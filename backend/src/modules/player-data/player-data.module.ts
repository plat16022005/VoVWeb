import { Module } from '@nestjs/common';
import { GachaModule } from '../gacha/gacha.module.js';
import { PlayerDataController } from './player-data.controller.js';
import { PlayerDataService } from './player-data.service.js';

@Module({
  imports: [GachaModule],
  controllers: [PlayerDataController],
  providers: [PlayerDataService],
  exports: [PlayerDataService],
})
export class PlayerDataModule {}
