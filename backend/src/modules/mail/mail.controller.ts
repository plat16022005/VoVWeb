import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { MailService } from './mail.service.js';
import { SystemMailStatus } from './mail.types.js';

const MAIL_READ_PERMISSIONS = [
  'support.mail.view',
  'support.mail.send_notice',
  'support.mail.send_personal',
  'support.mail.send_global_reward',
  'support.mail.delete',
];

const MAIL_SEND_ANY_PERMISSIONS = [
  'support.mail.send_notice',
  'support.mail.send_personal',
  'support.mail.send_global_reward',
];

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly firebase: GachaFirebaseService,
  ) {}

  @Get()
  async getAllMails(
    @Headers('authorization') authHeader: string | undefined,
    @Query('serverId') serverId?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: MAIL_READ_PERMISSIONS,
    });
    return this.mailService.getAllMails(operator, serverId);
  }

  @Get('references')
  async getReferences(@Headers('authorization') authHeader?: string) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: MAIL_READ_PERMISSIONS,
    });
    return this.mailService.getReferences(operator);
  }

  @Get('players')
  async searchPlayers(
    @Headers('authorization') authHeader: string | undefined,
    @Query('q') q?: string,
    @Query('serverId') serverId?: string,
    @Query('includeAll') includeAll?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: MAIL_READ_PERMISSIONS,
    });
    return this.mailService.searchPlayers(
      operator,
      q || '',
      serverId || '',
      includeAll === 'true',
    );
  }

  @Get('logs/activities')
  async getMailLogs(
    @Headers('authorization') authHeader: string | undefined,
    @Query('limit') limitParam?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      adminOnly: true,
    });
    const parsedLimit = limitParam ? Number(limitParam) : 100;
    return this.mailService.getMailLogs(operator, parsedLimit);
  }

  @Post()
  async sendMail(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: MAIL_SEND_ANY_PERMISSIONS,
    });
    return this.mailService.sendMail(operator, body ?? {});
  }

  @Patch(':mailId/status')
  async updateMailStatus(
    @Headers('authorization') authHeader: string | undefined,
    @Param('mailId') mailId: string,
    @Query('serverId') queryServerId?: string,
    @Query('receiverId') queryReceiverId?: string,
    @Body()
    body?: {
      status?: SystemMailStatus;
      serverId?: string;
      receiverId?: string;
    },
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: ['support.mail.delete'],
    });
    const serverId = body?.serverId || queryServerId || '';
    const receiverId = body?.receiverId || queryReceiverId || '';
    return this.mailService.updateMailStatus(
      operator,
      serverId,
      receiverId,
      mailId,
      body?.status === 'REVOKED' ? 'REVOKED' : 'SENT',
    );
  }

  @Delete(':mailId')
  async deleteMail(
    @Headers('authorization') authHeader: string | undefined,
    @Param('mailId') mailId: string,
    @Query('serverId') serverId?: string,
    @Query('receiverId') receiverId?: string,
  ) {
    const operator = await this.firebase.authorizeOperator(authHeader, {
      permissionGroupId: 'player_support',
      permissionGroupLabel: 'Hỗ Trợ Người Chơi',
      requiredAnyPermissions: ['support.mail.delete'],
    });
    return this.mailService.deleteMail(
      operator,
      serverId || '',
      receiverId || '',
      mailId,
    );
  }
}
