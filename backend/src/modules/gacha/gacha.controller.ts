import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GachaFirebaseService } from './gacha-firebase.service.js';
import { GachaService } from './gacha.service.js';

const GACHA_READ_PERMISSIONS = [
  'gamedata.gacha.view',
  'gamedata.gacha.edit',
  'gamedata.gacha.activate',
  'gamedata.gacha.delete',
];

@Controller('gacha')
export class GachaController {
  constructor(
    private readonly gachaService: GachaService,
    private readonly firebase: GachaFirebaseService,
  ) {}

  // ==================== REFERENCES ====================

  @Get('references/heroes')
  async getReferenceHeroes(
    @Headers('authorization') authHeader?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: GACHA_READ_PERMISSIONS,
    });
    return this.gachaService.getReferenceHeroes(operator);
  }

  @Get('references/items')
  async getReferenceItems(
    @Headers('authorization') authHeader?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: GACHA_READ_PERMISSIONS,
    });
    return this.gachaService.getReferenceItems(operator);
  }

  // ==================== SEASONS ====================

  @Get('seasons')
  async getSeasons(@Headers('authorization') authHeader?: string) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: GACHA_READ_PERMISSIONS,
    });
    return this.gachaService.getSeasons(operator);
  }

  @Get('seasons/:seasonId')
  async getSeasonById(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: GACHA_READ_PERMISSIONS,
    });
    return this.gachaService.getSeasonById(operator, seasonId);
  }

  @Post('seasons')
  async createSeason(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.edit'],
    });
    return this.gachaService.createSeason(operator, body ?? {});
  }

  @Post('seasons/:seasonId/clone')
  async cloneSeason(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') sourceSeasonId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.edit'],
    });
    return this.gachaService.cloneSeason(
      operator,
      sourceSeasonId,
      body ?? {},
    );
  }

  @Patch('seasons/:seasonId')
  async updateSeasonMetadata(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.edit'],
    });
    return this.gachaService.updateSeasonMetadata(
      operator,
      seasonId,
      body ?? {},
    );
  }

  @Post('seasons/:seasonId/activate')
  async activateSeason(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.activate'],
    });
    return this.gachaService.activateSeason(operator, seasonId);
  }

  @Post('seasons/:seasonId/deactivate')
  async deactivateSeason(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.activate'],
    });
    return this.gachaService.deactivateSeason(operator, seasonId);
  }

  @Delete('seasons/:seasonId')
  async deleteDraftSeason(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.delete'],
    });
    return this.gachaService.deleteDraftSeason(operator, seasonId);
  }

  // ==================== BANNERS ====================

  @Post('seasons/:seasonId/banners')
  async createBannerInSeason(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.edit'],
    });
    return this.gachaService.saveBannerInSeason(operator, seasonId, body ?? {}, {
      isEditing: false,
    });
  }

  @Put('seasons/:seasonId/banners/:bannerId')
  async updateBannerInSeason(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
    @Param('bannerId') bannerId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.edit'],
    });
    return this.gachaService.saveBannerInSeason(operator, seasonId, body ?? {}, {
      isEditing: true,
      routeBannerId: bannerId,
    });
  }

  @Patch('seasons/:seasonId/banners/:bannerId/active')
  async toggleBannerActive(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
    @Param('bannerId') bannerId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.activate'],
    });
    return this.gachaService.toggleBannerActive(
      operator,
      seasonId,
      bannerId,
      Boolean(body?.IsActive),
    );
  }

  @Delete('seasons/:seasonId/banners/:bannerId')
  async deleteBannerFromSeason(
    @Headers('authorization') authHeader: string | undefined,
    @Param('seasonId') seasonId: string,
    @Param('bannerId') bannerId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.delete'],
    });
    return this.gachaService.deleteBannerFromSeason(
      operator,
      seasonId,
      bannerId,
    );
  }

  // ==================== MEDIA (R2) ====================

  @Post('media/presign')
  async createMediaPresign(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.edit'],
    });
    return this.gachaService.createMediaPresignUrl(body ?? {});
  }

  @Post('media/cleanup')
  async cleanupTempMedia(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      requiredAnyPermissions: ['gamedata.gacha.edit', 'gamedata.gacha.delete'],
    });
    return this.gachaService.cleanupUnusedTempMedia(operator, body?.keys);
  }

  // ==================== AUDIT LOGS (ADMIN ONLY) ====================

  @Get('logs')
  async getGachaLogs(
    @Headers('authorization') authHeader: string | undefined,
    @Query('limit') limitParam?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      adminOnly: true,
    });
    const parsedLimit = limitParam ? Number(limitParam) : 50;
    return this.gachaService.getGachaLogs(operator, parsedLimit);
  }
}

