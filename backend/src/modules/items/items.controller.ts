import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { ItemsService } from './items.service.js';

const ITEM_READ_PERMISSIONS = [
  'gamedata.item.view',
  'gamedata.item.edit',
  'gamedata.item.delete',
  'gamedata.gacha.view',
  'gamedata.gacha.edit',
];

@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly firebase: GachaFirebaseService,
  ) {}

  @Get()
  async getAllItems(@Headers('authorization') authHeader?: string) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'game_data',
      permissionGroupLabel: 'Dữ Liệu Game & Nhân Vật',
      requiredAnyPermissions: ITEM_READ_PERMISSIONS,
    });
    return this.itemsService.getAllItems(operator);
  }

  @Get('logs/activities')
  async getItemLogs(
    @Headers('authorization') authHeader: string | undefined,
    @Query('limit') limitParam?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      adminOnly: true,
    });
    const parsedLimit = limitParam ? Number(limitParam) : 50;
    return this.itemsService.getItemLogs(operator, parsedLimit);
  }

  @Post('seed-samples')
  async seedUnitySampleItems(@Headers('authorization') authHeader?: string) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'game_data',
      permissionGroupLabel: 'Dữ Liệu Game & Nhân Vật',
      requiredAnyPermissions: ['gamedata.item.edit'],
    });
    return this.itemsService.seedUnitySampleItems(operator);
  }

  @Get(':itemId')
  async getItemById(
    @Headers('authorization') authHeader: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'game_data',
      permissionGroupLabel: 'Dữ Liệu Game & Nhân Vật',
      requiredAnyPermissions: ITEM_READ_PERMISSIONS,
    });
    return this.itemsService.getItemById(operator, itemId);
  }

  @Post()
  async createItem(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'game_data',
      permissionGroupLabel: 'Dữ Liệu Game & Nhân Vật',
      requiredAnyPermissions: ['gamedata.item.edit'],
    });
    return this.itemsService.createItem(operator, body ?? {});
  }

  @Put(':itemId')
  async updateItem(
    @Headers('authorization') authHeader: string | undefined,
    @Param('itemId') itemId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'game_data',
      permissionGroupLabel: 'Dữ Liệu Game & Nhân Vật',
      requiredAnyPermissions: ['gamedata.item.edit'],
    });
    return this.itemsService.updateItem(operator, itemId, body ?? {});
  }

  @Delete(':itemId')
  async deleteItem(
    @Headers('authorization') authHeader: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'game_data',
      permissionGroupLabel: 'Dữ Liệu Game & Nhân Vật',
      requiredAnyPermissions: ['gamedata.item.delete'],
    });
    return this.itemsService.deleteItem(operator, itemId);
  }
}
