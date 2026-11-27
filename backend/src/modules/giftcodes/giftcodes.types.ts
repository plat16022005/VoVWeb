export type GiftcodeType = 'COMMON' | 'SINGLE_USE';

export type GiftcodeCampaignCategory =
  | 'LAUNCH'
  | 'EVENT'
  | 'LIVESTREAM'
  | 'COMPENSATION'
  | 'PARTNER'
  | 'OTHER';

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
  IconUrl?: string;
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
  | 'CREATE_GIFTCODE'
  | 'CREATE_BATCH_GIFTCODES'
  | 'UPDATE_GIFTCODE'
  | 'ACTIVATE_GIFTCODE'
  | 'DEACTIVATE_GIFTCODE'
  | 'DELETE_GIFTCODE';

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
