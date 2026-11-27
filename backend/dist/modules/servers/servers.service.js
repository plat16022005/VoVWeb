var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ServersService_1;
import fs from 'node:fs';
import path from 'node:path';
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DEFAULT_SERVER_RULES } from './default-server-rules.js';
let ServersService = ServersService_1 = class ServersService {
    logger = new Logger(ServersService_1.name);
    projectId = process.env.FIREBASE_PROJECT_ID || 'valkyria-of-verya';
    createServerUrl = process.env.FIREBASE_CREATE_SERVER_URL ||
        'https://createnewserver-26irq6o5iq-as.a.run.app';
    applyRulesUrl = process.env.FIREBASE_APPLY_RULES_URL ||
        'https://applyrulestoserver-26irq6o5iq-as.a.run.app';
    internalSecret = process.env.INTERNAL_ADMIN_SECRET || 'VOV_SECRET_ADMIN_16022005';
    readLocalServerRulesContent() {
        const candidates = [
            path.resolve(process.cwd(), '../firestore.server.rules'),
            path.resolve(process.cwd(), 'firestore.server.rules'),
        ];
        for (const p of candidates) {
            if (fs.existsSync(p)) {
                try {
                    return fs.readFileSync(p, 'utf-8');
                }
                catch {
                }
            }
        }
        return DEFAULT_SERVER_RULES;
    }
    cachedServers = null;
    lastFetchTime = 0;
    CACHE_TTL_MS = 10000;
    cachedMaintenance = null;
    lastMaintenanceFetchTime = 0;
    async getGlobalMaintenance(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh &&
            this.cachedMaintenance &&
            now - this.lastMaintenanceFetchTime < this.CACHE_TTL_MS) {
            return this.cachedMaintenance;
        }
        const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/GameInfo/Information`;
        this.logger.log(`[ServersService] Đang tải GameInfo/Information từ ${url}...`);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Firestore REST trả về HTTP ${response.status}`);
            }
            const doc = (await response.json());
            const fields = doc.fields || {};
            const maintenance = Boolean(fields.Maintenance?.booleanValue);
            const message = fields.MaintenanceMessage?.stringValue ||
                'Hệ thống hiện tại đang bảo trì. Vui lòng quay lại game sau.';
            const version = fields.Version?.stringValue || '1.0.0';
            const minSupportedVersion = fields.MinSupportedVersion?.stringValue || '1.0.0';
            this.cachedMaintenance = {
                maintenance,
                message,
                version,
                minSupportedVersion,
            };
            this.lastMaintenanceFetchTime = now;
            return this.cachedMaintenance;
        }
        catch (error) {
            this.logger.warn(`[ServersService] Không thể đọc GameInfo/Information: ${error.message}. Sử dụng cấu hình mặc định.`);
            return {
                maintenance: false,
                message: 'Hệ thống hiện tại đang bảo trì. Vui lòng quay lại game sau.',
                version: '1.0.0',
                minSupportedVersion: '1.0.0',
            };
        }
    }
    async getAllServers(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && this.cachedServers && now - this.lastFetchTime < this.CACHE_TTL_MS) {
            return this.cachedServers;
        }
        const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/GameConfig/ServerList`;
        this.logger.log(`[ServersService] Đang tải danh sách server từ ${url}...`);
        try {
            const startTime = Date.now();
            const response = await fetch(url);
            const latencyMs = Math.max(1, Date.now() - startTime);
            if (!response.ok) {
                throw new Error(`Firestore REST trả về HTTP ${response.status}`);
            }
            const doc = (await response.json());
            const fields = doc.fields || {};
            const servers = [];
            for (const [serverId, fieldData] of Object.entries(fields)) {
                const mapFields = fieldData?.mapValue?.fields || {};
                const name = mapFields.Name?.stringValue || `S - ${serverId}`;
                const location = mapFields.DatabaseLocation?.stringValue ||
                    mapFields.Location?.stringValue ||
                    'asia-southeast1';
                const rawStatus = (mapFields.Status?.stringValue || 'Normal').toLowerCase();
                const isNew = Boolean(mapFields.IsNew?.booleanValue);
                const createdAt = mapFields.CreatedAt?.stringValue ||
                    mapFields.CreateAt?.stringValue ||
                    new Date().toISOString();
                let mappedStatus = 'online';
                if (rawStatus === 'maintenance' || rawStatus === 'baotri') {
                    mappedStatus = 'maintenance';
                }
                else if (rawStatus === 'busy') {
                    mappedStatus = 'busy';
                }
                else if (rawStatus === 'crowded') {
                    mappedStatus = 'crowded';
                }
                const regionName = location.includes('southeast')
                    ? 'Đông Nam Á (Singapore)'
                    : location.includes('northeast')
                        ? 'Đông Bắc Á (Tokyo)'
                        : location.includes('us')
                            ? 'Bắc Mỹ (Iowa)'
                            : 'Toàn Cầu';
                const ccu = mapFields.CurrentCcu?.integerValue
                    ? Number(mapFields.CurrentCcu.integerValue)
                    : 0;
                const maxCcu = mapFields.MaxCcu?.integerValue
                    ? Number(mapFields.MaxCcu.integerValue)
                    : 1500;
                const cpuLoad = mapFields.CpuLoad?.integerValue
                    ? Number(mapFields.CpuLoad.integerValue)
                    : null;
                const ramUsage = mapFields.RamUsage?.integerValue
                    ? Number(mapFields.RamUsage.integerValue)
                    : null;
                const ipAddress = mapFields.Host?.stringValue ||
                    mapFields.IpAddress?.stringValue ||
                    '';
                const port = mapFields.Port?.integerValue
                    ? Number(mapFields.Port.integerValue)
                    : 0;
                const createdDate = new Date(createdAt);
                const diffMs = Math.max(0, Date.now() - createdDate.getTime());
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                const remHours = diffHours % 24;
                const uptimeStr = diffDays > 0
                    ? `${diffDays} ngày ${remHours} giờ`
                    : `${diffHours} giờ trước`;
                const basePing = location.includes('southeast')
                    ? 28
                    : location.includes('northeast')
                        ? 75
                        : location.includes('us')
                            ? 195
                            : 45;
                const jitter = Math.floor(Math.random() * 5) - 2;
                const gameClientPing = mapFields.AveragePing?.integerValue
                    ? Number(mapFields.AveragePing.integerValue)
                    : mapFields.Ping?.integerValue
                        ? Number(mapFields.Ping.integerValue)
                        : Math.max(15, basePing + jitter);
                servers.push({
                    id: serverId,
                    name: name,
                    code: serverId.toUpperCase(),
                    region: regionName,
                    location: `${location} (Firestore Shard)`,
                    status: mappedStatus,
                    ccu,
                    maxCcu,
                    ping: gameClientPing,
                    ipAddress,
                    port,
                    engine: 'Unity 2023.3 LTS',
                    version: 'v1.2.4',
                    cpuLoad,
                    ramUsage,
                    uptime: uptimeStr,
                    uptimeHours: diffHours,
                    lastRestart: createdDate.toLocaleDateString('vi-VN'),
                    isNew,
                    createdAt,
                });
            }
            this.cachedServers = servers;
            this.lastFetchTime = Date.now();
            this.logger.log(`[ServersService] Tải thành công ${servers.length} máy chủ thực tế từ Firebase (Lưu cache 30s).`);
            return servers;
        }
        catch (error) {
            this.logger.error(`[ServersService] Lỗi tải server: ${error.message}`);
            throw new HttpException(`Không thể tải danh sách máy chủ: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createServer(dto, authHeader) {
        const serverId = (dto.serverId || '').trim().toLowerCase();
        const serverName = (dto.serverName || '').trim();
        const locationId = (dto.locationId || 'asia-southeast1').trim();
        const status = (dto.status || 'Normal').trim();
        this.logger.log(`[ServersService] Đang gửi yêu cầu tạo server ${serverId} tới Cloud Function...`);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'x-internal-secret': this.internalSecret,
            };
            if (authHeader && authHeader.startsWith('Bearer ')) {
                headers.Authorization = authHeader;
            }
            const rulesContent = this.readLocalServerRulesContent();
            const response = await fetch(this.createServerUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    data: {
                        serverId,
                        serverName,
                        locationId,
                        status,
                        internalSecret: this.internalSecret,
                        ...(rulesContent ? { rulesContent } : {}),
                    },
                }),
            });
            const resData = (await response.json());
            if (!response.ok || resData.error) {
                const errorMsg = resData?.error?.message ||
                    resData?.message ||
                    `Cloud Function trả về mã lỗi HTTP ${response.status}`;
                this.logger.error(`[ServersService] Thất bại: ${errorMsg}`);
                throw new HttpException(errorMsg, HttpStatus.BAD_REQUEST);
            }
            const result = resData.result || resData;
            this.cachedServers = null;
            this.logger.log(`[ServersService] Tạo máy chủ ${serverId} thành công trên Google Cloud!`);
            return result;
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`[ServersService] Lỗi kết nối: ${error.message}`);
            throw new HttpException(`Không thể kết nối tới Cloud Function: ${error.message}`, HttpStatus.GATEWAY_TIMEOUT);
        }
    }
    async applyRules(serverId, authHeader) {
        this.logger.log(`[ServersService] Đang gửi yêu cầu áp dụng rules cho ${serverId}...`);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'x-internal-secret': this.internalSecret,
            };
            if (authHeader && authHeader.startsWith('Bearer ')) {
                headers.Authorization = authHeader;
            }
            const rulesContent = this.readLocalServerRulesContent();
            const response = await fetch(this.applyRulesUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    data: {
                        serverId,
                        internalSecret: this.internalSecret,
                        ...(rulesContent ? { rulesContent } : {}),
                    },
                }),
            });
            const resData = (await response.json());
            if (!response.ok || resData.error) {
                const errorMsg = resData?.error?.message ||
                    resData?.message ||
                    `Lỗi khi áp dụng Rules HTTP ${response.status}`;
                throw new HttpException(errorMsg, HttpStatus.BAD_REQUEST);
            }
            const result = resData.result || resData;
            return result;
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(`Lỗi khi áp dụng Rules: ${error.message}`, HttpStatus.BAD_GATEWAY);
        }
    }
};
ServersService = ServersService_1 = __decorate([
    Injectable()
], ServersService);
export { ServersService };
//# sourceMappingURL=servers.service.js.map