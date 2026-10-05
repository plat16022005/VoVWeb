import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { PlayersService } from './players.service.js';
import { CreatePlayerDto } from './dto/create-player.dto.js';

// Layer 1: Nhận HTTP request, trả response
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // GET /api/players
  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  // GET /api/players/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  // POST /api/players
  @Post()
  create(@Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto);
  }

  // DELETE /api/players/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }
}
