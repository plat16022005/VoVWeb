import { GameServer } from "@/data/servers";
import {
  doc,
  getDoc,
  setDoc,
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { app, db, auth } from "@/lib/firebase";

export interface ServerAuditLog {
  id: string;
  action:
    | "APPLY_RULES"
    | "ENABLE_GLOBAL_MAINTENANCE"
    | "DISABLE_GLOBAL_MAINTENANCE"
    | "ENABLE_SERVER_MAINTENANCE"
    | "DISABLE_SERVER_MAINTENANCE";
  actionTitle: string;
  serverId?: string;
  serverName?: string;
  locationId?: string;
  maintenance?: boolean;
  reason?: string;
  message?: string;
  performedBy: string;
  timestamp: number;
  createdAt: string;
}

export interface CreateServerPayload {
  serverId: string;
  serverName?: string;
  locationId?: string;
  region?: string;
  status?: "Normal" | "Maintenance" | "Busy";
}

export interface CreateServerResult {
  success: boolean;
  serverId: string;
  serverName: string;
  databaseLocation: string;
  locationId?: string;
  status: string;
  databaseCreated: boolean;
  rulesApplied: boolean;
  rulesWarning?: string | null;
  createdAt: string;
}

export interface GlobalMaintenanceInfo {
  maintenance: boolean;
  message: string;
  version?: string;
  minSupportedVersion?: string;
}

export interface ServerMaintenancePayload {
  reason?: string;
  startTime?: string;
  endTime?: string;
  noticeMessage?: string;
  allowTesterWhitelist?: boolean;
}

export interface ServerClusterConfig {
  maintenance: boolean;
  message: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
  allowTesterWhitelist?: boolean;
  lastUpdated?: string;
}

const DEFAULT_SERVER_MAINTENANCE_MESSAGE =
  "Máy chủ đang trong quá trình bảo trì nâng cấp. Chỉ Huy vui lòng quay lại sau ít phút.";

const DEFAULT_MAINTENANCE_MESSAGE =
  "Hệ thống hiện tại đang bảo trì. Vui lòng quay lại game sau.";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Lấy toàn bộ danh sách server thật từ Backend NestJS (kết nối Firestore GameConfig/ServerList)
 */
export async function fetchServersList(forceRefresh = false): Promise<GameServer[]> {
  const url = forceRefresh
    ? `${API_BASE_URL}/servers?refresh=true`
    : `${API_BASE_URL}/servers`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Không thể tải danh sách máy chủ: HTTP ${response.status}`);
  }

  const servers = (await response.json()) as GameServer[];
  return servers;
}

/**
 * Ghi nhật ký kiểm toán hạ tầng & máy chủ vào Firestore chuẩn theo cấu trúc:
 * - Logs/ServerManagement/GlobalMaintenance/{logId}: Bảo trì toàn game
 * - Logs/ServerManagement/ClusterMaintenance/{logId}: Bảo trì từng cụm & cấu hình
 * - Logs/ServerManagement/ServerCreation/{logId}: Khởi tạo cụm máy chủ mới
 */
export async function logServerActivity(logData: {
  action: ServerAuditLog["action"];
  actionTitle: string;
  serverId?: string;
  serverName?: string;
  locationId?: string;
  maintenance?: boolean;
  reason?: string;
  message?: string;
}): Promise<void> {
  if (!db) return;
  try {
    const timestamp = Date.now();
    let subCollection = "ClusterMaintenance";

    if (
      logData.action === "ENABLE_GLOBAL_MAINTENANCE" ||
      logData.action === "DISABLE_GLOBAL_MAINTENANCE"
    ) {
      subCollection = "GlobalMaintenance";
    }

    const logId = `${subCollection.toLowerCase()}_${timestamp}_${Math.random().toString(36).substring(2, 6)}`;
    const logRef = doc(db, "Logs", "ServerManagement", subCollection, logId);

    const isMaintenance = Boolean(logData.maintenance);

    const rawData: Record<string, any> = {
      id: logId,
      action: logData.action,
      actionTitle: logData.actionTitle || "Thao tác máy chủ",
      serverId: logData.serverId || "",
      serverName: logData.serverName || "",
      locationId: logData.locationId || "",
      maintenance: isMaintenance,
      reason: logData.reason || "",
      message: logData.message || "",
      performedBy: auth?.currentUser?.email || "Admin",
      timestamp,
      createdAt: new Date().toLocaleString("vi-VN"),
      updatedAt: new Date().toLocaleString("vi-VN"),
    };

    // Loại bỏ triệt để bất kỳ trường nào có giá trị undefined trước khi đưa vào Firestore
    const cleanDocData: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (value !== undefined) {
        cleanDocData[key] = value;
      }
    }

    await setDoc(logRef, cleanDocData);
    console.log(
      `[ServerManagement] Đã ghi log thành công vào Logs/ServerManagement/${subCollection}/${logId}`
    );
  } catch (err) {
    console.warn("[ServerManagement] Ghi nhật ký hoạt động thất bại:", err);
  }
}

/**
 * Lấy danh sách nhật ký hoạt động hạ tầng & máy chủ từ các Subcollection:
 * ClusterMaintenance, GlobalMaintenance, và ServerCreation
 */
export async function getServerLogs(limitCount = 200): Promise<ServerAuditLog[]> {
  if (!db) return [];
  const allLogs: ServerAuditLog[] = [];

  const parseDocToLog = (d: { id: string; data: () => Record<string, any> }, defaultAction: ServerAuditLog["action"]): ServerAuditLog => {
    const data = d.data();
    const rawTime = data.timestamp || data.Timestamp || data.time || data.createdAtTime || 0;
    const numTime = typeof rawTime === "number" ? rawTime : Number(rawTime) || Date.now();
    const action = (data.action || data.Action || defaultAction) as ServerAuditLog["action"];
    const actionTitle = data.actionTitle || data.ActionTitle || data.title || (data.maintenance ? "Bật bảo trì" : "Thao tác máy chủ");
    const serverId = data.serverId || data.ServerId || data.id || "";
    const serverName = data.serverName || data.ServerName || (serverId ? `Cụm ${serverId}` : "");
    const createdAt = data.updatedAt || data.UpdatedAt || data.createdAt || data.CreatedAt || new Date(numTime).toLocaleString("vi-VN");

    return {
      id: d.id,
      action,
      actionTitle,
      serverId,
      serverName,
      locationId: data.locationId || data.LocationId || "",
      maintenance: Boolean(data.maintenance ?? data.Maintenance),
      reason: data.reason || data.Reason || "",
      message: data.message || data.Message || "",
      performedBy: data.performedBy || data.PerformedBy || data.admin || "Admin",
      timestamp: numTime,
      createdAt,
    };
  };

  try {
    // 1. Đọc subcollection ClusterMaintenance (Bảo trì & cấu hình từng cụm máy chủ)
    try {
      const snapCluster = await getDocs(
        collection(db, "Logs", "ServerManagement", "ClusterMaintenance")
      );
      snapCluster.forEach((d) => {
        allLogs.push(parseDocToLog(d, "ENABLE_SERVER_MAINTENANCE"));
      });
    } catch (clusterErr) {
      console.warn("[getServerLogs] Lỗi đọc ClusterMaintenance:", clusterErr);
    }

    // 2. Đọc subcollection GlobalMaintenance (Bảo trì toàn bộ hệ thống trò chơi)
    try {
      const snapGlobal = await getDocs(
        collection(db, "Logs", "ServerManagement", "GlobalMaintenance")
      );
      snapGlobal.forEach((d) => {
        allLogs.push(parseDocToLog(d, "ENABLE_GLOBAL_MAINTENANCE"));
      });
    } catch (globalErr) {
      console.warn("[getServerLogs] Lỗi đọc GlobalMaintenance:", globalErr);
    }

    // 3. Sắp xếp toàn bộ nhật ký theo thời gian mới nhất lên đầu
    allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return allLogs.slice(0, limitCount);
  } catch (err) {
    console.error("[ServerManagement] Lỗi khi tải nhật ký máy chủ:", err);
    return [];
  }
}

/**
 * Lấy Firebase ID Token của Admin hiện tại và tự động kích hoạt đồng bộ Custom Claim { role: 'admin' }
 * nếu Token chưa có claim 'admin' (giúp Cloud Functions createNewServer & applyRulesToServer xác thực 100%).
 */
async function getVerifiedAdminIdToken(forceRefresh = false): Promise<string> {
  if (!auth) {
    throw new Error("Hệ thống xác thực chưa sẵn sàng.");
  }
  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error(
      "Phiên đăng nhập Quản trị viên đã hết hạn. Vui lòng đăng nhập lại."
    );
  }

  let tokenResult = await user.getIdTokenResult(forceRefresh);
  const currentClaimRole = String(tokenResult.claims?.role || "").toLowerCase();

  if (currentClaimRole !== "admin" && db) {
    try {
      const userDocRef = doc(db, "Users", user.uid);
      const snap = await getDoc(userDocRef);
      const rawRole = snap.exists() ? String(snap.data()?.Role || "") : "";
      if (rawRole.toLowerCase() === "admin") {
        // Kích hoạt Cloud Function trigger onUserRoleChanged (yêu cầu Role thay đổi sang chữ thường 'admin')
        if (rawRole === "admin") {
          await setDoc(userDocRef, { Role: "Admin" }, { merge: true });
          await new Promise((r) => setTimeout(r, 450));
        }
        await setDoc(userDocRef, { Role: "admin" }, { merge: true });

        // Chờ Cloud Function onUserRoleChanged cập nhật Custom Claims trên Firebase Auth
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise((r) => setTimeout(r, 1100));
          tokenResult = await user.getIdTokenResult(true);
          if (String(tokenResult.claims?.role || "").toLowerCase() === "admin") {
            break;
          }
        }
      }
    } catch (err) {
      console.warn("[ServerManagement] Không thể tự đồng bộ Admin Claim:", err);
    }
  }

  return tokenResult.token;
}

/**
 * Gọi Backend NestJS để kích hoạt Firebase Cloud Function createNewServer
 */
export async function callCreateNewServer(
  payload: CreateServerPayload
): Promise<CreateServerResult> {
  const url = `${API_BASE_URL}/servers/create`;
  let idToken = await getVerifiedAdminIdToken(false);

  const sendRequest = async (token: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        serverId: payload.serverId,
        serverName: payload.serverName,
        locationId: payload.locationId || "asia-southeast1",
        status: payload.status || "Normal",
      }),
    });

  let response = await sendRequest(idToken);
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    const cloneJson = await response.clone().json().catch(() => ({}));
    const msg = String(cloneJson?.message || cloneJson?.error || "");
    if (msg.includes("Chỉ Quản trị viên") || msg.includes("Chỉ Admin")) {
      idToken = await getVerifiedAdminIdToken(true);
      response = await sendRequest(idToken);
    }
  }

  const resJson = await response.json();

  if (!response.ok) {
    const errorMsg =
      resJson.message ||
      resJson.error ||
      `Lỗi máy chủ (${response.status}): Không thể tạo database`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg);
  }

  const result = resJson as CreateServerResult;
  return result;
}

/**
 * Gọi Backend NestJS để kích hoạt Firebase Cloud Function applyRulesToServer
 */
export async function callApplyRulesToServer(
  serverId: string
): Promise<{ success: boolean; message: string; serverId: string }> {
  const url = `${API_BASE_URL}/servers/${serverId}/rules`;
  let idToken = await getVerifiedAdminIdToken(false);

  const sendRequest = async (token: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

  let response = await sendRequest(idToken);
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    const cloneJson = await response.clone().json().catch(() => ({}));
    const msg = String(cloneJson?.message || cloneJson?.error || "");
    if (msg.includes("Chỉ Admin") || msg.includes("Chỉ Quản trị viên")) {
      idToken = await getVerifiedAdminIdToken(true);
      response = await sendRequest(idToken);
    }
  }

  const resJson = await response.json();

  if (!response.ok) {
    const errorMsg =
      resJson.message ||
      resJson.error ||
      `Lỗi áp dụng Rules (${response.status})`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg);
  }

  // Ghi nhật ký kiểm toán khi áp dụng Rules thành công vào Subcollection ClusterMaintenance
  await logServerActivity({
    action: "APPLY_RULES",
    actionTitle: `Áp dụng Security Rules cho máy chủ [${serverId}]`,
    serverId,
    maintenance: false,
    message: "Kích hoạt và phân phối Firestore Security Rules cho database cụm máy chủ",
  });

  return resJson;
}

/**
 * Lấy trạng thái bảo trì toàn game thực tế từ Firestore (GameInfo/Information)
 */
export async function fetchGlobalMaintenance(): Promise<GlobalMaintenanceInfo> {
  // 1. Thử qua backend API trước (đã có cache và bảo vệ số lượt đọc)
  try {
    const res = await fetch(`${API_BASE_URL}/servers/global-maintenance`, {
      method: "GET",
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return {
        maintenance: Boolean(data.maintenance),
        message: data.message || DEFAULT_MAINTENANCE_MESSAGE,
        version: data.version || "1.0.0",
        minSupportedVersion: data.minSupportedVersion || "1.0.0",
      };
    }
  } catch (err) {
    console.warn("[ServerService] Lỗi gọi API global-maintenance, thử Firestore SDK:", err);
  }

  // 2. Dự phòng: Đọc trực tiếp qua Firestore Client SDK
  if (db) {
    try {
      const snap = await getDoc(doc(db, "GameInfo", "Information"));
      if (snap.exists()) {
        const d = snap.data();
        return {
          maintenance: Boolean(d.Maintenance),
          message: d.MaintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE,
          version: d.Version || "1.0.0",
          minSupportedVersion: d.MinSupportedVersion || "1.0.0",
        };
      }
    } catch (fsErr) {
      console.warn("[ServerService] Lỗi đọc Firestore trực tiếp:", fsErr);
    }
  }

  return {
    maintenance: false,
    message: DEFAULT_MAINTENANCE_MESSAGE,
  };
}

/**
 * Cập nhật trạng thái bảo trì toàn game lên Firestore GameInfo/Information
 */
export async function updateGlobalMaintenance(
  maintenance: boolean,
  message: string
): Promise<void> {
  const finalMessage = (message || DEFAULT_MAINTENANCE_MESSAGE).trim();

  if (!db) {
    throw new Error("Không thể kết nối Firebase Firestore. Vui lòng kiểm tra môi trường.");
  }

  const docRef = doc(db, "GameInfo", "Information");

  // 1. Ghi đè trường Maintenance & MaintenanceMessage lên Firestore
  await setDoc(
    docRef,
    {
      Maintenance: maintenance,
      MaintenanceMessage: finalMessage,
    },
    { merge: true }
  );

  // 2. Ghi nhật ký vào Logs/ServerManagement/Activities (Audit Log chuẩn Rule 6)
  await logServerActivity({
    action: maintenance ? "ENABLE_GLOBAL_MAINTENANCE" : "DISABLE_GLOBAL_MAINTENANCE",
    actionTitle: maintenance ? "Kích hoạt bảo trì toàn hệ thống" : "Mở lại máy chủ toàn hệ thống",
    maintenance,
    message: finalMessage,
  });
}

/**
 * Đọc cấu hình ServerConfig/Config của từng cụm máy chủ cụ thể (trên database riêng của server)
 */
export async function fetchServerClusterConfig(
  serverId: string
): Promise<ServerClusterConfig> {
  const cleanId = (serverId || "").trim().toLowerCase();

  // 1. Thử đọc từ database riêng của server trên Google Cloud Firestore
  if (app) {
    try {
      const serverDb = getFirestore(app, cleanId);
      const configRef = doc(serverDb, "ServerConfig", "Config");
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        const d = snap.data();
        return {
          maintenance: Boolean(d.Maintenance),
          message: d.MaintenanceMessage || DEFAULT_SERVER_MAINTENANCE_MESSAGE,
          reason: d.Reason || "",
          startTime: d.StartTime || "",
          endTime: d.EndTime || "",
          allowTesterWhitelist: d.AllowTesterWhitelist !== false,
          lastUpdated: d.LastUpdated || "",
        };
      }
    } catch (err: any) {
      console.warn(`[fetchServerClusterConfig] Đọc ServerConfig/Config từ db ${cleanId}:`, err?.message);
    }
  }

  // 2. Dự phòng: Kiểm tra trạng thái Status từ GameConfig/ServerList trên (default)
  if (db) {
    try {
      const listSnap = await getDoc(doc(db, "GameConfig", "ServerList"));
      if (listSnap.exists()) {
        const data = listSnap.data();
        const serverData = data[cleanId] || {};
        const isMaintenance =
          String(serverData.Status || "").toLowerCase() === "maintenance" ||
          String(serverData.Status || "").toLowerCase() === "baotri";

        return {
          maintenance: isMaintenance,
          message: serverData.MaintenanceMessage || DEFAULT_SERVER_MAINTENANCE_MESSAGE,
          reason: serverData.MaintenanceReason || "",
          startTime: serverData.MaintenanceStartTime || "",
          endTime: serverData.MaintenanceEndTime || "",
          allowTesterWhitelist: true,
        };
      }
    } catch (listErr) {
      console.warn("[fetchServerClusterConfig] Lỗi đọc ServerList dự phòng:", listErr);
    }
  }

  return {
    maintenance: false,
    message: DEFAULT_SERVER_MAINTENANCE_MESSAGE,
    allowTesterWhitelist: true,
  };
}

/**
 * Cập nhật chế độ bảo trì cho từng cụm máy chủ cụ thể:
 * 1. Ghi vào ServerConfig/Config trên database riêng của server (databases/{serverId})
 * 2. Cập nhật trường Status ("Maintenance" / "Normal") trong GameConfig/ServerList trên (default)
 * 3. Ghi audit log vào Logs/ServerManagement/ClusterMaintenance
 */
export async function updateServerClusterMaintenance(
  serverId: string,
  action: "enable" | "disable",
  data?: ServerMaintenancePayload
): Promise<void> {
  const cleanId = (serverId || "").trim().toLowerCase();
  const isMaintenance = action === "enable";
  const notice = (
    data?.noticeMessage || DEFAULT_SERVER_MAINTENANCE_MESSAGE
  ).trim();
  const now = new Date().toISOString();

  // 1. Ghi vào database riêng của server: databases/{cleanId} / ServerConfig / Config
  if (app) {
    try {
      const serverDb = getFirestore(app, cleanId);
      const serverConfigRef = doc(serverDb, "ServerConfig", "Config");
      await setDoc(
        serverConfigRef,
        {
          Maintenance: isMaintenance,
          MaintenanceMessage: notice,
          Reason: data?.reason || "",
          StartTime: data?.startTime || "",
          EndTime: data?.endTime || "",
          AllowTesterWhitelist: data?.allowTesterWhitelist ?? true,
          LastUpdated: now,
          UpdatedBy: auth?.currentUser?.email || "Admin",
        },
        { merge: true }
      );
    } catch (dbErr: any) {
      console.warn(
        `[updateServerClusterMaintenance] Lưu ServerConfig/Config db ${cleanId}: ${dbErr?.message}`
      );
    }
  }

  // 2. Cập nhật Status trong GameConfig/ServerList trên database (default)
  if (db) {
    try {
      const serverListRef = doc(db, "GameConfig", "ServerList");
      await setDoc(
        serverListRef,
        {
          [cleanId]: {
            Status: isMaintenance ? "Maintenance" : "Normal",
            MaintenanceMessage: isMaintenance ? notice : null,
            MaintenanceReason: isMaintenance ? data?.reason || "" : null,
            MaintenanceStartTime: isMaintenance ? data?.startTime || "" : null,
            MaintenanceEndTime: isMaintenance ? data?.endTime || "" : null,
            LastStatusChange: now,
          },
        },
        { merge: true }
      );
    } catch (listErr: any) {
      console.error("[updateServerClusterMaintenance] Lỗi cập nhật ServerList:", listErr);
      throw new Error(`Không thể cập nhật danh sách máy chủ: ${listErr?.message}`);
    }
  }

  // 3. Ghi nhật ký kiểm toán (Audit Log) theo chuẩn Rule 6
  await logServerActivity({
    action: isMaintenance ? "ENABLE_SERVER_MAINTENANCE" : "DISABLE_SERVER_MAINTENANCE",
    actionTitle: isMaintenance
      ? `Bật bảo trì cụm máy chủ [${cleanId}]`
      : `Mở lại cụm máy chủ [${cleanId}]`,
    serverId: cleanId,
    maintenance: isMaintenance,
    reason: data?.reason || "",
    message: notice,
  });
}
