import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FirestoreBatchWrite,
  GachaFirebaseService,
} from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import {
  GameConsumableEffectType,
  GameEquipSlot,
  GameItemRarity,
  GameItemType,
  ItemActivityLog,
  ItemConfigDocument,
  ItemLogAction,
} from './items.types.js';

const ITEM_CONFIGS_COLLECTION = 'ItemConfigs';
const ITEM_LOGS_PARENT_PATH = 'Logs/ItemConfigs';
const ITEM_LOGS_COLLECTION_PATH = 'Logs/ItemConfigs/Activities';
const VALID_ID_REGEX = /^[a-z0-9_]+$/;

const ITEM_TYPE_LABELS: Record<number, string> = {
  [GameItemType.Consumable]: 'Tiêu Hao (Consumable)',
  [GameItemType.Material]: 'Nguyên Liệu (Material)',
  [GameItemType.Equipment]: 'Trang Bị (Equipment)',
  [GameItemType.Shard]: 'Mảnh Ghép (Shard)',
  [GameItemType.Ticket]: 'Vé & Tiền Tệ (Ticket)',
};

const ITEM_RARITY_LABELS: Record<number, string> = {
  [GameItemRarity.Common]: 'Phổ Thông (N)',
  [GameItemRarity.Rare]: 'Hiếm (R)',
  [GameItemRarity.Epic]: 'Sử Thi (SR)',
  [GameItemRarity.Legendary]: 'Huyền Thoại (SSR)',
  [GameItemRarity.Mythic]: 'Thần Thoại (UR)',
};

/**
 * 9 Vật phẩm mẫu chuẩn đồng bộ 100% từ ItemSystemSetupUtility.cs trong dự án Unity ValkyriaOfVerya
 */
export const UNITY_SAMPLE_ITEMS: ItemConfigDocument[] = [
  {
    ItemId: 'item_exp_book_small',
    ItemName: 'Sách EXP Sơ Cấp',
    Description:
      'Chứa đựng tri thức cổ xưa, dùng để tăng 500 điểm kinh nghiệm cho Tướng.',
    Type: GameItemType.Consumable,
    Rarity: GameItemRarity.Common,
    MaxStack: 9999,
    DropLocationHint: 'Rớt từ Ải 1-1 đến 2-5',
    ConsumableType: GameConsumableEffectType.AddExpToHero,
    EffectValue: 500,
    Slot: GameEquipSlot.None,
    BonusHp: 0,
    BonusAtk: 0,
    BonusDef: 0,
    BonusSpeed: 0,
    BonusCritRate: 0,
    BonusCritDamage: 0,
    TargetHeroId: '',
    RequiredShardsToSummon: 50,
  },
  {
    ItemId: 'item_exp_book_large',
    ItemName: 'Sách EXP Cao Cấp',
    Description:
      'Bí tịch cổ ngữ chứa ma lực dày đặc, dùng để tăng 2,500 điểm kinh nghiệm cho Tướng.',
    Type: GameItemType.Consumable,
    Rarity: GameItemRarity.Rare,
    MaxStack: 9999,
    DropLocationHint: 'Rớt từ Phó bản EXP Tinh Anh',
    ConsumableType: GameConsumableEffectType.AddExpToHero,
    EffectValue: 2500,
    Slot: GameEquipSlot.None,
    BonusHp: 0,
    BonusAtk: 0,
    BonusDef: 0,
    BonusSpeed: 0,
    BonusCritRate: 0,
    BonusCritDamage: 0,
    TargetHeroId: '',
    RequiredShardsToSummon: 50,
  },
  {
    ItemId: 'item_stamina_potion',
    ItemName: 'Bình Thể Lực',
    Description:
      'Dung dịch ma thuật hồi phục thể lực, ngay lập tức hồi 60 điểm Thể Lực (Energy).',
    Type: GameItemType.Consumable,
    Rarity: GameItemRarity.Rare,
    MaxStack: 999,
    DropLocationHint: 'Nhiệm vụ hàng ngày hoặc Cửa hàng',
    ConsumableType: GameConsumableEffectType.AddEnergyToPlayer,
    EffectValue: 60,
    Slot: GameEquipSlot.None,
    BonusHp: 0,
    BonusAtk: 0,
    BonusDef: 0,
    BonusSpeed: 0,
    BonusCritRate: 0,
    BonusCritDamage: 0,
    TargetHeroId: '',
    RequiredShardsToSummon: 50,
  },
  {
    ItemId: 'ticket_gacha_standard',
    ItemName: 'Vé Chiêu Mộ Tiêu Chuẩn',
    Description:
      'Vé dùng để triệu hồi các Valkyria tại Đài Triệu Hồi thường.',
    Type: GameItemType.Ticket,
    Rarity: GameItemRarity.Legendary,
    MaxStack: 999,
    DropLocationHint: 'Nhiệm vụ cốt truyện, Điểm danh tuần',
    ConsumableType: GameConsumableEffectType.None,
    EffectValue: 0,
    Slot: GameEquipSlot.None,
    BonusHp: 0,
    BonusAtk: 0,
    BonusDef: 0,
    BonusSpeed: 0,
    BonusCritRate: 0,
    BonusCritDamage: 0,
    TargetHeroId: '',
    RequiredShardsToSummon: 50,
  },
  {
    ItemId: 'ticket_gacha_limited',
    ItemName: 'Vé Chiêu Mộ Giới Hạn',
    Description:
      'Vé đặc biệt dùng để triệu hồi các Valkyria Rate-up tại sự kiện giới hạn.',
    Type: GameItemType.Ticket,
    Rarity: GameItemRarity.Mythic,
    MaxStack: 999,
    DropLocationHint: 'Sự kiện đặc biệt hoặc Nạp đầu',
    ConsumableType: GameConsumableEffectType.None,
    EffectValue: 0,
    Slot: GameEquipSlot.None,
    BonusHp: 0,
    BonusAtk: 0,
    BonusDef: 0,
    BonusSpeed: 0,
    BonusCritRate: 0,
    BonusCritDamage: 0,
    TargetHeroId: '',
    RequiredShardsToSummon: 50,
  },
  {
    ItemId: 'mat_breakthrough_stone',
    ItemName: 'Đá Đột Phá Thần Bí',
    Description:
      'Nguyên liệu quý giá cần thiết để nâng sao và khai phá giới hạn cấp độ của Tướng.',
    Type: GameItemType.Material,
    Rarity: GameItemRarity.Epic,
    MaxStack: 9999,
    DropLocationHint: 'Phó bản Đột Phá Thần Bí',
    ConsumableType: GameConsumableEffectType.None,
    EffectValue: 0,
    Slot: GameEquipSlot.None,
    BonusHp: 0,
    BonusAtk: 0,
    BonusDef: 0,
    BonusSpeed: 0,
    BonusCritRate: 0,
    BonusCritDamage: 0,
    TargetHeroId: '',
    RequiredShardsToSummon: 50,
  },
  {
    ItemId: 'shard_hero_hitomi',
    ItemName: 'Mảnh Hồn Hitomi',
    Description:
      'Thu thập đủ 50 mảnh để triệu hồi hoặc tăng sao cho Hitomi - Nữ Thần Ánh Sáng.',
    Type: GameItemType.Shard,
    Rarity: GameItemRarity.Legendary,
    MaxStack: 9999,
    DropLocationHint: 'Cửa hàng Đấu Trường, Vượt ải Tinh Anh',
    ConsumableType: GameConsumableEffectType.None,
    EffectValue: 0,
    Slot: GameEquipSlot.None,
    BonusHp: 0,
    BonusAtk: 0,
    BonusDef: 0,
    BonusSpeed: 0,
    BonusCritRate: 0,
    BonusCritDamage: 0,
    TargetHeroId: 'hero_hitomi',
    RequiredShardsToSummon: 50,
  },
  {
    ItemId: 'equip_weapon_valkyrie_sword',
    ItemName: 'Thánh Kiếm Valkyria',
    Description:
      'Thanh kiếm huyền thoại được rèn từ tinh thể quang minh, ban tặng uy lực tấn công vô song.',
    Type: GameItemType.Equipment,
    Rarity: GameItemRarity.Legendary,
    MaxStack: 99,
    DropLocationHint: 'Tháp Thử Thách Tầng 50',
    ConsumableType: GameConsumableEffectType.None,
    EffectValue: 0,
    Slot: GameEquipSlot.Weapon,
    BonusHp: 0,
    BonusAtk: 250,
    BonusDef: 0,
    BonusSpeed: 0,
    BonusCritRate: 5,
    BonusCritDamage: 0,
    TargetHeroId: '',
    RequiredShardsToSummon: 50,
  },
  {
    ItemId: 'equip_armor_valkyrie_plate',
    ItemName: 'Chiến Giáp Valkyria',
    Description:
      'Bộ giáp hộ thân làm từ thép thánh, bảo vệ người mặc trước mọi sát thương hiểm hóc.',
    Type: GameItemType.Equipment,
    Rarity: GameItemRarity.Legendary,
    MaxStack: 99,
    DropLocationHint: 'Tháp Thử Thách Tầng 60',
    ConsumableType: GameConsumableEffectType.None,
    EffectValue: 0,
    Slot: GameEquipSlot.Armor,
    BonusHp: 2000,
    BonusDef: 120,
    BonusAtk: 0,
    BonusSpeed: 0,
    BonusCritRate: 0,
    BonusCritDamage: 0,
    TargetHeroId: '',
    RequiredShardsToSummon: 50,
  },
];

function formatOperatorLabel(operator: AuthenticatedOperator): string {
  return operator.email || operator.username || 'system';
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(num)));
}

function clampFloat(val: unknown, min: number, max: number, fallback = 0): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  const clamped = Math.max(min, Math.min(max, num));
  return Math.round(clamped * 100) / 100;
}

function parseRarity(raw: unknown): GameItemRarity {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return clampInt(raw, 0, 4, GameItemRarity.Common) as GameItemRarity;
  }
  const str = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (str === 'UR' || str === 'MYTHIC' || str === '4') return GameItemRarity.Mythic;
  if (str === 'SSR' || str === 'LEGENDARY' || str === '3') return GameItemRarity.Legendary;
  if (str === 'SR' || str === 'EPIC' || str === '2') return GameItemRarity.Epic;
  if (str === 'R' || str === 'RARE' || str === '1') return GameItemRarity.Rare;
  if (str === 'N' || str === 'COMMON' || str === '0') return GameItemRarity.Common;
  return clampInt(raw, 0, 4, GameItemRarity.Common) as GameItemRarity;
}

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(private readonly firebase: GachaFirebaseService) {}

  private assertValidItemId(rawId: unknown): string {
    const trimmed = typeof rawId === 'string' ? rawId.trim().toLowerCase() : '';
    if (!trimmed || trimmed.length > 80 || !VALID_ID_REGEX.test(trimmed)) {
      throw new BadRequestException(
        'Mã vật phẩm (ItemId) không hợp lệ. Chỉ cho phép chữ thường không dấu, chữ số và dấu gạch dưới (VD: item_exp_book_small, equip_weapon_ssr).',
      );
    }
    return trimmed;
  }

  private normalizeItemDocument(
    docId: string,
    raw: Record<string, unknown>,
  ): ItemConfigDocument {
    const itemId =
      (typeof raw.ItemId === 'string' && raw.ItemId.trim()) ||
      (typeof raw.itemId === 'string' && raw.itemId.trim()) ||
      docId;
    const itemName =
      (typeof raw.ItemName === 'string' && raw.ItemName.trim()) ||
      (typeof raw.Name === 'string' && raw.Name.trim()) ||
      itemId;
    const description =
      typeof raw.Description === 'string' ? raw.Description.trim() : '';

    const type = clampInt(
      raw.Type ?? raw.ItemType,
      0,
      4,
      GameItemType.Material,
    ) as GameItemType;
    const rarity = parseRarity(raw.Rarity);
    const maxStack = clampInt(
      raw.MaxStack,
      1,
      999999,
      type === GameItemType.Equipment ? 99 : 9999,
    );
    const dropLocationHint =
      typeof raw.DropLocationHint === 'string'
        ? raw.DropLocationHint.trim()
        : '';

    const consumableType = clampInt(
      raw.ConsumableType,
      0,
      6,
      GameConsumableEffectType.None,
    ) as GameConsumableEffectType;
    const effectValue = clampInt(raw.EffectValue, 0, 100000000, 0);

    const slot = clampInt(
      raw.Slot,
      0,
      5,
      GameEquipSlot.None,
    ) as GameEquipSlot;
    const bonusHp = clampFloat(raw.BonusHp, 0, 10000000, 0);
    const bonusAtk = clampFloat(raw.BonusAtk, 0, 10000000, 0);
    const bonusDef = clampFloat(raw.BonusDef, 0, 10000000, 0);
    const bonusSpeed = clampFloat(raw.BonusSpeed, 0, 100000, 0);
    const bonusCritRate = clampFloat(raw.BonusCritRate, 0, 1000, 0);
    const bonusCritDamage = clampFloat(raw.BonusCritDamage, 0, 10000, 0);

    const targetHeroId =
      typeof raw.TargetHeroId === 'string' ? raw.TargetHeroId.trim() : '';
    const requiredShardsToSummon = clampInt(
      raw.RequiredShardsToSummon,
      1,
      9999,
      50,
    );

    const lastUpdated =
      typeof raw.LastUpdated === 'string' && raw.LastUpdated.trim()
        ? raw.LastUpdated.trim()
        : undefined;
    const updatedBy =
      typeof raw.UpdatedBy === 'string' && raw.UpdatedBy.trim()
        ? raw.UpdatedBy.trim()
        : undefined;

    return {
      ItemId: itemId,
      ItemName: itemName,
      Description: description,
      Type: type,
      Rarity: rarity,
      MaxStack: maxStack,
      DropLocationHint: dropLocationHint,
      ConsumableType: consumableType,
      EffectValue: effectValue,
      Slot: slot,
      BonusHp: bonusHp,
      BonusAtk: bonusAtk,
      BonusDef: bonusDef,
      BonusSpeed: bonusSpeed,
      BonusCritRate: bonusCritRate,
      BonusCritDamage: bonusCritDamage,
      TargetHeroId: targetHeroId,
      RequiredShardsToSummon: requiredShardsToSummon,
      ...(lastUpdated ? { LastUpdated: lastUpdated } : {}),
      ...(updatedBy ? { UpdatedBy: updatedBy } : {}),
    };
  }

  private validateAndBuildPayload(
    itemId: string,
    rawBody: Record<string, unknown>,
    operator: AuthenticatedOperator,
  ): ItemConfigDocument {
    const itemName =
      typeof rawBody.ItemName === 'string' ? rawBody.ItemName.trim() : '';
    if (!itemName || itemName.length > 120) {
      throw new BadRequestException(
        'Tên hiển thị của vật phẩm không được để trống và tối đa 120 ký tự.',
      );
    }

    const description =
      typeof rawBody.Description === 'string' ? rawBody.Description.trim() : '';
    if (description.length > 1000) {
      throw new BadRequestException('Mô tả vật phẩm tối đa 1000 ký tự.');
    }

    const type = clampInt(
      rawBody.Type,
      0,
      4,
      GameItemType.Material,
    ) as GameItemType;
    const rarity = parseRarity(rawBody.Rarity);
    const maxStack = clampInt(
      rawBody.MaxStack,
      1,
      999999,
      type === GameItemType.Equipment ? 99 : 9999,
    );
    const dropLocationHint =
      typeof rawBody.DropLocationHint === 'string'
        ? rawBody.DropLocationHint.trim().slice(0, 300)
        : '';

    const isConsumable = type === GameItemType.Consumable;
    const isEquipment = type === GameItemType.Equipment;
    const isShard = type === GameItemType.Shard;

    const consumableType = isConsumable
      ? (clampInt(
          rawBody.ConsumableType,
          0,
          6,
          GameConsumableEffectType.None,
        ) as GameConsumableEffectType)
      : GameConsumableEffectType.None;
    const effectValue = isConsumable
      ? clampInt(rawBody.EffectValue, 0, 100000000, 0)
      : 0;

    const slot = isEquipment
      ? (clampInt(rawBody.Slot, 0, 5, GameEquipSlot.Weapon) as GameEquipSlot)
      : GameEquipSlot.None;
    const bonusHp = isEquipment ? clampFloat(rawBody.BonusHp, 0, 10000000, 0) : 0;
    const bonusAtk = isEquipment ? clampFloat(rawBody.BonusAtk, 0, 10000000, 0) : 0;
    const bonusDef = isEquipment ? clampFloat(rawBody.BonusDef, 0, 10000000, 0) : 0;
    const bonusSpeed = isEquipment ? clampFloat(rawBody.BonusSpeed, 0, 100000, 0) : 0;
    const bonusCritRate = isEquipment
      ? clampFloat(rawBody.BonusCritRate, 0, 1000, 0)
      : 0;
    const bonusCritDamage = isEquipment
      ? clampFloat(rawBody.BonusCritDamage, 0, 10000, 0)
      : 0;

    const targetHeroId = isShard
      ? typeof rawBody.TargetHeroId === 'string'
        ? rawBody.TargetHeroId.trim().slice(0, 80)
        : ''
      : '';
    const requiredShardsToSummon = isShard
      ? clampInt(rawBody.RequiredShardsToSummon, 1, 9999, 50)
      : 50;

    if (isShard && !targetHeroId) {
      throw new BadRequestException(
        'Vật phẩm loại Mảnh Ghép (Shard) bắt buộc phải chỉ định Mã Tướng liên kết (TargetHeroId, VD: hero_hitomi).',
      );
    }

    const nowIso = new Date().toISOString();
    return {
      ItemId: itemId,
      ItemName: itemName,
      Description: description,
      Type: type,
      Rarity: rarity,
      MaxStack: maxStack,
      DropLocationHint: dropLocationHint,
      ConsumableType: consumableType,
      EffectValue: effectValue,
      Slot: slot,
      BonusHp: bonusHp,
      BonusAtk: bonusAtk,
      BonusDef: bonusDef,
      BonusSpeed: bonusSpeed,
      BonusCritRate: bonusCritRate,
      BonusCritDamage: bonusCritDamage,
      TargetHeroId: targetHeroId,
      RequiredShardsToSummon: requiredShardsToSummon,
      LastUpdated: nowIso,
      UpdatedBy: formatOperatorLabel(operator),
    };
  }

  private async logItemActivity(
    operator: AuthenticatedOperator,
    payload: {
      action: ItemLogAction;
      actionTitle: string;
      itemId: string;
      itemName: string;
      itemType: number;
      rarity: number;
      details: string;
    },
  ): Promise<void> {
    const now = Date.now();
    const record: Record<string, unknown> = {
      action: payload.action,
      actionTitle: payload.actionTitle,
      itemId: payload.itemId,
      itemName: payload.itemName,
      itemType: payload.itemType,
      rarity: payload.rarity,
      details: payload.details,
      performedBy: formatOperatorLabel(operator),
      performedByRole: operator.role,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
    };

    try {
      await this.firebase.createDocument(
        ITEM_LOGS_COLLECTION_PATH,
        null,
        record,
        operator.authTokenForFirestore,
      );
    } catch (err) {
      this.logger.warn(
        `Không thể ghi nhật ký Vật Phẩm (${payload.action}): ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  async getAllItems(
    operator: AuthenticatedOperator,
  ): Promise<ItemConfigDocument[]> {
    const docs = await this.firebase.listDocuments(
      ITEM_CONFIGS_COLLECTION,
      operator.authTokenForFirestore,
    );

    const list = docs.map((doc) =>
      this.normalizeItemDocument(
        this.firebase.extractDocId(doc.name),
        this.firebase.docToObject(doc),
      ),
    );

    // Sắp xếp giống InventoryService.cs trong Unity: Phẩm chất giảm dần -> Loại tăng dần -> Tên A-Z
    return list.sort((a, b) => {
      if (b.Rarity !== a.Rarity) return b.Rarity - a.Rarity;
      if (a.Type !== b.Type) return a.Type - b.Type;
      return a.ItemName.localeCompare(b.ItemName, 'vi');
    });
  }

  async getItemById(
    operator: AuthenticatedOperator,
    rawItemId: string,
  ): Promise<ItemConfigDocument> {
    const itemId = this.assertValidItemId(rawItemId);
    const doc = await this.firebase.getDocument(
      `${ITEM_CONFIGS_COLLECTION}/${itemId}`,
      operator.authTokenForFirestore,
    );
    if (!doc) {
      throw new NotFoundException(
        `Không tìm thấy vật phẩm với mã "${itemId}".`,
      );
    }
    return this.normalizeItemDocument(itemId, this.firebase.docToObject(doc));
  }

  async createItem(
    operator: AuthenticatedOperator,
    rawBody: Record<string, unknown>,
  ): Promise<ItemConfigDocument> {
    const itemId = this.assertValidItemId(rawBody.ItemId);
    const existing = await this.firebase.getDocument(
      `${ITEM_CONFIGS_COLLECTION}/${itemId}`,
      operator.authTokenForFirestore,
    );
    if (existing) {
      throw new ConflictException(
        `Mã vật phẩm "${itemId}" đã tồn tại trong danh mục trò chơi.`,
      );
    }

    const itemDoc = this.validateAndBuildPayload(itemId, rawBody, operator);

    await this.firebase.createDocument(
      ITEM_CONFIGS_COLLECTION,
      itemId,
      itemDoc as unknown as Record<string, unknown>,
      operator.authTokenForFirestore,
    );

    await this.logItemActivity(operator, {
      action: 'CREATE_ITEM',
      actionTitle: 'Tạo mới vật phẩm game',
      itemId: itemDoc.ItemId,
      itemName: itemDoc.ItemName,
      itemType: itemDoc.Type,
      rarity: itemDoc.Rarity,
      details: `Tạo mới vật phẩm "${itemDoc.ItemName}" (${itemDoc.ItemId}) — Phân loại: ${ITEM_TYPE_LABELS[itemDoc.Type] || itemDoc.Type}, Phẩm chất: ${ITEM_RARITY_LABELS[itemDoc.Rarity] || itemDoc.Rarity}, MaxStack: ${itemDoc.MaxStack}.`,
    });

    return itemDoc;
  }

  async updateItem(
    operator: AuthenticatedOperator,
    rawItemId: string,
    rawBody: Record<string, unknown>,
  ): Promise<ItemConfigDocument> {
    const itemId = this.assertValidItemId(rawItemId);
    const existing = await this.firebase.getDocument(
      `${ITEM_CONFIGS_COLLECTION}/${itemId}`,
      operator.authTokenForFirestore,
    );
    if (!existing) {
      throw new NotFoundException(
        `Không tìm thấy vật phẩm "${itemId}" để cập nhật.`,
      );
    }

    const itemDoc = this.validateAndBuildPayload(itemId, rawBody, operator);

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${ITEM_CONFIGS_COLLECTION}/${itemId}`,
            ),
            fields: this.firebase.objectToFields(
              itemDoc as unknown as Record<string, unknown>,
            ),
          },
        },
      ],
      operator.authTokenForFirestore,
    );

    await this.logItemActivity(operator, {
      action: 'UPDATE_ITEM',
      actionTitle: 'Cập nhật cấu hình vật phẩm',
      itemId: itemDoc.ItemId,
      itemName: itemDoc.ItemName,
      itemType: itemDoc.Type,
      rarity: itemDoc.Rarity,
      details: `Cập nhật thông số vật phẩm "${itemDoc.ItemName}" (${itemDoc.ItemId}) — Phân loại: ${ITEM_TYPE_LABELS[itemDoc.Type] || itemDoc.Type}, Phẩm chất: ${ITEM_RARITY_LABELS[itemDoc.Rarity] || itemDoc.Rarity}.`,
    });

    return itemDoc;
  }

  async deleteItem(
    operator: AuthenticatedOperator,
    rawItemId: string,
  ): Promise<{ success: boolean; deletedItemId: string }> {
    const itemId = this.assertValidItemId(rawItemId);
    const existingDoc = await this.firebase.getDocument(
      `${ITEM_CONFIGS_COLLECTION}/${itemId}`,
      operator.authTokenForFirestore,
    );
    if (!existingDoc) {
      throw new NotFoundException(
        `Không tìm thấy vật phẩm "${itemId}" để xóa.`,
      );
    }

    const existing = this.normalizeItemDocument(
      itemId,
      this.firebase.docToObject(existingDoc),
    );

    await this.firebase.deleteDocument(
      `${ITEM_CONFIGS_COLLECTION}/${itemId}`,
      operator.authTokenForFirestore,
    );

    await this.logItemActivity(operator, {
      action: 'DELETE_ITEM',
      actionTitle: 'Xóa vật phẩm khỏi danh mục game',
      itemId: existing.ItemId,
      itemName: existing.ItemName,
      itemType: existing.Type,
      rarity: existing.Rarity,
      details: `Xóa vĩnh viễn vật phẩm "${existing.ItemName}" (${existing.ItemId}) thuộc nhóm ${ITEM_TYPE_LABELS[existing.Type] || existing.Type}.`,
    });

    return {
      success: true,
      deletedItemId: itemId,
    };
  }

  async seedUnitySampleItems(
    operator: AuthenticatedOperator,
  ): Promise<{ seededCount: number; items: ItemConfigDocument[] }> {
    const nowIso = new Date().toISOString();
    const opLabel = formatOperatorLabel(operator);

    const writes: FirestoreBatchWrite[] = UNITY_SAMPLE_ITEMS.map((sample) => {
      const docData: ItemConfigDocument = {
        ...sample,
        LastUpdated: nowIso,
        UpdatedBy: opLabel,
      };
      return {
        update: {
          name: this.firebase.fullDocumentName(
            `${ITEM_CONFIGS_COLLECTION}/${sample.ItemId}`,
          ),
          fields: this.firebase.objectToFields(
            docData as unknown as Record<string, unknown>,
          ),
        },
      };
    });

    await this.firebase.commitWrites(writes, operator.authTokenForFirestore);

    await this.logItemActivity(operator, {
      action: 'SEED_SAMPLE_ITEMS',
      actionTitle: 'Đồng bộ bộ vật phẩm mẫu Unity',
      itemId: 'unity_sample_pack_9',
      itemName: 'Bộ 9 Vật Phẩm Mẫu Chuẩn Unity',
      itemType: GameItemType.Consumable,
      rarity: GameItemRarity.Legendary,
      details: `Đồng bộ 9 vật phẩm mẫu chuẩn dự án Unity (Sách EXP, Bình Thể Lực, Vé Chiêu Mộ, Đá Đột Phá, Mảnh Hồn Hitomi, Thánh Kiếm & Chiến Giáp Valkyria).`,
    });

    const items = await this.getAllItems(operator);
    return {
      seededCount: UNITY_SAMPLE_ITEMS.length,
      items,
    };
  }

  // ==================== AUDIT LOGS (ADMIN ONLY) ====================

  async getItemLogs(
    operator: AuthenticatedOperator,
    limitCount = 50,
  ): Promise<ItemActivityLog[]> {
    const safeLimit = Math.min(Math.max(1, Math.trunc(limitCount) || 50), 200);
    let docs = [];
    try {
      docs = await this.firebase.runQuery(
        ITEM_LOGS_PARENT_PATH,
        {
          from: [{ collectionId: 'Activities' }],
          orderBy: [
            {
              field: { fieldPath: 'timestamp' },
              direction: 'DESCENDING',
            },
          ],
          limit: safeLimit,
        },
        operator.authTokenForFirestore,
      );
    } catch {
      docs = await this.firebase.listDocuments(
        ITEM_LOGS_COLLECTION_PATH,
        operator.authTokenForFirestore,
        safeLimit,
      );
    }

    const mapped = docs.map((doc) => {
      const id = this.firebase.extractDocId(doc.name);
      const data = this.firebase.docToObject(doc);
      const ts = Number(data.timestamp) || 0;
      return {
        id,
        action: (typeof data.action === 'string'
          ? data.action
          : 'UPDATE_ITEM') as ItemLogAction,
        actionTitle:
          typeof data.actionTitle === 'string'
            ? data.actionTitle
            : 'Thao tác vật phẩm',
        itemId: typeof data.itemId === 'string' ? data.itemId : '',
        itemName: typeof data.itemName === 'string' ? data.itemName : '',
        itemType: Number.isFinite(Number(data.itemType))
          ? Number(data.itemType)
          : 0,
        rarity: Number.isFinite(Number(data.rarity)) ? Number(data.rarity) : 0,
        details: typeof data.details === 'string' ? data.details : '',
        performedBy:
          typeof data.performedBy === 'string' ? data.performedBy : 'Hệ thống',
        performedByRole:
          typeof data.performedByRole === 'string'
            ? data.performedByRole
            : undefined,
        timestamp: ts,
        createdAt:
          typeof data.createdAt === 'string' && data.createdAt
            ? data.createdAt
            : ts
              ? new Date(ts).toISOString()
              : '',
      };
    });

    return mapped.sort((a, b) => b.timestamp - a.timestamp).slice(0, safeLimit);
  }
}
