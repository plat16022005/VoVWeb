export type EventRewardRarity = 'UR' | 'SSR' | 'SR' | 'R';
export type EventMissionType = 'daily' | 'once';
export type UnityCompressionType = 'none' | 'gzip' | 'brotli';
export interface EventMissionConfig {
    MissionId: string;
    Title: string;
    Description: string;
    TicketReward: number;
    MissionType: EventMissionType;
    ActionUrl?: string;
}
export interface EventRewardItemConfig {
    ItemId: string;
    ItemName: string;
    Rarity: EventRewardRarity;
    Quantity: number;
    Probability: number;
    IconUrl?: string;
}
export interface UnityWebGlBuildInfo {
    BuildName: string;
    LoaderUrl: string;
    LoaderKey: string;
    DataUrl: string;
    DataKey: string;
    FrameworkUrl: string;
    FrameworkKey: string;
    WasmUrl: string;
    WasmKey: string;
    Compression: UnityCompressionType;
    TotalSizeBytes: number;
    UploadedAt: string;
}
export interface WebEventDocument {
    EventId: string;
    Title: string;
    Subtitle: string;
    Description: string;
    IsActive: boolean;
    StartTime: string;
    EndTime: string;
    InitialTickets: number;
    ReferralTicketReward?: number;
    UnityTargetObject: string;
    HtmlLayoutUrl: string;
    HtmlLayoutKey: string;
    RawHtmlContent: string;
    MergedHtmlContent: string;
    UnityBuild: UnityWebGlBuildInfo | null;
    Missions: EventMissionConfig[];
    Rewards: EventRewardItemConfig[];
    Version: number;
    LastUpdated: string;
    UpdatedBy: string;
}
export interface PlayerSpinRecord {
    SpinId: string;
    Uid: string;
    Username: string;
    EventId: string;
    ItemId: string;
    ItemName: string;
    Rarity: EventRewardRarity;
    Quantity: number;
    WonAt: string;
}
export interface PlayerInventoryEntry {
    ItemId: string;
    ItemName: string;
    Rarity: EventRewardRarity;
    Quantity: number;
    UpdatedAt: string;
}
export interface ReferralHelpEntry {
    Username: string;
    TicketsEarned: number;
    CreatedAt: string;
}
export interface PlayerEventState {
    Uid: string;
    Username: string;
    EventId: string;
    SpinTickets: number;
    TotalSpins: number;
    ClaimedMissions: Record<string, string>;
    Inventory: Record<string, PlayerInventoryEntry>;
    RecentRewards: PlayerSpinRecord[];
    InviteCode: string;
    HelpGivenCount: number;
    HelpReceivedCount: number;
    MaxHelpGiven: number;
    MaxHelpReceived: number;
    UsedHelps: ReferralHelpEntry[];
    ReceivedHelps: ReferralHelpEntry[];
    LastUpdated: string;
}
export type EventLogAction = 'CREATE_EVENT' | 'UPDATE_EVENT' | 'UPLOAD_BUILD' | 'UPLOAD_HTML' | 'ACTIVATE_EVENT' | 'DEACTIVATE_EVENT' | 'DELETE_EVENT';
export interface EventActivityLog {
    id: string;
    action: EventLogAction;
    actionTitle: string;
    eventId: string;
    eventTitle: string;
    buildName?: string;
    version?: number;
    details: string;
    performedBy: string;
    performedByRole?: string;
    timestamp: number;
    createdAt: string;
}
