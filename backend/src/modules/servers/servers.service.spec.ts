import { HttpException } from '@nestjs/common';
import { DEFAULT_SERVER_RULES } from './default-server-rules.js';
import { ServersController } from './servers.controller.js';
import { ServersService } from './servers.service.js';

describe('ServersService & ServersController', () => {
  let service: ServersService;
  let controller: ServersController;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    service = new ServersService();
    controller = new ServersController(service);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('DEFAULT_SERVER_RULES chứa cấu hình ruleset hợp lệ cho cụm máy chủ', () => {
    expect(DEFAULT_SERVER_RULES).toContain("rules_version = '2';");
    expect(DEFAULT_SERVER_RULES).toContain('service cloud.firestore');
  });

  describe('getGlobalMaintenance', () => {
    it('đọc cấu hình bảo trì từ Firestore REST và lưu cache', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          fields: {
            Maintenance: { booleanValue: true },
            MaintenanceMessage: { stringValue: 'Bảo trì định kỳ máy chủ Veyra' },
            Version: { stringValue: '1.3.0' },
            MinSupportedVersion: { stringValue: '1.2.0' },
          },
        }),
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const first = await controller.getGlobalMaintenance();
      expect(first).toEqual({
        maintenance: true,
        message: 'Bảo trì định kỳ máy chủ Veyra',
        version: '1.3.0',
        minSupportedVersion: '1.2.0',
      });

      // Lần gọi thứ 2 dùng cache không gọi lại fetch
      const second = await service.getGlobalMaintenance(false);
      expect(second).toEqual(first);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('trả về cấu hình mặc định an toàn khi Firestore REST lỗi', async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error('Network offline')) as unknown as typeof fetch;

      const res = await service.getGlobalMaintenance(true);
      expect(res.maintenance).toBe(false);
      expect(res.version).toBe('1.0.0');
    });
  });

  describe('getAllServers', () => {
    it('ánh xạ chính xác danh sách cụm máy chủ, khu vực và trạng thái', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          fields: {
            'server-1': {
              mapValue: {
                fields: {
                  Name: { stringValue: 'Thánh Địa Veyra 01' },
                  DatabaseLocation: { stringValue: 'asia-southeast1' },
                  Status: { stringValue: 'Normal' },
                  CurrentCcu: { integerValue: '320' },
                  MaxCcu: { integerValue: '1500' },
                  AveragePing: { integerValue: '24' },
                  IsNew: { booleanValue: true },
                },
              },
            },
            'server-2': {
              mapValue: {
                fields: {
                  Name: { stringValue: 'Thánh Địa Veyra 02' },
                  DatabaseLocation: { stringValue: 'asia-northeast1' },
                  Status: { stringValue: 'Maintenance' },
                },
              },
            },
          },
        }),
      }) as unknown as typeof fetch;

      const list = await controller.getAllServers('true');
      expect(list).toHaveLength(2);
      const s1 = list.find((s) => s.id === 'server-1')!;
      const s2 = list.find((s) => s.id === 'server-2')!;

      expect(s1.name).toBe('Thánh Địa Veyra 01');
      expect(s1.status).toBe('online');
      expect(s1.region).toContain('Singapore');
      expect(s1.ccu).toBe(320);
      expect(s1.ping).toBe(24);
      expect(s1.isNew).toBe(true);

      expect(s2.status).toBe('maintenance');
      expect(s2.region).toContain('Tokyo');
    });

    it('ném HttpException khi tải danh sách máy chủ thất bại', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }) as unknown as typeof fetch;

      await expect(service.getAllServers(true)).rejects.toBeInstanceOf(
        HttpException,
      );
    });
  });

  describe('createServer & applyRules', () => {
    it('gửi yêu cầu tạo server mới thành công và xóa cache cũ', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { success: true, serverId: 'server-3' },
        }),
      }) as unknown as typeof fetch;

      const res = await controller.createServer(
        {
          serverId: 'Server-3',
          serverName: 'Veyra 03',
          locationId: 'asia-southeast1',
          status: 'Normal',
        },
        'Bearer test_token',
      );
      expect(res).toEqual({ success: true, serverId: 'server-3' });
    });

    it('ném HttpException khi Cloud Function trả về lỗi lúc tạo server', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Server đã tồn tại' } }),
      }) as unknown as typeof fetch;

      await expect(
        service.createServer({
          serverId: 'server-1',
          serverName: 'Dup',
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('áp dụng bảo mật rules cho máy chủ thành công', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: { applied: true } }),
      }) as unknown as typeof fetch;

      const res = await controller.applyRules('server-1', 'Bearer token');
      expect(res).toEqual({ applied: true });
    });
  });
});
