import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import { PlayerDataService } from './player-data.service.js';

describe('PlayerDataService', () => {
  let service: PlayerDataService;
  let firebaseMock: Record<string, ReturnType<typeof vi.fn>>;

  const adminOp: AuthenticatedOperator = {
    uid: 'admin_1',
    email: 'admin@veyra.game',
    username: 'AdminVeyra',
    role: 'Admin',
    permissionGroups: ['player_support'],
    permissions: [],
    authTokenForFirestore: 'token_admin',
  };

  const viewOnlyManager: AuthenticatedOperator = {
    uid: 'mgr_view',
    email: 'mgr@veyra.game',
    username: 'MgrView',
    role: 'Manager',
    permissionGroups: ['player_support'],
    permissions: ['support.player.view'],
    authTokenForFirestore: 'token_mgr',
  };

  beforeEach(() => {
    firebaseMock = {
      listDocuments: vi.fn().mockResolvedValue([]),
      getDocument: vi.fn().mockImplementation(async (path: string) => {
        if (path === 'GameConfig/ServerList') {
          return {
            name: 'GameConfig/ServerList',
            data: {
              'server-1': { Name: 'Thánh Địa 01', Status: 'Normal' },
            },
          };
        }
        return null;
      }),
      createDocument: vi.fn().mockResolvedValue({}),
      commitWrites: vi.fn().mockResolvedValue(undefined),
      runQuery: vi.fn().mockResolvedValue([]),
      extractDocId: vi.fn((name: string) => name.split('/').pop() || ''),
      docToObject: vi.fn((doc: { data?: Record<string, unknown> }) => doc.data || {}),
      fullDocumentName: vi.fn((path: string) => `projects/test/databases/(default)/documents/${path}`),
      objectToFields: vi.fn((obj: Record<string, unknown>) => obj),
    };
    service = new PlayerDataService(
      firebaseMock as unknown as GachaFirebaseService,
    );
  });

  it('revokeInventoryItem chặn Manager không có quyền support.player.revoke_item', async () => {
    await expect(
      service.revokeInventoryItem(viewOnlyManager, 'server-1', 'uid_player_1', {
        itemId: 'item_01',
        amount: 5,
        reason: 'Thu hồi vật phẩm phát nhầm',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('revokeInventoryItem yêu cầu lý do tối thiểu 3 ký tự và số lượng > 0', async () => {
    await expect(
      service.revokeInventoryItem(adminOp, 'server-1', 'uid_player_1', {
        itemId: 'item_01',
        amount: 5,
        reason: 'ab',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.revokeInventoryItem(adminOp, 'server-1', 'uid_player_1', {
        itemId: 'item_01',
        amount: 'invalid_number',
        revokeAll: false,
        reason: 'Lý do hợp lệ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revokeInventoryItem trừ đúng số lượng trong túi đồ và trả về thông số đối soát', async () => {
    firebaseMock.getDocument.mockImplementation(async (path: string) => {
      if (path === 'GameConfig/ServerList') {
        return {
          name: 'GameConfig/ServerList',
          data: { 'server-1': { Name: 'Thánh Địa 01', Status: 'Normal' } },
        };
      }
      if (path === 'Users/uid_player_1/UserData/Inventory') {
        return {
          name: path,
          data: { item_01: 20, item_02: 5 },
        };
      }
      if (path === 'Users/uid_player_1/UserData/Profile') {
        return {
          name: path,
          data: { InGameName: 'ValkyrieHunter', Level: 35 },
        };
      }
      return null;
    });

    vi.spyOn(service, 'getPlayerFullDetail').mockResolvedValue({
      serverId: 'server-1',
      serverName: 'Thánh Địa 01',
      uid: 'uid_player_1',
    } as Awaited<ReturnType<typeof service.getPlayerFullDetail>>);

    const res = await service.revokeInventoryItem(
      adminOp,
      'server-1',
      'uid_player_1',
      {
        itemId: 'item_01',
        amount: 8,
        revokeAll: false,
        reason: 'Thu hồi vật phẩm lỗi sự kiện',
      },
    );

    expect(res.previousQuantity).toBe(20);
    expect(res.revokedQuantity).toBe(8);
    expect(res.remainingQuantity).toBe(12);
  });

  it('revokeEquipment chặn khi không có quyền hoặc kho trang bị không tồn tại', async () => {
    await expect(
      service.revokeEquipment(viewOnlyManager, 'server-1', 'uid_player_1', {
        equipUid: 'eq_01',
        reason: 'Thu hồi trang bị lỗi',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.revokeEquipment(adminOp, 'server-1', 'uid_player_1', {
        equipUid: 'eq_01',
        reason: 'Thu hồi trang bị lỗi',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('getPlayerGameplayActivityLogs', () => {
    it('chặn Manager không có quyền tra cứu dữ liệu hoặc nhật ký hoạt động người chơi', async () => {
      const noPermManager: AuthenticatedOperator = {
        uid: 'mgr_none',
        email: 'none@veyra.game',
        username: 'MgrNone',
        role: 'Manager',
        permissionGroups: ['player_support'],
        permissions: ['support.mail.view'],
        authTokenForFirestore: 'token_mgr_none',
      };

      await expect(
        service.getPlayerGameplayActivityLogs(
          noPermManager,
          'server-1',
          'uid_player_1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('trả về danh sách ActivityLogs của người chơi kèm thống kê categoryCounts, WalletDelta và ánh xạ tên vật phẩm', async () => {
      const activityOnlyManager: AuthenticatedOperator = {
        uid: 'mgr_act',
        email: 'act@veyra.game',
        username: 'MgrActivity',
        role: 'Manager',
        permissionGroups: ['player_support'],
        permissions: ['support.player.activity_logs'],
        authTokenForFirestore: 'token_mgr_act',
      };

      firebaseMock.getDocument.mockImplementation(async (path: string) => {
        if (path === 'GameConfig/ServerList') {
          return {
            name: 'GameConfig/ServerList',
            data: { 'server-1': { Name: 'Thánh Địa 01', Status: 'Normal' } },
          };
        }
        if (path === 'Users/uid_player_1') {
          return {
            name: path,
            data: { Username: 'Commander01', PlayerCode: '888999' },
          };
        }
        if (path === 'Users/uid_player_1/UserData/Profile') {
          return {
            name: path,
            data: { InGameName: 'ValkyrieCommander', Level: 45 },
          };
        }
        return null;
      });

      firebaseMock.runQuery.mockResolvedValue([
        {
          name: 'projects/test/databases/server-1/documents/Users/uid_player_1/ActivityLogs/LOG_1002',
          data: {
            LogId: 'LOG_1002',
            UserId: 'uid_player_1',
            ServerId: 'server-1',
            Category: 'GACHA',
            Action: 'ROLL_HERO_GACHA',
            Status: 'SUCCESS',
            Summary: "Triệu hồi x10 Banner 'Khúc Ca Ánh Sáng'",
            WalletDelta: {
              GoldBefore: 50000,
              GoldAfter: 50000,
              GoldChange: 0,
              GemsBefore: 3000,
              GemsAfter: 300,
              GemsChange: -2700,
              EnergyBefore: 120,
              EnergyAfter: 120,
              EnergyChange: 0,
            },
            ItemsDelta: {
              Consumed: [{ ItemId: 'item_05', ItemName: 'item_05', Quantity: 10 }],
              Rewarded: [
                {
                  ItemId: 'shard_hero_hitomi',
                  ItemName: 'shard_hero_hitomi',
                  Quantity: 30,
                },
              ],
            },
            Metadata: {
              bannerId: 'banner_hitomi',
              rollCount: 10,
              newHeroIds: ['hero_hitomi'],
            },
            TimestampMs: 2000,
            CreatedAt: '2026-11-28T07:00:00.000Z',
          },
        },
        {
          name: 'projects/test/databases/server-1/documents/Users/uid_player_1/ActivityLogs/LOG_1001',
          data: {
            LogId: 'LOG_1001',
            UserId: 'uid_player_1',
            ServerId: 'server-1',
            Category: 'BATTLE',
            Action: 'CLAIM_STAGE_REWARD',
            Status: 'SUCCESS',
            Summary: 'Vượt ải 1-3 đạt 3 Sao (Lần đầu) -> +1500 Vàng, +50 Ngọc',
            WalletDelta: {
              GoldBefore: 48500,
              GoldAfter: 50000,
              GoldChange: 1500,
              GemsBefore: 2950,
              GemsAfter: 3000,
              GemsChange: 50,
              EnergyBefore: 125,
              EnergyAfter: 120,
              EnergyChange: -5,
            },
            ItemsDelta: {
              Consumed: [],
              Rewarded: [{ ItemId: 'item_01', ItemName: 'item_01', Quantity: 3 }],
            },
            Metadata: { stageId: '1-3', starsWon: 3 },
            TimestampMs: 1000,
            CreatedAt: '2026-11-28T06:50:00.000Z',
          },
        },
      ]);

      const res = await service.getPlayerGameplayActivityLogs(
        activityOnlyManager,
        'server-1',
        'uid_player_1',
        { category: 'ALL' },
      );

      expect(res.serverId).toBe('server-1');
      expect(res.targetUid).toBe('uid_player_1');
      expect(res.count).toBe(2);
      expect(res.categoryCounts).toEqual({ GACHA: 1, BATTLE: 1 });
      expect(res.logs[0].InGameName).toBe('ValkyrieCommander');
      expect(res.logs[0].PlayerCode).toBe('888999');
      expect(res.logs[0].WalletDelta?.GemsChange).toBe(-2700);
      // Tự động phân giải tên tiếng Việt chuẩn từ BUILTIN_UNITY_ITEM_CATALOG khi ItemName == ItemId
      expect(res.logs[0].ItemsDelta.Consumed[0].ItemName).toBe(
        'Lõi Cộng Hưởng Cao Cấp',
      );
      expect(res.logs[0].ItemsDelta.Rewarded[0].ItemName).toBe(
        'Mảnh Hồn Hitomi',
      );

      // Lọc theo Category = BATTLE và từ khóa search
      const filtered = await service.getPlayerGameplayActivityLogs(
        activityOnlyManager,
        'server-1',
        'uid_player_1',
        { category: 'BATTLE', search: '1-3' },
      );
      expect(filtered.count).toBe(1);
      expect(filtered.logs[0].Action).toBe('CLAIM_STAGE_REWARD');
    });
  });
});
