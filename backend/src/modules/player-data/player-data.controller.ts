import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { PlayerDataService } from './player-data.service.js';

const PLAYER_DATA_READ_PERMISSIONS = [
  'support.player.view',
  'support.player.activity_logs',
  'support.player.revoke_item',
];

const PLAYER_ACTIVITY_LOG_PERMISSIONS = [
  'support.player.activity_logs',
  'support.player.view',
  'support.player.revoke_item',
];

@Controller('player-data')
export class PlayerDataController {
  constructor(
    private readonly playerDataService: PlayerDataService,
    private readonly firebase: GachaFirebaseService,
  ) {}

  @Get('servers')
  async getServers(@Headers('authorization') authHeader?: string) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: PLAYER_DATA_READ_PERMISSIONS,
    });
    return this.playerDataService.getRegisteredServers(
      operator.authTokenForFirestore,
    );
  }

  @Get('players')
  async listPlayersByServer(
    @Headers('authorization') authHeader: string | undefined,
    @Query('serverId') serverId?: string,
    @Query('q') query?: string,
    @Query('includeAll') includeAll?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: PLAYER_DATA_READ_PERMISSIONS,
    });
    return this.playerDataService.listPlayersByServer(
      operator,
      serverId || '',
      query || '',
      includeAll === '1' || includeAll === 'true',
    );
  }

  @Get('logs/activities')
  async getPlayerDataLogs(
    @Headers('authorization') authHeader: string | undefined,
    @Query('limit') limitParam?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      adminOnly: true,
    });
    const parsedLimit = limitParam ? Number(limitParam) : 100;
    return this.playerDataService.getPlayerDataLogs(operator, parsedLimit);
  }

  @Get('players/:serverId/:uid')
  async getPlayerFullDetail(
    @Headers('authorization') authHeader: string | undefined,
    @Param('serverId') serverId: string,
    @Param('uid') uid: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: PLAYER_DATA_READ_PERMISSIONS,
    });
    return this.playerDataService.getPlayerFullDetail(operator, serverId, uid);
  }

  @Get('players/:serverId/:uid/activity-logs')
  async getPlayerGameplayActivityLogs(
    @Headers('authorization') authHeader: string | undefined,
    @Param('serverId') serverId: string,
    @Param('uid') uid: string,
    @Query('category') category?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
    @Query('limit') limitParam?: string,
    @Query('startAfterCreatedAt') startAfterCreatedAt?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: PLAYER_ACTIVITY_LOG_PERMISSIONS,
    });
    return this.playerDataService.getPlayerGameplayActivityLogs(
      operator,
      serverId,
      uid,
      {
        category,
        action,
        search,
        limit: limitParam ? Number(limitParam) : 50,
        startAfterCreatedAt,
      },
    );
  }

  @Get('activity-logs/:serverId')
  async getServerGameplayActivityLogs(
    @Headers('authorization') authHeader: string | undefined,
    @Param('serverId') serverId: string,
    @Query('targetUid') targetUid?: string,
    @Query('category') category?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
    @Query('limit') limitParam?: string,
    @Query('startAfterCreatedAt') startAfterCreatedAt?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: PLAYER_ACTIVITY_LOG_PERMISSIONS,
    });
    return this.playerDataService.getPlayerGameplayActivityLogs(
      operator,
      serverId,
      targetUid || 'all',
      {
        category,
        action,
        search,
        limit: limitParam ? Number(limitParam) : 50,
        startAfterCreatedAt,
      },
    );
  }

  @Post('players/:serverId/:uid/revoke-item')
  async revokeInventoryItem(
    @Headers('authorization') authHeader: string | undefined,
    @Param('serverId') serverId: string,
    @Param('uid') uid: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: ['support.player.revoke_item'],
    });
    return this.playerDataService.revokeInventoryItem(
      operator,
      serverId,
      uid,
      body ?? {},
    );
  }

  @Post('players/:serverId/:uid/revoke-equipment')
  async revokeEquipment(
    @Headers('authorization') authHeader: string | undefined,
    @Param('serverId') serverId: string,
    @Param('uid') uid: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: ['support.player.revoke_item'],
    });
    return this.playerDataService.revokeEquipment(
      operator,
      serverId,
      uid,
      body ?? {},
    );
  }
}
