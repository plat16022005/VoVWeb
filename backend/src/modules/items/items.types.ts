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

/**
 * Cấu hình gốc của Vật phẩm trên Cloud Firestore (Collection: "ItemConfigs")
 * Khớp 100% với class C# ItemConfigData trong dự án Unity ValkyriaOfVerya.
 */
export interface ItemConfigDocument {
  ItemId: string;
  ItemName: string;
  Description: string;
  Type: GameItemType;
  Rarity: GameItemRarity;
  MaxStack: number;
  DropLocationHint: string;

  // Thuộc tính Tiêu hao (Consumable - Type === 0)
  ConsumableType: GameConsumableEffectType;
  EffectValue: number;

  // Thuộc tính Trang bị (Equipment - Type === 2: chỉ mẫu Slot & SetId, chỉ số sinh động trên Server)
  Slot: GameEquipSlot;
  SetId: string;

  // Thuộc tính Mảnh ghép (Shard - Type === 3)
  TargetHeroId: string;
  RequiredShardsToSummon: number;

  // Thông tin kiểm toán trên Web (Unity FirestoreData tự bỏ qua các trường phụ)
  LastUpdated?: string;
  UpdatedBy?: string;
}

export type ItemLogAction =
  | 'CREATE_ITEM'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'SEED_SAMPLE_ITEMS';

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
