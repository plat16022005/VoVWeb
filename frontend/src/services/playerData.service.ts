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
}

export const playerDataService = new PlayerDataService();
