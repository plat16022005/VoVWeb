import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<import("./auth.interface.js").AuthResponse>;
    login(dto: LoginDto): Promise<import("./auth.interface.js").AuthResponse>;
    getMe(authHeader?: string): Promise<{
        user: import("./auth.interface.js").AuthUser;
    }>;
}
