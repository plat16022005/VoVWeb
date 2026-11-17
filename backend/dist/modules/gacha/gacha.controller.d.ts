import { GachaFirebaseService } from './gacha-firebase.service.js';
import { GachaService } from './gacha.service.js';
export declare class GachaController {
    private readonly gachaService;
    private readonly firebase;
    constructor(gachaService: GachaService, firebase: GachaFirebaseService);
    getReferenceHeroes(authHeader?: string): Promise<import("./gacha.types.js").HeroReferenceItem[]>;
    getReferenceItems(authHeader?: string): Promise<import("./gacha.types.js").GameItemReference[]>;
    getSeasons(authHeader?: string): Promise<import("./gacha.types.js").GachaSeasonDocument[]>;
    getSeasonById(authHeader: string | undefined, seasonId: string): Promise<import("./gacha.types.js").GachaSeasonDocument>;
    createSeason(authHeader: string | undefined, body: Record<string, unknown>): Promise<import("./gacha.types.js").GachaSeasonDocument>;
    cloneSeason(authHeader: string | undefined, sourceSeasonId: string, body: Record<string, unknown>): Promise<import("./gacha.types.js").GachaSeasonDocument>;
    updateSeasonMetadata(authHeader: string | undefined, seasonId: string, body: Record<string, unknown>): Promise<import("./gacha.types.js").GachaSeasonDocument>;
    activateSeason(authHeader: string | undefined, seasonId: string): Promise<import("./gacha.types.js").GachaSeasonDocument>;
    deactivateSeason(authHeader: string | undefined, seasonId: string): Promise<import("./gacha.types.js").GachaSeasonDocument>;
    deleteDraftSeason(authHeader: string | undefined, seasonId: string): Promise<{
        success: true;
        deletedMediaKeys: string[];
    }>;
    createBannerInSeason(authHeader: string | undefined, seasonId: string, body: Record<string, unknown>): Promise<import("./gacha.types.js").GachaBannerConfig>;
    updateBannerInSeason(authHeader: string | undefined, seasonId: string, bannerId: string, body: Record<string, unknown>): Promise<import("./gacha.types.js").GachaBannerConfig>;
    toggleBannerActive(authHeader: string | undefined, seasonId: string, bannerId: string, body: Record<string, unknown>): Promise<{
        BannerId: string;
        IsActive: boolean;
    }>;
    deleteBannerFromSeason(authHeader: string | undefined, seasonId: string, bannerId: string): Promise<{
        success: true;
        deletedMediaKeys: string[];
    }>;
    createMediaPresign(authHeader: string | undefined, body: Record<string, unknown>): Promise<import("./gacha-r2.service.js").GachaPresignResult>;
    cleanupTempMedia(authHeader: string | undefined, body: Record<string, unknown>): Promise<{
        deletedKeys: string[];
        skippedLiveKeys: string[];
    }>;
    getGachaLogs(authHeader: string | undefined, limitParam?: string): Promise<import("./gacha.types.js").GachaActivityLog[]>;
}
