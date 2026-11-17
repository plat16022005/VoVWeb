var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { GachaFirebaseService } from './gacha-firebase.service.js';
import { GachaR2Service } from './gacha-r2.service.js';
import { GachaController } from './gacha.controller.js';
import { GachaService } from './gacha.service.js';
let GachaModule = class GachaModule {
};
GachaModule = __decorate([
    Module({
        controllers: [GachaController],
        providers: [GachaFirebaseService, GachaR2Service, GachaService],
        exports: [GachaService, GachaFirebaseService],
    })
], GachaModule);
export { GachaModule };
//# sourceMappingURL=gacha.module.js.map