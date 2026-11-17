"use client";

import { auth } from "@/lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type EventRewardRarity = "UR" | "SSR" | "SR" | "R";
export type EventMissionType = "daily" | "once";
export type UnityCompressionType = "none" | "gzip" | "brotli";

export interface EventMissionConfig {
  MissionId: string;
  Title: string;
  Description: string;
  TicketReward: number;
  MissionType: EventMissionType;
  ActionUrl?: string;
}

export interface EventRewardItemConfig {
  ItemId: string;
  ItemName: string;
  Rarity: EventRewardRarity;
  Quantity: number;
  Probability: number;
  IconUrl?: string;
}

export interface UnityWebGlBuildInfo {
  BuildName: string;
  LoaderUrl: string;
  LoaderKey: string;
  DataUrl: string;
  DataKey: string;
  FrameworkUrl: string;
  FrameworkKey: string;
  WasmUrl: string;
  WasmKey: string;
  Compression: UnityCompressionType;
  TotalSizeBytes: number;
  UploadedAt: string;
}

export interface WebEventDocument {
  EventId: string;
  Title: string;
  Subtitle: string;
  Description: string;
  IsActive: boolean;
  StartTime: string;
  EndTime: string;
  InitialTickets: number;
  ReferralTicketReward?: number;
  UnityTargetObject: string;
  HtmlLayoutUrl: string;
  HtmlLayoutKey: string;
  RawHtmlContent: string;
  MergedHtmlContent: string;
  UnityBuild: UnityWebGlBuildInfo | null;
  Missions: EventMissionConfig[];
  Rewards: EventRewardItemConfig[];
  Version: number;
  LastUpdated: string;
  UpdatedBy: string;
}

export interface PlayerSpinRecord {
  SpinId: string;
  Uid: string;
  Username: string;
  EventId: string;
  ItemId: string;
  ItemName: string;
  Rarity: EventRewardRarity;
  Quantity: number;
  WonAt: string;
}

export interface PlayerInventoryEntry {
  ItemId: string;
  ItemName: string;
  Rarity: EventRewardRarity;
  Quantity: number;
  UpdatedAt: string;
}

export interface ReferralHelpEntry {
  Username: string;
  TicketsEarned: number;
  CreatedAt: string;
}

export interface PlayerEventState {
  Uid: string;
  Username: string;
  EventId: string;
  SpinTickets: number;
  TotalSpins: number;
  ClaimedMissions: Record<string, string>;
  Inventory: Record<string, PlayerInventoryEntry>;
  RecentRewards: PlayerSpinRecord[];
  InviteCode: string;
  HelpGivenCount: number;
  HelpReceivedCount: number;
  MaxHelpGiven: number;
  MaxHelpReceived: number;
  UsedHelps: ReferralHelpEntry[];
  ReceivedHelps: ReferralHelpEntry[];
  LastUpdated: string;
}

export type EventLogAction =
  | "CREATE_EVENT"
  | "UPDATE_EVENT"
  | "UPLOAD_BUILD"
  | "UPLOAD_HTML"
  | "ACTIVATE_EVENT"
  | "DEACTIVATE_EVENT"
  | "DELETE_EVENT";

export interface EventActivityLog {
  id: string;
  action: EventLogAction;
  actionTitle: string;
  eventId: string;
  eventTitle: string;
  buildName?: string;
  version?: number;
  details: string;
  performedBy: string;
  performedByRole?: string;
  timestamp: number;
  createdAt: string;
}

export interface ZipUnityEntryInspection {
  role: "loader" | "data" | "framework" | "wasm";
  fileName: string;
  contentType: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  localHeaderOffset: number;
}

export interface UnityZipInspectionResult {
  isValid: boolean;
  buildName: string;
  compression: UnityCompressionType;
  totalSizeBytes: number;
  missingRoles: string[];
  entries: Partial<Record<"loader" | "data" | "framework" | "wasm", ZipUnityEntryInspection>>;
}

function classifyUnityEntryName(rawName: string): {
  role: "loader" | "data" | "framework" | "wasm";
  buildName: string;
  compression: UnityCompressionType;
  contentType: string;
} | null {
  const baseName = rawName.split("/").pop()?.split("\\").pop()?.trim() || "";
  if (!baseName || baseName.startsWith(".")) return null;
  const lower = baseName.toLowerCase();

  if (lower.endsWith(".loader.js")) {
    return {
      role: "loader",
      buildName: baseName.slice(0, -".loader.js".length) || "UnityBuild",
      compression: "none",
      contentType: "application/javascript",
    };
  }
  const frameworkMatch = baseName.match(/^(.+?)\.framework\.js(\.(gz|br|unityweb))?$/i);
  if (frameworkMatch) {
    const ext = (frameworkMatch[3] || "").toLowerCase();
    return {
      role: "framework",
      buildName: frameworkMatch[1] || "UnityBuild",
      compression: ext === "gz" ? "gzip" : ext === "br" ? "brotli" : "none",
      contentType: "application/javascript",
    };
  }
  const wasmMatch = baseName.match(/^(.+?)\.wasm(\.(gz|br|unityweb))?$/i);
  if (wasmMatch) {
    const ext = (wasmMatch[3] || "").toLowerCase();
    return {
      role: "wasm",
      buildName: wasmMatch[1] || "UnityBuild",
      compression: ext === "gz" ? "gzip" : ext === "br" ? "brotli" : "none",
      contentType: "application/wasm",
    };
  }
  const dataMatch = baseName.match(/^(.+?)\.data(\.(gz|br|unityweb))?$/i);
  if (dataMatch) {
    const ext = (dataMatch[3] || "").toLowerCase();
    return {
      role: "data",
      buildName: dataMatch[1] || "UnityBuild",
      compression: ext === "gz" ? "gzip" : ext === "br" ? "brotli" : "none",
      contentType: "application/octet-stream",
    };
  }
  return null;
}

/**
 * Quét nhanh cấu trúc file .zip của Unity WebGL ngay khi chọn file để hiển thị trạng thái 4 file chuẩn
 */
export async function inspectUnityZipFile(
  zipFile: File
): Promise<UnityZipInspectionResult> {
  const arrayBuffer = await zipFile.arrayBuffer();
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);

  let eocdOffset = -1;
  const minOffset = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset < 0) {
    return {
      isValid: false,
      buildName: "Không hợp lệ",
      compression: "none",
      totalSizeBytes: 0,
      missingRoles: ["*.loader.js", "*.data", "*.framework.js", "*.wasm"],
      entries: {},
    };
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder("utf-8");

  const entries: Partial<
    Record<"loader" | "data" | "framework" | "wasm", ZipUnityEntryInspection>
  > = {};
  let buildName = "UnityBuild";
  let compression: UnityCompressionType = "none";
  let totalSizeBytes = 0;

  let ptr = centralDirOffset;
  for (let idx = 0; idx < totalEntries && ptr + 46 <= bytes.length; idx++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const uncompressedSize = view.getUint32(ptr + 24, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const entryName = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + fileNameLen));
    ptr += 46 + fileNameLen + extraLen + commentLen;

    if (entryName.endsWith("/") || entryName.includes("__MACOSX")) continue;
    const classified = classifyUnityEntryName(entryName);
    if (!classified) continue;

    const cleanName = entryName.split("/").pop()?.split("\\").pop() || entryName;
    entries[classified.role] = {
      role: classified.role,
      fileName: cleanName,
      contentType: classified.contentType,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      localHeaderOffset,
    };
    buildName = classified.buildName;
    if (classified.compression !== "none") {
      compression = classified.compression;
    }
    totalSizeBytes += uncompressedSize;
  }

  const missingRoles: string[] = [];
  if (!entries.loader) missingRoles.push("*.loader.js");
  if (!entries.data) missingRoles.push("*.data");
  if (!entries.framework) missingRoles.push("*.framework.js");
  if (!entries.wasm) missingRoles.push("*.wasm");

  return {
    isValid: missingRoles.length === 0,
    buildName,
    compression,
    totalSizeBytes,
    missingRoles,
    entries,
  };
}

async function extractZipEntryBlob(
  zipBuffer: ArrayBuffer,
  entry: ZipUnityEntryInspection
): Promise<Blob> {
  const view = new DataView(zipBuffer);
  const bytes = new Uint8Array(zipBuffer);
  const offset = entry.localHeaderOffset;

  if (view.getUint32(offset, true) !== 0x04034b50) {
    throw new Error(`Header tệp "${entry.fileName}" trong ZIP không hợp lệ.`);
  }
  const localNameLen = view.getUint16(offset + 26, true);
  const localExtraLen = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + localNameLen + localExtraLen;
  const compressedSlice = bytes.subarray(
    dataStart,
    dataStart + entry.compressedSize
  );

  if (entry.compressionMethod === 0) {
    return new Blob([compressedSlice], { type: entry.contentType });
  }
  if (entry.compressionMethod === 8 && typeof DecompressionStream !== "undefined") {
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Blob([compressedSlice]).stream().pipeThrough(ds);
    return await new Response(stream).blob();
  }
  throw new Error("Cần giải nén qua máy chủ cho định dạng ZIP này.");
}

class EventsServiceClient {
  async getOptionalAuthToken(): Promise<string> {
    const currentUser = auth?.currentUser;
    if (!currentUser) return "";
    try {
      return await currentUser.getIdToken();
    } catch {
      return "";
    }
  }

  private async getRequiredAuthToken(): Promise<string> {
    const token = await this.getOptionalAuthToken();
    if (!token) {
      throw new Error(
        "Vui lòng đăng nhập tài khoản để thực hiện thao tác này."
      );
    }
    return token;
  }

  private async request<T>(
    path: string,
    init?: RequestInit & { requireAuth?: boolean }
  ): Promise<T> {
    const requireAuth = init?.requireAuth !== false;
    const token = requireAuth
      ? await this.getRequiredAuthToken()
      : await this.getOptionalAuthToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (init?.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE_URL}/events${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as {
        message?: string | string[];
      } | null;
      const msg = Array.isArray(payload?.message)
        ? payload.message[0]
        : payload?.message || `Yêu cầu thất bại (Mã ${res.status}).`;
      throw new Error(msg);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  // ==================== PUBLIC & PLAYER ====================

  async getPublicActiveEvents(): Promise<WebEventDocument[]> {
    return this.request<WebEventDocument[]>("/public", { requireAuth: false });
  }

  async getPublicEventById(eventId: string): Promise<WebEventDocument> {
    return this.request<WebEventDocument>(
      `/public/${encodeURIComponent(eventId)}`,
      { requireAuth: false }
    );
  }

  async getPlayerEventState(eventId: string): Promise<PlayerEventState> {
    return this.request<PlayerEventState>(
      `/${encodeURIComponent(eventId)}/player-state`
    );
  }

  async claimMissionReward(
    eventId: string,
    missionId: string
  ): Promise<{
    mission: EventMissionConfig;
    addedTickets: number;
    playerState: PlayerEventState;
  }> {
    return this.request(
      `/${encodeURIComponent(eventId)}/missions/${encodeURIComponent(missionId)}/claim`,
      { method: "POST", body: JSON.stringify({}) }
    );
  }

  async redeemInviteCode(
    eventId: string,
    code: string
  ): Promise<{
    addedTickets: number;
    targetUsername: string;
    playerState: PlayerEventState;
  }> {
    return this.request(
      `/${encodeURIComponent(eventId)}/referral/redeem`,
      {
        method: "POST",
        body: JSON.stringify({ code }),
      }
    );
  }

  async recordSpinAndSaveReward(
    eventId: string,
    payload: {
      itemId?: string;
      itemName?: string;
      quantity?: number;
      rarity?: EventRewardRarity;
      mode?: "server_random" | "unity_direct";
    }
  ): Promise<{
    reward: PlayerSpinRecord;
    playerState: PlayerEventState;
  }> {
    return this.request(`/${encodeURIComponent(eventId)}/spin`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ==================== MANAGER / ADMIN ====================

  async getAllEvents(): Promise<WebEventDocument[]> {
    return this.request<WebEventDocument[]>("");
  }

  async getEventById(eventId: string): Promise<WebEventDocument> {
    return this.request<WebEventDocument>(`/${encodeURIComponent(eventId)}`);
  }

  async createEvent(
    payload: Partial<WebEventDocument> & { EventId: string; Title: string }
  ): Promise<WebEventDocument> {
    return this.request<WebEventDocument>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateEvent(
    eventId: string,
    payload: Partial<WebEventDocument>
  ): Promise<WebEventDocument> {
    return this.request<WebEventDocument>(`/${encodeURIComponent(eventId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async toggleEventActive(
    eventId: string,
    isActive: boolean
  ): Promise<WebEventDocument> {
    return this.request<WebEventDocument>(
      `/${encodeURIComponent(eventId)}/active`,
      {
        method: "PATCH",
        body: JSON.stringify({ IsActive: isActive }),
      }
    );
  }

  async deleteEvent(
    eventId: string
  ): Promise<{ success: boolean; deletedMediaKeys: string[] }> {
    return this.request<{ success: boolean; deletedMediaKeys: string[] }>(
      `/${encodeURIComponent(eventId)}`,
      { method: "DELETE" }
    );
  }

  async createMediaPresign(input: {
    eventId: string;
    role: "loader" | "data" | "framework" | "wasm" | "html";
    fileName: string;
    contentType: string;
    fileSize: number;
  }): Promise<{
    uploadUrl: string;
    publicUrl: string;
    key: string;
    contentType: string;
  }> {
    return this.request("/media/presign", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /**
   * Giải nén 4 file từ gói .zip Unity WebGL và đẩy trực tiếp lên đám mây lưu trữ (Presigned R2 PUT)
   * Nếu trình duyệt hoặc mạng chặn CORS PUT trực tiếp, tự động chuyển sang giải nén ở Backend!
   */
  async uploadUnityZipToCloud(
    eventId: string,
    zipFile: File,
    onStatus?: (stepText: string, percent: number) => void
  ): Promise<UnityWebGlBuildInfo> {
    onStatus?.("Đang kiểm tra cấu trúc bản build Unity WebGL (.zip)...", 10);
    const inspection = await inspectUnityZipFile(zipFile);
    if (!inspection.isValid) {
      throw new Error(
        `Tệp .zip thiếu các thành phần bắt buộc của Unity WebGL: ${inspection.missingRoles.join(", ")}`
      );
    }

    const zipBuffer = await zipFile.arrayBuffer();
    const roles: Array<"loader" | "data" | "framework" | "wasm"> = [
      "loader",
      "framework",
      "wasm",
      "data",
    ];
    const uploaded: Partial<
      Record<"loader" | "data" | "framework" | "wasm", { publicUrl: string; key: string }>
    > = {};

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const entry = inspection.entries[role]!;
      onStatus?.(
        `Đang giải nén & tải tệp ${entry.fileName} (${i + 1}/4)...`,
        20 + i * 18
      );

      const blob = await extractZipEntryBlob(zipBuffer, entry);
      const presign = await this.createMediaPresign({
        eventId,
        role,
        fileName: entry.fileName,
        contentType: entry.contentType,
        fileSize: blob.size,
      });

      try {
        const putRes = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": presign.contentType,
          },
          body: blob,
        });

        if (!putRes.ok) {
          throw new Error(`HTTP ${putRes.status}`);
        }
      } catch {
        // Fallback: Giải nén & đẩy lên lưu trữ trực tiếp qua máy chủ Backend (tránh lỗi CORS trình duyệt)
        onStatus?.(
          "Đang chuyển luồng giải nén & đồng bộ trực tiếp qua máy chủ...",
          60
        );
        const updatedEvent = await this.uploadZipViaBackend(eventId, zipFile);
        if (!updatedEvent.UnityBuild) {
          throw new Error(
            "Không thể đồng bộ gói bản build Unity lên đám mây lưu trữ."
          );
        }
        onStatus?.("Đã giải nén và đồng bộ bản build Unity hoàn tất!", 95);
        return updatedEvent.UnityBuild;
      }

      uploaded[role] = {
        publicUrl: presign.publicUrl,
        key: presign.key,
      };
    }

    onStatus?.("Đã tải hoàn tất 4 tệp cốt lõi của Unity WebGL!", 95);

    return {
      BuildName: inspection.buildName,
      LoaderUrl: uploaded.loader!.publicUrl,
      LoaderKey: uploaded.loader!.key,
      DataUrl: uploaded.data!.publicUrl,
      DataKey: uploaded.data!.key,
      FrameworkUrl: uploaded.framework!.publicUrl,
      FrameworkKey: uploaded.framework!.key,
      WasmUrl: uploaded.wasm!.publicUrl,
      WasmKey: uploaded.wasm!.key,
      Compression: inspection.compression,
      TotalSizeBytes: inspection.totalSizeBytes,
      UploadedAt: new Date().toISOString(),
    };
  }

  async uploadZipViaBackend(
    eventId: string,
    zipFile: File,
    rawHtmlContent?: string
  ): Promise<WebEventDocument> {
    const zipBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Không thể đọc tệp .zip."));
      reader.readAsDataURL(zipFile);
    });

    return this.request<WebEventDocument>(
      `/${encodeURIComponent(eventId)}/upload-package`,
      {
        method: "POST",
        body: JSON.stringify({
          zipBase64,
          ...(rawHtmlContent !== undefined
            ? { RawHtmlContent: rawHtmlContent }
            : {}),
        }),
      }
    );
  }

  // ==================== ADMIN AUDIT LOGS ====================

  async getEventLogs(limitCount = 50): Promise<EventActivityLog[]> {
    return this.request<EventActivityLog[]>(
      `/logs/activities?limit=${encodeURIComponent(String(limitCount))}`
    );
  }
}

export const eventsService = new EventsServiceClient();
