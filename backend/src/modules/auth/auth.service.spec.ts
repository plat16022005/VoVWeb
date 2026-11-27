import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  describe('register', () => {
    it('tạo tài khoản mới và không trả về mật khẩu', async () => {
      const res = await service.register({
        username: '  Commander_A ',
        email: '  New@Example.COM ',
        password: 'secret123',
      });

      expect(res.user.username).toBe('Commander_A');
      expect(res.user.email).toBe('new@example.com');
      expect(res.user.level).toBe(1);
      expect(res.token.startsWith('vov_token_')).toBe(true);
      expect(res.user).not.toHaveProperty('passwordHash');
      expect(res.user).not.toHaveProperty('salt');
    });

    it('từ chối email đã tồn tại (không phân biệt hoa thường)', async () => {
      await expect(
        service.register({
          username: 'Another',
          email: 'COMMANDER@veyra.game',
          password: 'secret123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('từ chối tên người dùng đã tồn tại (không phân biệt hoa thường)', async () => {
      await expect(
        service.register({
          username: 'hitomi_valkyrie',
          email: 'other@example.com',
          password: 'secret123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('đăng nhập thành công với tài khoản mẫu', async () => {
      const res = await service.login({
        email: ' Commander@Veyra.game ',
        password: '123456',
      });

      expect(res.user.username).toBe('Hitomi_Valkyrie');
      expect(res.user).not.toHaveProperty('passwordHash');
      expect(res.token.startsWith('vov_token_')).toBe(true);
    });

    it('từ chối khi sai mật khẩu', async () => {
      await expect(
        service.login({ email: 'commander@veyra.game', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('từ chối khi email không tồn tại', async () => {
      await expect(
        service.login({ email: 'nobody@example.com', password: '123456' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('đăng nhập được với tài khoản vừa đăng ký', async () => {
      await service.register({
        username: 'Fresh',
        email: 'fresh@example.com',
        password: 'pass-1234',
      });
      const res = await service.login({
        email: 'fresh@example.com',
        password: 'pass-1234',
      });
      expect(res.user.username).toBe('Fresh');
    });
  });

  describe('verifyToken', () => {
    it('trả về người dùng khi token hợp lệ', async () => {
      const { token } = await service.login({
        email: 'commander@veyra.game',
        password: '123456',
      });
      const user = await service.verifyToken(token);
      expect(user?.email).toBe('commander@veyra.game');
    });

    it('trả về null với token rỗng hoặc sai định dạng', async () => {
      expect(await service.verifyToken('')).toBeNull();
      expect(await service.verifyToken('abc')).toBeNull();
    });

    it('trả về null khi token trỏ tới người dùng không tồn tại', async () => {
      const fake = `vov_token_${Buffer.from('unknown:1').toString('base64')}`;
      expect(await service.verifyToken(fake)).toBeNull();
    });
  });
});
