import { Module } from '@nestjs/common';
import { GachaModule } from '../gacha/gacha.module.js';
import { GiftcodesController } from './giftcodes.controller.js';
import { GiftcodesService } from './giftcodes.service.js';

@Module({
  imports: [GachaModule],
  controllers: [GiftcodesController],
  providers: [GiftcodesService],
  exports: [GiftcodesService],
})
export class GiftcodesModule {}
