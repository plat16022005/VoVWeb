var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, NotFoundException } from '@nestjs/common';
let PlayersService = class PlayersService {
    async findAll() {
        return { data: [], message: 'Get all players' };
    }
    async findOne(id) {
        const player = null;
        if (!player)
            throw new NotFoundException(`Player #${id} not found`);
        return player;
    }
    async create(dto) {
        return { id: 'new-id', ...dto, createdAt: new Date() };
    }
    async remove(id) {
        return { message: `Player #${id} removed` };
    }
};
PlayersService = __decorate([
    Injectable()
], PlayersService);
export { PlayersService };
//# sourceMappingURL=players.service.js.map