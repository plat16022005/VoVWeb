import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { GachaR2Service } from '../gacha/gacha-r2.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import { ItemsService, UNITY_SAMPLE_ITEMS } from './items.service.js';
import { GameItemRarity, GameItemType } from './items.types.js';

describe('ItemsService', () => {
  let service: ItemsService;
  let firebaseMock: Record<string, ReturnType<typeof vi.fn>>;
  let r2Mock: Record<string, ReturnType<typeof vi.fn>>;

  const operator: AuthenticatedOperator = {
    uid: 'admin_1',
    email: 'admin@veyra.game',
    username: 'AdminVeyra',
    role: 'Admin',
    permissionGroups: ['game_data'],
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
      extractDocId: vi.fn((name: string) => name.split('/').pop() || ''),
      docToObject: vi.fn((doc: { data?: Record<string, unknown> }) => doc.data || {}),
      fullDocumentName: vi.fn((path: string) => `projects/test/databases/(default)/documents/${path}`),
      objectToFields: vi.fn((obj: Record<string, unknown>) => obj),
    };
    r2Mock = {
      deleteItemIconObjects: vi.fn().mockResolvedValue([]),
    };
    service = new ItemsService(
      firebaseMock as unknown as GachaFirebaseService,
      r2Mock as unknown as GachaR2Service,
    );
  });

  it('UNITY_SAMPLE_ITEMS chứa 9 vật phẩm mẫu chuẩn Unity', () => {
    expect(UNITY_SAMPLE_ITEMS).toHaveLength(9);
    expect(
      UNITY_SAMPLE_ITEMS.some((i) => i.ItemId === 'ticket_gacha_limited'),
    ).toBe(true);
  });

  it('getAllItems sắp xếp theo Phẩm chất giảm dần -> Loại tăng dần -> Tên', async () => {
    firebaseMock.listDocuments.mockResolvedValue([
      {
        name: 'ItemConfigs/item_a',
        data: {
          ItemId: 'item_a',
          ItemName: 'Bình Thuốc',
          Type: GameItemType.Consumable,
          Rarity: GameItemRarity.Rare,
        },
      },
      {
        name: 'ItemConfigs/item_b',
        data: {
          ItemId: 'item_b',
          ItemName: 'Thánh Kiếm',
          Type: GameItemType.Equipment,
          Rarity: GameItemRarity.Mythic,
        },
      },
    ]);

    const items = await service.getAllItems(operator);
    expect(items[0].ItemId).toBe('item_b');
    expect(items[1].ItemId).toBe('item_a');
  });

  it('createItem kiểm tra định dạng ItemId, trùng lặp và yêu cầu TargetHeroId cho Mảnh Ghép (Shard)', async () => {
    await expect(
      service.createItem(operator, {
        ItemId: 'INVALID-ID!',
        ItemName: 'Lỗi ID',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Vật phẩm loại Shard nhưng thiếu TargetHeroId sẽ bị chặn
    await expect(
      service.createItem(operator, {
        ItemId: 'shard_missing_hero',
        ItemName: 'Mảnh Vô Danh',
        Type: GameItemType.Shard,
        Rarity: 'SSR',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Tạo Shard hợp lệ
    const shard = await service.createItem(operator, {
      ItemId: 'shard_hero_lyra',
      ItemName: 'Mảnh Hồn Lyra',
      Type: GameItemType.Shard,
      Rarity: 'SSR',
      TargetHeroId: 'hero_lyra',
      RequiredShardsToSummon: 50,
    });
    expect(shard.Rarity).toBe(GameItemRarity.Legendary);
    expect(shard.TargetHeroId).toBe('hero_lyra');

    // Trùng ItemId ném ConflictException
    firebaseMock.getDocument.mockResolvedValueOnce({ name: 'dup', data: {} });
    await expect(
      service.createItem(operator, {
        ItemId: 'shard_hero_lyra',
        ItemName: 'Mảnh Hồn Lyra',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updateItem cập nhật thông tin và tự động dọn ảnh R2 cũ nếu đổi IconKey', async () => {
    firebaseMock.getDocument.mockResolvedValueOnce({
      name: 'ItemConfigs/item_01',
      data: {
        ItemId: 'item_01',
        ItemName: 'Sách Cũ',
        Type: GameItemType.Consumable,
        IconUrl: 'https://cdn.example.com/items/old_icon.png',
        IconKey: 'items/old_icon.png',
      },
    });

    const updated = await service.updateItem(operator, 'item_01', {
      ItemName: 'Sách Mới',
      Type: GameItemType.Consumable,
      Rarity: 'SR',
      IconUrl: 'https://cdn.example.com/items/new_icon.png',
      IconKey: 'items/new_icon.png',
    });

    expect(updated.ItemName).toBe('Sách Mới');
    expect(r2Mock.deleteItemIconObjects).toHaveBeenCalledWith([
      'items/old_icon.png',
    ]);
  });

  it('getItemById ném NotFoundException khi vật phẩm không tồn tại', async () => {
    await expect(
      service.getItemById(operator, 'item_not_found'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
