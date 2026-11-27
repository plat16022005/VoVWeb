import {
  BadRequestException,
  ForbiddenException,
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
  PlayerDataActivityLog,
  PlayerDataLogAction,
  PlayerEquipmentDetailItem,
  PlayerEquipmentStatRollDetail,
  PlayerEquippedSlotDetail,
  PlayerFormationData,
  PlayerFormationSlotItem,
  PlayerFullServerDetailResponse,
  PlayerHeroDetailItem,
  PlayerInventoryItemDetail,
  PlayerProfileData,
  PlayerProgressData,
  PlayerServerInfo,
  PlayerShardSummaryItem,
  PlayerStageStarItem,
  PlayerWalletData,
} from './player-data.types.js';

const USERS_COLLECTION = 'Users';
const ITEM_CONFIGS_COLLECTION = 'ItemConfigs';
const HERO_CONFIGS_COLLECTION = 'HeroConfigs';
const CHARACTERS_COLLECTION = 'Characters';
const SERVER_LIST_DOC_PATH = 'GameConfig/ServerList';
const PLAYER_DATA_LOGS_PARENT_PATH = 'Logs/PlayerData';
const PLAYER_DATA_LOGS_COLLECTION_PATH = 'Logs/PlayerData/Activities';

const VALID_SERVER_ID_REGEX = /^[a-z0-9-]+$/;
const VALID_KEY_REGEX = /^[A-Za-z0-9_.-]{1,128}$/;

const QUALITY_TIERS: Array<{
  quality: number;
  name: string;
  maxLevel: number;
  statBonusPct: number;
}> = [
  { quality: 0, name: 'Thường', maxLevel: 20, statBonusPct: 0 },
  { quality: 1, name: 'Lục', maxLevel: 40, statBonusPct: 0.1 },
  { quality: 2, name: 'Lam', maxLevel: 60, statBonusPct: 0.25 },
  { quality: 3, name: 'Tím', maxLevel: 80, statBonusPct: 0.45 },
  { quality: 4, name: 'Vàng', maxLevel: 90, statBonusPct: 0.7 },
  { quality: 5, name: 'Đỏ', maxLevel: 100, statBonusPct: 1.0 },
];

const STAR_TIERS: Array<{
  star: number;
  growthBonusPct: number;
  bonusSpeed: number;
  bonusCritRate: number;
  bonusCritDamage: number;
}> = [
  {
    star: 1,
    growthBonusPct: 0,
    bonusSpeed: 0,
    bonusCritRate: 0,
    bonusCritDamage: 0,
  },
  {
    star: 2,
    growthBonusPct: 0.15,
    bonusSpeed: 3,
    bonusCritRate: 2,
    bonusCritDamage: 10,
  },
  {
    star: 3,
    growthBonusPct: 0.35,
    bonusSpeed: 7,
    bonusCritRate: 5,
    bonusCritDamage: 20,
  },
  {
    star: 4,
    growthBonusPct: 0.6,
    bonusSpeed: 12,
    bonusCritRate: 8,
    bonusCritDamage: 35,
  },
  {
    star: 5,
    growthBonusPct: 1.0,
    bonusSpeed: 20,
    bonusCritRate: 12,
    bonusCritDamage: 50,
  },
];

const EQUIP_SLOT_LABELS: Record<number, string> = {
  0: 'Chung',
  1: 'Vũ Khí',
  2: 'Mũ / Nón',
  3: 'Áo Giáp',
  4: 'Giày',
  5: 'Phụ Kiện',
  6: 'Găng Tay',
};

const EQUIP_MAX_ENHANCE_BY_RARITY: Record<number, number> = {
  0: 20,
  1: 40,
  2: 60,
  3: 80,
  4: 100,
};

const STAT_META: Record<
  number,
  { label: string; isInt: boolean; isPct: boolean }
> = {
  1: { label: 'HP', isInt: true, isPct: false },
  2: { label: 'ATK', isInt: true, isPct: false },
  3: { label: 'DEF', isInt: true, isPct: false },
  4: { label: 'Speed', isInt: false, isPct: false },
  5: { label: 'Crit Rate', isInt: false, isPct: true },
  6: { label: 'Crit Damage', isInt: false, isPct: true },
  7: { label: 'Né tránh', isInt: false, isPct: true },
  8: { label: 'Đỡ đòn', isInt: false, isPct: true },
  9: { label: 'HP%', isInt: false, isPct: true },
  10: { label: 'ATK%', isInt: false, isPct: true },
  11: { label: 'DEF%', isInt: false, isPct: true },
};

interface FallbackItemCatalogEntry {
  itemName: string;
  description: string;
  type: number;
  rarity: number;
  maxStack: number;
  slot?: number;
  dropLocationHint: string;
}

/**
 * Danh mục dự phòng chuẩn 100% theo dự án Unity ValkyriaOfVerya (phòng trường hợp vật phẩm gốc chưa được đồng bộ lên ItemConfigs).
 */
const BUILTIN_UNITY_ITEM_CATALOG: Record<string, FallbackItemCatalogEntry> = {
  item_01: {
    itemName: 'Chip Cải Tiến Sơ Cấp',
    description: 'Dùng để tăng 200 điểm kinh nghiệm (EXP) cho Chiến binh Valkyria.',
    type: 0,
    rarity: 0,
    maxStack: 9999,
    dropLocationHint: 'Ải cốt truyện sơ cấp, Nhiệm vụ ngày',
  },
  item_02: {
    itemName: 'Chip Cải Tiến Trung Cấp',
    description: 'Dùng để tăng 2,000 điểm kinh nghiệm (EXP) cho Chiến binh Valkyria.',
    type: 0,
    rarity: 1,
    maxStack: 9999,
    dropLocationHint: 'Ải cốt truyện trung cấp, Phó bản EXP',
  },
  item_03: {
    itemName: 'Chip Cải Tiến Cao Cấp',
    description: 'Dùng để tăng 20,000 điểm kinh nghiệm (EXP) cho Chiến binh Valkyria.',
    type: 0,
    rarity: 2,
    maxStack: 9999,
    dropLocationHint: 'Phó bản EXP Tinh Anh, Tháp Thử Thách',
  },
  item_04: {
    itemName: 'Lõi Cộng Hưởng Sơ Cấp',
    description: 'Vé dùng để triệu hồi Valkyria tại Đài Chiêu Mộ Tiêu Chuẩn.',
    type: 4,
    rarity: 3,
    maxStack: 999,
    dropLocationHint: 'Nhiệm vụ cốt truyện, Điểm danh tuần',
  },
  item_05: {
    itemName: 'Lõi Cộng Hưởng Cao Cấp',
    description: 'Vé đặc biệt dùng để triệu hồi Valkyria tại Banner Giới Hạn (Rate-Up).',
    type: 4,
    rarity: 4,
    maxStack: 999,
    dropLocationHint: 'Sự kiện đặc biệt, Cửa hàng Tinh Tú',
  },
  item_06: {
    itemName: 'Lõi Thăng Hoa',
    description: 'Nguyên liệu quý hiếm dùng để đột phá bậc Phẩm Chất và mở khóa giới hạn cấp độ cho Valkyria.',
    type: 1,
    rarity: 2,
    maxStack: 9999,
    dropLocationHint: 'Phó bản Đột Phá, Rương Mốc Sao Chiến Dịch',
  },
  item_07: {
    itemName: 'Đá Cường Hóa',
    description: 'Nguyên liệu tinh luyện dùng để cường hóa cấp độ Trang bị (+1 đến +100).',
    type: 1,
    rarity: 1,
    maxStack: 9999,
    dropLocationHint: 'Rớt từ phó bản, Phân giải trang bị dư thừa',
  },
  item_exp_book_small: {
    itemName: 'Sách EXP Sơ Cấp',
    description: 'Chứa đựng tri thức cổ xưa, dùng để tăng 500 điểm kinh nghiệm cho Tướng.',
    type: 0,
    rarity: 0,
    maxStack: 9999,
    dropLocationHint: 'Rớt từ Ải 1-1 đến 2-5',
  },
  item_exp_book_large: {
    itemName: 'Sách EXP Cao Cấp',
    description: 'Bí tịch cổ ngữ chứa ma lực dày đặc, dùng để tăng 2,500 điểm kinh nghiệm cho Tướng.',
    type: 0,
    rarity: 1,
    maxStack: 9999,
    dropLocationHint: 'Rớt từ Phó bản EXP Tinh Anh',
  },
  item_stamina_potion: {
    itemName: 'Bình Thể Lực',
    description: 'Dung dịch ma thuật hồi phục thể lực, ngay lập tức hồi 60 điểm Thể Lực (Energy).',
    type: 0,
    rarity: 1,
    maxStack: 999,
    dropLocationHint: 'Nhiệm vụ hàng ngày hoặc Cửa hàng',
  },
  ticket_gacha_standard: {
    itemName: 'Vé Chiêu Mộ Tiêu Chuẩn',
    description: 'Vé dùng để triệu hồi các Valkyria tại Đài Triệu Hồi thường.',
    type: 4,
    rarity: 3,
    maxStack: 999,
    dropLocationHint: 'Nhiệm vụ cốt truyện, Điểm danh tuần',
  },
  ticket_gacha_limited: {
    itemName: 'Vé Chiêu Mộ Giới Hạn',
    description: 'Vé đặc biệt dùng để triệu hồi các Valkyria Rate-up tại sự kiện giới hạn.',
    type: 4,
    rarity: 4,
    maxStack: 999,
    dropLocationHint: 'Sự kiện đặc biệt hoặc Nạp đầu',
  },
  mat_breakthrough_stone: {
    itemName: 'Đá Đột Phá Thần Bí',
    description: 'Nguyên liệu quý giá cần thiết để nâng sao và khai phá giới hạn cấp độ của Tướng.',
    type: 1,
    rarity: 2,
    maxStack: 9999,
    dropLocationHint: 'Phó bản Đột Phá Thần Bí',
  },
  shard_hero_hitomi: {
    itemName: 'Mảnh Hồn Hitomi',
    description: 'Thu thập đủ 50 mảnh để triệu hồi hoặc tăng sao cho Hitomi.',
    type: 3,
    rarity: 3,
    maxStack: 9999,
    dropLocationHint: 'Cửa hàng Đấu Trường, Vượt ải Tinh Anh',
  },
  equip_weapon_valkyrie_sword: {
    itemName: 'Thánh Kiếm Valkyria',
    description: 'Thanh kiếm huyền thoại được rèn từ tinh thể quang minh.',
    type: 2,
    rarity: 3,
    maxStack: 99,
    slot: 1,
    dropLocationHint: 'Tháp Thử Thách Tầng 50',
  },
  equip_armor_valkyrie_plate: {
    itemName: 'Chiến Giáp Valkyria',
    description: 'Bộ giáp hộ thân làm từ thép thánh.',
    type: 2,
    rarity: 3,
    maxStack: 99,
    slot: 3,
    dropLocationHint: 'Tháp Thử Thách Tầng 60',
  },
  equip_weapon_01: {
    itemName: 'Trường Kiếm Rực Lửa',
    description: 'Kiếm chiến rèn từ hỏa tinh thép; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 1,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_weapon_02: {
    itemName: 'Lưỡi Kiếm Ám Ảnh',
    description: 'Lưỡi kiếm mang năng lượng huyền bí; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 1,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_helmet_01: {
    itemName: 'Chiến Khôi Lửa',
    description: 'Mũ giáp bảo hộ tiền tuyến; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 2,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_helmet_02: {
    itemName: 'Mũ Trùm Bóng Đêm',
    description: 'Mũ trùm nhẹ tăng khả năng tập trung; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 2,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_armor_01: {
    itemName: 'Chiến Giáp Hoàng Kim',
    description: 'Giáp nặng phòng hộ kiên cố; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 3,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_armor_02: {
    itemName: 'Áo Choàng Tinh Linh',
    description: 'Áo choàng dệt ma lực linh hoạt; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 3,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_boots_01: {
    itemName: 'Chiến Hài Bạc',
    description: 'Ủng chiến cơ động cao; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 4,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_boots_02: {
    itemName: 'Ủng Bóng Tối',
    description: 'Ủng da nhẹ gia tăng tốc độ; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 4,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_accessory_01: {
    itemName: 'Huy Hiệu Sư Tử',
    description: 'Phù hiệu cổ truyền sức mạnh; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 5,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_accessory_02: {
    itemName: 'Dây Chuyền Tinh Tú',
    description: 'Mặt dây chuyền hội tụ tinh lực; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 5,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_gloves_01: {
    itemName: 'Thủ Giáp Thép',
    description: 'Găng giáp bọc thép tăng uy lực; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 6,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
  equip_gloves_02: {
    itemName: 'Nhẫn Ma Tinh',
    description: 'Vòng tay/nhẫn ma lực tinh xảo; phẩm chất và thuộc tính sinh ngẫu nhiên.',
    type: 2,
    rarity: 0,
    maxStack: 1,
    slot: 6,
    dropLocationHint: 'Rớt ngẫu nhiên từ phó bản, sự kiện hoặc cửa hàng',
  },
};

function clampInt(
  val: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(num)));
}

function clampFloat(val: unknown, fallback = 0): number {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

function formatOperatorLabel(operator: AuthenticatedOperator): string {
  return operator.email || operator.username || 'system';
}

function formatStatRollValue(statType: number, value: number): string {
  const meta = STAT_META[statType];
  if (!meta) return `+${value}`;
  const numStr = meta.isInt
    ? Math.round(value).toLocaleString('vi-VN')
    : Number(value.toFixed(2)).toString();
  const unit = meta.isPct ? '%' : '';
  return `${meta.label} +${numStr}${unit}`;
}

function parseStatRoll(raw: unknown): PlayerEquipmentStatRollDetail | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const statType = clampInt(rec.StatType, 0, 11, 0);
  if (statType < 1 || statType > 11) return null;
  const baseValue = clampFloat(rec.BaseValue, 0);
  const value = clampFloat(rec.Value, baseValue);
  const upgradeCount = clampInt(rec.UpgradeCount, 0, 100, 0);
  const meta = STAT_META[statType] || {
    label: `Stat #${statType}`,
    isInt: false,
    isPct: false,
  };
  return {
    statType,
    statLabel: meta.label,
    baseValue,
    value,
    formattedValue: formatStatRollValue(statType, value),
    upgradeCount,
  };
}

function computeEquipStatScore(
  mainStat: PlayerEquipmentStatRollDetail | null,
  subStats: PlayerEquipmentStatRollDetail[],
): number {
  const all = [...(mainStat ? [mainStat] : []), ...subStats];
  let hp = 0;
  let atk = 0;
  let def = 0;
  let speed = 0;
  let critRate = 0;
  let critDamage = 0;
  let dodgeRate = 0;
  let parryRate = 0;
  let hpPct = 0;
  let atkPct = 0;
  let defPct = 0;

  for (const s of all) {
    switch (s.statType) {
      case 1:
        hp += s.value;
        break;
      case 2:
        atk += s.value;
        break;
      case 3:
        def += s.value;
        break;
      case 4:
        speed += s.value;
        break;
      case 5:
        critRate += s.value;
        break;
      case 6:
        critDamage += s.value;
        break;
      case 7:
        dodgeRate += s.value;
        break;
      case 8:
        parryRate += s.value;
        break;
      case 9:
        hpPct += s.value;
        break;
      case 10:
        atkPct += s.value;
        break;
      case 11:
        defPct += s.value;
        break;
    }
  }

  return Math.round(
    hp * 0.2 +
      atk * 5.0 +
      def * 3.0 +
      speed * 15.0 +
      critRate * 25.0 +
      critDamage * 15.0 +
      dodgeRate * 12.0 +
      parryRate * 12.0 +
      hpPct * 18.0 +
      atkPct * 35.0 +
      defPct * 15.0,
  );
}

@Injectable()
export class PlayerDataService {
  private readonly logger = new Logger(PlayerDataService.name);

  constructor(private readonly firebase: GachaFirebaseService) {}

  private hasSubPermission(
    operator: AuthenticatedOperator,
    perm: string,
  ): boolean {
    if (operator.role === 'Admin') return true;
    return operator.permissions.includes(perm);
  }

  private assertValidServerId(rawServerId: unknown): string {
    const trimmed =
      typeof rawServerId === 'string' ? rawServerId.trim().toLowerCase() : '';
    if (
      !trimmed ||
      trimmed === 'default' ||
      trimmed === '(default)' ||
      trimmed === 'all' ||
      !VALID_SERVER_ID_REGEX.test(trimmed)
    ) {
      throw new BadRequestException(
        'Vui lòng chọn đúng mã cụm máy chủ cụ thể (ví dụ: server-1, server-2).',
      );
    }
    return trimmed;
  }

  private assertValidUid(rawUid: unknown): string {
    const trimmed = typeof rawUid === 'string' ? rawUid.trim() : '';
    if (!trimmed || trimmed.length > 128 || trimmed.includes('/')) {
      throw new BadRequestException(
        'Mã định danh tài khoản người chơi không hợp lệ.',
      );
    }
    return trimmed;
  }

  async getRegisteredServers(token: string): Promise<PlayerServerInfo[]> {
    const serverDoc = await this.firebase
      .getDocument(SERVER_LIST_DOC_PATH, token)
      .catch(() => null);
    const servers: PlayerServerInfo[] = [];
    if (serverDoc) {
      const obj = this.firebase.docToObject(serverDoc);
      for (const [serverId, value] of Object.entries(obj)) {
        const cleanId = serverId.trim().toLowerCase();
        if (
          !cleanId ||
          cleanId === 'default' ||
          cleanId === '(default)' ||
          !VALID_SERVER_ID_REGEX.test(cleanId)
        ) {
          continue;
        }
        if (!value || typeof value !== 'object') continue;
        const rec = value as Record<string, unknown>;
        const name =
          typeof rec.Name === 'string' && rec.Name.trim()
            ? rec.Name.trim()
            : cleanId;
        const status =
          typeof rec.Status === 'string' && rec.Status.trim()
            ? rec.Status.trim()
            : 'Normal';
        servers.push({ ServerId: cleanId, Name: name, Status: status });
      }
      servers.sort((a, b) => a.ServerId.localeCompare(b.ServerId));
    }
    return servers;
  }

  private async assertRegisteredServer(
    rawServerId: unknown,
    token: string,
  ): Promise<PlayerServerInfo> {
    const serverId = this.assertValidServerId(rawServerId);
    const servers = await this.getRegisteredServers(token);
    const matched = servers.find((s) => s.ServerId === serverId);
    if (!matched) {
      throw new BadRequestException(
        `Cụm máy chủ "${serverId}" chưa được đăng ký trong danh sách máy chủ hoạt động.`,
      );
    }
    return matched;
  }

  private wrapShardError(serverId: string, err: unknown): never {
    if (
      err instanceof BadRequestException ||
      err instanceof ForbiddenException ||
      err instanceof NotFoundException
    ) {
      throw err;
    }
    const rawMsg = err instanceof Error ? err.message : String(err);
    const lower = rawMsg.toLowerCase();
    if (
      lower.includes('missing or insufficient permissions') ||
      lower.includes('permission_denied') ||
      lower.includes('403')
    ) {
      throw new ForbiddenException(
        `Không đủ quyền truy cập dữ liệu người chơi trên cụm máy chủ "${serverId}". Vui lòng kiểm tra quy tắc bảo mật của máy chủ hoặc đăng nhập lại.`,
      );
    }
    if (lower.includes('database') && lower.includes('not found')) {
      throw new NotFoundException(
        `Cụm máy chủ "${serverId}" chưa được khởi tạo vùng dữ liệu trên hệ thống.`,
      );
    }
    throw err instanceof Error ? err : new Error(rawMsg);
  }

  // ==================== 1. TRA CỨU DANH SÁCH NGƯỜI CHƠI THEO SERVER ====================

  async listPlayersByServer(
    operator: AuthenticatedOperator,
    rawServerId: string,
    rawQuery = '',
    includeWithoutCharacter = false,
  ): Promise<PlayerShardSummaryItem[]> {
    const srv = await this.assertRegisteredServer(
      rawServerId,
      operator.authTokenForFirestore,
    );
    const serverId = srv.ServerId;
    const q = (rawQuery || '').trim().toLowerCase();

    const userDocs = await this.firebase.listDocuments(
      USERS_COLLECTION,
      operator.authTokenForFirestore,
    );

    interface RawAccountCandidate {
      uid: string;
      username: string;
      email: string;
      playerCode: string;
      provider: string;
      role: string;
      isBanned: boolean;
      lastLogin: string;
      hasHintInServer: boolean;
      hintInGameName: string;
      hintLevel: number;
      hintAvatarId: string;
    }

    const candidates: RawAccountCandidate[] = [];

    for (const doc of userDocs) {
      const uid = this.firebase.extractDocId(doc.name);
      const obj = this.firebase.docToObject(doc);

      const roleRaw =
        typeof obj.Role === 'string' && obj.Role.trim()
          ? obj.Role.trim()
          : typeof obj.role === 'string' && obj.role.trim()
            ? obj.role.trim()
            : 'Player';
      const username =
        typeof obj.Username === 'string' && obj.Username.trim()
          ? obj.Username.trim()
          : typeof obj.username === 'string' && obj.username.trim()
            ? obj.username.trim()
            : uid.slice(0, 12);
      const email =
        typeof obj.Email === 'string'
          ? obj.Email.trim()
          : typeof obj.email === 'string'
            ? obj.email.trim()
            : '';
      const playerCode =
        typeof obj.PlayerCode === 'string' || typeof obj.PlayerCode === 'number'
          ? String(obj.PlayerCode).trim()
          : '';
      const provider =
        typeof obj.Provider === 'string' && obj.Provider.trim()
          ? obj.Provider.trim()
          : 'Email';
      const isBanned =
        obj.IsBanned === true ||
        obj.isBanned === true ||
        obj.Status === 'banned' ||
        obj.status === 'banned';
      const lastLogin =
        typeof obj.LastLogin === 'string'
          ? obj.LastLogin
          : typeof obj.CreatedAt === 'string'
            ? obj.CreatedAt
            : '';
      const lastServerId =
        typeof obj.LastServerId === 'string'
          ? obj.LastServerId.trim().toLowerCase()
          : '';

      const serverChars =
        obj.ServerCharacters && typeof obj.ServerCharacters === 'object'
          ? (obj.ServerCharacters as Record<string, unknown>)
          : {};
      const charEntry = serverChars[serverId];
      let hasHintInServer = lastServerId === serverId;
      let hintInGameName = '';
      let hintLevel = 1;
      let hintAvatarId = 'avatar_default';

      if (charEntry && typeof charEntry === 'object') {
        const rec = charEntry as Record<string, unknown>;
        hasHintInServer = true;
        if (typeof rec.Name === 'string' && rec.Name.trim()) {
          hintInGameName = rec.Name.trim();
        }
        if (typeof rec.Level === 'number' && Number.isFinite(rec.Level)) {
          hintLevel = Math.max(1, Math.trunc(rec.Level));
        }
        if (typeof rec.AvatarId === 'string' && rec.AvatarId.trim()) {
          hintAvatarId = rec.AvatarId.trim();
        }
      }

      candidates.push({
        uid,
        username,
        email,
        playerCode,
        provider,
        role: roleRaw,
        isBanned,
        lastLogin,
        hasHintInServer,
        hintInGameName,
        hintLevel,
        hintAvatarId,
      });
    }

    // Ưu tiên kiểm tra những tài khoản đã có dấu vết ở serverId hoặc khớp từ khóa tìm kiếm trước
    candidates.sort((a, b) => {
      if (a.hasHintInServer !== b.hasHintInServer) {
        return a.hasHintInServer ? -1 : 1;
      }
      const aIsPlayer = a.role.toLowerCase() === 'player';
      const bIsPlayer = b.role.toLowerCase() === 'player';
      if (aIsPlayer !== bIsPlayer) return aIsPlayer ? -1 : 1;
      return a.username.localeCompare(b.username, 'vi');
    });

    // Giới hạn tối đa 60 tài khoản để truy vấn song song Profile & Wallet trên shard server-x mượt mà
    const toProbe = candidates.slice(0, 60);
    const BATCH_SIZE = 12;
    const summaries: PlayerShardSummaryItem[] = [];

    for (let i = 0; i < toProbe.length; i += BATCH_SIZE) {
      const slice = toProbe.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        slice.map(async (cand) => {
          const [profileDoc, walletDoc] = await Promise.all([
            this.firebase
              .getDocument(
                `${USERS_COLLECTION}/${cand.uid}/UserData/Profile`,
                operator.authTokenForFirestore,
                serverId,
              )
              .catch(() => null),
            this.firebase
              .getDocument(
                `${USERS_COLLECTION}/${cand.uid}/UserData/Wallet`,
                operator.authTokenForFirestore,
                serverId,
              )
              .catch(() => null),
          ]);

          const hasCharacterInServer = Boolean(profileDoc);
          if (!hasCharacterInServer && !includeWithoutCharacter && !cand.hasHintInServer) {
            return null;
          }

          const profileObj = profileDoc
            ? this.firebase.docToObject(profileDoc)
            : {};
          const walletObj = walletDoc
            ? this.firebase.docToObject(walletDoc)
            : {};

          const inGameName =
            (typeof profileObj.InGameName === 'string' &&
              profileObj.InGameName.trim()) ||
            cand.hintInGameName ||
            cand.username;
          const level = clampInt(profileObj.Level, 1, 999, cand.hintLevel || 1);
          const exp = clampInt(profileObj.Exp, 0, 1000000000, 0);
          const totalCombatPower = clampInt(
            profileObj.TotalCombatPower,
            0,
            100000000000,
            0,
          );
          const avatarId =
            (typeof profileObj.AvatarId === 'string' &&
              profileObj.AvatarId.trim()) ||
            cand.hintAvatarId ||
            'avatar_default';

          const gold = clampInt(walletObj.Gold, 0, 100000000000, 0);
          const gems = clampInt(walletObj.Gems, 0, 1000000000, 0);
          const energy = clampInt(walletObj.Energy, 0, 1000000, 0);
          const maxEnergy = clampInt(walletObj.MaxEnergy, 1, 1000000, 120);

          if (q) {
            const match =
              cand.uid.toLowerCase().includes(q) ||
              cand.username.toLowerCase().includes(q) ||
              cand.email.toLowerCase().includes(q) ||
              cand.playerCode.toLowerCase().includes(q) ||
              inGameName.toLowerCase().includes(q);
            if (!match) return null;
          }

          // Nếu hoàn toàn chưa tạo nhân vật ở server này và người dùng không bật xem tài khoản chưa tạo nhân vật -> ẩn
          if (!hasCharacterInServer && !includeWithoutCharacter) {
            return null;
          }

          return {
            uid: cand.uid,
            username: cand.username,
            email: cand.email,
            playerCode: cand.playerCode,
            provider: cand.provider,
            role: cand.role,
            isBanned: cand.isBanned,
            serverId,
            hasCharacterInServer,
            inGameName,
            level,
            exp,
            totalCombatPower,
            avatarId,
            gold,
            gems,
            energy,
            maxEnergy,
            lastLogin: cand.lastLogin,
          } satisfies PlayerShardSummaryItem;
        }),
      );

      for (const item of batchResults) {
        if (item) summaries.push(item);
      }
    }

    // Sắp xếp: Đã có nhân vật trên server lên đầu -> Lực chiến giảm dần -> Level giảm dần -> Tên nhân vật
    return summaries.sort((a, b) => {
      if (a.hasCharacterInServer !== b.hasCharacterInServer) {
        return a.hasCharacterInServer ? -1 : 1;
      }
      if (b.totalCombatPower !== a.totalCombatPower) {
        return b.totalCombatPower - a.totalCombatPower;
      }
      if (b.level !== a.level) return b.level - a.level;
      return a.inGameName.localeCompare(b.inGameName, 'vi');
    });
  }

  // ==================== 2. CHI TIẾT HỒ SƠ, KHO TƯỚNG, TRANG BỊ, TIẾN TRÌNH & TÚI ĐỒ ====================

  private async loadCatalogMaps(token: string) {
    const [itemDocs, heroConfigDocs, charDocs] = await Promise.all([
      this.firebase
        .listDocuments(ITEM_CONFIGS_COLLECTION, token)
        .catch(() => []),
      this.firebase
        .listDocuments(HERO_CONFIGS_COLLECTION, token)
        .catch(() => []),
      this.firebase
        .listDocuments(CHARACTERS_COLLECTION, token)
        .catch(() => []),
    ]);

    const itemMap = new Map<
      string,
      {
        itemName: string;
        description: string;
        iconUrl: string;
        type: number;
        rarity: number;
        maxStack: number;
        slot: number;
        dropLocationHint: string;
      }
    >();

    // Nạp danh mục mặc định Unity trước
    for (const [id, entry] of Object.entries(BUILTIN_UNITY_ITEM_CATALOG)) {
      itemMap.set(id, {
        itemName: entry.itemName,
        description: entry.description,
        iconUrl: '',
        type: entry.type,
        rarity: entry.rarity,
        maxStack: entry.maxStack,
        slot: entry.slot ?? 0,
        dropLocationHint: entry.dropLocationHint,
      });
    }

    // Ghi đè bằng dữ liệu trực tiếp từ ItemConfigs (bao gồm IconUrl mới tải lên)
    for (const doc of itemDocs) {
      const id = this.firebase.extractDocId(doc.name);
      const raw = this.firebase.docToObject(doc);
      const itemId =
        (typeof raw.ItemId === 'string' && raw.ItemId.trim()) || id;
      const fallback = BUILTIN_UNITY_ITEM_CATALOG[itemId];
      const itemName =
        (typeof raw.ItemName === 'string' && raw.ItemName.trim()) ||
        (typeof raw.Name === 'string' && raw.Name.trim()) ||
        fallback?.itemName ||
        itemId;
      const description =
        (typeof raw.Description === 'string' && raw.Description.trim()) ||
        fallback?.description ||
        '';
      const iconUrl =
        (typeof raw.IconUrl === 'string' && raw.IconUrl.trim()) ||
        (typeof raw.ImageUrl === 'string' && raw.ImageUrl.trim()) ||
        '';
      const type = clampInt(
        raw.Type ?? raw.ItemType,
        0,
        4,
        fallback?.type ?? 1,
      );
      const rarity = clampInt(raw.Rarity, 0, 4, fallback?.rarity ?? 0);
      const maxStack = clampInt(
        raw.MaxStack,
        1,
        999999,
        fallback?.maxStack ?? (type === 2 ? 99 : 9999),
      );
      const slot = clampInt(raw.Slot, 0, 6, fallback?.slot ?? 0);
      const dropLocationHint =
        (typeof raw.DropLocationHint === 'string' &&
          raw.DropLocationHint.trim()) ||
        fallback?.dropLocationHint ||
        '';

      itemMap.set(itemId, {
        itemName,
        description,
        iconUrl,
        type,
        rarity,
        maxStack,
        slot,
        dropLocationHint,
      });
    }

    interface HeroCatalogEntry {
      heroId: string;
      heroName: string;
      title: string;
      role: string;
      rarity: number;
      rarityLabel: string;
      image: string;
      baseHp: number;
      baseAtk: number;
      baseDef: number;
      baseSpeed: number;
      baseCritRate: number;
      baseCritDamage: number;
      hpGrowthPerLevel: number;
      atkGrowthPerLevel: number;
      defGrowthPerLevel: number;
    }

    const heroMap = new Map<string, HeroCatalogEntry>();

    const registerHeroAlias = (key: string, entry: HeroCatalogEntry) => {
      const clean = key.trim().toLowerCase();
      if (!clean) return;
      heroMap.set(clean, entry);
      const stripped = clean.replace(/^hero_/, '');
      if (stripped) {
        if (!heroMap.has(stripped)) heroMap.set(stripped, entry);
        if (!heroMap.has(`hero_${stripped}`)) {
          heroMap.set(`hero_${stripped}`, entry);
        }
      }
    };

    for (const doc of charDocs) {
      const id = this.firebase.extractDocId(doc.name);
      const raw = this.firebase.docToObject(doc);
      const rarityNum = clampInt(raw.rarity ?? raw.Rarity, 1, 6, 5);
      const rarityLabel =
        (typeof raw.rarityLabel === 'string' && raw.rarityLabel.trim()) ||
        (typeof raw.RarityLabel === 'string' && raw.RarityLabel.trim()) ||
        (rarityNum >= 6
          ? 'UR'
          : rarityNum === 5
            ? 'SSR'
            : rarityNum === 4
              ? 'SR'
              : 'R');

      const entry: HeroCatalogEntry = {
        heroId: id,
        heroName:
          (typeof raw.name === 'string' && raw.name.trim()) ||
          (typeof raw.Name === 'string' && raw.Name.trim()) ||
          id,
        title:
          (typeof raw.title === 'string' && raw.title.trim()) ||
          (typeof raw.Title === 'string' && raw.Title.trim()) ||
          '',
        role:
          (typeof raw.role === 'string' && raw.role.trim()) ||
          (typeof raw.Role === 'string' && raw.Role.trim()) ||
          'Valkyria',
        rarity: rarityNum,
        rarityLabel,
        image:
          (typeof raw.image === 'string' && raw.image.trim()) ||
          (typeof raw.Image === 'string' && raw.Image.trim()) ||
          '/images/default_hero.png',
        baseHp: clampFloat(raw.baseHp ?? raw.BaseHp, 1000),
        baseAtk: clampFloat(raw.baseAtk ?? raw.BaseAtk, 100),
        baseDef: clampFloat(raw.baseDef ?? raw.BaseDef, 50),
        baseSpeed: clampFloat(
          raw.baseSpd ?? raw.BaseSpeed ?? raw.BaseSpd,
          100,
        ),
        baseCritRate: clampFloat(raw.critRate ?? raw.BaseCritRate, 5),
        baseCritDamage: clampFloat(raw.critDmg ?? raw.BaseCritDamage, 150),
        hpGrowthPerLevel: clampFloat(
          raw.hpGrowthPerLevel ?? raw.HpGrowthPerLevel,
          100,
        ),
        atkGrowthPerLevel: clampFloat(
          raw.atkGrowthPerLevel ?? raw.AtkGrowthPerLevel,
          10,
        ),
        defGrowthPerLevel: clampFloat(
          raw.defGrowthPerLevel ?? raw.DefGrowthPerLevel,
          5,
        ),
      };
      registerHeroAlias(id, entry);
    }

    // Tải song song hồ sơ mở rộng HeroConfigs/{heroId}/Profile/info (nơi lưu ảnh R2 Image, Title...)
    const profileByDocId = new Map<string, Record<string, unknown>>();
    await Promise.all(
      heroConfigDocs.map(async (doc) => {
        const docId = this.firebase.extractDocId(doc.name);
        try {
          const profileDoc = await this.firebase.getDocument(
            `${HERO_CONFIGS_COLLECTION}/${docId}/Profile/info`,
            token,
          );
          if (profileDoc) {
            profileByDocId.set(docId, this.firebase.docToObject(profileDoc));
          }
        } catch {
          // Bỏ qua nếu tướng chưa có subcollection Profile/info
        }
      }),
    );

    for (const doc of heroConfigDocs) {
      const id = this.firebase.extractDocId(doc.name);
      const raw = this.firebase.docToObject(doc);
      const profileRaw = profileByDocId.get(id) || {};
      const heroIdField =
        typeof raw.HeroId === 'string' && raw.HeroId.trim()
          ? raw.HeroId.trim()
          : id;
      const existing =
        heroMap.get(id.toLowerCase()) ||
        heroMap.get(heroIdField.toLowerCase()) ||
        heroMap.get(id.toLowerCase().replace(/^hero_/, ''));

      const rawRarity =
        raw.Rarity ?? profileRaw.Rarity ?? existing?.rarity ?? 5;
      let rarityNum = 5;
      let rarityLabel = existing?.rarityLabel || 'SSR';
      if (typeof rawRarity === 'string' && rawRarity.trim()) {
        rarityLabel = rawRarity.trim().toUpperCase();
        rarityNum =
          rarityLabel === 'UR'
            ? 6
            : rarityLabel === 'SSR'
              ? 5
              : rarityLabel === 'SR'
                ? 4
                : 3;
      } else if (typeof rawRarity === 'number') {
        rarityNum = rawRarity;
        if (!existing?.rarityLabel) {
          rarityLabel =
            rarityNum >= 6
              ? 'UR'
              : rarityNum === 5
                ? 'SSR'
                : rarityNum === 4
                  ? 'SR'
                  : 'R';
        }
      }

      const resolvedImage =
        (typeof profileRaw.Image === 'string' && profileRaw.Image.trim()) ||
        (typeof profileRaw.image === 'string' && profileRaw.image.trim()) ||
        (typeof profileRaw.AvatarUrl === 'string' &&
          profileRaw.AvatarUrl.trim()) ||
        (typeof raw.Image === 'string' && raw.Image.trim()) ||
        (typeof raw.image === 'string' && raw.image.trim()) ||
        existing?.image ||
        '/images/default_hero.png';

      const resolvedTitle =
        (typeof profileRaw.Title === 'string' && profileRaw.Title.trim()) ||
        (typeof profileRaw.title === 'string' && profileRaw.title.trim()) ||
        existing?.title ||
        '';

      const entry: HeroCatalogEntry = {
        heroId: heroIdField,
        heroName:
          (typeof raw.HeroName === 'string' && raw.HeroName.trim()) ||
          (typeof raw.Name === 'string' && raw.Name.trim()) ||
          (typeof profileRaw.HeroName === 'string' &&
            profileRaw.HeroName.trim()) ||
          existing?.heroName ||
          id,
        title: resolvedTitle,
        role:
          (typeof raw.Role === 'string' && raw.Role.trim()) ||
          (typeof profileRaw.Role === 'string' && profileRaw.Role.trim()) ||
          existing?.role ||
          'Valkyria',
        rarity: rarityNum,
        rarityLabel,
        image: resolvedImage,
        baseHp: clampFloat(raw.BaseHp, existing?.baseHp ?? 1000),
        baseAtk: clampFloat(raw.BaseAtk, existing?.baseAtk ?? 100),
        baseDef: clampFloat(raw.BaseDef, existing?.baseDef ?? 50),
        baseSpeed: clampFloat(
          raw.BaseSpeed ?? raw.BaseSpd,
          existing?.baseSpeed ?? 100,
        ),
        baseCritRate: clampFloat(
          raw.BaseCritRate ?? raw.CritRate,
          existing?.baseCritRate ?? 5,
        ),
        baseCritDamage: clampFloat(
          raw.BaseCritDamage ?? raw.CritDmg,
          existing?.baseCritDamage ?? 150,
        ),
        hpGrowthPerLevel: clampFloat(
          raw.HpGrowthPerLevel,
          existing?.hpGrowthPerLevel ?? 100,
        ),
        atkGrowthPerLevel: clampFloat(
          raw.AtkGrowthPerLevel,
          existing?.atkGrowthPerLevel ?? 10,
        ),
        defGrowthPerLevel: clampFloat(
          raw.DefGrowthPerLevel,
          existing?.defGrowthPerLevel ?? 5,
        ),
      };
      registerHeroAlias(id, entry);
      if (heroIdField !== id) {
        registerHeroAlias(heroIdField, entry);
      }
    }

    return { itemMap, heroMap };
  }

  private computeSingleHeroCombatPower(
    heroRaw: {
      level: number;
      star: number;
      quality: number;
      skillLvs: number[];
      equippedSlots: Record<string, string>;
    },
    heroCatalog:
      | {
          baseHp: number;
          baseAtk: number;
          baseDef: number;
          baseSpeed: number;
          baseCritRate: number;
          baseCritDamage: number;
          hpGrowthPerLevel: number;
          atkGrowthPerLevel: number;
          defGrowthPerLevel: number;
        }
      | undefined,
    equipmentsMap: Map<string, PlayerEquipmentDetailItem>,
  ): number {
    const level = Math.max(1, heroRaw.level);
    const star = clampInt(heroRaw.star, 1, 5, 1);
    const quality = clampInt(heroRaw.quality, 0, 5, 0);

    const starTier = STAR_TIERS[star - 1] || STAR_TIERS[0];
    const qualityTier = QUALITY_TIERS[quality] || QUALITY_TIERS[0];
    const growthMult = 1 + starTier.growthBonusPct;
    const qualityMult = 1 + qualityTier.statBonusPct;
    const offset = level - 1;

    const baseHp = heroCatalog?.baseHp ?? 1000;
    const baseAtk = heroCatalog?.baseAtk ?? 100;
    const baseDef = heroCatalog?.baseDef ?? 50;
    const baseSpeed = heroCatalog?.baseSpeed ?? 100;
    const baseCritRate = heroCatalog?.baseCritRate ?? 5;
    const baseCritDamage = heroCatalog?.baseCritDamage ?? 150;
    const hpGrowth = heroCatalog?.hpGrowthPerLevel ?? 100;
    const atkGrowth = heroCatalog?.atkGrowthPerLevel ?? 10;
    const defGrowth = heroCatalog?.defGrowthPerLevel ?? 5;

    let ebHp = 0;
    let ebAtk = 0;
    let ebDef = 0;
    let ebSpeed = 0;
    let ebCritRate = 0;
    let ebCritDamage = 0;
    let ebHpPct = 0;
    let ebAtkPct = 0;
    let ebDefPct = 0;

    for (const [slotStr, equipUid] of Object.entries(heroRaw.equippedSlots)) {
      const slotNum = Number(slotStr);
      if (!equipUid) continue;
      const eq = equipmentsMap.get(equipUid);
      if (!eq) continue;
      if (eq.slot && slotNum && eq.slot !== slotNum) continue;
      const rolls = [...(eq.mainStat ? [eq.mainStat] : []), ...eq.subStats];
      for (const r of rolls) {
        switch (r.statType) {
          case 1:
            ebHp += r.value;
            break;
          case 2:
            ebAtk += r.value;
            break;
          case 3:
            ebDef += r.value;
            break;
          case 4:
            ebSpeed += r.value;
            break;
          case 5:
            ebCritRate += r.value;
            break;
          case 6:
            ebCritDamage += r.value;
            break;
          case 9:
            ebHpPct += r.value;
            break;
          case 10:
            ebAtkPct += r.value;
            break;
          case 11:
            ebDefPct += r.value;
            break;
        }
      }
    }

    const scaledHp = (baseHp + offset * hpGrowth * growthMult) * qualityMult;
    const scaledAtk = (baseAtk + offset * atkGrowth * growthMult) * qualityMult;
    const scaledDef = (baseDef + offset * defGrowth * growthMult) * qualityMult;

    const hp = Math.max(1, scaledHp * (1 + ebHpPct / 100) + ebHp);
    const atk = Math.max(0, scaledAtk * (1 + ebAtkPct / 100) + ebAtk);
    const def = Math.max(0, scaledDef * (1 + ebDefPct / 100) + ebDef);
    const spd = Math.max(1, baseSpeed + starTier.bonusSpeed + ebSpeed);
    const critRate = Math.max(
      0,
      Math.min(100, baseCritRate + starTier.bonusCritRate + ebCritRate),
    );
    const critDmg = Math.max(
      100,
      baseCritDamage + starTier.bonusCritDamage + ebCritDamage,
    );

    const skillSum = heroRaw.skillLvs.reduce(
      (sum, lv) => sum + (Number(lv) || 0),
      0,
    );

    const baseScore =
      hp * 0.2 +
      atk * 5 +
      def * 3 +
      spd * 15 +
      critRate * 25 +
      Math.max(0, critDmg - 100) * 15;

    return Math.round(baseScore + star * 500 + skillSum * 200);
  }

  async getPlayerFullDetail(
    operator: AuthenticatedOperator,
    rawServerId: string,
    rawUid: string,
  ): Promise<PlayerFullServerDetailResponse> {
    const srv = await this.assertRegisteredServer(
      rawServerId,
      operator.authTokenForFirestore,
    );
    const serverId = srv.ServerId;
    const uid = this.assertValidUid(rawUid);
    const token = operator.authTokenForFirestore;

    const userDataBase = `${USERS_COLLECTION}/${uid}/UserData`;

    let userDoc = null;
    let profileDoc = null;
    let walletDoc = null;
    let heroesDoc = null;
    let formationDoc = null;
    let inventoryDoc = null;
    let equipmentsDoc = null;
    let progressDoc = null;
    let catalogs: Awaited<ReturnType<typeof this.loadCatalogMaps>>;

    try {
      [
        userDoc,
        catalogs,
        profileDoc,
        walletDoc,
        heroesDoc,
        formationDoc,
        inventoryDoc,
        equipmentsDoc,
        progressDoc,
      ] = await Promise.all([
        this.firebase.getDocument(`${USERS_COLLECTION}/${uid}`, token),
        this.loadCatalogMaps(token),
        this.firebase
          .getDocument(`${userDataBase}/Profile`, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(`${userDataBase}/Wallet`, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(`${userDataBase}/Heroes`, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(`${userDataBase}/Formation`, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(`${userDataBase}/Inventory`, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(`${userDataBase}/Equipments`, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(`${userDataBase}/Progress`, token, serverId)
          .catch(() => null),
      ]);
    } catch (err) {
      this.wrapShardError(serverId, err);
    }

    if (!userDoc && !profileDoc) {
      throw new NotFoundException(
        `Không tìm thấy dữ liệu người chơi "${uid}" trên cụm máy chủ ${serverId}.`,
      );
    }

    const userObj = userDoc ? this.firebase.docToObject(userDoc) : {};
    const { itemMap, heroMap } = catalogs;

    const account = {
      username:
        (typeof userObj.Username === 'string' && userObj.Username.trim()) ||
        (typeof userObj.username === 'string' && userObj.username.trim()) ||
        uid.slice(0, 12),
      email:
        (typeof userObj.Email === 'string' && userObj.Email.trim()) ||
        (typeof userObj.email === 'string' && userObj.email.trim()) ||
        '',
      playerCode:
        typeof userObj.PlayerCode === 'string' ||
        typeof userObj.PlayerCode === 'number'
          ? String(userObj.PlayerCode).trim()
          : '',
      provider:
        (typeof userObj.Provider === 'string' && userObj.Provider.trim()) ||
        'Email',
      role:
        (typeof userObj.Role === 'string' && userObj.Role.trim()) || 'Player',
      status:
        (typeof userObj.Status === 'string' && userObj.Status.trim()) ||
        'active',
      isBanned:
        userObj.IsBanned === true ||
        userObj.isBanned === true ||
        userObj.Status === 'banned',
      createdAt:
        typeof userObj.CreatedAt === 'string' ? userObj.CreatedAt : '',
      lastLogin:
        typeof userObj.LastLogin === 'string' ? userObj.LastLogin : '',
      lastServerId:
        typeof userObj.LastServerId === 'string' ? userObj.LastServerId : '',
    };

    const hasCharacterInServer = Boolean(profileDoc);
    const rawProfile = profileDoc ? this.firebase.docToObject(profileDoc) : {};
    const profile: PlayerProfileData = {
      InGameName:
        (typeof rawProfile.InGameName === 'string' &&
          rawProfile.InGameName.trim()) ||
        account.username,
      Level: clampInt(rawProfile.Level, 1, 999, 1),
      Exp: clampInt(rawProfile.Exp, 0, 1000000000, 0),
      AvatarId:
        (typeof rawProfile.AvatarId === 'string' &&
          rawProfile.AvatarId.trim()) ||
        'avatar_default',
      FrameId:
        (typeof rawProfile.FrameId === 'string' &&
          rawProfile.FrameId.trim()) ||
        'frame_default',
      RenameCount: clampInt(rawProfile.RenameCount, 0, 9999, 0),
      TotalCombatPower: clampInt(
        rawProfile.TotalCombatPower,
        0,
        100000000000,
        0,
      ),
    };

    const rawWallet = walletDoc ? this.firebase.docToObject(walletDoc) : {};
    const wallet: PlayerWalletData = {
      Gold: clampInt(rawWallet.Gold, 0, 100000000000, 0),
      Gems: clampInt(rawWallet.Gems, 0, 1000000000, 0),
      Energy: clampInt(rawWallet.Energy, 0, 1000000, 0),
      MaxEnergy: clampInt(rawWallet.MaxEnergy, 1, 1000000, 120),
      LastEnergyRecover: clampInt(
        rawWallet.LastEnergyRecover,
        0,
        9999999999999,
        0,
      ),
    };

    // Phân giải Equipments trước để ánh xạ sang Heroes
    const rawEquipments = equipmentsDoc
      ? this.firebase.docToObject(equipmentsDoc)
      : {};
    const rawHeroes = heroesDoc ? this.firebase.docToObject(heroesDoc) : {};

    // Tìm chủ sở hữu thực tế của từng equipUid từ Heroes.EquippedSlots (nguồn sự thật trong equipmentController.js)
    const ownerByEquipUid = new Map<string, { heroId: string; slot: number }>();
    for (const [heroKey, hVal] of Object.entries(rawHeroes)) {
      if (!hVal || typeof hVal !== 'object') continue;
      const hRec = hVal as Record<string, unknown>;
      const slotsObj =
        hRec.EquippedSlots && typeof hRec.EquippedSlots === 'object'
          ? (hRec.EquippedSlots as Record<string, unknown>)
          : {};
      for (const [slotKey, eqUidVal] of Object.entries(slotsObj)) {
        const eqUid = typeof eqUidVal === 'string' ? eqUidVal.trim() : '';
        const slotNum = clampInt(slotKey, 1, 6, 0);
        if (eqUid && slotNum >= 1 && slotNum <= 6) {
          ownerByEquipUid.set(eqUid, { heroId: heroKey, slot: slotNum });
        }
      }
    }

    const equipmentsMap = new Map<string, PlayerEquipmentDetailItem>();
    const equipmentsList: PlayerEquipmentDetailItem[] = [];

    for (const [eqKey, eqVal] of Object.entries(rawEquipments)) {
      if (!eqVal || typeof eqVal !== 'object') continue;
      const rec = eqVal as Record<string, unknown>;
      const equipUid =
        (typeof rec.EquipUid === 'string' && rec.EquipUid.trim()) || eqKey;
      const templateId =
        (typeof rec.TemplateId === 'string' && rec.TemplateId.trim()) ||
        equipUid;
      const tplMeta = itemMap.get(templateId);

      const slot = clampInt(rec.Slot, 1, 6, tplMeta?.slot || 1);
      const rarity = clampInt(rec.Rarity, 0, 4, tplMeta?.rarity ?? 0);
      const maxEnhanceLevel = EQUIP_MAX_ENHANCE_BY_RARITY[rarity] ?? 20;
      const enhanceLevel = clampInt(rec.EnhanceLevel, 0, 100, 0);

      const ownerInfo = ownerByEquipUid.get(equipUid);
      const equippedHeroId =
        ownerInfo?.heroId ||
        (typeof rec.EquippedHeroId === 'string' ? rec.EquippedHeroId.trim() : '');
      const equippedHeroMeta = equippedHeroId
        ? heroMap.get(equippedHeroId.toLowerCase())
        : undefined;
      const equippedHeroName = equippedHeroId
        ? equippedHeroMeta?.heroName || equippedHeroId
        : '';

      const mainStat = parseStatRoll(rec.MainStat);
      const rawSubStats = Array.isArray(rec.SubStats) ? rec.SubStats : [];
      const subStats = rawSubStats
        .map((s) => parseStatRoll(s))
        .filter((s): s is PlayerEquipmentStatRollDetail => Boolean(s));

      const detail: PlayerEquipmentDetailItem = {
        equipUid,
        templateId,
        itemName: tplMeta?.itemName || templateId,
        description:
          tplMeta?.description ||
          `${EQUIP_SLOT_LABELS[slot] || 'Trang bị'} — Thuộc tính động.`,
        iconUrl: tplMeta?.iconUrl || '',
        slot,
        slotLabel: EQUIP_SLOT_LABELS[slot] || `Ô #${slot}`,
        rarity,
        enhanceLevel,
        maxEnhanceLevel,
        equippedHeroId,
        equippedHeroName,
        isLocked: rec.IsLocked === true,
        setId: typeof rec.SetId === 'string' ? rec.SetId.trim() : '',
        createdAt: clampInt(rec.CreatedAt, 0, 9999999999999, 0),
        mainStat,
        subStats,
        combatScore: computeEquipStatScore(mainStat, subStats),
      };

      equipmentsMap.set(equipUid, detail);
      equipmentsList.push(detail);
    }

    equipmentsList.sort((a, b) => {
      const aEq = Boolean(a.equippedHeroId);
      const bEq = Boolean(b.equippedHeroId);
      if (aEq !== bEq) return aEq ? -1 : 1;
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      if (b.enhanceLevel !== a.enhanceLevel) {
        return b.enhanceLevel - a.enhanceLevel;
      }
      if (a.slot !== b.slot) return a.slot - b.slot;
      return a.itemName.localeCompare(b.itemName, 'vi');
    });

    // Phân giải Formation trước để đánh dấu tướng trong đội hình đang kích hoạt
    const rawFormation = formationDoc
      ? this.firebase.docToObject(formationDoc)
      : {};
    const activeTeamIndex = clampInt(
      rawFormation.ActiveTeamIndex ?? rawFormation.activeTeamIndex,
      1,
      3,
      1,
    );

    const parseRawTeamSlots = (
      key: string,
      altKey: string,
    ): Array<{ HeroId: string; SlotIndex: number }> => {
      const arr = Array.isArray(rawFormation[key])
        ? (rawFormation[key] as unknown[])
        : Array.isArray(rawFormation[altKey])
          ? (rawFormation[altKey] as unknown[])
          : [];
      const slots: Array<{ HeroId: string; SlotIndex: number }> = [];
      for (const entry of arr) {
        if (!entry || typeof entry !== 'object') continue;
        const rec = entry as Record<string, unknown>;
        const hid =
          (typeof rec.HeroId === 'string' && rec.HeroId.trim()) ||
          (typeof rec.heroId === 'string' && rec.heroId.trim()) ||
          '';
        const slotIndex = clampInt(rec.SlotIndex ?? rec.slotIndex, 0, 8, 0);
        if (hid) {
          slots.push({ HeroId: hid, SlotIndex: slotIndex });
        }
      }
      return slots;
    };

    const rawTeam1 = parseRawTeamSlots('Team1', 'team1');
    const rawTeam2 = parseRawTeamSlots('Team2', 'team2');
    const rawTeam3 = parseRawTeamSlots('Team3', 'team3');
    const activeRawTeam =
      activeTeamIndex === 2
        ? rawTeam2
        : activeTeamIndex === 3
          ? rawTeam3
          : rawTeam1;
    const activeHeroSlotMap = new Map<string, number>();
    for (const s of activeRawTeam) {
      activeHeroSlotMap.set(s.HeroId.toLowerCase(), s.SlotIndex);
    }

    // Phân giải Heroes
    const heroesList: PlayerHeroDetailItem[] = [];
    const parsedHeroById = new Map<string, PlayerHeroDetailItem>();

    for (const [heroKey, hVal] of Object.entries(rawHeroes)) {
      if (!hVal || typeof hVal !== 'object') continue;
      const rec = hVal as Record<string, unknown>;
      const heroId =
        (typeof rec.HeroId === 'string' && rec.HeroId.trim()) || heroKey;
      const catalog =
        heroMap.get(heroId.toLowerCase()) ||
        heroMap.get(heroKey.toLowerCase());

      const level = clampInt(rec.Level, 1, 100, 1);
      const star = clampInt(rec.Star, 1, 5, 1);
      const quality = clampInt(rec.Quality, 0, 5, 0);
      const qualityTier = QUALITY_TIERS[quality] || QUALITY_TIERS[0];
      const exp = clampInt(rec.Exp, 0, 100000000, 0);
      const skillLvs = Array.isArray(rec.SkillLvs)
        ? rec.SkillLvs.map((v) => clampInt(v, 1, 20, 1))
        : [1, 1, 1];

      const rawSlotsObj =
        rec.EquippedSlots && typeof rec.EquippedSlots === 'object'
          ? (rec.EquippedSlots as Record<string, unknown>)
          : {};
      const equippedSlotsMap: Record<string, string> = {};
      const equippedSlotsDetail: PlayerEquippedSlotDetail[] = [];

      for (let slotNum = 1; slotNum <= 6; slotNum++) {
        const eqUidRaw = rawSlotsObj[String(slotNum)];
        const eqUid = typeof eqUidRaw === 'string' ? eqUidRaw.trim() : '';
        if (!eqUid) continue;
        equippedSlotsMap[String(slotNum)] = eqUid;
        const eqDetail = equipmentsMap.get(eqUid);
        equippedSlotsDetail.push({
          slot: slotNum,
          slotLabel: EQUIP_SLOT_LABELS[slotNum] || `Ô #${slotNum}`,
          equipUid: eqUid,
          templateId: eqDetail?.templateId || eqUid,
          itemName: eqDetail?.itemName || eqUid,
          iconUrl: eqDetail?.iconUrl || '',
          rarity: eqDetail?.rarity ?? 0,
          enhanceLevel: eqDetail?.enhanceLevel ?? 0,
          mainStatText: eqDetail?.mainStat?.formattedValue || '',
        });
      }

      const combatPower = this.computeSingleHeroCombatPower(
        {
          level,
          star,
          quality,
          skillLvs,
          equippedSlots: equippedSlotsMap,
        },
        catalog,
        equipmentsMap,
      );

      const activeSlotIndex =
        activeHeroSlotMap.get(heroId.toLowerCase()) ??
        activeHeroSlotMap.get(heroKey.toLowerCase()) ??
        null;

      const heroItem: PlayerHeroDetailItem = {
        heroId,
        heroName: catalog?.heroName || heroId,
        title: catalog?.title || '',
        role: catalog?.role || 'Valkyria',
        rarity: catalog?.rarity ?? 5,
        rarityLabel: catalog?.rarityLabel || 'SSR',
        image: catalog?.image || '/images/default_hero.png',
        level,
        maxLevel: qualityTier.maxLevel,
        star,
        quality,
        qualityName: qualityTier.name,
        exp,
        maxExpForLevel: level * 1000,
        skillLvs,
        combatPower,
        inActiveTeam: activeSlotIndex !== null,
        activeSlotIndex,
        equippedSlots: equippedSlotsDetail,
      };

      heroesList.push(heroItem);
      parsedHeroById.set(heroId.toLowerCase(), heroItem);
      parsedHeroById.set(heroKey.toLowerCase(), heroItem);
    }

    heroesList.sort((a, b) => {
      if (a.inActiveTeam !== b.inActiveTeam) return a.inActiveTeam ? -1 : 1;
      if (b.combatPower !== a.combatPower) return b.combatPower - a.combatPower;
      if (b.level !== a.level) return b.level - a.level;
      return a.heroName.localeCompare(b.heroName, 'vi');
    });

    const buildTeamDetails = (
      rawSlots: Array<{ HeroId: string; SlotIndex: number }>,
    ): PlayerFormationSlotItem[] => {
      return rawSlots.map((s) => {
        const heroObj = parsedHeroById.get(s.HeroId.toLowerCase());
        const catalog = heroMap.get(s.HeroId.toLowerCase());
        return {
          HeroId: s.HeroId,
          HeroName: heroObj?.heroName || catalog?.heroName || s.HeroId,
          HeroImage:
            heroObj?.image ||
            catalog?.image ||
            '/images/default_hero.png',
          RarityLabel: heroObj?.rarityLabel || catalog?.rarityLabel || 'SSR',
          Level: heroObj?.level ?? 1,
          Star: heroObj?.star ?? 1,
          Quality: heroObj?.quality ?? 0,
          SlotIndex: s.SlotIndex,
          Row: Math.floor(s.SlotIndex / 3),
          Column: s.SlotIndex % 3,
        };
      });
    };

    const formation: PlayerFormationData = {
      ActiveTeamIndex: activeTeamIndex,
      Team1: buildTeamDetails(rawTeam1),
      Team2: buildTeamDetails(rawTeam2),
      Team3: buildTeamDetails(rawTeam3),
    };

    // Phân giải Inventory (vật phẩm xếp chồng)
    const rawInventory = inventoryDoc
      ? this.firebase.docToObject(inventoryDoc)
      : {};
    const inventoryList: PlayerInventoryItemDetail[] = [];

    for (const [itemId, rawQty] of Object.entries(rawInventory)) {
      const quantity = clampInt(rawQty, 0, 999999999, 0);
      if (quantity <= 0) continue;
      const meta = itemMap.get(itemId);
      inventoryList.push({
        itemId,
        itemName: meta?.itemName || itemId,
        description: meta?.description || '',
        iconUrl: meta?.iconUrl || '',
        type: meta?.type ?? 1,
        rarity: meta?.rarity ?? 0,
        quantity,
        maxStack: meta?.maxStack ?? 9999,
        dropLocationHint: meta?.dropLocationHint || '',
      });
    }

    // Sắp xếp giống InventoryService.cs trong Unity: Phẩm chất giảm dần -> Loại tăng dần -> Tên A-Z
    inventoryList.sort((a, b) => {
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      if (a.type !== b.type) return a.type - b.type;
      return a.itemName.localeCompare(b.itemName, 'vi');
    });

    // Phân giải Progress (Tiến trình vượt ải)
    const rawProgress = progressDoc
      ? this.firebase.docToObject(progressDoc)
      : {};
    const maxStage =
      (typeof rawProgress.MaxStage === 'string' &&
        rawProgress.MaxStage.trim()) ||
      (typeof rawProgress.maxStage === 'string' &&
        rawProgress.maxStage.trim()) ||
      '1-1';

    const rawStarsWon =
      rawProgress.StarsWon && typeof rawProgress.StarsWon === 'object'
        ? (rawProgress.StarsWon as Record<string, unknown>)
        : rawProgress.starsWon && typeof rawProgress.starsWon === 'object'
          ? (rawProgress.starsWon as Record<string, unknown>)
          : {};

    const stages: PlayerStageStarItem[] = [];
    let totalStars = 0;

    for (const [stageKey, starVal] of Object.entries(rawStarsWon)) {
      const stars = clampInt(starVal, 0, 3, 0);
      const cleanStage = stageKey.trim();
      const parts = cleanStage.split('-');
      const chapter = clampInt(parts[0], 1, 999, 1);
      const stageNumber = clampInt(parts[1], 1, 999, 1);
      if (stars > 0) {
        totalStars += stars;
      }
      stages.push({
        stageId: cleanStage,
        chapter,
        stageNumber,
        stars,
      });
    }

    stages.sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.stageNumber - b.stageNumber;
    });

    const claimedChests: string[] = [];
    const rawChests = rawProgress.ClaimedChests ?? rawProgress.claimedChests;
    if (Array.isArray(rawChests)) {
      for (const c of rawChests) {
        if (typeof c === 'string' && c.trim()) {
          claimedChests.push(c.trim());
        }
      }
    } else if (rawChests && typeof rawChests === 'object') {
      for (const [k, v] of Object.entries(
        rawChests as Record<string, unknown>,
      )) {
        if (v === true && k.trim()) {
          claimedChests.push(k.trim());
        }
      }
    }
    claimedChests.sort();

    const progress: PlayerProgressData = {
      MaxStage: maxStage,
      ClearedStagesCount: stages.filter((s) => s.stars > 0).length,
      TotalStars: totalStars,
      MaxPossibleStars: stages.length * 3,
      Stages: stages,
      ClaimedChests: claimedChests,
    };

    return {
      serverId,
      serverName: srv.Name,
      uid,
      account,
      hasCharacterInServer,
      profile,
      wallet,
      heroes: heroesList,
      formation,
      inventory: inventoryList,
      equipments: equipmentsList,
      progress,
    };
  }

  // ==================== 3. XÓA / THU HỒI VẬT PHẨM TRONG TÚI ĐỒ (INVENTORY) ====================

  async revokeInventoryItem(
    operator: AuthenticatedOperator,
    rawServerId: string,
    rawUid: string,
    rawBody: Record<string, unknown>,
  ): Promise<{
    revokedItemId: string;
    revokedItemName: string;
    previousQuantity: number;
    revokedQuantity: number;
    remainingQuantity: number;
    playerDetail: PlayerFullServerDetailResponse;
  }> {
    if (!this.hasSubPermission(operator, 'support.player.revoke_item')) {
      throw new ForbiddenException(
        'Tài khoản của bạn không có quyền "Xóa & Thu Hồi Vật Phẩm / Trang Bị Trong Túi Đồ".',
      );
    }

    const srv = await this.assertRegisteredServer(
      rawServerId,
      operator.authTokenForFirestore,
    );
    const serverId = srv.ServerId;
    const uid = this.assertValidUid(rawUid);

    const itemId =
      typeof rawBody.itemId === 'string' ? rawBody.itemId.trim() : '';
    if (!itemId || !VALID_KEY_REGEX.test(itemId)) {
      throw new BadRequestException('Mã vật phẩm cần thu hồi không hợp lệ.');
    }

    const reason =
      typeof rawBody.reason === 'string'
        ? rawBody.reason.trim().slice(0, 500)
        : '';
    if (reason.length < 3) {
      throw new BadRequestException(
        'Vui lòng nhập lý do thu hồi / xóa vật phẩm (tối thiểu 3 ký tự) để lưu hồ sơ đối soát.',
      );
    }

    const revokeAll = rawBody.revokeAll === true;
    const requestedAmount = clampInt(rawBody.amount, 1, 999999999, 0);
    if (!revokeAll && requestedAmount <= 0) {
      throw new BadRequestException(
        'Số lượng vật phẩm cần thu hồi phải lớn hơn 0.',
      );
    }

    const token = operator.authTokenForFirestore;
    const invPath = `${USERS_COLLECTION}/${uid}/UserData/Inventory`;
    const profilePath = `${USERS_COLLECTION}/${uid}/UserData/Profile`;

    let invDoc = null;
    let profileDoc = null;
    let userDoc = null;
    let catalogs: Awaited<ReturnType<typeof this.loadCatalogMaps>>;

    try {
      [invDoc, profileDoc, userDoc, catalogs] = await Promise.all([
        this.firebase.getDocument(invPath, token, serverId),
        this.firebase
          .getDocument(profilePath, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(`${USERS_COLLECTION}/${uid}`, token)
          .catch(() => null),
        this.loadCatalogMaps(token),
      ]);
    } catch (err) {
      this.wrapShardError(serverId, err);
    }

    if (!invDoc) {
      throw new NotFoundException(
        'Người chơi hiện chưa có túi đồ vật phẩm trên cụm máy chủ này.',
      );
    }

    const invObj = this.firebase.docToObject(invDoc);
    const currentQuantity = clampInt(invObj[itemId], 0, 999999999, 0);
    if (currentQuantity <= 0) {
      throw new BadRequestException(
        `Người chơi hiện không còn sở hữu vật phẩm "${itemId}" trong túi đồ.`,
      );
    }

    const revokedQuantity = revokeAll
      ? currentQuantity
      : Math.min(currentQuantity, requestedAmount);
    const remainingQuantity = Math.max(0, currentQuantity - revokedQuantity);

    const updatedInventory: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(invObj)) {
      if (k === itemId) {
        if (remainingQuantity > 0) {
          updatedInventory[k] = remainingQuantity;
        }
      } else {
        const qty = clampInt(v, 0, 999999999, 0);
        if (qty > 0) {
          updatedInventory[k] = qty;
        }
      }
    }

    try {
      await this.firebase.commitWrites(
        [
          {
            update: {
              name: this.firebase.fullDocumentName(invPath, serverId),
              fields: this.firebase.objectToFields(updatedInventory),
            },
          },
        ],
        token,
        serverId,
      );
    } catch (err) {
      this.wrapShardError(serverId, err);
    }

    const itemMeta = catalogs.itemMap.get(itemId);
    const itemName = itemMeta?.itemName || itemId;
    const rarity = itemMeta?.rarity ?? 0;

    const profileObj = profileDoc ? this.firebase.docToObject(profileDoc) : {};
    const userObj = userDoc ? this.firebase.docToObject(userDoc) : {};
    const targetInGameName =
      (typeof profileObj.InGameName === 'string' &&
        profileObj.InGameName.trim()) ||
      (typeof userObj.Username === 'string' && userObj.Username.trim()) ||
      uid.slice(0, 12);
    const targetUsername =
      (typeof userObj.Username === 'string' && userObj.Username.trim()) ||
      targetInGameName;
    const targetPlayerCode =
      typeof userObj.PlayerCode === 'string' ||
      typeof userObj.PlayerCode === 'number'
        ? String(userObj.PlayerCode).trim()
        : '';

    const isClear = remainingQuantity === 0;
    await this.logPlayerDataActivity(operator, {
      action: isClear ? 'CLEAR_INVENTORY_ITEM' : 'REVOKE_INVENTORY_ITEM',
      actionTitle: isClear
        ? 'Xóa toàn bộ vật phẩm khỏi túi đồ người chơi'
        : 'Thu hồi một phần số lượng vật phẩm túi đồ',
      serverId,
      targetUid: uid,
      targetInGameName,
      targetUsername,
      targetPlayerCode,
      itemId,
      itemName,
      rarity,
      previousQuantity: currentQuantity,
      revokedQuantity,
      remainingQuantity,
      reason,
      details: `${isClear ? 'Xóa toàn bộ' : 'Thu hồi'} ${revokedQuantity.toLocaleString('vi-VN')}x "${itemName}" (${itemId}) khỏi túi đồ nhân vật "${targetInGameName}" tại máy chủ ${serverId} (Trước: ${currentQuantity.toLocaleString('vi-VN')} → Còn lại: ${remainingQuantity.toLocaleString('vi-VN')}). Lý do: ${reason}`,
    });

    const playerDetail = await this.getPlayerFullDetail(
      operator,
      serverId,
      uid,
    );

    return {
      revokedItemId: itemId,
      revokedItemName: itemName,
      previousQuantity: currentQuantity,
      revokedQuantity,
      remainingQuantity,
      playerDetail,
    };
  }

  // ==================== 4. XÓA / THU HỒI TRANG BỊ THỰC THỂ (EQUIPMENTS) ====================

  async revokeEquipment(
    operator: AuthenticatedOperator,
    rawServerId: string,
    rawUid: string,
    rawBody: Record<string, unknown>,
  ): Promise<{
    revokedEquipUid: string;
    revokedItemName: string;
    unequippedHeroId: string;
    playerDetail: PlayerFullServerDetailResponse;
  }> {
    if (!this.hasSubPermission(operator, 'support.player.revoke_item')) {
      throw new ForbiddenException(
        'Tài khoản của bạn không có quyền "Xóa & Thu Hồi Vật Phẩm / Trang Bị Trong Túi Đồ".',
      );
    }

    const srv = await this.assertRegisteredServer(
      rawServerId,
      operator.authTokenForFirestore,
    );
    const serverId = srv.ServerId;
    const uid = this.assertValidUid(rawUid);

    const equipUid =
      typeof rawBody.equipUid === 'string' ? rawBody.equipUid.trim() : '';
    if (!equipUid || !VALID_KEY_REGEX.test(equipUid)) {
      throw new BadRequestException('Mã thực thể trang bị cần thu hồi không hợp lệ.');
    }

    const reason =
      typeof rawBody.reason === 'string'
        ? rawBody.reason.trim().slice(0, 500)
        : '';
    if (reason.length < 3) {
      throw new BadRequestException(
        'Vui lòng nhập lý do thu hồi / xóa trang bị (tối thiểu 3 ký tự) để lưu hồ sơ đối soát.',
      );
    }

    const token = operator.authTokenForFirestore;
    const equipPath = `${USERS_COLLECTION}/${uid}/UserData/Equipments`;
    const heroesPath = `${USERS_COLLECTION}/${uid}/UserData/Heroes`;
    const profilePath = `${USERS_COLLECTION}/${uid}/UserData/Profile`;

    let equipDoc = null;
    let heroesDoc = null;
    let profileDoc = null;
    let userDoc = null;
    let catalogs: Awaited<ReturnType<typeof this.loadCatalogMaps>>;

    try {
      [equipDoc, heroesDoc, profileDoc, userDoc, catalogs] = await Promise.all([
        this.firebase.getDocument(equipPath, token, serverId),
        this.firebase
          .getDocument(heroesPath, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(profilePath, token, serverId)
          .catch(() => null),
        this.firebase
          .getDocument(`${USERS_COLLECTION}/${uid}`, token)
          .catch(() => null),
        this.loadCatalogMaps(token),
      ]);
    } catch (err) {
      this.wrapShardError(serverId, err);
    }

    if (!equipDoc) {
      throw new NotFoundException(
        'Người chơi hiện chưa có kho trang bị trên cụm máy chủ này.',
      );
    }

    const equipObj = this.firebase.docToObject(equipDoc);
    const targetEqRaw = equipObj[equipUid];
    if (!targetEqRaw || typeof targetEqRaw !== 'object') {
      throw new BadRequestException(
        `Không tìm thấy trang bị "${equipUid}" trong kho trang bị của người chơi.`,
      );
    }

    const targetEqRec = targetEqRaw as Record<string, unknown>;
    const templateId =
      (typeof targetEqRec.TemplateId === 'string' &&
        targetEqRec.TemplateId.trim()) ||
      equipUid;
    const rarity = clampInt(targetEqRec.Rarity, 0, 4, 0);
    const enhanceLevel = clampInt(targetEqRec.EnhanceLevel, 0, 100, 0);
    const tplMeta = catalogs.itemMap.get(templateId);
    const itemName = `${tplMeta?.itemName || templateId}${enhanceLevel > 0 ? ` (+${enhanceLevel})` : ''}`;

    // Xóa thực thể trang bị khỏi UserData/Equipments
    const updatedEquipments: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(equipObj)) {
      if (k !== equipUid && v && typeof v === 'object') {
        updatedEquipments[k] = v;
      }
    }

    const writes: FirestoreBatchWrite[] = [
      {
        update: {
          name: this.firebase.fullDocumentName(equipPath, serverId),
          fields: this.firebase.objectToFields(updatedEquipments),
        },
      },
    ];

    // Kiểm tra và tự động tháo khỏi Tướng nếu trang bị đang được mặc trên người Tướng
    let unequippedHeroId = '';
    if (heroesDoc) {
      const heroesObj = this.firebase.docToObject(heroesDoc);
      let heroesModified = false;

      for (const [heroKey, hVal] of Object.entries(heroesObj)) {
        if (!hVal || typeof hVal !== 'object') continue;
        const hRec = { ...(hVal as Record<string, unknown>) };
        if (hRec.EquippedSlots && typeof hRec.EquippedSlots === 'object') {
          const slotsCopy: Record<string, unknown> = {
            ...(hRec.EquippedSlots as Record<string, unknown>),
          };
          for (const [slotKey, eqVal] of Object.entries(slotsCopy)) {
            if (eqVal === equipUid) {
              delete slotsCopy[slotKey];
              unequippedHeroId = heroKey;
              heroesModified = true;
            }
          }
          hRec.EquippedSlots = slotsCopy;
        }
        if (Array.isArray(hRec.EquippedItemIds)) {
          const filteredIds = hRec.EquippedItemIds.filter(
            (id) => id !== equipUid && id !== templateId,
          );
          if (filteredIds.length !== hRec.EquippedItemIds.length) {
            hRec.EquippedItemIds = filteredIds;
            heroesModified = true;
          }
        }
        heroesObj[heroKey] = hRec;
      }

      if (heroesModified) {
        writes.push({
          update: {
            name: this.firebase.fullDocumentName(heroesPath, serverId),
            fields: this.firebase.objectToFields(heroesObj),
          },
        });
      }
    }

    try {
      await this.firebase.commitWrites(writes, token, serverId);
    } catch (err) {
      this.wrapShardError(serverId, err);
    }

    // Lấy lại hồ sơ chi tiết mới nhất; nếu trang bị vừa tháo nằm trên tướng đang trong đội hình xuất trận thì đồng bộ lại TotalCombatPower trên Profile
    let playerDetail = await this.getPlayerFullDetail(
      operator,
      serverId,
      uid,
    );

    if (unequippedHeroId && profileDoc) {
      const activeTeamCombatPower = playerDetail.heroes
        .filter((h) => h.inActiveTeam)
        .reduce((sum, h) => sum + h.combatPower, 0);
      if (
        activeTeamCombatPower > 0 &&
        activeTeamCombatPower !== playerDetail.profile.TotalCombatPower
      ) {
        const rawProfileObj = this.firebase.docToObject(profileDoc);
        rawProfileObj.TotalCombatPower = activeTeamCombatPower;
        await this.firebase
          .commitWrites(
            [
              {
                update: {
                  name: this.firebase.fullDocumentName(profilePath, serverId),
                  fields: this.firebase.objectToFields(rawProfileObj),
                },
              },
            ],
            token,
            serverId,
          )
          .catch(() => undefined);
        playerDetail = {
          ...playerDetail,
          profile: {
            ...playerDetail.profile,
            TotalCombatPower: activeTeamCombatPower,
          },
        };
      }
    }

    const userObj = userDoc ? this.firebase.docToObject(userDoc) : {};
    const targetInGameName = playerDetail.profile.InGameName;
    const targetUsername =
      (typeof userObj.Username === 'string' && userObj.Username.trim()) ||
      targetInGameName;
    const targetPlayerCode =
      typeof userObj.PlayerCode === 'string' ||
      typeof userObj.PlayerCode === 'number'
        ? String(userObj.PlayerCode).trim()
        : '';

    await this.logPlayerDataActivity(operator, {
      action: 'REVOKE_EQUIPMENT',
      actionTitle: 'Thu hồi & xóa trang bị của người chơi',
      serverId,
      targetUid: uid,
      targetInGameName,
      targetUsername,
      targetPlayerCode,
      itemId: templateId,
      itemName,
      rarity,
      previousQuantity: 1,
      revokedQuantity: 1,
      remainingQuantity: 0,
      reason,
      details: `Thu hồi trang bị "${itemName}" (Mã thực thể: ${equipUid}${unequippedHeroId ? `, đã tự động tháo khỏi tướng ${unequippedHeroId}` : ''}) của nhân vật "${targetInGameName}" tại máy chủ ${serverId}. Lý do: ${reason}`,
    });

    return {
      revokedEquipUid: equipUid,
      revokedItemName: itemName,
      unequippedHeroId,
      playerDetail,
    };
  }

  // ==================== 5. NHẬT KÝ KIỂM TOÁN (ADMIN ONLY) ====================

  private async logPlayerDataActivity(
    operator: AuthenticatedOperator,
    payload: Omit<
      PlayerDataActivityLog,
      'id' | 'performedBy' | 'performedByRole' | 'timestamp' | 'createdAt'
    >,
  ): Promise<void> {
    const now = Date.now();
    const record: Record<string, unknown> = {
      ...payload,
      performedBy: formatOperatorLabel(operator),
      performedByRole: operator.role,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
    };

    try {
      await this.firebase.createDocument(
        PLAYER_DATA_LOGS_COLLECTION_PATH,
        null,
        record,
        operator.authTokenForFirestore,
      );
    } catch (err) {
      this.logger.warn(
        `Không thể ghi nhật ký Dữ liệu người chơi (${payload.action}): ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  async getPlayerDataLogs(
    operator: AuthenticatedOperator,
    limitCount = 100,
  ): Promise<PlayerDataActivityLog[]> {
    const safeLimit = Math.min(Math.max(1, Math.trunc(limitCount) || 100), 200);
    let docs = [];
    try {
      docs = await this.firebase.runQuery(
        PLAYER_DATA_LOGS_PARENT_PATH,
        {
          from: [{ collectionId: 'Activities' }],
          orderBy: [
            { field: { fieldPath: 'timestamp' }, direction: 'DESCENDING' },
          ],
          limit: safeLimit,
        },
        operator.authTokenForFirestore,
      );
    } catch {
      docs = await this.firebase
        .listDocuments(
          PLAYER_DATA_LOGS_COLLECTION_PATH,
          operator.authTokenForFirestore,
          safeLimit,
        )
        .catch(() => []);
    }

    const list: PlayerDataActivityLog[] = docs.map((doc) => {
      const id = this.firebase.extractDocId(doc.name);
      const data = this.firebase.docToObject(doc);
      const ts = Number(data.timestamp) || 0;
      return {
        id,
        action: (typeof data.action === 'string'
          ? data.action
          : 'REVOKE_INVENTORY_ITEM') as PlayerDataLogAction,
        actionTitle:
          typeof data.actionTitle === 'string'
            ? data.actionTitle
            : 'Thu hồi vật phẩm người chơi',
        serverId: typeof data.serverId === 'string' ? data.serverId : '',
        targetUid: typeof data.targetUid === 'string' ? data.targetUid : '',
        targetInGameName:
          typeof data.targetInGameName === 'string'
            ? data.targetInGameName
            : '',
        targetUsername:
          typeof data.targetUsername === 'string' ? data.targetUsername : '',
        targetPlayerCode:
          typeof data.targetPlayerCode === 'string'
            ? data.targetPlayerCode
            : '',
        itemId: typeof data.itemId === 'string' ? data.itemId : '',
        itemName: typeof data.itemName === 'string' ? data.itemName : '',
        rarity: clampInt(data.rarity, 0, 4, 0),
        previousQuantity: clampInt(data.previousQuantity, 0, 999999999, 0),
        revokedQuantity: clampInt(data.revokedQuantity, 0, 999999999, 0),
        remainingQuantity: clampInt(data.remainingQuantity, 0, 999999999, 0),
        reason: typeof data.reason === 'string' ? data.reason : '',
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

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, safeLimit);
  }
}
