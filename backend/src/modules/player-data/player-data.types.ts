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
  | 'REVOKE_INVENTORY_ITEM'
  | 'CLEAR_INVENTORY_ITEM'
  | 'REVOKE_EQUIPMENT';

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
  | 'AUTH'
  | 'BATTLE'
  | 'GACHA'
  | 'HERO'
  | 'EQUIPMENT'
  | 'ITEM'
  | 'MAIL'
  | 'GIFTCODE'
  | 'ADMIN'
  | 'SYSTEM';

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
