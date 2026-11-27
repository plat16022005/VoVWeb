import { CreateServerDto } from './dto/create-server.dto.js';
export interface GameServerResponse {
    id: string;
    name: string;
    code: string;
    region: string;
    location: string;
    status: 'online' | 'busy' | 'crowded' | 'maintenance' | 'offline';
    ccu: number;
    maxCcu: number;
    ping: number;
    ipAddress: string;
    port: number;
    engine: string;
    version: string;
    cpuLoad: number | null;
    ramUsage: number | null;
    uptime: string;
    uptimeHours: number;
    lastRestart: string;
    isNew?: boolean;
    createdAt: string;
}
export declare class ServersService {
    private readonly logger;
    private readonly projectId;
    private readonly createServerUrl;
    private readonly applyRulesUrl;
    private readonly internalSecret;
    private readLocalServerRulesContent;
    private cachedServers;
    private lastFetchTime;
    private readonly CACHE_TTL_MS;
    private cachedMaintenance;
    private lastMaintenanceFetchTime;
    getGlobalMaintenance(forceRefresh?: boolean): Promise<{
        maintenance: boolean;
        message: string;
        version: string;
        minSupportedVersion: string;
    }>;
    getAllServers(forceRefresh?: boolean): Promise<GameServerResponse[]>;
    createServer(dto: CreateServerDto, authHeader?: string): Promise<any>;
    applyRules(serverId: string, authHeader?: string): Promise<any>;
}
