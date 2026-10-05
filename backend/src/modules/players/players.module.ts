import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller.js';
import { PlayersService } from './players.service.js';

@Module({
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService], // export nếu module khác cần dùng
})
export class PlayersModule {}
