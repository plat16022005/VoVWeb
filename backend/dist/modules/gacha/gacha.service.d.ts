import { GachaFirebaseService } from './gacha-firebase.service.js';
import { GachaR2Service } from './gacha-r2.service.js';
import { AuthenticatedOperator, GachaActivityLog, GachaBannerConfig, GachaSeasonDocument, GameItemReference, HeroReferenceItem } from './gacha.types.js';
export declare class GachaService {
    private readonly firebase;
    private readonly r2;
    private readonly logger;
    constructor(firebase: GachaFirebaseService, r2: GachaR2Service);
    private throwValidationFailure;
    private assertValidId;
    private logGachaActivity;
    getSeasons(operator: AuthenticatedOperator): Promise<GachaSeasonDocument[]>;
    getSeasonById(operator: AuthenticatedOperator, rawSeasonId: string): Promise<GachaSeasonDocument>;
    createSeason(operator: AuthenticatedOperator, rawBody: Record<string, unknown>): Promise<GachaSeasonDocument>;
    cloneSeason(operator: AuthenticatedOperator, rawSourceSeasonId: string, rawBody: Record<string, unknown>): Promise<GachaSeasonDocument>;
    updateSeasonMetadata(operator: AuthenticatedOperator, rawSeasonId: string, rawBody: Record<string, unknown>): Promise<GachaSeasonDocument>;
    activateSeason(operator: AuthenticatedOperator, rawSeasonId: string): Promise<GachaSeasonDocument>;
    deactivateSeason(operator: AuthenticatedOperator, rawSeasonId: string): Promise<GachaSeasonDocument>;
    deleteDraftSeason(operator: AuthenticatedOperator, rawSeasonId: string): Promise<{
        success: true;
        deletedMediaKeys: string[];
    }>;
    saveBannerInSeason(operator: AuthenticatedOperator, rawSeasonId: string, body: Record<string, unknown>, options: {
        isEditing: boolean;
        routeBannerId?: string;
    }): Promise<GachaBannerConfig>;
    toggleBannerActive(operator: AuthenticatedOperator, rawSeasonId: string, rawBannerId: string, isActive: boolean): Promise<{
        BannerId: string;
        IsActive: boolean;
    }>;
    deleteBannerFromSeason(operator: AuthenticatedOperator, rawSeasonId: string, rawBannerId: string): Promise<{
        success: true;
        deletedMediaKeys: string[];
    }>;
    getReferenceHeroes(operator: AuthenticatedOperator): Promise<HeroReferenceItem[]>;
    getReferenceItems(operator: AuthenticatedOperator): Promise<GameItemReference[]>;
    createMediaPresignUrl(body: Record<string, unknown>): import("./gacha-r2.service.js").GachaPresignResult;
    cleanupUnusedTempMedia(operator: AuthenticatedOperator, rawKeys: unknown): Promise<{
        deletedKeys: string[];
        skippedLiveKeys: string[];
    }>;
    getGachaLogs(operator: AuthenticatedOperator, limitCount?: number): Promise<GachaActivityLog[]>;
}
