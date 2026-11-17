export type BannerType = 'limited' | 'standard' | 'novice';
export type HeroRarityKey = 'UR' | 'SSR' | 'SR' | 'R';
export declare const HERO_RARITY_KEYS: HeroRarityKey[];
export interface GachaCostConfig {
    TicketItemId: string;
    TicketPerRoll: number;
    AllowGemFallback: boolean;
    GemCostPerRoll: number;
    MultiRollCount: number;
}
export interface GachaPityConfig {
    SharedPityGroup: string;
    SoftPityStart: number;
    SoftPityStepRate: number;
    HardPityCount: number;
    GuaranteedSrEvery: number;
    EnableRateUpGuarantee: boolean;
    RateUpWinChance: number;
}
export interface GachaPoolEntry {
    HeroId: string;
    Weight: number;
}
export interface GachaDuplicateRule {
    ShardAmount: number;
    BonusItemId: string;
    BonusQty: number;
}
export interface GachaBannerConfig {
    BannerId: string;
    Title: string;
    Subtitle: string;
    Description: string;
    BannerType: BannerType;
    SortOrder: number;
    BannerImageUrl: string;
    BannerImageKey: string;
    BannerTabImageUrl?: string;
    BannerTabImageKey?: string;
    BannerArtKey?: string;
    IsActive: boolean;
    StartTime: string | null;
    EndTime: string | null;
    MaxTotalRolls: number;
    Cost: GachaCostConfig;
    Pity: GachaPityConfig;
    RarityRates: Record<HeroRarityKey, number>;
    RateUpHeroIds: string[];
    Pool: Record<HeroRarityKey, GachaPoolEntry[]>;
    DuplicateConversion: Record<HeroRarityKey, GachaDuplicateRule>;
}
export interface GachaSeasonDocument {
    SeasonId: string;
    SeasonName: string;
    Version: number;
    IsActive: boolean;
    StartTime: string;
    EndTime: string;
    LastUpdated: string;
    UpdatedBy: string;
    Banners: Record<string, GachaBannerConfig>;
}
export type GachaLogAction = 'CREATE_SEASON' | 'CLONE_SEASON' | 'UPDATE_SEASON' | 'ACTIVATE_SEASON' | 'DEACTIVATE_SEASON' | 'DELETE_SEASON' | 'CREATE_BANNER' | 'UPDATE_BANNER' | 'TOGGLE_BANNER' | 'DELETE_BANNER';
export interface GachaActivityLog {
    id: string;
    action: GachaLogAction;
    actionTitle: string;
    seasonId: string;
    seasonName: string;
    bannerId?: string;
    bannerTitle?: string;
    bannerType?: string;
    version?: number;
    details: string;
    performedBy: string;
    performedByRole?: string;
    timestamp: number;
    createdAt: string;
}
export interface HeroReferenceItem {
    id: string;
    name: string;
    title?: string;
    role: string;
    rarity: number;
    rarityLabel: string;
    image: string;
}
export interface GameItemReference {
    ItemId: string;
    Name: string;
    Description?: string;
    Type: number;
    Rarity?: string;
    IconUrl?: string;
    IconKey?: string;
}
export interface AuthenticatedOperator {
    uid: string;
    email: string;
    username: string;
    role: 'Admin' | 'Manager';
    permissions: string[];
    authTokenForFirestore: string;
}
