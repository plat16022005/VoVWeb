import { Module } from '@nestjs/common';
import { GachaFirebaseService } from './gacha-firebase.service.js';
import { GachaR2Service } from './gacha-r2.service.js';
import { GachaController } from './gacha.controller.js';
import { GachaService } from './gacha.service.js';

@Module({
  controllers: [GachaController],
  providers: [GachaFirebaseService, GachaR2Service, GachaService],
  exports: [GachaService, GachaFirebaseService],
})
export class GachaModule {}

