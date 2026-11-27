import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
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
});
