"use client";

import { auth } from "@/lib/firebase";
import { gachaService } from "./gacha.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export enum GameItemType {
  Consumable = 0,
  Material = 1,
  Equipment = 2,
  Shard = 3,
  Ticket = 4,
}

export enum GameItemRarity {
  Common = 0,
  Rare = 1,
  Epic = 2,
  Legendary = 3,
  Mythic = 4,
}

export enum GameEquipSlot {
  None = 0,
  Weapon = 1,
  Helmet = 2,
  Armor = 3,
  Boots = 4,
  Accessory = 5,
  Gloves = 6,
}

export enum GameConsumableEffectType {
  None = 0,
  AddExpToHero = 1,
  AddEnergyToPlayer = 2,
  AddGoldToPlayer = 3,
  AddGemsToPlayer = 4,
  OpenChestRandom = 5,
  OpenChestSelector = 6,
}

export interface ItemConfigDocument {
  ItemId: string;
  ItemName: string;
  Description: string;
  Type: GameItemType;
  Rarity: GameItemRarity;
  MaxStack: number;
  DropLocationHint: string;

  // Tiêu hao (Type === 0)
  ConsumableType: GameConsumableEffectType;
  EffectValue: number;

  // Trang bị (Type === 2 - mẫu Slot & SetId, chỉ số sinh động trên Server)
  Slot: GameEquipSlot;
  SetId: string;

  // Mảnh ghép (Type === 3)
  TargetHeroId: string;
  RequiredShardsToSummon: number;

  // Biểu tượng / Hình ảnh vật phẩm
  IconUrl?: string;
  IconKey?: string;

  LastUpdated?: string;
  UpdatedBy?: string;
}

export interface ItemMediaPresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  contentType: string;
  expiresInSeconds: number;
}

export type ItemLogAction =
  | "CREATE_ITEM"
  | "UPDATE_ITEM"
  | "DELETE_ITEM"
  | "SEED_SAMPLE_ITEMS";

export interface ItemActivityLog {
  id: string;
  action: ItemLogAction;
  actionTitle: string;
  itemId: string;
  itemName: string;
  itemType: number;
  rarity: number;
  details: string;
  performedBy: string;
  performedByRole?: string;
  timestamp: number;
  createdAt: string;
}

/**
 * Interface rút gọn dùng cho bộ chọn vật phẩm Gacha (ItemSelectorField)
 */
export interface GameItemConfig {
  id: string;
  name: string;
  type: number;
  rarity?: string;
  description?: string;
  iconUrl?: string;
}

export const ITEM_TYPE_OPTIONS: Array<{
  value: GameItemType;
  label: string;
  shortLabel: string;
  code: string;
  description: string;
}> = [
  {
    value: GameItemType.Consumable,
    label: "Vật Phẩm Tiêu Hao",
    shortLabel: "Tiêu Hao",
    code: "CONSUMABLE",
    description: "Bình thể lực, Sách EXP, Rương quà có thể bấm Sử Dụng",
  },
  {
    value: GameItemType.Material,
    label: "Nguyên Liệu Nâng Cấp",
    shortLabel: "Nguyên Liệu",
    code: "MATERIAL",
    description: "Đá đột phá sao, tăng cấp kỹ năng, phôi đúc trang bị",
  },
  {
    value: GameItemType.Equipment,
    label: "Trang Bị Chiến Binh",
    shortLabel: "Trang Bị",
    code: "EQUIPMENT",
    description: "Vũ khí, Mũ, Áo Giáp, Giày, Phụ kiện, Găng tay (chỉ số sinh động)",
  },
  {
    value: GameItemType.Shard,
    label: "Mảnh Ghép Triệu Hồi",
    shortLabel: "Mảnh Ghép",
    code: "SHARD",
    description: "Mảnh hồn Tướng Valkyria dùng để triệu hồi hoặc nâng sao",
  },
  {
    value: GameItemType.Ticket,
    label: "Vé & Tiền Tệ Đặc Thù",
    shortLabel: "Vé / Tiền Tệ",
    code: "TICKET",
    description: "Vé chiêu mộ Gacha, vé phó bản, vé đấu trường",
  },
];

export const ITEM_RARITY_OPTIONS: Array<{
  value: GameItemRarity;
  tier: string;
  label: string;
  hexColor: string;
  badgeClass: string;
  borderClass: string;
}> = [
  {
    value: GameItemRarity.Common,
    tier: "N",
    label: "Phổ Thông",
    hexColor: "#FFFFFF",
    badgeClass: "bg-slate-400/15 text-slate-200 border-slate-400/40",
    borderClass:
      "border-slate-400/60 bg-slate-400/10 shadow-[0_0_12px_rgba(148,163,184,0.18)]",
  },
  {
    value: GameItemRarity.Rare,
    tier: "R",
    label: "Hiếm",
    hexColor: "#4DA6FF",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-400/45",
    borderClass:
      "border-sky-400/75 bg-sky-500/15 shadow-[0_0_14px_rgba(56,189,248,0.25)]",
  },
  {
    value: GameItemRarity.Epic,
    tier: "SR",
    label: "Sử Thi",
    hexColor: "#B366FF",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-400/45",
    borderClass:
      "border-purple-400/75 bg-purple-500/15 shadow-[0_0_14px_rgba(192,132,252,0.28)]",
  },
  {
    value: GameItemRarity.Legendary,
    tier: "SSR",
    label: "Huyền Thoại",
    hexColor: "#FFB733",
    badgeClass: "bg-[#f5c767]/15 text-[#f5c767] border-[#f5c767]/50",
    borderClass:
      "border-[#f5c767]/85 bg-[#f5c767]/15 shadow-[0_0_16px_rgba(245,199,103,0.32)]",
  },
  {
    value: GameItemRarity.Mythic,
    tier: "UR",
    label: "Thần Thoại",
    hexColor: "#FF3B30",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/50",
    borderClass:
      "border-rose-500/85 bg-rose-500/15 shadow-[0_0_16px_rgba(244,63,94,0.35)]",
  },
];

export const EQUIP_SLOT_OPTIONS: Array<{
  value: GameEquipSlot;
  label: string;
  hint: string;
}> = [
  { value: GameEquipSlot.None, label: "Chung / Không cố định", hint: "Mặc định" },
  { value: GameEquipSlot.Weapon, label: "Vũ Khí (Weapon)", hint: "ATK, Crit Rate" },
  { value: GameEquipSlot.Helmet, label: "Mũ / Nón (Helmet)", hint: "HP, DEF" },
  { value: GameEquipSlot.Armor, label: "Áo Giáp (Armor)", hint: "DEF, HP" },
  { value: GameEquipSlot.Boots, label: "Giày (Boots)", hint: "Speed, HP, Dodge" },
  {
    value: GameEquipSlot.Accessory,
    label: "Phụ Kiện (Accessory)",
    hint: "Crit Rate, Crit Dmg, ATK",
  },
  {
    value: GameEquipSlot.Gloves,
    label: "Găng Tay (Gloves)",
    hint: "ATK, Crit Dmg, Parry",
  },
];

export const CONSUMABLE_EFFECT_OPTIONS: Array<{
  value: GameConsumableEffectType;
  label: string;
  unit: string;
}> = [
  { value: GameConsumableEffectType.None, label: "Không có hiệu ứng trực tiếp", unit: "" },
  {
    value: GameConsumableEffectType.AddExpToHero,
    label: "Cộng Điểm Kinh Nghiệm (EXP) Cho Tướng",
    unit: "EXP",
  },
  {
    value: GameConsumableEffectType.AddEnergyToPlayer,
    label: "Hồi Phục Thể Lực (Energy) Người Chơi",
    unit: "Energy",
  },
  {
    value: GameConsumableEffectType.AddGoldToPlayer,
    label: "Cộng Vàng (Gold) Vào Ví",
    unit: "Gold",
  },
  {
    value: GameConsumableEffectType.AddGemsToPlayer,
    label: "Cộng Ngọc (Gems) Vào Ví",
    unit: "Gems",
  },
  {
    value: GameConsumableEffectType.OpenChestRandom,
    label: "Mở Rương Vật Phẩm Ngẫu Nhiên",
    unit: "Vật phẩm",
  },
  {
    value: GameConsumableEffectType.OpenChestSelector,
    label: "Mở Hộp Quà Tự Chọn",
    unit: "Lựa chọn",
  },
];

export function getItemTypeMeta(type: number) {
  return (
    ITEM_TYPE_OPTIONS.find((opt) => opt.value === type) || ITEM_TYPE_OPTIONS[1]
  );
}

export function getItemRarityMeta(rarity: number) {
  return (
    ITEM_RARITY_OPTIONS.find((opt) => opt.value === rarity) ||
    ITEM_RARITY_OPTIONS[0]
  );
}

export function getEquipSlotMeta(slot: number) {
  return (
    EQUIP_SLOT_OPTIONS.find((opt) => opt.value === slot) ||
    EQUIP_SLOT_OPTIONS[0]
  );
}

export function getConsumableEffectMeta(effectType: number) {
  return (
    CONSUMABLE_EFFECT_OPTIONS.find((opt) => opt.value === effectType) ||
    CONSUMABLE_EFFECT_OPTIONS[0]
  );
}

class ItemConfigService {
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

    const res = await fetch(`${API_BASE_URL}/items${path}`, {
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

  /**
   * Đọc danh sách vật phẩm rút gọn cho bộ chọn Gacha (đã sắp xếp Type === 4 lên đầu).
   */
  async getItems(): Promise<GameItemConfig[]> {
    const refs = await gachaService.getReferenceItems();
    return refs.map((item) => ({
      id: item.ItemId,
      name: item.Name,
      type: item.Type,
      rarity: item.Rarity,
      description: item.Description,
      iconUrl: item.IconUrl,
    }));
  }

  // ==================== FULL ITEM CONFIG CRUD (BACKEND /api/items) ====================

  async getAllItemConfigs(): Promise<ItemConfigDocument[]> {
    return this.request<ItemConfigDocument[]>("");
  }

  async getItemConfigById(itemId: string): Promise<ItemConfigDocument> {
    return this.request<ItemConfigDocument>(`/${encodeURIComponent(itemId)}`);
  }

  async createItemConfig(
    payload: Partial<ItemConfigDocument> & { ItemId: string; ItemName: string }
  ): Promise<ItemConfigDocument> {
    return this.request<ItemConfigDocument>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateItemConfig(
    itemId: string,
    payload: Partial<ItemConfigDocument>
  ): Promise<ItemConfigDocument> {
    return this.request<ItemConfigDocument>(`/${encodeURIComponent(itemId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteItemConfig(
    itemId: string
  ): Promise<{ success: boolean; deletedItemId: string }> {
    return this.request<{ success: boolean; deletedItemId: string }>(
      `/${encodeURIComponent(itemId)}`,
      { method: "DELETE" }
    );
  }

  async seedUnitySampleItems(): Promise<{
    seededCount: number;
    items: ItemConfigDocument[];
  }> {
    return this.request<{ seededCount: number; items: ItemConfigDocument[] }>(
      "/seed-samples",
      { method: "POST", body: JSON.stringify({}) }
    );
  }

  async getItemLogs(limitCount = 100): Promise<ItemActivityLog[]> {
    return this.request<ItemActivityLog[]>(
      `/logs/activities?limit=${encodeURIComponent(String(limitCount))}`
    );
  }

  async createMediaPresign(params: {
    itemId?: string;
    fileName: string;
    contentType: string;
    fileSize?: number;
  }): Promise<ItemMediaPresignResponse> {
    return this.request<ItemMediaPresignResponse>("/media/presign", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async cleanupTempMedia(
    keys: string[]
  ): Promise<{ deletedKeys: string[]; skippedLiveKeys: string[] }> {
    return this.request<{ deletedKeys: string[]; skippedLiveKeys: string[] }>(
      "/media/cleanup-temp",
      {
        method: "POST",
        body: JSON.stringify({ keys }),
      }
    );
  }
}

export const itemConfigService = new ItemConfigService();
