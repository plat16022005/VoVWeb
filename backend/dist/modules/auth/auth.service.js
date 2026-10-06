var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
let AuthService = class AuthService {
    users = [];
    constructor() {
        this.seedDemoUser();
    }
    seedDemoUser() {
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
    hashPassword(password, salt) {
        return scryptSync(password, salt, 64).toString('hex');
    }
    async register(dto) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const normalizedUsername = dto.username.trim();
        const existingEmail = this.users.find((u) => u.email === normalizedEmail);
        if (existingEmail) {
            throw new ConflictException('Email này đã được sử dụng bởi một tài khoản khác.');
        }
        const existingUsername = this.users.find((u) => u.username.toLowerCase() === normalizedUsername.toLowerCase());
        if (existingUsername) {
            throw new ConflictException('Tên Chỉ Huy này đã có người sử dụng.');
        }
        const salt = randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(dto.password, salt);
        const newUser = {
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
    async login(dto) {
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
    async verifyToken(token) {
        if (!token || !token.startsWith('vov_token_'))
            return null;
        try {
            const raw = token.replace('vov_token_', '');
            const decoded = Buffer.from(raw, 'base64').toString('utf-8');
            const [userId] = decoded.split(':');
            const user = this.users.find((u) => u.id === userId);
            if (!user || user.isBanned)
                return null;
            const { passwordHash: _, salt: __, ...authUser } = user;
            return authUser;
        }
        catch {
            return null;
        }
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map