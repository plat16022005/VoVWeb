import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getFirestore,
  addDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "@/lib/firebase";
import { normalizeRole } from "./auth.service";
import { AdminAccount, BanDetails } from "@/data/adminAccounts";

export type AccountLogAction =
  | "CREATE"
  | "UPDATE"
  | "BAN"
  | "UNBAN"
  | "DELETE"
  | "RESET_PASSWORD";

export interface AccountLogItem {
  id: string;
  action: AccountLogAction;
  actionTitle: string;
  targetUserId: string;
  targetUsername: string;
  targetEmail?: string;
  details?: string;
  performedBy: string;
  timestamp: number;
  createdAt: string;
}

export interface AccountStatsCounters {
  EmailCount: number;
  GoogleCount: number;
  GuestCount: number;
}

export interface DailyAccountStats {
  Date: string; // Định danh ngày: "YYYY-MM-DD"
  PlayerCount: number; // Chỉ đếm tài khoản Người Chơi
  EmailCount: number;
  GoogleCount: number;
  GuestCount: number;
  LastUpdated?: string;
}

export function getTodayDateString(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const USERS_COLLECTION = "Users";
const COUNTERS_COLLECTION = "Counters";
const ACCOUNT_STATS_DOC = "AccountStats";
const DAILY_STATS_SUBCOLLECTION = "DailyStats";

function parseToTimestamp(rawVal: any): number {
  if (!rawVal) return 0;
  if (typeof rawVal === "object" && typeof rawVal.toDate === "function") {
    return rawVal.toDate().getTime();
  }
  if (typeof rawVal === "object" && typeof rawVal.seconds === "number") {
    return rawVal.seconds * 1000;
  }
  if (typeof rawVal === "number") {
    return rawVal;
  }
  const parsed = new Date(rawVal).getTime();
  if (!isNaN(parsed)) return parsed;

  if (typeof rawVal === "string") {
    // "12:07:16 28/10/2026"
    const match1 = rawVal.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match1) {
      const [, h, min, s, d, m, y] = match1;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s)).getTime();
    }
    // "28/10/2026 12:07:16"
    const match2 = rawVal.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
    if (match2) {
      const [, d, m, y, h, min, s] = match2;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s)).getTime();
    }
  }
  return 0;
}

function formatDisplayDate(timestamp: number, fallback: string): string {
  if (!timestamp || isNaN(timestamp)) return fallback || "N/A";
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return `${time} ${date}`;
}

// Chuyển đổi Firestore document thành đối tượng AdminAccount gọn gàng
function mapFirestoreDocToAccount(docId: string, data: any): AdminAccount {
  const isBanned =
    data.IsBanned === true ||
    data.isBanned === true ||
    data.Status === "banned" ||
    data.status === "banned";

  let status: "active" | "banned" | "pending" = "active";
  if (isBanned) {
    status = "banned";
  } else if (data.Status === "pending" || data.status === "pending") {
    status = "pending";
  } else if (data.Status === "active" || data.status === "active") {
    status = "active";
  }

  const createdAtTimestamp = parseToTimestamp(data.CreatedAt || data.createdAt);
  const lastLoginTimestamp = parseToTimestamp(data.LastLogin || data.lastLogin);

  const formattedCreatedAt = createdAtTimestamp
    ? formatDisplayDate(createdAtTimestamp, String(data.CreatedAt || ""))
    : String(data.CreatedAt || "N/A");

  const formattedLastLogin = lastLoginTimestamp
    ? formatDisplayDate(lastLoginTimestamp, String(data.LastLogin || ""))
    : String(data.LastLogin || "Chưa đăng nhập");

  const rawBan = data.BanDetails || data.banDetails || {};
  const parsedTerms = Array.isArray(rawBan.terms)
    ? rawBan.terms
    : rawBan.termTitle
    ? [{ id: rawBan.termId || "", title: rawBan.termTitle, content: rawBan.termContent || "" }]
    : [];
  const parsedTermTitles =
    Array.isArray(rawBan.termTitles) && rawBan.termTitles.length > 0
      ? rawBan.termTitles
      : parsedTerms.length > 0
      ? parsedTerms.map((t: any) => t.title)
      : rawBan.termTitle
      ? [rawBan.termTitle]
      : [];

  const banDetails: BanDetails | undefined = isBanned
    ? {
        termId: rawBan.termId || data.BanTermId || data.banTermId || "",
        termTitle: rawBan.termTitle || data.BanReason || data.banReason || "Vi phạm Điều khoản Dịch vụ",
        termContent: rawBan.termContent || data.BanTermContent || data.banTermContent || "",
        termIds: Array.isArray(rawBan.termIds) ? rawBan.termIds : rawBan.termId ? [rawBan.termId] : [],
        termTitles: parsedTermTitles,
        terms: parsedTerms,
        note: rawBan.note || data.BanNote || data.banNote || "",
        bannedAt: rawBan.bannedAt || data.BannedAt || data.bannedAt || "",
        bannedBy: rawBan.bannedBy || data.BannedBy || data.bannedBy || "",
      }
    : undefined;

  const rawEmail = String(data.Email || data.email || "").trim().toLowerCase();
  const isGuestAccount =
    !rawEmail ||
    rawEmail === "(khách)" ||
    rawEmail.includes("guest") ||
    String(docId || "").startsWith("guest_") ||
    String(data.UserId || "").startsWith("guest_");

  let provider: "Email" | "Google" | "Guest" = "Email";
  if (data.Provider || data.provider) {
    const rawP = String(data.Provider || data.provider).toLowerCase();
    if (rawP.includes("guest") || rawP.includes("khách")) {
      provider = "Guest";
    } else if (rawP.includes("google")) {
      provider = "Google";
    } else {
      provider = "Email";
    }
  } else if (isGuestAccount) {
    provider = "Guest";
  } else {
    provider = "Email";
  }

  return {
    id: data.UserId || docId,
    username: data.Username || data.username || "Chỉ Huy",
    email: data.Email || data.email || "",
    role: normalizeRole(data.Role || data.role),
    status,
    provider,
    createdAt: formattedCreatedAt,
    createdAtTimestamp,
    lastLogin: formattedLastLogin,
    lastLoginTimestamp,
    banDetails,
  };
}

export const adminService = {
  // 1. Đọc danh sách tài khoản trực tiếp từ collection "Users"
  async getAccounts(): Promise<AdminAccount[]> {
    if (!db) {
      throw new Error("Chưa kết nối được Firebase Firestore. Vui lòng kiểm tra cấu hình trong .env.local");
    }

    try {
      const colRef = collection(db, USERS_COLLECTION);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((docSnap) =>
        mapFirestoreDocToAccount(docSnap.id, docSnap.data())
      );
    } catch (err: any) {
      console.error("Lỗi khi đọc danh sách tài khoản từ Firestore Users:", err);
      throw new Error(err.message || "Không thể tải danh sách tài khoản từ Firebase Firestore");
    }
  },

  // 2. Thống kê số lượng & Đồng bộ số tài khoản Người Chơi tạo mới hôm nay
  async getStats() {
    const list = await this.getAccounts();
    const total = list.length;
    const active = list.filter((a) => a.status === "active").length;
    const banned = list.filter((a) => a.status === "banned").length;
    const admins = list.filter((a) => a.role === "Admin" || a.role === "Manager").length;
    const pending = list.filter((a) => a.status === "pending").length;

    // Tính chính xác số lượng tài khoản Người Chơi (Role === "Player") được tạo mới trong ngày hôm nay
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    const todayPlayers = list.filter((a) => {
      const isPlayer = a.role === "Player";
      const isToday = (a.createdAtTimestamp || 0) >= startOfTodayMs;
      return isPlayer && isToday;
    }).length;

    // Tự động cập nhật Counters/AccountStats và DailyStats của ngày hôm nay (chỉ ghi nhận ngày hôm nay, không tạo ngày cũ)
    this.syncAccountCounters(list).catch(() => {});

    return { total, active, banned, admins, pending, todayPlayers };
  },

  // Đọc dữ liệu từ collection "Counters" doc "AccountStats" (Chỉ chứa EmailCount, GoogleCount, GuestCount)
  async getAccountStatsCounters(): Promise<AccountStatsCounters> {
    if (!db) {
      return { EmailCount: 0, GoogleCount: 0, GuestCount: 0 };
    }

    try {
      const docRef = doc(db, COUNTERS_COLLECTION, ACCOUNT_STATS_DOC);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        return {
          EmailCount: Number(data.EmailCount) || 0,
          GoogleCount: Number(data.GoogleCount) || 0,
          GuestCount: Number(data.GuestCount) || 0,
        };
      } else {
        const initData: AccountStatsCounters = {
          EmailCount: 0,
          GoogleCount: 0,
          GuestCount: 0,
        };
        await setDoc(docRef, initData);
        return initData;
      }
    } catch (err) {
      console.warn("Lỗi đọc Counters/AccountStats:", err);
      return { EmailCount: 0, GoogleCount: 0, GuestCount: 0 };
    }
  },

  // Tăng phương thức đăng ký trong Counters/AccountStats và ghi nhận ngày trong DailyStats
  async incrementAccountCounters(method: "Email" | "Google" | "Guest" = "Email"): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, COUNTERS_COLLECTION, ACCOUNT_STATS_DOC);
      const todayStr = getTodayDateString();
      const snap = await getDoc(docRef);

      const methodKey = `${method}Count`;

      // 1. Cập nhật Document cha: CHỈ LƯU 3 trường EmailCount, GoogleCount, GuestCount
      if (snap.exists()) {
        const data = snap.data();
        const currentMethodCount = Number(data[methodKey]) || 0;

        await setDoc(
          docRef,
          {
            [methodKey]: currentMethodCount + 1,
          },
          { merge: true }
        );
      } else {
        await setDoc(docRef, {
          EmailCount: method === "Email" ? 1 : 0,
          GoogleCount: method === "Google" ? 1 : 0,
          GuestCount: method === "Guest" ? 1 : 0,
        });
      }

      // 2. Lưu số đếm theo ngày vào subcollection DailyStats/{todayStr}
      await this.recordDailyStats(method, todayStr);
    } catch (err: any) {
      console.error("❌ LỖI GHI NHẬN COUNTERS/ACCOUNTSTATS:", err);
      if (err?.code === "permission-denied") {
        console.error("⚠️ Firebase từ chối quyền ghi vào collection Counters (permission-denied). Vui lòng cập nhật Firestore Security Rules trên Firebase Console!");
      }
    }
  },

  // Ghi nhận hoặc tăng số đếm vào subcollection Counters/AccountStats/DailyStats/{dateDoc}
  async recordDailyStats(method: "Email" | "Google" | "Guest" = "Email", dateStr?: string): Promise<void> {
    if (!db) return;
    try {
      const targetDate = dateStr || getTodayDateString();
      const dailyDocRef = doc(db, COUNTERS_COLLECTION, ACCOUNT_STATS_DOC, DAILY_STATS_SUBCOLLECTION, targetDate);
      const snap = await getDoc(dailyDocRef);
      const methodKey = `${method}Count`;

      if (snap.exists()) {
        const data = snap.data();
        const currentPlayers = Number(data.PlayerCount) || 0;
        const currentMethod = Number(data[methodKey]) || 0;

        await setDoc(
          dailyDocRef,
          {
            Date: targetDate,
            PlayerCount: currentPlayers + 1,
            [methodKey]: currentMethod + 1,
            LastUpdated: new Date().toLocaleString("vi-VN"),
          },
          { merge: true }
        );
      } else {
        await setDoc(dailyDocRef, {
          Date: targetDate,
          PlayerCount: 1,
          EmailCount: method === "Email" ? 1 : 0,
          GoogleCount: method === "Google" ? 1 : 0,
          GuestCount: method === "Guest" ? 1 : 0,
          LastUpdated: new Date().toLocaleString("vi-VN"),
        });
      }
    } catch (err) {
      console.warn(`Lỗi ghi nhận Counters/AccountStats/DailyStats/${dateStr}:`, err);
    }
  },

  // Đọc danh sách thống kê theo từng ngày từ subcollection Counters/AccountStats/DailyStats
  async getDailyStats(limitDays = 30): Promise<DailyAccountStats[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, COUNTERS_COLLECTION, ACCOUNT_STATS_DOC, DAILY_STATS_SUBCOLLECTION),
        orderBy("Date", "desc"),
        limit(limitDays)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          Date: data.Date || d.id,
          PlayerCount: Number(data.PlayerCount) || 0,
          EmailCount: Number(data.EmailCount) || 0,
          GoogleCount: Number(data.GoogleCount) || 0,
          GuestCount: Number(data.GuestCount) || 0,
          LastUpdated: data.LastUpdated || "",
        };
      });
    } catch (err) {
      console.warn("Lỗi đọc subcollection Counters/AccountStats/DailyStats:", err);
      return [];
    }
  },

  // Đồng bộ lịch sử theo từng ngày từ danh sách tài khoản hiện có vào DailyStats và làm sạch Counters/AccountStats
  async syncAccountCounters(accounts?: AdminAccount[]): Promise<{ todayCount: number }> {
    if (!db) return { todayCount: 0 };
    try {
      const list = accounts || (await this.getAccounts());
      const playerAccounts = list.filter((a) => a.role === "Player");

      // 1. Phân loại theo phương thức đăng ký cho document cha Counters/AccountStats
      let emailCount = 0;
      let googleCount = 0;
      let guestCount = 0;

      playerAccounts.forEach((acc) => {
        const emailLower = (acc.email || "").trim().toLowerCase();
        const p = acc.provider;
        const isGuest =
          p === "Guest" ||
          acc.id.startsWith("guest_") ||
          !emailLower ||
          emailLower === "(khách)" ||
          emailLower.includes("guest");

        if (isGuest) {
          guestCount++;
        } else if (p === "Google") {
          googleCount++;
        } else {
          emailCount++;
        }
      });

      // Ghi đè document cha AccountStats để LOẠI BỎ hoàn toàn các trường ngày thừa (chỉ giữ đúng 3 trường)
      const docRef = doc(db, COUNTERS_COLLECTION, ACCOUNT_STATS_DOC);
      await setDoc(docRef, {
        EmailCount: emailCount,
        GoogleCount: googleCount,
        GuestCount: guestCount,
      }); // KHÔNG merge để dọn sạch các trường cũ nếu có

      // 2. CHỈ ghi nhận số liệu ngày hôm nay vào DailyStats (Tuyệt đối KHÔNG ghi lại các ngày cũ)
      const todayStr = getTodayDateString();
      let todayTotal = 0;
      let todayEmail = 0;
      let todayGoogle = 0;
      let todayGuest = 0;

      playerAccounts.forEach((acc) => {
        const dateStr = getTodayDateString(acc.createdAtTimestamp);
        if (dateStr === todayStr) {
          todayTotal++;
          const emailLower = (acc.email || "").trim().toLowerCase();
          const p = acc.provider;
          const isGuest =
            p === "Guest" ||
            acc.id.startsWith("guest_") ||
            !emailLower ||
            emailLower === "(khách)" ||
            emailLower.includes("guest");

          if (isGuest) {
            todayGuest++;
          } else if (p === "Google") {
            todayGoogle++;
          } else {
            todayEmail++;
          }
        }
      });

      const dailyDocRef = doc(db, COUNTERS_COLLECTION, ACCOUNT_STATS_DOC, DAILY_STATS_SUBCOLLECTION, todayStr);
      await setDoc(
        dailyDocRef,
        {
          Date: todayStr,
          PlayerCount: todayTotal,
          EmailCount: todayEmail,
          GoogleCount: todayGoogle,
          GuestCount: todayGuest,
          LastUpdated: new Date().toLocaleString("vi-VN"),
        },
        { merge: true }
      );

      return { todayCount: todayTotal };
    } catch (err) {
      console.error("Lỗi đồng bộ Counters/AccountStats:", err);
      throw err;
    }
  },

  // Giữ alias tương thích ngược
  async syncDailyStatsFromAccounts(accounts?: AdminAccount[]): Promise<void> {
    await this.syncAccountCounters(accounts);
  },

  async syncTodayPlayerCount(): Promise<number> {
    const res = await this.syncAccountCounters();
    return res.todayCount;
  },

  // 3. Tạo tài khoản mới trên Firebase Auth & Firestore:
  // - Có nhập mật khẩu để người dùng có thể đăng nhập thật
  // - KHÔNG cho phép Admin tạo tài khoản vai trò Admin (chỉ cho tạo Player hoặc Manager)
  async createAccount(data: {
    username: string;
    email: string;
    password?: string;
    role: "Manager" | "Player";
    status?: "active" | "banned" | "pending";
    provider?: "Email" | "Google" | "Guest";
  }): Promise<AdminAccount> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");

    // Kiểm tra bảo an: Tuyệt đối không cho tạo tài khoản Admin
    if ((data.role as string) === "Admin") {
      throw new Error("Không được phép khởi tạo tài khoản có vai trò Quản Trị Viên (Admin).");
    }

    const now = new Date().toISOString();
    let newUid = "";

    const rawEmail = (data.email || "").trim().toLowerCase();
    const isGuest = data.provider === "Guest" || !rawEmail || rawEmail === "(khách)" || rawEmail.includes("guest");
    const accountProvider: "Email" | "Google" | "Guest" = data.provider || (isGuest ? "Guest" : "Email");

    // Nếu có mật khẩu: khởi tạo qua Firebase Authentication bằng secondary app để không đăng xuất Admin hiện tại
    if (data.password && data.password.trim().length >= 6) {
      const secondaryAppName = `VOV_AdminAuth_${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      const secondaryDb = getFirestore(secondaryApp);

      try {
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          data.email.trim(),
          data.password.trim()
        );

        newUid = cred.user.uid;

        if (data.username.trim()) {
          await updateProfile(cred.user, { displayName: data.username.trim() });
        }

        const firestoreData = {
          UserId: newUid,
          Username: data.username.trim(),
          Email: data.email.trim(),
          Role: data.role,
          Status: data.status || "active",
          IsBanned: data.status === "banned",
          Provider: accountProvider,
          CreatedAt: now,
          LastLogin: "Chưa đăng nhập",
        };

        // Ghi Firestore ngay khi user mới đang có context đăng nhập trên secondaryApp
        // Quyền request.auth.uid == newUid sẽ hợp lệ 100%
        await setDoc(doc(secondaryDb, USERS_COLLECTION, newUid), firestoreData);

        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

        const createdAcc = mapFirestoreDocToAccount(newUid, firestoreData);

        // Ghi nhận nhật ký khởi tạo tài khoản mới
        await this.logActivity({
          action: "CREATE",
          actionTitle: "Tạo tài khoản mới",
          targetUserId: newUid,
          targetUsername: data.username.trim(),
          targetEmail: data.email.trim(),
          details: `Khởi tạo tài khoản với vai trò "${data.role}", hình thức "${accountProvider}", trạng thái "${data.status || "active"}".`,
        });

        // Chỉ đếm tài khoản Người Chơi vào Counters/AccountStats
        if (data.role === "Player") {
          try {
            await this.incrementAccountCounters(accountProvider);
          } catch (cErr) {
            console.error("Lỗi cập nhật Counters từ createAccount:", cErr);
          }
        }

        return createdAcc;
      } catch (authErr: any) {
        try {
          await signOut(secondaryAuth);
          await deleteApp(secondaryApp);
        } catch {}

        if (authErr.code === "auth/email-already-in-use") {
          throw new Error("Email này đã được sử dụng bởi một tài khoản khác trong hệ thống.");
        } else if (authErr.code === "auth/weak-password") {
          throw new Error("Mật khẩu quá yếu (phải chứa ít nhất 6 ký tự).");
        } else if (authErr.code === "auth/invalid-email") {
          throw new Error("Định dạng email không hợp lệ.");
        } else if (authErr.code === "permission-denied") {
          throw new Error("Firebase từ chối quyền ghi (permission-denied). Vui lòng cập nhật Firestore Rules trên Firebase Console.");
        } else {
          throw new Error(authErr.message || "Lỗi tạo tài khoản trên Firebase.");
        }
      }
    }

    // Ghi document vào Firestore collection Users (khi không có password, ví dụ tạo tài khoản Khách hoặc Google)
    const newDocRef = newUid ? doc(db, USERS_COLLECTION, newUid) : doc(collection(db, USERS_COLLECTION));
    const finalUid = newUid || newDocRef.id;

    const firestoreData = {
      UserId: finalUid,
      Username: data.username.trim(),
      Email: data.email ? data.email.trim() : "",
      Role: data.role,
      Status: data.status || "active",
      IsBanned: data.status === "banned",
      Provider: accountProvider,
      CreatedAt: now,
      LastLogin: "Chưa đăng nhập",
    };

    try {
      await setDoc(newDocRef, firestoreData);
      const createdAcc = mapFirestoreDocToAccount(finalUid, firestoreData);

      // Ghi nhận nhật ký
      await this.logActivity({
        action: "CREATE",
        actionTitle: "Tạo tài khoản mới",
        targetUserId: finalUid,
        targetUsername: data.username.trim(),
        targetEmail: data.email.trim(),
        details: `Khởi tạo tài khoản (không kèm mật khẩu Auth) với vai trò "${data.role}", hình thức "${accountProvider}", trạng thái "${data.status || "active"}".`,
      });

      // Chỉ đếm tài khoản Người Chơi vào Counters/AccountStats
      if (data.role === "Player") {
        try {
          await this.incrementAccountCounters(accountProvider);
        } catch (cErr) {
          console.error("Lỗi cập nhật Counters từ createAccount:", cErr);
        }
      }

      return createdAcc;
    } catch (fsErr: any) {
      if (fsErr.code === "permission-denied") {
        throw new Error("Firebase từ chối quyền ghi (permission-denied). Vui lòng kiểm tra Firestore Security Rules trên Firebase Console.");
      }
      throw fsErr;
    }
  },

  // 4. Cập nhật thông tin tài khoản trên Firestore
  async updateAccount(
    id: string,
    updates: Partial<AdminAccount>,
    targetInfo?: { username?: string; email?: string }
  ): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");

    if (auth?.currentUser && auth.currentUser.uid === id && updates.status === "banned") {
      throw new Error("Bạn không thể tự khóa tài khoản của chính mình.");
    }

    const docRef = doc(db, USERS_COLLECTION, id);
    const payload: Record<string, any> = {};

    if (updates.username !== undefined) payload.Username = updates.username.trim();
    if (updates.email !== undefined) payload.Email = updates.email.trim();
    if (updates.provider !== undefined) payload.Provider = updates.provider;
    if (updates.role !== undefined) {
      if (updates.role !== "Admin") {
        payload.Role = updates.role;
      }
    }
    if (updates.status !== undefined) {
      payload.Status = updates.status;
      payload.IsBanned = updates.status === "banned";
    }

    await updateDoc(docRef, payload);

    // Ghi nhật ký cập nhật
    const changeDetails: string[] = [];
    if (updates.username) changeDetails.push(`Tên: "${updates.username}"`);
    if (updates.email) changeDetails.push(`Email: "${updates.email}"`);
    if (updates.provider) changeDetails.push(`Hình thức: "${updates.provider}"`);
    if (updates.role) changeDetails.push(`Vai trò: "${updates.role}"`);
    if (updates.status) changeDetails.push(`Trạng thái: "${updates.status}"`);

    await this.logActivity({
      action: "UPDATE",
      actionTitle: "Cập nhật tài khoản",
      targetUserId: id,
      targetUsername: updates.username || targetInfo?.username || id,
      targetEmail: updates.email || targetInfo?.email || "",
      details: changeDetails.length > 0 ? `Thay đổi: ${changeDetails.join(", ")}` : "Cập nhật dữ liệu tài khoản.",
    });
  },

  // 5. Khóa tài khoản kèm lý do & trích dẫn điều khoản vi phạm
  async banAccount(
    id: string,
    banDetails: BanDetails,
    targetInfo?: { username?: string; email?: string }
  ): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");

    if (auth?.currentUser && auth.currentUser.uid === id) {
      throw new Error("Bạn không thể tự khóa tài khoản của chính mình.");
    }

    const docRef = doc(db, USERS_COLLECTION, id);
    const bannedAt = banDetails.bannedAt || new Date().toLocaleString("vi-VN");
    const bannedBy = banDetails.bannedBy || auth?.currentUser?.email || "Admin";

    await updateDoc(docRef, {
      IsBanned: true,
      Status: "banned",
      BanDetails: {
        ...banDetails,
        bannedAt,
        bannedBy,
      },
    });

    // Ghi nhật ký khóa tài khoản
    const termsReason =
      banDetails.termTitles && banDetails.termTitles.length > 1
        ? `Vi phạm ${banDetails.termTitles.length} điều khoản: ${banDetails.termTitles.join("; ")}`
        : `Vi phạm điều khoản: "${banDetails.termTitle}"`;
    const noteText = banDetails.note ? ` | Ghi chú: ${banDetails.note}` : "";
    await this.logActivity({
      action: "BAN",
      actionTitle: "Khóa tài khoản",
      targetUserId: id,
      targetUsername: targetInfo?.username || id,
      targetEmail: targetInfo?.email || "",
      details: `${termsReason}${noteText}`,
      performedBy: bannedBy,
    });
  },

  // 6. Mở khóa tài khoản (Unban)
  async unbanAccount(
    id: string,
    targetInfo?: { username?: string; email?: string }
  ): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");

    const docRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(docRef, {
      IsBanned: false,
      Status: "active",
      BanDetails: null,
    });

    // Ghi nhật ký mở khóa
    await this.logActivity({
      action: "UNBAN",
      actionTitle: "Mở khóa tài khoản",
      targetUserId: id,
      targetUsername: targetInfo?.username || id,
      targetEmail: targetInfo?.email || "",
      details: "Đã gỡ bỏ trạng thái khóa, cho phép tài khoản đăng nhập lại bình thường.",
    });
  },

  // 7. Khóa / Mở khóa tài khoản (Ban/Unban)
  async toggleBan(
    id: string,
    banDetails?: BanDetails,
    targetInfo?: { username?: string; email?: string }
  ): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");

    if (auth?.currentUser && auth.currentUser.uid === id) {
      throw new Error("Bạn không thể tự khóa tài khoản của chính mình.");
    }

    const docRef = doc(db, USERS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Tài khoản không tồn tại trên Firestore");

    const data = snap.data();
    const currentIsBanned =
      data.IsBanned === true ||
      data.isBanned === true ||
      data.Status === "banned" ||
      data.status === "banned";

    const effectiveTargetInfo = {
      username: targetInfo?.username || data.Username || id,
      email: targetInfo?.email || data.Email || "",
    };

    if (currentIsBanned) {
      await this.unbanAccount(id, effectiveTargetInfo);
    } else {
      await this.banAccount(
        id,
        banDetails || {
          termTitle: "Vi phạm Điều khoản Dịch vụ",
          note: "Tài khoản bị khóa bởi Quản Trị Viên",
        },
        effectiveTargetInfo
      );
    }
  },

  // 8. Xóa vĩnh viễn tài khoản khỏi Firestore
  async deleteAccount(
    id: string,
    targetInfo?: { username?: string; email?: string }
  ): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");

    if (auth?.currentUser && auth.currentUser.uid === id) {
      throw new Error("Bạn không thể tự xóa tài khoản của chính bạn đang đăng nhập.");
    }

    const docRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(docRef);

    // Ghi nhật ký xóa tài khoản
    await this.logActivity({
      action: "DELETE",
      actionTitle: "Xóa tài khoản",
      targetUserId: id,
      targetUsername: targetInfo?.username || id,
      targetEmail: targetInfo?.email || "",
      details: `Đã xóa vĩnh viễn tài khoản "${targetInfo?.username || id}" khỏi hệ thống.`,
    });
  },

  // 9. Ghi nhận nhật ký đặt lại mật khẩu
  async logResetPassword(account: { id: string; username: string; email?: string }): Promise<void> {
    await this.logActivity({
      action: "RESET_PASSWORD",
      actionTitle: "Đặt lại mật khẩu",
      targetUserId: account.id,
      targetUsername: account.username,
      targetEmail: account.email || "",
      details: `Đã gửi hướng dẫn và đường dẫn đặt lại mật khẩu đến hòm thư: ${account.email || "(không có email)"}.`,
    });
  },

  // 10. Ghi nhật ký hoạt động vào Firestore (Logs/AccountManagement/Activities)
  async logActivity(entry: {
    action: AccountLogAction;
    actionTitle: string;
    targetUserId: string;
    targetUsername: string;
    targetEmail?: string;
    details?: string;
    performedBy?: string;
  }): Promise<void> {
    if (!db) return;

    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const createdAt = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
      const performer =
        entry.performedBy ||
        auth?.currentUser?.email ||
        auth?.currentUser?.displayName ||
        "Admin";

      await addDoc(collection(db, "Logs", "AccountManagement", "Activities"), {
        action: entry.action,
        actionTitle: entry.actionTitle,
        targetUserId: entry.targetUserId,
        targetUsername: entry.targetUsername || "N/A",
        targetEmail: entry.targetEmail || "",
        details: entry.details || "",
        performedBy: performer,
        timestamp: Date.now(),
        createdAt,
      });
    } catch (err) {
      console.warn("Không thể ghi log quản lý tài khoản vào Logs/AccountManagement/Activities:", err);
    }
  },

  // 11. Đọc danh sách nhật ký quản lý tài khoản từ Firestore
  async getAccountLogs(limitCount = 100): Promise<AccountLogItem[]> {
    if (!db) return [];

    try {
      const q = query(
        collection(db, "Logs", "AccountManagement", "Activities"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          action: (data.action as AccountLogAction) || "UPDATE",
          actionTitle: data.actionTitle || "Hoạt động tài khoản",
          targetUserId: data.targetUserId || "",
          targetUsername: data.targetUsername || "N/A",
          targetEmail: data.targetEmail || "",
          details: data.details || "",
          performedBy: data.performedBy || "Admin",
          timestamp: data.timestamp || 0,
          createdAt: data.createdAt || "",
        };
      });
    } catch (err) {
      console.warn("Lỗi khi tải nhật ký tài khoản từ Logs/AccountManagement/Activities:", err);
      return [];
    }
  },
};
