var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Post, Body, Param, Query, Headers, } from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { CreateServerDto } from './dto/create-server.dto.js';
let ServersController = class ServersController {
    serversService;
    constructor(serversService) {
        this.serversService = serversService;
    }
    async getAllServers(refresh) {
        const forceRefresh = refresh === 'true' || refresh === '1';
        return this.serversService.getAllServers(forceRefresh);
    }
    async getGlobalMaintenance() {
        return this.serversService.getGlobalMaintenance();
    }
    async createServer(dto, authHeader) {
        return this.serversService.createServer(dto, authHeader);
    }
    async applyRules(serverId, authHeader) {
        return this.serversService.applyRules(serverId, authHeader);
    }
};
__decorate([
    Get(),
    __param(0, Query('refresh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getAllServers", null);
__decorate([
    Get('global-maintenance'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getGlobalMaintenance", null);
__decorate([
    Post('create'),
    __param(0, Body()),
    __param(1, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateServerDto, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "createServer", null);
__decorate([
    Post(':id/rules'),
    __param(0, Param('id')),
    __param(1, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "applyRules", null);
ServersController = __decorate([
    Controller('servers'),
    __metadata("design:paramtypes", [ServersService])
], ServersController);
export { ServersController };
//# sourceMappingURL=servers.controller.js.map