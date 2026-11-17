import { Module } from '@nestjs/common';
import { GachaModule } from '../gacha/gacha.module.js';
import { EventsR2Service } from './events-r2.service.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [GachaModule],
  controllers: [EventsController],
  providers: [EventsR2Service, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
