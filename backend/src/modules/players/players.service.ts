import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlayerDto } from './dto/create-player.dto.js';

// Layer 2: Business Logic
// Đây sẽ gọi Firebase / Supabase ở Layer 3
@Injectable()
export class PlayersService {
  // TODO: inject FirebaseService hoặc SupabaseService ở đây

  async findAll() {
    // Layer 3: Gọi Supabase → SELECT * FROM players
    return { data: [], message: 'Get all players' };
  }

  async findOne(id: string) {
    // Layer 3: Gọi Firebase → getDoc(players/id)
    const player = null; // placeholder
    if (!player) throw new NotFoundException(`Player #${id} not found`);
    return player;
  }

  async create(dto: CreatePlayerDto) {
    // Layer 3: Gọi Supabase → INSERT INTO players
    return { id: 'new-id', ...dto, createdAt: new Date() };
  }

  async remove(id: string) {
    // Layer 3: Gọi Supabase → DELETE FROM players WHERE id = ?
    return { message: `Player #${id} removed` };
  }
}
