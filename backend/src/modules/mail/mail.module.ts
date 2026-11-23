import { Module } from '@nestjs/common';
import { GachaModule } from '../gacha/gacha.module.js';
import { MailController } from './mail.controller.js';
import { MailService } from './mail.service.js';

@Module({
  imports: [GachaModule],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
