import { UnityWebGlBuildInfo } from './events.types.js';
export declare function generateDefaultEventHtmlLayout(title: string, _subtitle: string): string;
export declare function mergeHtmlWithUnityBuild(options: {
    eventId: string;
    eventTitle: string;
    unityTargetObject: string;
    rawHtml: string;
    unityBuild: UnityWebGlBuildInfo | null;
    defaultApiUrl?: string;
}): string;
