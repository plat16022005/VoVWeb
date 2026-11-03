import { PlayersService } from './players.service.js';
import { CreatePlayerDto } from './dto/create-player.dto.js';
export declare class PlayersController {
    private readonly playersService;
    constructor(playersService: PlayersService);
    findAll(): Promise<{
        data: never[];
        message: string;
    }>;
    findOne(id: string): Promise<never>;
    create(dto: CreatePlayerDto): Promise<{
        createdAt: Date;
        username: string;
        email: string;
        avatarUrl?: string;
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
