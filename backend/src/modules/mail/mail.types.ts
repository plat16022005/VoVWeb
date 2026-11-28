export type SystemMailType = 'global' | 'personal';

export type SystemMailCategory =
  | 'NOTICE'
  | 'COMPENSATION'
  | 'REWARD'
  | 'SUPPORT'
  | 'EVENT';

export type SystemMailStatus = 'SENT' | 'REVOKED';

export interface CustomEquipmentStatRoll {
  StatType: number;
  BaseValue: number;
  Value: number;
  UpgradeCount: number;
}

export interface CustomForgedEquipmentSpec {
  TemplateId: string;
  Slot: number;
  Rarity: number;
  EnhanceLevel: number;
  IsLocked: boolean;
  SetId: string;
  MainStat: CustomEquipmentStatRoll;
  SubStats: CustomEquipmentStatRoll[];
}

export interface SystemMailRewardItem {
  ItemId: string;
  ItemName: string;
  Quantity: number;
  Rarity: number;
  CustomEquipment?: CustomForgedEquipmentSpec;
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
  Slot?: number;
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
  | 'SEND_GLOBAL_MAIL'
  | 'SEND_PERSONAL_MAIL'
  | 'SEND_BULK_PERSONAL_MAIL'
  | 'REVOKE_MAIL'
  | 'RESTORE_MAIL'
  | 'DELETE_MAIL';

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
