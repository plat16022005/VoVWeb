import { UnityCompressionType } from './events.types.js';
export type UnityBuildFileRole = 'loader' | 'data' | 'framework' | 'wasm' | 'html';
export interface CreateEventMediaPresignInput {
    eventId: string;
    role: UnityBuildFileRole;
    fileName: string;
    contentType?: string;
    fileSize?: number;
}
export interface EventMediaPresignResult {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    contentType: string;
    expiresInSeconds: number;
}
export interface ExtractedUnityBuildFile {
    role: 'loader' | 'data' | 'framework' | 'wasm';
    fileName: string;
    contentType: string;
    buffer: Buffer;
}
export interface ExtractedUnityZipResult {
    buildName: string;
    compression: UnityCompressionType;
    totalSizeBytes: number;
    files: Record<'loader' | 'data' | 'framework' | 'wasm', ExtractedUnityBuildFile>;
}
interface R2Config {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
}
export declare function classifyUnityBuildFileName(rawName: string): {
    role: 'loader' | 'data' | 'framework' | 'wasm';
    buildName: string;
    compression: UnityCompressionType;
    contentType: string;
} | null;
export declare class EventsR2Service {
    private readonly logger;
    getConfigOrNull(): R2Config | null;
    private getRequiredConfig;
    createEventMediaPresignUrl(input: CreateEventMediaPresignInput): EventMediaPresignResult;
    putObjectToR2(key: string, bodyBuffer: Buffer, contentType: string): Promise<{
        key: string;
        publicUrl: string;
    } | null>;
    deleteEventObjects(keys: string[]): Promise<{
        deletedKeys: string[];
        failedKeys: string[];
    }>;
    private deleteSingleObject;
    extractUnityZipBuffer(zipBuffer: Buffer): ExtractedUnityZipResult;
}
export {};
