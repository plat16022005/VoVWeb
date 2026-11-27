"use client";

import { auth } from "@/lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type SystemMailType = "global" | "personal";

export type SystemMailCategory =
  | "NOTICE"
  | "COMPENSATION"
  | "REWARD"
  | "SUPPORT"
  | "EVENT";

export type SystemMailStatus = "SENT" | "REVOKED";

export interface SystemMailRewardItem {
  ItemId: string;
  ItemName: string;
  Quantity: number;
  Rarity: number;
}

export interface SystemMailRewards {
  Gold: number;
  Gems: number;
  Energy: number;
  Items: SystemMailRewardItem[];
}

export interface SystemMailDocument {
  MailId: string;
  ServerId: string;
  Type: SystemMailType;
  Category: SystemMailCategory;
  Title: string;
  Content: string;
  SenderName: string;
  TargetServers: string[];
  ReceiverId: string;
  UserId: string;
  ReceiverName: string;
  ReceiverPlayerCode: string;
  HasRewards: boolean;
  Rewards: SystemMailRewards;
  ReferenceTicketId: string;
  Status: SystemMailStatus;
  IsRead?: boolean;
  IsClaimed?: boolean;
  ClaimedAt?: string;
  ExpiresAt: string;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: string;
  UpdatedBy: string;
}

export interface MailReferenceItem {
  ItemId: string;
  ItemName: string;
  Type: number;
  Rarity: number;
  IconUrl?: string;
}

export interface MailReferenceServer {
  ServerId: string;
  Name: string;
  Status: string;
}

export interface MailReferencesResponse {
  items: MailReferenceItem[];
  servers: MailReferenceServer[];
}

export interface MailPlayerSearchItem {
  uid: string;
  username: string;
  playerCode: string;
  lastServerId: string;
  role: string;
  inGameName?: string;
  characterLevel?: number;
  hasCharacterInServer?: boolean;
  servers: string[];
}

export type MailLogAction =
  | "SEND_GLOBAL_MAIL"
  | "SEND_PERSONAL_MAIL"
  | "SEND_BULK_PERSONAL_MAIL"
  | "REVOKE_MAIL"
  | "RESTORE_MAIL"
  | "DELETE_MAIL";

export interface MailActivityLog {
  id: string;
  action: MailLogAction;
  actionTitle: string;
  mailId: string;
  mailType: SystemMailType;
  category: SystemMailCategory;
  title: string;
  targetSummary: string;
  hasRewards: boolean;
  details: string;
  performedBy: string;
  performedByRole?: string;
  timestamp: number;
  createdAt: string;
}

export interface SendSystemMailPayload {
  Type: SystemMailType;
  Category: SystemMailCategory;
  Title: string;
  Content: string;
  SenderName: string;
  ServerId?: string;
  TargetServers: string[];
  Recipients?: Array<{
    uid: string;
    username: string;
    playerCode: string;
  }>;
  ReferenceTicketId?: string;
  ExpiresAt: string;
  Rewards: SystemMailRewards;
}

export const MAIL_CATEGORY_OPTIONS: Array<{
  value: SystemMailCategory;
  label: string;
  shortLabel: string;
  badgeClass: string;
  borderClass: string;
}> = [
  {
    value: "NOTICE",
    label: "Thông Báo Hệ Thống",
    shortLabel: "Thông Báo",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    borderClass: "border-sky-500/30",
  },
  {
    value: "COMPENSATION",
    label: "Đền Bù & Xử Lý Lỗi",
    shortLabel: "Đền Bù Lỗi",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    borderClass: "border-rose-500/30",
  },
  {
    value: "REWARD",
    label: "Quà Tặng & Tri Ân",
    shortLabel: "Quà Tặng",
    badgeClass: "bg-[#f5c767]/15 text-[#f5c767] border-[#f5c767]/40",
    borderClass: "border-[#f5c767]/30",
  },
  {
    value: "SUPPORT",
    label: "Hỗ Trợ Tài Khoản",
    shortLabel: "Hỗ Trợ CSKH",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    borderClass: "border-emerald-500/30",
  },
  {
    value: "EVENT",
    label: "Thông Báo & Quà Sự Kiện",
    shortLabel: "Sự Kiện",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/40",
    borderClass: "border-purple-500/30",
  },
];

export function getMailCategoryMeta(category?: string) {
  return (
    MAIL_CATEGORY_OPTIONS.find((opt) => opt.value === category) ||
    MAIL_CATEGORY_OPTIONS[0]
  );
}

export interface MailQuickTemplate {
  id: string;
  name: string;
  type: SystemMailType;
  category: SystemMailCategory;
  senderName: string;
  title: string;
  content: string;
}

export const MAIL_QUICK_TEMPLATES: MailQuickTemplate[] = [
  {
    id: "maintenance_comp",
    name: "Đền Bù Bảo Trì Toàn Server",
    type: "global",
    category: "COMPENSATION",
    senderName: "Hội Đồng Veyra",
    title: "Quà Đền Bù Bảo Trì Máy Chủ",
    content:
      "Thưa Chỉ Huy,\n\nQuá trình bảo trì định kỳ máy chủ đã hoàn tất. Cảm ơn Chỉ Huy đã kiên nhẫn chờ đợi và đồng hành cùng các Valkyria.\n\nXin gửi tặng phần quà đền bù đính kèm bên dưới. Chúc Chỉ Huy có những trận chiến thắng lợi tại lục địa Veyra!",
  },
  {
    id: "bug_support",
    name: "Xử Lý Báo Lỗi Cá Nhân",
    type: "personal",
    category: "COMPENSATION",
    senderName: "Đội Hỗ Trợ Kỹ Thuật",
    title: "Phản Hồi Xử Lý Báo Lỗi & Quà Bồi Hoàn",
    content:
      "Thưa Chỉ Huy,\n\nĐội ngũ Hỗ Trợ Người Chơi đã kiểm tra và xác nhận sự cố mà Chỉ Huy phản ánh. Chúng tôi đã tiến hành khắc phục và gửi kèm phần quà bồi hoàn trực tiếp vào hòm thư này.\n\nNếu cần hỗ trợ thêm, xin vui lòng liên hệ lại với bộ phận chăm sóc khách hàng.",
  },
  {
    id: "system_notice",
    name: "Thông Báo Hệ Thống",
    type: "global",
    category: "NOTICE",
    senderName: "Hội Đồng Veyra",
    title: "Thông Báo Cập Nhật Phiên Bản Mới",
    content:
      "Thưa Chỉ Huy,\n\nLục địa Veyra sắp đón nhận bản cập nhật mới với nhiều tối ưu về trải nghiệm chiến đấu và sự kiện hấp dẫn. Vui lòng theo dõi tin tức chi tiết trên trang chủ chính thức.",
  },
  {
    id: "vip_reward",
    name: "Quà Tặng Tri Ân / Đua Top",
    type: "personal",
    category: "REWARD",
    senderName: "Ban Tổ Chức Sự Kiện Veyra",
    title: "Chúc Mừng Nhận Thưởng Vinh Danh",
    content:
      "Thưa Chỉ Huy,\n\nChúc mừng Chỉ Huy đã đạt thành tích xuất sắc! Phần thưởng vinh danh đã được đính kèm bên dưới, vui lòng nhận trước khi thư hết hạn.",
  },
];

export function isMailExpired(mail: SystemMailDocument, nowMs = Date.now()): boolean {
  if (!mail.ExpiresAt) return false;
  const ts = new Date(mail.ExpiresAt).getTime();
  return !Number.isNaN(ts) && ts <= nowMs;
}

class MailService {
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

    const res = await fetch(`${API_BASE_URL}/mail${path}`, {
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

  async getAllMails(serverId?: string): Promise<SystemMailDocument[]> {
    const query =
      serverId && serverId !== "ALL"
        ? `?serverId=${encodeURIComponent(serverId)}`
        : "";
    return this.request<SystemMailDocument[]>(query);
  }

  async getReferences(): Promise<MailReferencesResponse> {
    return this.request<MailReferencesResponse>("/references");
  }

  async searchPlayers(
    query: string,
    serverId?: string,
    includeAll = false
  ): Promise<MailPlayerSearchItem[]> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (serverId) params.set("serverId", serverId);
    if (includeAll) params.set("includeAll", "true");
    return this.request<MailPlayerSearchItem[]>(`/players?${params.toString()}`);
  }

  async sendMail(
    payload: SendSystemMailPayload
  ): Promise<{ sentCount: number; mails: SystemMailDocument[] }> {
    return this.request<{ sentCount: number; mails: SystemMailDocument[] }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async updateMailStatus(
    serverId: string,
    mailId: string,
    status: SystemMailStatus,
    receiverId?: string
  ): Promise<SystemMailDocument> {
    const params = new URLSearchParams({ serverId });
    if (receiverId) params.set("receiverId", receiverId);
    return this.request<SystemMailDocument>(
      `/${encodeURIComponent(mailId)}/status?${params.toString()}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          serverId,
          ...(receiverId ? { receiverId } : {}),
        }),
      }
    );
  }

  async deleteMail(
    serverId: string,
    mailId: string,
    receiverId?: string
  ): Promise<{ success: boolean; deletedMailId: string; serverId: string }> {
    const params = new URLSearchParams({ serverId });
    if (receiverId) params.set("receiverId", receiverId);
    return this.request<{
      success: boolean;
      deletedMailId: string;
      serverId: string;
    }>(`/${encodeURIComponent(mailId)}?${params.toString()}`, {
      method: "DELETE",
    });
  }

  async getMailLogs(limitCount = 150): Promise<MailActivityLog[]> {
    return this.request<MailActivityLog[]>(
      `/logs/activities?limit=${encodeURIComponent(String(limitCount))}`
    );
  }
}

export const mailService = new MailService();
