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
import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query, Res, } from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { EventsService } from './events.service.js';
const EVENT_READ_PERMISSIONS = [
    'event.minigame.view',
    'event.minigame.edit',
    'event.minigame.publish',
    'event.minigame.delete',
];
let EventsController = class EventsController {
    eventsService;
    firebase;
    constructor(eventsService, firebase) {
        this.eventsService = eventsService;
        this.firebase = firebase;
    }
    async getPublicActiveEvents(authHeader) {
        return this.eventsService.getPublicActiveEvents(authHeader);
    }
    async getPublicEventById(eventId, authHeader) {
        return this.eventsService.getPublicEventById(eventId, authHeader);
    }
    async getPublicEventPlayFrame(eventId, res, authHeader) {
        const ev = await this.eventsService.getPublicEventById(eventId, authHeader);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(ev.MergedHtmlContent);
    }
    async getPublicEventBuildAsset(eventId, role, res) {
        const asset = await this.eventsService.getDecompressedBuildAsset(eventId, role);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', asset.contentType);
        res.setHeader('Content-Length', String(asset.buffer.length));
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(asset.buffer);
    }
    async getPlayerEventState(eventId, authHeader) {
        return this.eventsService.getPlayerEventState(authHeader, eventId);
    }
    async claimMissionReward(eventId, missionId, authHeader) {
        return this.eventsService.claimMissionReward(authHeader, eventId, missionId);
    }
    async recordSpinAndSaveReward(eventId, authHeader, body) {
        return this.eventsService.recordSpinAndSaveReward(authHeader, eventId, body ?? {});
    }
    async getAllEvents(authHeader) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            permissionGroupId: 'event_management',
            permissionGroupLabel: 'Quản Lý Sự Kiện',
            requiredAnyPermissions: EVENT_READ_PERMISSIONS,
        });
        return this.eventsService.getAllEvents(operator);
    }
    async getEventLogs(authHeader, limitParam) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            adminOnly: true,
        });
        const parsedLimit = limitParam ? Number(limitParam) : 50;
        return this.eventsService.getEventLogs(operator, parsedLimit);
    }
    async getEventById(authHeader, eventId) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            permissionGroupId: 'event_management',
            permissionGroupLabel: 'Quản Lý Sự Kiện',
            requiredAnyPermissions: EVENT_READ_PERMISSIONS,
        });
        return this.eventsService.getEventByIdForOperator(operator, eventId);
    }
    async createEvent(authHeader, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            permissionGroupId: 'event_management',
            permissionGroupLabel: 'Quản Lý Sự Kiện',
            requiredAnyPermissions: ['event.minigame.edit'],
        });
        return this.eventsService.createEvent(operator, body ?? {});
    }
    async updateEvent(authHeader, eventId, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            permissionGroupId: 'event_management',
            permissionGroupLabel: 'Quản Lý Sự Kiện',
            requiredAnyPermissions: ['event.minigame.edit'],
        });
        return this.eventsService.updateEvent(operator, eventId, body ?? {});
    }
    async uploadZipAndMergePackage(authHeader, eventId, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            permissionGroupId: 'event_management',
            permissionGroupLabel: 'Quản Lý Sự Kiện',
            requiredAnyPermissions: ['event.minigame.edit'],
        });
        return this.eventsService.uploadZipAndMergePackage(operator, eventId, body ?? {});
    }
    async toggleEventActive(authHeader, eventId, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            permissionGroupId: 'event_management',
            permissionGroupLabel: 'Quản Lý Sự Kiện',
            requiredAnyPermissions: ['event.minigame.publish'],
        });
        return this.eventsService.toggleEventActive(operator, eventId, Boolean(body?.IsActive));
    }
    async deleteEvent(authHeader, eventId) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            permissionGroupId: 'event_management',
            permissionGroupLabel: 'Quản Lý Sự Kiện',
            requiredAnyPermissions: ['event.minigame.delete'],
        });
        return this.eventsService.deleteEvent(operator, eventId);
    }
    async createMediaPresign(authHeader, body) {
        await this.firebase.authorizeOperator(authHeader, {
            permissionGroupId: 'event_management',
            permissionGroupLabel: 'Quản Lý Sự Kiện',
            requiredAnyPermissions: ['event.minigame.edit'],
        });
        return this.eventsService.createMediaPresignUrl(body ?? {});
    }
};
__decorate([
    Get('public'),
    __param(0, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getPublicActiveEvents", null);
__decorate([
    Get('public/:eventId'),
    __param(0, Param('eventId')),
    __param(1, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getPublicEventById", null);
__decorate([
    Get('public/:eventId/play-frame'),
    __param(0, Param('eventId')),
    __param(1, Res()),
    __param(2, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getPublicEventPlayFrame", null);
__decorate([
    Get('public/:eventId/build/:role'),
    __param(0, Param('eventId')),
    __param(1, Param('role')),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getPublicEventBuildAsset", null);
__decorate([
    Get(':eventId/player-state'),
    __param(0, Param('eventId')),
    __param(1, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getPlayerEventState", null);
__decorate([
    Post(':eventId/missions/:missionId/claim'),
    __param(0, Param('eventId')),
    __param(1, Param('missionId')),
    __param(2, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "claimMissionReward", null);
__decorate([
    Post(':eventId/spin'),
    __param(0, Param('eventId')),
    __param(1, Headers('authorization')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "recordSpinAndSaveReward", null);
__decorate([
    Get(),
    __param(0, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getAllEvents", null);
__decorate([
    Get('logs/activities'),
    __param(0, Headers('authorization')),
    __param(1, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventLogs", null);
__decorate([
    Get(':eventId'),
    __param(0, Headers('authorization')),
    __param(1, Param('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventById", null);
__decorate([
    Post(),
    __param(0, Headers('authorization')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createEvent", null);
__decorate([
    Put(':eventId'),
    __param(0, Headers('authorization')),
    __param(1, Param('eventId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "updateEvent", null);
__decorate([
    Post(':eventId/upload-package'),
    __param(0, Headers('authorization')),
    __param(1, Param('eventId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "uploadZipAndMergePackage", null);
__decorate([
    Patch(':eventId/active'),
    __param(0, Headers('authorization')),
    __param(1, Param('eventId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "toggleEventActive", null);
__decorate([
    Delete(':eventId'),
    __param(0, Headers('authorization')),
    __param(1, Param('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "deleteEvent", null);
__decorate([
    Post('media/presign'),
    __param(0, Headers('authorization')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createMediaPresign", null);
EventsController = __decorate([
    Controller('events'),
    __metadata("design:paramtypes", [EventsService,
        GachaFirebaseService])
], EventsController);
export { EventsController };
//# sourceMappingURL=events.controller.js.map