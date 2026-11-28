"use client";

import { auth } from "@/lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface PlayerServerInfo {
  ServerId: string;
  Name: string;
  Status: string;
}

export interface PlayerShardSummaryItem {
  uid: string;
  username: string;
  email: string;
  playerCode: string;
  provider: string;
  role: string;
  isBanned: boolean;
  serverId: string;
  hasCharacterInServer: boolean;
  inGameName: string;
  level: number;
  exp: number;
  totalCombatPower: number;
  avatarId: string;
  gold: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  lastLogin: string;
}

export interface PlayerProfileData {
  InGameName: string;
  Level: number;
  Exp: number;
  AvatarId: string;
  FrameId: string;
  RenameCount: number;
  TotalCombatPower: number;
}

export interface PlayerWalletData {
  Gold: number;
  Gems: number;
  Energy: number;
  MaxEnergy: number;
  LastEnergyRecover: number;
}

export interface PlayerEquippedSlotDetail {
  slot: number;
  slotLabel: string;
  equipUid: string;
  templateId: string;
  itemName: string;
  iconUrl: string;
  rarity: number;
  enhanceLevel: number;
  mainStatText: string;
}

export interface PlayerHeroDetailItem {
  heroId: string;
  heroName: string;
  title: string;
  role: string;
  rarity: number;
  rarityLabel: string;
  image: string;
  level: number;
  maxLevel: number;
  star: number;
  quality: number;
  qualityName: string;
  exp: number;
  maxExpForLevel: number;
  skillLvs: number[];
  combatPower: number;
  inActiveTeam: boolean;
  activeSlotIndex: number | null;
  equippedSlots: PlayerEquippedSlotDetail[];
}

export interface PlayerFormationSlotItem {
  HeroId: string;
  HeroName: string;
  HeroImage: string;
  RarityLabel: string;
  Level: number;
  Star: number;
  Quality: number;
  SlotIndex: number;
  Row: number;
  Column: number;
}

export interface PlayerFormationData {
  ActiveTeamIndex: number;
  Team1: PlayerFormationSlotItem[];
  Team2: PlayerFormationSlotItem[];
  Team3: PlayerFormationSlotItem[];
}

export interface PlayerInventoryItemDetail {
  itemId: string;
  itemName: string;
  description: string;
  iconUrl: string;
  type: number;
  rarity: number;
  quantity: number;
  maxStack: number;
  dropLocationHint: string;
}

export interface PlayerEquipmentStatRollDetail {
  statType: number;
  statLabel: string;
  baseValue: number;
  value: number;
  formattedValue: string;
  upgradeCount: number;
}

export interface PlayerEquipmentDetailItem {
  equipUid: string;
  templateId: string;
  itemName: string;
  description: string;
  iconUrl: string;
  slot: number;
  slotLabel: string;
  rarity: number;
  enhanceLevel: number;
  maxEnhanceLevel: number;
  equippedHeroId: string;
  equippedHeroName: string;
  isLocked: boolean;
  setId: string;
  createdAt: number;
  mainStat: PlayerEquipmentStatRollDetail | null;
  subStats: PlayerEquipmentStatRollDetail[];
  combatScore: number;
}

export interface PlayerStageStarItem {
  stageId: string;
  chapter: number;
  stageNumber: number;
  stars: number;
}

export interface PlayerProgressData {
  MaxStage: string;
  ClearedStagesCount: number;
  TotalStars: number;
  MaxPossibleStars: number;
  Stages: PlayerStageStarItem[];
  ClaimedChests: string[];
}

export interface PlayerFullServerDetailResponse {
  serverId: string;
  serverName: string;
  uid: string;
  account: {
    username: string;
    email: string;
    playerCode: string;
    provider: string;
    role: string;
    status: string;
    isBanned: boolean;
    createdAt: string;
    lastLogin: string;
    lastServerId: string;
  };
  hasCharacterInServer: boolean;
  profile: PlayerProfileData;
  wallet: PlayerWalletData;
  heroes: PlayerHeroDetailItem[];
  formation: PlayerFormationData;
  inventory: PlayerInventoryItemDetail[];
  equipments: PlayerEquipmentDetailItem[];
  progress: PlayerProgressData;
}

export type PlayerDataLogAction =
  | "REVOKE_INVENTORY_ITEM"
  | "CLEAR_INVENTORY_ITEM"
  | "REVOKE_EQUIPMENT";

export interface PlayerDataActivityLog {
  id: string;
  action: PlayerDataLogAction;
  actionTitle: string;
  serverId: string;
  targetUid: string;
  targetInGameName: string;
  targetUsername: string;
  targetPlayerCode: string;
  itemId: string;
  itemName: string;
  rarity: number;
  previousQuantity: number;
  revokedQuantity: number;
  remainingQuantity: number;
  reason: string;
  details: string;
  performedBy: string;
  performedByRole?: string;
  timestamp: number;
  createdAt: string;
}

export type PlayerActivityLogCategory =
  | "AUTH"
  | "BATTLE"
  | "GACHA"
  | "HERO"
  | "EQUIPMENT"
  | "ITEM"
  | "MAIL"
  | "GIFTCODE"
  | "ADMIN"
  | "SYSTEM";

export interface PlayerActivityWalletDelta {
  GoldBefore: number;
  GoldAfter: number;
  GoldChange: number;
  GemsBefore: number;
  GemsAfter: number;
  GemsChange: number;
  EnergyBefore: number;
  EnergyAfter: number;
  EnergyChange: number;
}

export interface PlayerActivityItemEntry {
  ItemId: string;
  ItemName: string;
  Quantity: number;
}

export interface PlayerActivityItemsDelta {
  Consumed: PlayerActivityItemEntry[];
  Rewarded: PlayerActivityItemEntry[];
}

export interface PlayerGameplayActivityLog {
  LogId: string;
  UserId: string;
  InGameName: string;
  Username: string;
  PlayerCode: string;
  ServerId: string;
  Category: PlayerActivityLogCategory;
  Action: string;
  Status: string;
  Summary: string;
  WalletDelta: PlayerActivityWalletDelta | null;
  ItemsDelta: PlayerActivityItemsDelta;
  Metadata: Record<string, unknown>;
  TimestampMs: number;
  CreatedAt: string;
}

export interface PlayerGameplayActivityLogsResponse {
  serverId: string;
  targetUid: string;
  count: number;
  nextCursor: string;
  categoryCounts: Record<string, number>;
  logs: PlayerGameplayActivityLog[];
}

export const PLAYER_ACTIVITY_CATEGORY_META: Record<
  PlayerActivityLogCategory,
  { label: string; shortLabel: string; badgeClass: string }
> = {
  GACHA: {
    label: "Triệu Hồi Gacha",
    shortLabel: "Gacha",
    badgeClass: "bg-[#f5c767]/15 text-[#f5c767] border-[#f5c767]/45",
  },
  BATTLE: {
    label: "Chiến Dịch PVE",
    shortLabel: "Chiến Dịch",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  },
  HERO: {
    label: "Chiến Binh Valkyria",
    shortLabel: "Tướng",
    badgeClass: "bg-[#3fe9d6]/15 text-[#3fe9d6] border-[#3fe9d6]/40",
  },
  EQUIPMENT: {
    label: "Trang Bị Động",
    shortLabel: "Trang Bị",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  },
  ITEM: {
    label: "Vật Phẩm Tiêu Hao",
    shortLabel: "Vật Phẩm",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  },
  MAIL: {
    label: "Hòm Thư & Nhận Quà",
    shortLabel: "Hòm Thư",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  },
  GIFTCODE: {
    label: "Mã Quà Tặng (Giftcode)",
    shortLabel: "Giftcode",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/40",
  },
  AUTH: {
    label: "Khởi Tạo & Tân Thủ",
    shortLabel: "Tân Thủ",
    badgeClass: "bg-teal-500/15 text-teal-300 border-teal-500/40",
  },
  ADMIN: {
    label: "Tác Vụ Quản Trị",
    shortLabel: "Quản Trị",
    badgeClass: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40",
  },
  SYSTEM: {
    label: "Hệ Thống",
    shortLabel: "Hệ Thống",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  },
};

export const PLAYER_ACTIVITY_ACTION_LABELS: Record<string, string> = {
  INIT_NEWBIE_DATA: "Khởi tạo nhân vật tân thủ",
  START_STAGE: "Bắt đầu ải Chiến dịch",
  CLAIM_STAGE_REWARD: "Hoàn thành & nhận thưởng ải",
  CLAIM_CHAPTER_CHEST: "Mở rương mốc sao chương",
  ROLL_HERO_GACHA: "Triệu hồi Banner Gacha",
  LEVEL_UP_HERO_BATCH: "Nâng cấp độ Valkyria",
  PROMOTE_HERO_QUALITY: "Đột phá phẩm chất Valkyria",
  PROMOTE_HERO_STAR: "Nâng bậc sao Valkyria",
  SAVE_FORMATION: "Lưu đội hình xuất chiến 3×3",
  EQUIP_HERO_EQUIPMENT: "Mặc trang bị cho Valkyria",
  UNEQUIP_HERO_EQUIPMENT: "Tháo trang bị khỏi Valkyria",
  UNEQUIP_ALL_HERO_EQUIPMENTS: "Tháo toàn bộ trang bị",
  AUTO_EQUIP_BEST_HERO: "Tự động mặc trang bị tối ưu",
  ENHANCE_EQUIPMENT: "Cường hóa cấp độ trang bị",
  TOGGLE_EQUIPMENT_LOCK: "Khóa / Mở khóa trang bị",
  SALVAGE_EQUIPMENTS: "Phân giải trang bị nhận nguyên liệu",
  USE_CONSUMABLE_ITEM: "Sử dụng vật phẩm tiêu hao",
  CLAIM_MAIL_REWARD: "Nhận vật phẩm từ thư",
  CLAIM_ALL_MAIL_REWARDS: "Nhận nhanh toàn bộ quà thư",
  REDEEM_GIFTCODE: "Nhập mã quà tặng Giftcode",
  ADMIN_GRANT_EQUIPMENTS: "Cấp trang bị từ quản trị",
  ADMIN_GRANT_ITEMS: "Cấp vật phẩm từ quản trị",
  REVOKE_INVENTORY_ITEM: "Thu hồi vật phẩm túi đồ",
  CLEAR_INVENTORY_ITEM: "Xóa toàn bộ vật phẩm túi đồ",
  REVOKE_EQUIPMENT: "Thu hồi trang bị thực thể",
};

export function getPlayerActivityCategoryMeta(category: string) {
  const key = (category || "SYSTEM").trim().toUpperCase() as PlayerActivityLogCategory;
  return (
    PLAYER_ACTIVITY_CATEGORY_META[key] || PLAYER_ACTIVITY_CATEGORY_META.SYSTEM
  );
}

export function getPlayerActivityActionLabel(action: string): string {
  const key = (action || "").trim().toUpperCase();
  return PLAYER_ACTIVITY_ACTION_LABELS[key] || key || "Hoạt động trong game";
}

export function formatSignedDelta(delta: number): string {
  const num = Math.trunc(Number(delta) || 0);
  if (num > 0) return `+${num.toLocaleString("vi-VN")}`;
  if (num < 0) return num.toLocaleString("vi-VN");
  return "0";
}

export const HERO_QUALITY_META: Record<
  number,
  { label: string; badgeClass: string; maxLevel: number }
> = {
  0: {
    label: "Thường",
    badgeClass: "bg-slate-400/15 text-slate-200 border-slate-400/40",
    maxLevel: 20,
  },
  1: {
    label: "Lục",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-400/45",
    maxLevel: 40,
  },
  2: {
    label: "Lam",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-400/45",
    maxLevel: 60,
  },
  3: {
    label: "Tím",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-400/45",
    maxLevel: 80,
  },
  4: {
    label: "Vàng",
    badgeClass: "bg-[#f5c767]/15 text-[#f5c767] border-[#f5c767]/50",
    maxLevel: 90,
  },
  5: {
    label: "Đỏ",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/50",
    maxLevel: 100,
  },
};

export function getHeroQualityMeta(quality: number) {
  return HERO_QUALITY_META[quality] || HERO_QUALITY_META[0];
}

/**
 * Định dạng tiền tệ / lực chiến giống hệt PlayerWalletDocument.FormatCurrency trong Unity
 */
export function formatCompactCurrency(amount: number): string {
  const num = Number(amount) || 0;
  if (num < 0) return "-" + formatCompactCurrency(-num);
  if (num >= 1_000_000_000) {
    return `${Number((num / 1_000_000_000).toFixed(2))}B`;
  }
  if (num >= 1_000_000) {
    return `${Number((num / 1_000_000).toFixed(2))}M`;
  }
  return num.toLocaleString("vi-VN");
}

class PlayerDataService {
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

    const res = await fetch(`${API_BASE_URL}/player-data${path}`, {
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

  async getServers(): Promise<PlayerServerInfo[]> {
    return this.request<PlayerServerInfo[]>("/servers");
  }

  async listPlayersByServer(
    serverId: string,
    query = "",
    includeWithoutCharacter = false
  ): Promise<PlayerShardSummaryItem[]> {
    const params = new URLSearchParams({
      serverId,
      ...(query.trim() ? { q: query.trim() } : {}),
      ...(includeWithoutCharacter ? { includeAll: "1" } : {}),
    });
    return this.request<PlayerShardSummaryItem[]>(
      `/players?${params.toString()}`
    );
  }

  async getPlayerFullDetail(
    serverId: string,
    uid: string
  ): Promise<PlayerFullServerDetailResponse> {
    return this.request<PlayerFullServerDetailResponse>(
      `/players/${encodeURIComponent(serverId)}/${encodeURIComponent(uid)}`
    );
  }

  async revokeInventoryItem(
    serverId: string,
    uid: string,
    payload: {
      itemId: string;
      amount?: number;
      revokeAll?: boolean;
      reason: string;
    }
  ): Promise<{
    revokedItemId: string;
    revokedItemName: string;
    previousQuantity: number;
    revokedQuantity: number;
    remainingQuantity: number;
    playerDetail: PlayerFullServerDetailResponse;
  }> {
    return this.request(
      `/players/${encodeURIComponent(serverId)}/${encodeURIComponent(uid)}/revoke-item`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async revokeEquipment(
    serverId: string,
    uid: string,
    payload: {
      equipUid: string;
      reason: string;
    }
  ): Promise<{
    revokedEquipUid: string;
    revokedItemName: string;
    unequippedHeroId: string;
    playerDetail: PlayerFullServerDetailResponse;
  }> {
    return this.request(
      `/players/${encodeURIComponent(serverId)}/${encodeURIComponent(uid)}/revoke-equipment`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async getPlayerDataLogs(limitCount = 150): Promise<PlayerDataActivityLog[]> {
    return this.request<PlayerDataActivityLog[]>(
      `/logs/activities?limit=${encodeURIComponent(String(limitCount))}`
    );
  }

  async getPlayerGameplayActivityLogs(
    serverId: string,
    uid: string,
    options: {
      category?: string;
      action?: string;
      search?: string;
      limit?: number;
      startAfterCreatedAt?: string;
    } = {}
  ): Promise<PlayerGameplayActivityLogsResponse> {
    const params = new URLSearchParams();
    if (options.category && options.category !== "ALL") {
      params.set("category", options.category);
    }
    if (options.action) params.set("action", options.action);
    if (options.search?.trim()) params.set("search", options.search.trim());
    if (options.limit) params.set("limit", String(options.limit));
    if (options.startAfterCreatedAt) {
      params.set("startAfterCreatedAt", options.startAfterCreatedAt);
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request<PlayerGameplayActivityLogsResponse>(
      `/players/${encodeURIComponent(serverId)}/${encodeURIComponent(uid)}/activity-logs${qs}`
    );
  }

  async getServerGameplayActivityLogs(
    serverId: string,
    options: {
      targetUid?: string;
      category?: string;
      action?: string;
      search?: string;
      limit?: number;
      startAfterCreatedAt?: string;
    } = {}
  ): Promise<PlayerGameplayActivityLogsResponse> {
    const params = new URLSearchParams();
    if (options.targetUid && options.targetUid !== "all") {
      params.set("targetUid", options.targetUid);
    }
    if (options.category && options.category !== "ALL") {
      params.set("category", options.category);
    }
    if (options.action) params.set("action", options.action);
    if (options.search?.trim()) params.set("search", options.search.trim());
    if (options.limit) params.set("limit", String(options.limit));
    if (options.startAfterCreatedAt) {
      params.set("startAfterCreatedAt", options.startAfterCreatedAt);
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request<PlayerGameplayActivityLogsResponse>(
      `/activity-logs/${encodeURIComponent(serverId)}${qs}`
    );
  }
}

export const playerDataService = new PlayerDataService();
