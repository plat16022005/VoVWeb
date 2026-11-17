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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { EventsService } from './events.service.js';

const EVENT_READ_PERMISSIONS = [
  'event.minigame.view',
  'event.minigame.edit',
  'event.minigame.publish',
  'event.minigame.delete',
];

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly firebase: GachaFirebaseService,
  ) {}

  // ==================== PUBLIC / PLAYER ENDPOINTS ====================

  @Get('public')
  async getPublicActiveEvents(@Headers('authorization') authHeader?: string) {
    return this.eventsService.getPublicActiveEvents(authHeader);
  }

  @Get('public/:eventId')
  async getPublicEventById(
    @Param('eventId') eventId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.eventsService.getPublicEventById(eventId, authHeader);
  }

  @Get('public/:eventId/play-frame')
  async getPublicEventPlayFrame(
    @Param('eventId') eventId: string,
    @Res() res: Response,
    @Headers('authorization') authHeader?: string,
  ) {
    const ev = await this.eventsService.getPublicEventById(eventId, authHeader);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(ev.MergedHtmlContent);
  }

  @Get('public/:eventId/build/:role')
  async getPublicEventBuildAsset(
    @Param('eventId') eventId: string,
    @Param('role') role: string,
    @Res() res: Response,
  ) {
    const asset = await this.eventsService.getDecompressedBuildAsset(
      eventId,
      role,
    );
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Content-Length', String(asset.buffer.length));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(asset.buffer);
  }

  @Get(':eventId/player-state')
  async getPlayerEventState(
    @Param('eventId') eventId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.eventsService.getPlayerEventState(authHeader, eventId);
  }

  @Post(':eventId/missions/:missionId/claim')
  async claimMissionReward(
    @Param('eventId') eventId: string,
    @Param('missionId') missionId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.eventsService.claimMissionReward(
      authHeader,
      eventId,
      missionId,
    );
  }

  @Post(':eventId/spin')
  async recordSpinAndSaveReward(
    @Param('eventId') eventId: string,
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.eventsService.recordSpinAndSaveReward(
      authHeader,
      eventId,
      body ?? {},
    );
  }

  // ==================== ADMIN / MANAGER CRUD ====================

  @Get()
  async getAllEvents(@Headers('authorization') authHeader?: string) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: EVENT_READ_PERMISSIONS,
    });
    return this.eventsService.getAllEvents(operator);
  }

  @Get('logs/activities')
  async getEventLogs(
    @Headers('authorization') authHeader: string | undefined,
    @Query('limit') limitParam?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      adminOnly: true,
    });
    const parsedLimit = limitParam ? Number(limitParam) : 50;
    return this.eventsService.getEventLogs(operator, parsedLimit);
  }

  @Get(':eventId')
  async getEventById(
    @Headers('authorization') authHeader: string | undefined,
    @Param('eventId') eventId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: EVENT_READ_PERMISSIONS,
    });
    return this.eventsService.getEventByIdForOperator(operator, eventId);
  }

  @Post()
  async createEvent(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.minigame.edit'],
    });
    return this.eventsService.createEvent(operator, body ?? {});
  }

  @Put(':eventId')
  async updateEvent(
    @Headers('authorization') authHeader: string | undefined,
    @Param('eventId') eventId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.minigame.edit'],
    });
    return this.eventsService.updateEvent(operator, eventId, body ?? {});
  }

  @Post(':eventId/upload-package')
  async uploadZipAndMergePackage(
    @Headers('authorization') authHeader: string | undefined,
    @Param('eventId') eventId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.minigame.edit'],
    });
    return this.eventsService.uploadZipAndMergePackage(
      operator,
      eventId,
      body ?? {},
    );
  }

  @Patch(':eventId/active')
  async toggleEventActive(
    @Headers('authorization') authHeader: string | undefined,
    @Param('eventId') eventId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.minigame.publish'],
    });
    return this.eventsService.toggleEventActive(
      operator,
      eventId,
      Boolean(body?.IsActive),
    );
  }

  @Delete(':eventId')
  async deleteEvent(
    @Headers('authorization') authHeader: string | undefined,
    @Param('eventId') eventId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.minigame.delete'],
    });
    return this.eventsService.deleteEvent(operator, eventId);
  }

  @Post('media/presign')
  async createMediaPresign(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.minigame.edit'],
    });
    return this.eventsService.createMediaPresignUrl(body ?? {});
  }
}
