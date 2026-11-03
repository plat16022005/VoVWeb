import { ServersService } from './servers.service.js';
import { CreateServerDto } from './dto/create-server.dto.js';
export declare class ServersController {
    private readonly serversService;
    constructor(serversService: ServersService);
    getAllServers(refresh?: string): Promise<import("./servers.service.js").GameServerResponse[]>;
    getGlobalMaintenance(): Promise<{
        maintenance: boolean;
        message: string;
        version: string;
        minSupportedVersion: string;
    }>;
    createServer(dto: CreateServerDto): Promise<any>;
    applyRules(serverId: string): Promise<any>;
}
