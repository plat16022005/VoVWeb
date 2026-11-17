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
import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query, } from '@nestjs/common';
import { GachaFirebaseService } from './gacha-firebase.service.js';
import { GachaService } from './gacha.service.js';
const GACHA_READ_PERMISSIONS = [
    'gamedata.gacha.view',
    'gamedata.gacha.edit',
    'gamedata.gacha.activate',
    'gamedata.gacha.delete',
];
let GachaController = class GachaController {
    gachaService;
    firebase;
    constructor(gachaService, firebase) {
        this.gachaService = gachaService;
        this.firebase = firebase;
    }
    async getReferenceHeroes(authHeader) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: GACHA_READ_PERMISSIONS,
        });
        return this.gachaService.getReferenceHeroes(operator);
    }
    async getReferenceItems(authHeader) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: GACHA_READ_PERMISSIONS,
        });
        return this.gachaService.getReferenceItems(operator);
    }
    async getSeasons(authHeader) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: GACHA_READ_PERMISSIONS,
        });
        return this.gachaService.getSeasons(operator);
    }
    async getSeasonById(authHeader, seasonId) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: GACHA_READ_PERMISSIONS,
        });
        return this.gachaService.getSeasonById(operator, seasonId);
    }
    async createSeason(authHeader, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.edit'],
        });
        return this.gachaService.createSeason(operator, body ?? {});
    }
    async cloneSeason(authHeader, sourceSeasonId, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.edit'],
        });
        return this.gachaService.cloneSeason(operator, sourceSeasonId, body ?? {});
    }
    async updateSeasonMetadata(authHeader, seasonId, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.edit'],
        });
        return this.gachaService.updateSeasonMetadata(operator, seasonId, body ?? {});
    }
    async activateSeason(authHeader, seasonId) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.activate'],
        });
        return this.gachaService.activateSeason(operator, seasonId);
    }
    async deactivateSeason(authHeader, seasonId) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.activate'],
        });
        return this.gachaService.deactivateSeason(operator, seasonId);
    }
    async deleteDraftSeason(authHeader, seasonId) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.delete'],
        });
        return this.gachaService.deleteDraftSeason(operator, seasonId);
    }
    async createBannerInSeason(authHeader, seasonId, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.edit'],
        });
        return this.gachaService.saveBannerInSeason(operator, seasonId, body ?? {}, {
            isEditing: false,
        });
    }
    async updateBannerInSeason(authHeader, seasonId, bannerId, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.edit'],
        });
        return this.gachaService.saveBannerInSeason(operator, seasonId, body ?? {}, {
            isEditing: true,
            routeBannerId: bannerId,
        });
    }
    async toggleBannerActive(authHeader, seasonId, bannerId, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.activate'],
        });
        return this.gachaService.toggleBannerActive(operator, seasonId, bannerId, Boolean(body?.IsActive));
    }
    async deleteBannerFromSeason(authHeader, seasonId, bannerId) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.delete'],
        });
        return this.gachaService.deleteBannerFromSeason(operator, seasonId, bannerId);
    }
    async createMediaPresign(authHeader, body) {
        await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.edit'],
        });
        return this.gachaService.createMediaPresignUrl(body ?? {});
    }
    async cleanupTempMedia(authHeader, body) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            requiredAnyPermissions: ['gamedata.gacha.edit', 'gamedata.gacha.delete'],
        });
        return this.gachaService.cleanupUnusedTempMedia(operator, body?.keys);
    }
    async getGachaLogs(authHeader, limitParam) {
        const operator = await this.firebase.authorizeOperator(authHeader, {
            adminOnly: true,
        });
        const parsedLimit = limitParam ? Number(limitParam) : 50;
        return this.gachaService.getGachaLogs(operator, parsedLimit);
    }
};
__decorate([
    Get('references/heroes'),
    __param(0, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "getReferenceHeroes", null);
__decorate([
    Get('references/items'),
    __param(0, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "getReferenceItems", null);
__decorate([
    Get('seasons'),
    __param(0, Headers('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "getSeasons", null);
__decorate([
    Get('seasons/:seasonId'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "getSeasonById", null);
__decorate([
    Post('seasons'),
    __param(0, Headers('authorization')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "createSeason", null);
__decorate([
    Post('seasons/:seasonId/clone'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "cloneSeason", null);
__decorate([
    Patch('seasons/:seasonId'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "updateSeasonMetadata", null);
__decorate([
    Post('seasons/:seasonId/activate'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "activateSeason", null);
__decorate([
    Post('seasons/:seasonId/deactivate'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "deactivateSeason", null);
__decorate([
    Delete('seasons/:seasonId'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "deleteDraftSeason", null);
__decorate([
    Post('seasons/:seasonId/banners'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "createBannerInSeason", null);
__decorate([
    Put('seasons/:seasonId/banners/:bannerId'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __param(2, Param('bannerId')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "updateBannerInSeason", null);
__decorate([
    Patch('seasons/:seasonId/banners/:bannerId/active'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __param(2, Param('bannerId')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "toggleBannerActive", null);
__decorate([
    Delete('seasons/:seasonId/banners/:bannerId'),
    __param(0, Headers('authorization')),
    __param(1, Param('seasonId')),
    __param(2, Param('bannerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "deleteBannerFromSeason", null);
__decorate([
    Post('media/presign'),
    __param(0, Headers('authorization')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "createMediaPresign", null);
__decorate([
    Post('media/cleanup'),
    __param(0, Headers('authorization')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "cleanupTempMedia", null);
__decorate([
    Get('logs'),
    __param(0, Headers('authorization')),
    __param(1, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GachaController.prototype, "getGachaLogs", null);
GachaController = __decorate([
    Controller('gacha'),
    __metadata("design:paramtypes", [GachaService,
        GachaFirebaseService])
], GachaController);
export { GachaController };
//# sourceMappingURL=gacha.controller.js.map