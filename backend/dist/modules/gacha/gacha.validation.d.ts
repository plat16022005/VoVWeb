import { GachaBannerConfig, GachaDuplicateRule, GachaSeasonDocument, HeroRarityKey } from './gacha.types.js';
export declare const VALID_ID_REGEX: RegExp;
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export type UnknownRecord = Record<string, unknown>;
export declare function asRecord(val: unknown): UnknownRecord;
export declare function createDefaultDuplicateConversion(): Record<HeroRarityKey, GachaDuplicateRule>;
export declare function toUtcIsoString(dateInput: Date | string): string;
export declare function normalizeBanner(bannerId: string, raw: UnknownRecord): GachaBannerConfig;
export declare function normalizeSeason(docId: string, data: UnknownRecord): GachaSeasonDocument;
export declare function validateSeasonInput(input: {
    SeasonId: string;
    SeasonName: string;
    StartTime: string;
    EndTime: string;
}): ValidationResult;
export declare function validateBannerConfig(banner: GachaBannerConfig, existingBannerIdsInSeason?: string[], isEditing?: boolean): ValidationResult;
export declare function sanitizeBannerForFirestore(banner: GachaBannerConfig): Record<string, unknown>;
export declare function collectOtherReferencedKeys(seasons: GachaSeasonDocument[], exclude?: {
    seasonId: string;
    bannerId?: string;
}): Set<string>;
