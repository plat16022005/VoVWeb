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
});
