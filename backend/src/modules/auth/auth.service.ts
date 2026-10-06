import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthUser, AuthResponse } from './auth.interface.js';

interface StoredUser extends AuthUser {
  passwordHash: string;
  salt: string;
}

@Injectable()
export class AuthService {
  // In-memory persistent state while server runs
  private users: StoredUser[] = [];

  constructor() {
    this.seedDemoUser();
  }

  private seedDemoUser() {
    const salt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync('123456', salt, 64).toString('hex');
    this.users.push({
      id: 'demo-pioneer-1',
      username: 'Hitomi_Valkyrie',
      email: 'commander@veyra.game',
      passwordHash,
      salt,
      avatarUrl: '/images/characters/hitomi.png',
      level: 50,
      createdAt: new Date(),
      isBanned: false,
    });
  }

  private hashPassword(password: string, salt: string): string {
    return scryptSync(password, salt, 64).toString('hex');
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedUsername = dto.username.trim();

    // Check email uniqueness
    const existingEmail = this.users.find((u) => u.email === normalizedEmail);
    if (existingEmail) {
      throw new ConflictException('Email này đã được sử dụng bởi một tài khoản khác.');
    }

    // Check username uniqueness
    const existingUsername = this.users.find(
      (u) => u.username.toLowerCase() === normalizedUsername.toLowerCase(),
    );
    if (existingUsername) {
      throw new ConflictException('Tên Chỉ Huy này đã có người sử dụng.');
    }

    const salt = randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(dto.password, salt);

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${randomBytes(4).toString('hex')}`,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      salt,
      avatarUrl: '/images/characters/hitomi.png',
      level: 1,
      createdAt: new Date(),
      isBanned: false,
    };

    this.users.push(newUser);

    const { passwordHash: _, salt: __, ...user } = newUser;
    const token = `vov_token_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64')}`;

    return {
      message: 'Khởi tạo tài khoản Chỉ Huy thành công! Sẵn sàng đồng hành cùng các Valkyria.',
      user,
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const userRecord = this.users.find((u) => u.email === normalizedEmail);
    if (!userRecord) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    if (userRecord.isBanned) {
      throw new UnauthorizedException('Tài khoản này đã bị phong ấn khỏi Vùng đất Veyra.');
    }

    const testHash = this.hashPassword(dto.password, userRecord.salt);
    const hashBuffer = Buffer.from(testHash, 'hex');
    const targetBuffer = Buffer.from(userRecord.passwordHash, 'hex');

    if (hashBuffer.length !== targetBuffer.length || !timingSafeEqual(hashBuffer, targetBuffer)) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const { passwordHash: _, salt: __, ...user } = userRecord;
    const token = `vov_token_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64')}`;

    return {
      message: `Chào mừng Chỉ Huy "${user.username}" trở lại Vùng đất Veyra!`,
      user,
      token,
    };
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    if (!token || !token.startsWith('vov_token_')) return null;
    try {
      const raw = token.replace('vov_token_', '');
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      const user = this.users.find((u) => u.id === userId);
      if (!user || user.isBanned) return null;
      const { passwordHash: _, salt: __, ...authUser } = user;
      return authUser;
    } catch {
      return null;
    }
  }
}
