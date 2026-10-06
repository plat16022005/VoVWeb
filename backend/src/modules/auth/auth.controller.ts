import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /api/auth/login
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /api/auth/me
  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new UnauthorizedException('Chưa đăng nhập');
    }
    const user = await this.authService.verifyToken(token);
    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }
    return { user };
  }
}
