import type { Response } from 'express';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { EventsService } from './events.service.js';
export declare class EventsController {
    private readonly eventsService;
    private readonly firebase;
    constructor(eventsService: EventsService, firebase: GachaFirebaseService);
    getPublicActiveEvents(authHeader?: string): Promise<import("./events.types.js").WebEventDocument[]>;
    getPublicEventById(eventId: string, authHeader?: string): Promise<import("./events.types.js").WebEventDocument>;
    getPublicEventPlayFrame(eventId: string, res: Response, authHeader?: string): Promise<void>;
    getPublicEventBuildAsset(eventId: string, role: string, res: Response): Promise<void>;
    getPlayerEventState(eventId: string, authHeader?: string): Promise<import("./events.types.js").PlayerEventState>;
    claimMissionReward(eventId: string, missionId: string, authHeader?: string): Promise<{
        mission: import("./events.types.js").EventMissionConfig;
        addedTickets: number;
        playerState: import("./events.types.js").PlayerEventState;
    }>;
    recordSpinAndSaveReward(eventId: string, authHeader: string | undefined, body: Record<string, unknown>): Promise<{
        reward: import("./events.types.js").PlayerSpinRecord;
        playerState: import("./events.types.js").PlayerEventState;
    }>;
    getAllEvents(authHeader?: string): Promise<import("./events.types.js").WebEventDocument[]>;
    getEventLogs(authHeader: string | undefined, limitParam?: string): Promise<import("./events.types.js").EventActivityLog[]>;
    getEventById(authHeader: string | undefined, eventId: string): Promise<import("./events.types.js").WebEventDocument>;
    createEvent(authHeader: string | undefined, body: Record<string, unknown>): Promise<import("./events.types.js").WebEventDocument>;
    updateEvent(authHeader: string | undefined, eventId: string, body: Record<string, unknown>): Promise<import("./events.types.js").WebEventDocument>;
    uploadZipAndMergePackage(authHeader: string | undefined, eventId: string, body: Record<string, unknown>): Promise<import("./events.types.js").WebEventDocument>;
    toggleEventActive(authHeader: string | undefined, eventId: string, body: Record<string, unknown>): Promise<import("./events.types.js").WebEventDocument>;
    deleteEvent(authHeader: string | undefined, eventId: string): Promise<{
        success: boolean;
        deletedMediaKeys: string[];
    }>;
    createMediaPresign(authHeader: string | undefined, body: Record<string, unknown>): Promise<import("./events-r2.service.js").EventMediaPresignResult>;
}
