"use client";

import { auth } from "@/lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type GiftcodeType = "COMMON" | "SINGLE_USE";

export type GiftcodeCampaignCategory =
  | "LAUNCH"
  | "EVENT"
  | "LIVESTREAM"
  | "COMPENSATION"
  | "PARTNER"
  | "OTHER";

export const CAMPAIGN_CATEGORY_OPTIONS: Array<{
  value: GiftcodeCampaignCategory;
  label: string;
  shortLabel: string;
  badgeClass: string;
  borderClass: string;
}> = [
  {
    value: "LAUNCH",
    label: "Ra Mắt & Tân Thủ",
    shortLabel: "Ra Mắt",
    badgeClass: "bg-[#f5c767]/15 text-[#f5c767] border-[#f5c767]/40",
    borderClass: "border-[#f5c767]/30",
  },
  {
    value: "EVENT",
    label: "Sự Kiện & Mùa Giải",
    shortLabel: "Sự Kiện",
    badgeClass: "bg-[#3fe9d6]/15 text-[#3fe9d6] border-[#3fe9d6]/40",
    borderClass: "border-[#3fe9d6]/30",
  },
  {
    value: "LIVESTREAM",
    label: "Livestream & Cộng Đồng",
    shortLabel: "Livestream",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/40",
    borderClass: "border-purple-500/30",
  },
  {
    value: "COMPENSATION",
    label: "Đền Bù & Bảo Trì",
    shortLabel: "Đền Bù",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    borderClass: "border-rose-500/30",
  },
  {
    value: "PARTNER",
    label: "Đối Tác & VIP",
    shortLabel: "Đối Tác / VIP",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    borderClass: "border-sky-500/30",
  },
  {
    value: "OTHER",
    label: "Chiến Dịch Khác",
    shortLabel: "Khác",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/40",
    borderClass: "border-slate-500/30",
  },
];

export function getCampaignCategoryMeta(category?: string) {
  return (
    CAMPAIGN_CATEGORY_OPTIONS.find((opt) => opt.value === category) ||
    CAMPAIGN_CATEGORY_OPTIONS[1]
  );
}

export interface GiftcodeRewardItem {
  ItemId: string;
  ItemName: string;
  Quantity: number;
  Rarity: number;
}

export interface GiftcodeRewards {
  Gold: number;
  Gems: number;
  Energy: number;
  Items: GiftcodeRewardItem[];
}

export interface GiftcodeDocument {
  Code: string;
  Title: string;
  Description: string;
  CodeType: GiftcodeType;
  CampaignCategory: GiftcodeCampaignCategory;
  CampaignName: string;
  BatchId?: string;
  IsActive: boolean;
  IsPublicDisplay: boolean;
  MaxRedemptions: number;
  CurrentRedemptions: number;
  MaxPerUser: number;
  AllowedServers: string[];
  StartsAt: string;
  ExpiresAt: string;
  Rewards: GiftcodeRewards;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: string;
  UpdatedBy: string;
}

export interface PublicGiftcodeItem {
  Code: string;
  Title: string;
  Description: string;
  CampaignCategory: GiftcodeCampaignCategory;
  CampaignName: string;
  ExpiresAt: string;
  AllowedServers: string[];
  Rewards: GiftcodeRewards;
}

export interface GiftcodeReferenceItem {
  ItemId: string;
  ItemName: string;
  Type: number;
  Rarity: number;
}

export interface GiftcodeReferenceServer {
  ServerId: string;
  Name: string;
  Status: string;
}

export interface GiftcodeReferencesResponse {
  items: GiftcodeReferenceItem[];
  servers: GiftcodeReferenceServer[];
}

export type GiftcodeLogAction =
  | "CREATE_GIFTCODE"
  | "CREATE_BATCH_GIFTCODES"
  | "UPDATE_GIFTCODE"
  | "ACTIVATE_GIFTCODE"
  | "DEACTIVATE_GIFTCODE"
  | "DELETE_GIFTCODE";

export interface GiftcodeActivityLog {
  id: string;
  action: GiftcodeLogAction;
  actionTitle: string;
  code: string;
  title: string;
  codeType: GiftcodeType;
  campaignCategory?: GiftcodeCampaignCategory;
  campaignName?: string;
  batchId?: string;
  details: string;
  performedBy: string;
  performedByRole?: string;
  timestamp: number;
  createdAt: string;
}

export interface CreateGiftcodePayload {
  Code: string;
  Title: string;
  Description: string;
  CodeType: GiftcodeType;
  CampaignCategory: GiftcodeCampaignCategory;
  CampaignName: string;
  IsActive: boolean;
  IsPublicDisplay: boolean;
  MaxRedemptions: number;
  MaxPerUser: number;
  AllowedServers: string[];
  StartsAt: string;
  ExpiresAt: string;
  Rewards: GiftcodeRewards;
}

export interface CreateBatchGiftcodePayload {
  Prefix: string;
  RandomLength: number;
  Count: number;
  Title: string;
  Description: string;
  CampaignCategory: GiftcodeCampaignCategory;
  CampaignName: string;
  IsActive: boolean;
  AllowedServers: string[];
  StartsAt: string;
  ExpiresAt: string;
  Rewards: GiftcodeRewards;
}

export type GiftcodeComputedStatus =
  | "ACTIVE"
  | "SCHEDULED"
  | "DISABLED"
  | "EXPIRED"
  | "DEPLETED";

export function computeGiftcodeStatus(
  gift: GiftcodeDocument,
  nowMs = Date.now()
): GiftcodeComputedStatus {
  if (!gift.IsActive) return "DISABLED";
  if (gift.ExpiresAt && new Date(gift.ExpiresAt).getTime() <= nowMs) {
    return "EXPIRED";
  }
  if (
    gift.MaxRedemptions > 0 &&
    gift.CurrentRedemptions >= gift.MaxRedemptions
  ) {
    return "DEPLETED";
  }
  if (gift.StartsAt && new Date(gift.StartsAt).getTime() > nowMs) {
    return "SCHEDULED";
  }
  return "ACTIVE";
}

export function generateClientRandomCode(length = 8): string {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

class GiftcodesService {
  private async getAuthToken(): Promise<string> {
    if (!auth) {
      throw new Error("Hệ thống xác thực chưa sẵn sàng.");
    }
    if (typeof auth.authStateReady === "function") {
      await auth.authStateReady();
    }
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    return user.getIdToken();
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    };

    const res = await fetch(`${API_BASE_URL}/giftcodes${path}`, {
      ...init,
      headers,
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

  async getPublicGiftcodes(): Promise<PublicGiftcodeItem[]> {
    const res = await fetch(`${API_BASE_URL}/giftcodes/public`);
    if (!res.ok) return [];
    return (await res.json()) as PublicGiftcodeItem[];
  }

  async getAllGiftcodes(): Promise<GiftcodeDocument[]> {
    return this.request<GiftcodeDocument[]>("");
  }

  async getReferences(): Promise<GiftcodeReferencesResponse> {
    return this.request<GiftcodeReferencesResponse>("/references");
  }

  async createGiftcode(
    payload: CreateGiftcodePayload
  ): Promise<GiftcodeDocument> {
    return this.request<GiftcodeDocument>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createBatchGiftcodes(
    payload: CreateBatchGiftcodePayload
  ): Promise<{ batchId: string; count: number; codes: GiftcodeDocument[] }> {
    return this.request<{
      batchId: string;
      count: number;
      codes: GiftcodeDocument[];
    }>("/batch", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateGiftcode(
    code: string,
    payload: Partial<CreateGiftcodePayload>
  ): Promise<GiftcodeDocument> {
    return this.request<GiftcodeDocument>(`/${encodeURIComponent(code)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async toggleGiftcodeActive(
    code: string,
    isActive: boolean
  ): Promise<GiftcodeDocument> {
    return this.request<GiftcodeDocument>(
      `/${encodeURIComponent(code)}/active`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }
    );
  }

  async deleteGiftcode(
    code: string
  ): Promise<{ success: boolean; deletedCode: string }> {
    return this.request<{ success: boolean; deletedCode: string }>(
      `/${encodeURIComponent(code)}`,
      { method: "DELETE" }
    );
  }

  async getGiftcodeLogs(limitCount = 150): Promise<GiftcodeActivityLog[]> {
    return this.request<GiftcodeActivityLog[]>(
      `/logs/activities?limit=${encodeURIComponent(String(limitCount))}`
    );
  }
}

export const giftcodesService = new GiftcodesService();
