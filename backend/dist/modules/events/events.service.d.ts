import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import { EventMediaPresignResult, EventsR2Service } from './events-r2.service.js';
import { EventActivityLog, EventMissionConfig, PlayerEventState, PlayerSpinRecord, WebEventDocument } from './events.types.js';
export declare class EventsService {
    private readonly firebase;
    private readonly r2;
    private readonly logger;
    private readonly buildAssetCache;
    constructor(firebase: GachaFirebaseService, r2: EventsR2Service);
    private assertValidId;
    private normalizeMissions;
    private normalizeRewards;
    private normalizeUnityBuild;
    private normalizeEventDocument;
    private logEventActivity;
    getAllEvents(operator: AuthenticatedOperator): Promise<WebEventDocument[]>;
    getEventByIdForOperator(operator: AuthenticatedOperator, rawEventId: string): Promise<WebEventDocument>;
    createEvent(operator: AuthenticatedOperator, rawBody: Record<string, unknown>): Promise<WebEventDocument>;
    updateEvent(operator: AuthenticatedOperator, rawEventId: string, rawBody: Record<string, unknown>): Promise<WebEventDocument>;
    uploadZipAndMergePackage(operator: AuthenticatedOperator, rawEventId: string, rawBody: Record<string, unknown>): Promise<WebEventDocument>;
    toggleEventActive(operator: AuthenticatedOperator, rawEventId: string, isActive: boolean): Promise<WebEventDocument>;
    deleteEvent(operator: AuthenticatedOperator, rawEventId: string): Promise<{
        success: boolean;
        deletedMediaKeys: string[];
    }>;
    createMediaPresignUrl(rawBody: Record<string, unknown>): EventMediaPresignResult;
    getPublicActiveEvents(authHeader?: string): Promise<WebEventDocument[]>;
    getPublicEventById(rawEventId: string, authHeader?: string): Promise<WebEventDocument>;
    getDecompressedBuildAsset(rawEventId: string, rawRole: string): Promise<{
        buffer: Buffer;
        contentType: string;
    }>;
    private buildFirestorePlayerDoc;
    private ensurePlayerInviteCode;
    private normalizeReferralHelpList;
    private listSortedHelpsForInviteCode;
    private loadStoredPlayerState;
    getPlayerEventState(authHeader: string | undefined, rawEventId: string): Promise<PlayerEventState>;
    claimMissionReward(authHeader: string | undefined, rawEventId: string, rawMissionId: string): Promise<{
        mission: EventMissionConfig;
        addedTickets: number;
        playerState: PlayerEventState;
    }>;
    redeemInviteCode(authHeader: string | undefined, rawEventId: string, rawCode: string): Promise<{
        addedTickets: number;
        targetUsername: string;
        playerState: PlayerEventState;
    }>;
    recordSpinAndSaveReward(authHeader: string | undefined, rawEventId: string, rawBody: Record<string, unknown>): Promise<{
        reward: PlayerSpinRecord;
        playerState: PlayerEventState;
    }>;
    getEventLogs(operator: AuthenticatedOperator, limitCount?: number): Promise<EventActivityLog[]>;
}
