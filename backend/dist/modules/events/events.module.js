var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { GachaModule } from '../gacha/gacha.module.js';
import { EventsR2Service } from './events-r2.service.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
let EventsModule = class EventsModule {
};
EventsModule = __decorate([
    Module({
        imports: [GachaModule],
        controllers: [EventsController],
        providers: [EventsR2Service, EventsService],
        exports: [EventsService],
    })
], EventsModule);
export { EventsModule };
//# sourceMappingURL=events.module.js.map