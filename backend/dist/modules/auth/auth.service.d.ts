import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthUser, AuthResponse } from './auth.interface.js';
export declare class AuthService {
    private users;
    constructor();
    private seedDemoUser;
    private hashPassword;
    register(dto: RegisterDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    verifyToken(token: string): Promise<AuthUser | null>;
}
