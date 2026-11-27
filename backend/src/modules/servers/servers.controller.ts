import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { ServersService } from './servers.service.js';
import { CreateServerDto } from './dto/create-server.dto.js';

@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Get()
  async getAllServers(@Query('refresh') refresh?: string) {
    const forceRefresh = refresh === 'true' || refresh === '1';
    return this.serversService.getAllServers(forceRefresh);
  }

  @Get('global-maintenance')
  async getGlobalMaintenance() {
    return this.serversService.getGlobalMaintenance();
  }

  @Post('create')
  async createServer(
    @Body() dto: CreateServerDto,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.serversService.createServer(dto, authHeader);
  }

  @Post(':id/rules')
  async applyRules(
    @Param('id') serverId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.serversService.applyRules(serverId, authHeader);
  }
}
