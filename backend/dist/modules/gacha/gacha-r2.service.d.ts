export type GachaMediaVariant = 'main' | 'tab';
export interface CreateGachaBannerPresignInput {
    seasonId: string;
    bannerId: string;
    variant?: GachaMediaVariant;
    fileName?: string;
    contentType: string;
    fileSize?: number;
}
export interface GachaPresignResult {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    contentType: 'image/png' | 'image/jpeg';
    expiresInSeconds: number;
}
export interface DeleteR2ObjectsResult {
    deletedKeys: string[];
    failedKeys: string[];
}
export declare class GachaR2Service {
    private getConfig;
    validateGachaBannerUploadInput(input: CreateGachaBannerPresignInput): {
        seasonId: string;
        bannerId: string;
        variant: GachaMediaVariant;
        contentType: 'image/png' | 'image/jpeg';
        extension: 'png' | 'jpg';
    };
    createGachaBannerPresignUrl(input: CreateGachaBannerPresignInput): GachaPresignResult;
    deleteBannerObjects(keys: string[]): Promise<DeleteR2ObjectsResult>;
    private deleteSingleObject;
}
