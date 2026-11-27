import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import { GiftcodesService } from './giftcodes.service.js';

describe('GiftcodesService', () => {
  let service: GiftcodesService;
  let firebaseMock: Record<string, ReturnType<typeof vi.fn>>;

  const operator: AuthenticatedOperator = {
    uid: 'admin_1',
    email: 'admin@veyra.game',
    username: 'AdminVeyra',
    role: 'Admin',
    permissionGroups: ['event_management'],
    permissions: [],
    authTokenForFirestore: 'token_123',
  };

  beforeEach(() => {
    firebaseMock = {
      listDocuments: vi.fn().mockResolvedValue([]),
      getDocument: vi.fn().mockResolvedValue(null),
      createDocument: vi.fn().mockResolvedValue({}),
      commitWrites: vi.fn().mockResolvedValue(undefined),
      deleteDocument: vi.fn().mockResolvedValue(undefined),
      runQuery: vi.fn().mockResolvedValue([]),
      extractDocId: vi.fn((name: string) => name.split('/').pop() || ''),
      docToObject: vi.fn((doc: { data?: Record<string, unknown> }) => doc.data || {}),
      fullDocumentName: vi.fn((path: string) => `projects/test/databases/(default)/documents/${path}`),
      objectToFields: vi.fn((obj: Record<string, unknown>) => obj),
    };
    service = new GiftcodesService(
      firebaseMock as unknown as GachaFirebaseService,
    );
  });

  it('getPublicGiftcodes lọc bỏ các mã đã hết hạn hoặc hết lượt nhập', async () => {
    const pastIso = new Date(Date.now() - 86400_000).toISOString();
    const futureIso = new Date(Date.now() + 86400_000).toISOString();

    firebaseMock.runQuery.mockResolvedValue([
      {
        name: 'Giftcodes/VOVACTIVE',
        data: {
          Code: 'VOVACTIVE',
          Title: 'Quà Đang Mở',
          CodeType: 'COMMON',
          IsActive: true,
          IsPublicDisplay: true,
          ExpiresAt: futureIso,
          MaxRedemptions: 100,
          CurrentRedemptions: 10,
          Rewards: { Gold: 5000, Gems: 100, Energy: 0, Items: [] },
        },
      },
      {
        name: 'Giftcodes/VOVEXPIRED',
        data: {
          Code: 'VOVEXPIRED',
          Title: 'Quà Hết Hạn',
          CodeType: 'COMMON',
          IsActive: true,
          IsPublicDisplay: true,
          ExpiresAt: pastIso,
          Rewards: { Gold: 1000, Gems: 0, Energy: 0, Items: [] },
        },
      },
      {
        name: 'Giftcodes/VOVFULL',
        data: {
          Code: 'VOVFULL',
          Title: 'Quà Hết Lượt',
          CodeType: 'COMMON',
          IsActive: true,
          IsPublicDisplay: true,
          MaxRedemptions: 50,
          CurrentRedemptions: 50,
          Rewards: { Gold: 1000, Gems: 0, Energy: 0, Items: [] },
        },
      },
    ]);

    const list = await service.getPublicGiftcodes();
    expect(list).toHaveLength(1);
    expect(list[0].Code).toBe('VOVACTIVE');
  });

  it('createGiftcode kiểm tra định dạng mã, thời hạn, cộng dồn vật phẩm trùng và bắt buộc có phần thưởng', async () => {
    // Mã quá ngắn (< 4 ký tự)
    await expect(
      service.createGiftcode(operator, {
        Code: 'AB',
        Title: 'Mã Ngắn',
        Rewards: { Gold: 100 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Không có phần thưởng nào
    await expect(
      service.createGiftcode(operator, {
        Code: 'VOVEMPTY2026',
        Title: 'Không Quà',
        Rewards: { Gold: 0, Gems: 0, Energy: 0, Items: [] },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Thời gian hết hạn <= thời gian bắt đầu
    await expect(
      service.createGiftcode(operator, {
        Code: 'VOVTIME2026',
        Title: 'Sai Thời Gian',
        StartsAt: '2026-12-10T00:00:00Z',
        ExpiresAt: '2026-12-01T00:00:00Z',
        Rewards: { Gold: 1000 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Tạo thành công mã SINGLE_USE (tự ép IsPublicDisplay = false, MaxRedemptions = 1) và cộng dồn vật phẩm trùng
    const created = await service.createGiftcode(operator, {
      Code: ' vov_vip_01 ',
      Title: 'Gói VIP',
      CodeType: 'SINGLE_USE',
      IsPublicDisplay: true,
      MaxRedemptions: 999,
      Rewards: {
        Gold: 50000,
        Gems: 300,
        Items: [
          { ItemId: 'item_01', ItemName: 'Chip', Quantity: 2, Rarity: 1 },
          { ItemId: 'item_01', ItemName: 'Chip', Quantity: 3, Rarity: 1 },
        ],
      },
    });

    expect(created.Code).toBe('VOV_VIP_01');
    expect(created.IsPublicDisplay).toBe(false);
    expect(created.MaxRedemptions).toBe(1);
    expect(created.Rewards.Items).toHaveLength(1);
    expect(created.Rewards.Items[0].Quantity).toBe(5);

    // Trùng mã ném ConflictException
    firebaseMock.getDocument.mockResolvedValueOnce({ name: 'dup', data: {} });
    await expect(
      service.createGiftcode(operator, {
        Code: 'VOV_VIP_01',
        Title: 'Trùng',
        Rewards: { Gold: 100 },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('getGiftcodeByCode ném NotFoundException khi mã không tồn tại', async () => {
    await expect(
      service.getGiftcodeByCode(operator, 'VOV_NOT_FOUND'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
