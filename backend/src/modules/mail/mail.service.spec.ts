import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import {
  computeMainStatValueAtLevel,
  getMainStatBaseRange,
  getSubStatBaseRange,
  validateAndNormalizeCustomEquipment,
} from './equipment-forger.util.js';
import { MailService } from './mail.service.js';

describe('MailService', () => {
  let service: MailService;
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

  const noticeOnlyManager: AuthenticatedOperator = {
    uid: 'mgr_notice',
    email: 'mgr@veyra.game',
    username: 'MgrNotice',
    role: 'Manager',
    permissionGroups: ['player_support'],
    permissions: ['support.mail.view', 'support.mail.send_notice'],
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
              'server-2': { Name: 'Thánh Địa 02', Status: 'Normal' },
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
    service = new MailService(
      firebaseMock as unknown as GachaFirebaseService,
    );
  });

  it('searchPlayers tìm kiếm theo tên hoặc mã Chỉ Huy và lọc theo cụm máy chủ', async () => {
    firebaseMock.listDocuments.mockResolvedValueOnce([
      {
        name: 'Users/uid_1',
        data: {
          Username: 'Hitomi_Cmd',
          PlayerCode: '888999',
          LastServerId: 'server-1',
          ServerCharacters: {
            'server-1': { Name: 'Nữ Vương Hitomi', Level: 60 },
          },
        },
      },
      {
        name: 'Users/uid_2',
        data: {
          Username: 'Other_Player',
          PlayerCode: '111222',
          LastServerId: 'server-2',
          ServerCharacters: {
            'server-2': { Name: 'Kiếm Khách', Level: 25 },
          },
        },
      },
    ]);

    const res = await service.searchPlayers(adminOp, 'hitomi', 'server-1');
    expect(res).toHaveLength(1);
    expect(res[0].uid).toBe('uid_1');
    expect(res[0].inGameName).toBe('Nữ Vương Hitomi');
    expect(res[0].characterLevel).toBe(60);
  });

  it('sendMail kiểm tra dữ liệu đầu vào và chặn thư cá nhân gửi cho ALL server', async () => {
    await expect(
      service.sendMail(adminOp, {
        Type: 'global',
        Title: '',
        Content: 'Nội dung',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Thư cá nhân nhưng không chỉ định đúng 1 server cụ thể
    await expect(
      service.sendMail(adminOp, {
        Type: 'personal',
        Title: 'Đền bù cá nhân',
        Content: 'Nội dung hỗ trợ',
        TargetServers: ['ALL'],
        ReceiverId: 'uid_1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sendMail kiểm tra phân quyền RBAC khi Manager gửi thư toàn server kèm quà tặng', async () => {
    // Manager chỉ có quyền send_notice sẽ bị chặn khi gửi thư toàn server có đính kèm Vàng/Ngọc
    await expect(
      service.sendMail(noticeOnlyManager, {
        Type: 'global',
        Category: 'REWARD',
        Title: 'Quà Toàn Server',
        Content: 'Tặng quà',
        TargetServers: ['server-1'],
        Rewards: { Gold: 10000, Gems: 200, Energy: 0, Items: [] },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // Nhưng gửi thư thông báo thuần (không kèm quà) thì được phép
    const sentNotice = await service.sendMail(noticeOnlyManager, {
      Type: 'global',
      Category: 'NOTICE',
      Title: 'Thông Báo Bảo Trì',
      Content: 'Máy chủ bảo trì định kỳ lúc 02:00.',
      TargetServers: ['server-1'],
      Rewards: { Gold: 0, Gems: 0, Energy: 0, Items: [] },
    });
    expect(sentNotice.sentCount).toBe(1);
    expect(sentNotice.mails[0].HasRewards).toBe(false);
  });

  describe('Chế tác & Kiểm tra chỉ số Trang bị đền bù (validateAndNormalizeCustomEquipment)', () => {
    it('chấp nhận và tính đúng chỉ số chính + dòng phụ hợp lệ theo công thức Unity', () => {
      // Vũ khí (Slot 1), Huyền Thoại (Rarity 3 -> maxEnhance 80, 4 dòng phụ)
      const atkMainRange = getMainStatBaseRange(2, 3); // ATK ở Rarity 3
      const s1 = getSubStatBaseRange(5, 3); // Crit Rate
      const s2 = getSubStatBaseRange(6, 3); // Crit Damage
      const s3 = getSubStatBaseRange(4, 3); // Speed
      const s4 = getSubStatBaseRange(10, 3); // ATK%

      const spec = validateAndNormalizeCustomEquipment(
        {
          Slot: 1,
          Rarity: 3,
          EnhanceLevel: 20,
          IsLocked: true,
          MainStat: {
            StatType: 2,
            BaseValue: atkMainRange.mid,
          },
          SubStats: [
            { StatType: 5, BaseValue: s1.max, UpgradeCount: 1 },
            { StatType: 6, BaseValue: s2.mid, UpgradeCount: 1 },
            { StatType: 4, BaseValue: s3.mid, UpgradeCount: 0 },
            { StatType: 10, BaseValue: s4.mid, UpgradeCount: 0 },
          ],
        },
        'equip_weapon_01',
        1,
      );

      expect(spec.Slot).toBe(1);
      expect(spec.Rarity).toBe(3);
      expect(spec.EnhanceLevel).toBe(20);
      expect(spec.MainStat.Value).toBe(
        computeMainStatValueAtLevel(2, atkMainRange.mid, 3, 20),
      );
      expect(spec.SubStats).toHaveLength(4);
      expect(spec.SubStats[0].UpgradeCount).toBe(1);
    });

    it('chặn khi chỉ số chính không thuộc Pool của ô trang bị hoặc vượt ngưỡng cân bằng', () => {
      // Vũ khí (Slot 1) chỉ cho phép ATK (2), ATK% (10), Crit Rate (5); không cho phép Speed (4) làm dòng chính
      expect(() =>
        validateAndNormalizeCustomEquipment(
          {
            Slot: 1,
            Rarity: 0,
            EnhanceLevel: 0,
            MainStat: { StatType: 4, BaseValue: 3.0 },
            SubStats: [{ StatType: 1, BaseValue: 100 }],
          },
          'equip_weapon_01',
          1,
        ),
      ).toThrow(BadRequestException);

      // Chỉ số chính ATK ở Rarity 0 có BaseValue hợp lệ 55..65; nhập 9999 sẽ bị chặn
      expect(() =>
        validateAndNormalizeCustomEquipment(
          {
            Slot: 1,
            Rarity: 0,
            EnhanceLevel: 0,
            MainStat: { StatType: 2, BaseValue: 9999 },
            SubStats: [{ StatType: 1, BaseValue: 100 }],
          },
          'equip_weapon_01',
          1,
        ),
      ).toThrow(BadRequestException);
    });

    it('chặn khi dòng phụ trùng với dòng chính, trùng nhau, sai số lượng dòng hoặc vượt cấp cường hóa', () => {
      const atkRange = getMainStatBaseRange(2, 1); // Rarity 1 (Hiếm) cần đúng 2 dòng phụ, maxEnhance = 40

      // Vượt cấp cường hóa (Rarity 1 tối đa +40 nhưng truyền +60)
      expect(() =>
        validateAndNormalizeCustomEquipment(
          {
            Slot: 1,
            Rarity: 1,
            EnhanceLevel: 60,
            MainStat: { StatType: 2, BaseValue: atkRange.mid },
            SubStats: [
              { StatType: 1, BaseValue: 160 },
              { StatType: 3, BaseValue: 12 },
            ],
          },
          'equip_weapon_01',
          1,
        ),
      ).toThrow(BadRequestException);

      // Dòng phụ trùng với dòng chính (ATK = 2)
      expect(() =>
        validateAndNormalizeCustomEquipment(
          {
            Slot: 1,
            Rarity: 1,
            EnhanceLevel: 10,
            MainStat: { StatType: 2, BaseValue: atkRange.mid },
            SubStats: [
              { StatType: 2, BaseValue: 18 },
              { StatType: 3, BaseValue: 12 },
            ],
          },
          'equip_weapon_01',
          1,
        ),
      ).toThrow(BadRequestException);
    });

    it('sendMail gửi thư cá nhân đính kèm trang bị chế tác thành công cho Manager có quyền support.mail.forge_equipment', async () => {
      const forgeManager: AuthenticatedOperator = {
        uid: 'mgr_forge',
        email: 'forge@veyra.game',
        username: 'MgrForge',
        role: 'Manager',
        permissionGroups: ['player_support'],
        permissions: ['support.mail.forge_equipment'],
        authTokenForFirestore: 'token_forge',
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
            data: { Username: 'HitomiPlayer', PlayerCode: '123456' },
          };
        }
        return null;
      });

      const atkRange = getMainStatBaseRange(2, 0);
      const hpSubRange = getSubStatBaseRange(1, 0);

      const res = await service.sendMail(forgeManager, {
        Type: 'personal',
        Category: 'COMPENSATION',
        Title: 'Đền Bù Trang Bị Vũ Khí',
        Content: 'Gửi trang bị đền bù theo phiếu hỗ trợ.',
        ServerId: 'server-1',
        TargetServers: ['server-1'],
        Recipients: [
          { uid: 'uid_player_1', username: 'HitomiPlayer', playerCode: '123456' },
        ],
        Rewards: {
          Gold: 0,
          Gems: 0,
          Energy: 0,
          Items: [
            {
              ItemId: 'equip_weapon_01',
              ItemName: 'Trường Kiếm Rực Lửa [Phổ Thông +10]',
              Quantity: 1,
              Rarity: 0,
              CustomEquipment: {
                Slot: 1,
                Rarity: 0,
                EnhanceLevel: 10,
                MainStat: { StatType: 2, BaseValue: atkRange.mid },
                SubStats: [{ StatType: 1, BaseValue: hpSubRange.mid, UpgradeCount: 1 }],
              },
            },
          ],
        },
      });

      expect(res.sentCount).toBe(1);
      const sentItem = res.mails[0].Rewards.Items[0];
      expect(sentItem.CustomEquipment).toBeDefined();
      expect(sentItem.CustomEquipment?.EnhanceLevel).toBe(10);
      expect(sentItem.CustomEquipment?.MainStat.Value).toBe(
        computeMainStatValueAtLevel(2, atkRange.mid, 0, 10),
      );
    });
  });
});
