import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PlayersModule } from './modules/players/players.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ServersModule } from './modules/servers/servers.module.js';

@Module({
  imports: [PlayersModule, AuthModule, ServersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
