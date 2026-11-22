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
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { GiftcodesService } from './giftcodes.service.js';

const GIFTCODE_READ_PERMISSIONS = [
  'event.giftcode.view',
  'event.giftcode.edit',
  'event.giftcode.toggle',
  'event.giftcode.delete',
];

@Controller('giftcodes')
export class GiftcodesController {
  constructor(
    private readonly giftcodesService: GiftcodesService,
    private readonly firebase: GachaFirebaseService,
  ) {}

  @Get('public')
  async getPublicGiftcodes() {
    return this.giftcodesService.getPublicGiftcodes();
  }

  @Get()
  async getAllGiftcodes(@Headers('authorization') authHeader?: string) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: GIFTCODE_READ_PERMISSIONS,
    });
    return this.giftcodesService.getAllGiftcodes(operator);
  }

  @Get('references')
  async getReferences(@Headers('authorization') authHeader?: string) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: GIFTCODE_READ_PERMISSIONS,
    });
    return this.giftcodesService.getReferences(operator);
  }

  @Get('logs/activities')
  async getGiftcodeLogs(
    @Headers('authorization') authHeader: string | undefined,
    @Query('limit') limitParam?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      adminOnly: true,
    });
    const parsedLimit = limitParam ? Number(limitParam) : 100;
    return this.giftcodesService.getGiftcodeLogs(operator, parsedLimit);
  }

  @Post('batch')
  async createBatchGiftcodes(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.giftcode.edit'],
    });
    return this.giftcodesService.createBatchGiftcodes(operator, body ?? {});
  }

  @Get(':code')
  async getGiftcodeByCode(
    @Headers('authorization') authHeader: string | undefined,
    @Param('code') code: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: GIFTCODE_READ_PERMISSIONS,
    });
    return this.giftcodesService.getGiftcodeByCode(operator, code);
  }

  @Post()
  async createGiftcode(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.giftcode.edit'],
    });
    return this.giftcodesService.createGiftcode(operator, body ?? {});
  }

  @Put(':code')
  async updateGiftcode(
    @Headers('authorization') authHeader: string | undefined,
    @Param('code') code: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.giftcode.edit'],
    });
    return this.giftcodesService.updateGiftcode(operator, code, body ?? {});
  }

  @Patch(':code/active')
  async toggleGiftcodeActive(
    @Headers('authorization') authHeader: string | undefined,
    @Param('code') code: string,
    @Body() body: { isActive?: boolean },
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.giftcode.toggle'],
    });
    return this.giftcodesService.toggleGiftcodeActive(
      operator,
      code,
      Boolean(body?.isActive),
    );
  }

  @Delete(':code')
  async deleteGiftcode(
    @Headers('authorization') authHeader: string | undefined,
    @Param('code') code: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'event_management',
      permissionGroupLabel: 'Quản Lý Sự Kiện',
      requiredAnyPermissions: ['event.giftcode.delete'],
    });
    return this.giftcodesService.deleteGiftcode(operator, code);
  }
}
