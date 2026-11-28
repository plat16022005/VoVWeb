import { BadRequestException } from '@nestjs/common';
import {
  CustomEquipmentStatRoll,
  CustomForgedEquipmentSpec,
} from './mail.types.js';

export const EQUIP_SLOT_LABELS: Record<number, string> = {
  1: 'Vũ Khí',
  2: 'Mũ / Nón',
  3: 'Áo Giáp',
  4: 'Giày',
  5: 'Phụ Kiện',
  6: 'Găng Tay',
};

export interface EquipStatMetaInfo {
  statType: number;
  key: string;
  label: string;
  isInt: boolean;
  isPct: boolean;
  mainBase: number;
}

export const EQUIP_STAT_META: Record<number, EquipStatMetaInfo> = {
  1: {
    statType: 1,
    key: 'hp',
    label: 'HP',
    isInt: true,
    isPct: false,
    mainBase: 500,
  },
  2: {
    statType: 2,
    key: 'atk',
    label: 'ATK',
    isInt: true,
    isPct: false,
    mainBase: 60,
  },
  3: {
    statType: 3,
    key: 'def',
    label: 'DEF',
    isInt: true,
    isPct: false,
    mainBase: 35,
  },
  4: {
    statType: 4,
    key: 'speed',
    label: 'Speed',
    isInt: false,
    isPct: false,
    mainBase: 3.0,
  },
  5: {
    statType: 5,
    key: 'critRate',
    label: 'Crit Rate',
    isInt: false,
    isPct: true,
    mainBase: 2.2,
  },
  6: {
    statType: 6,
    key: 'critDamage',
    label: 'Crit Damage',
    isInt: false,
    isPct: true,
    mainBase: 6.0,
  },
  7: {
    statType: 7,
    key: 'dodgeRate',
    label: 'Né tránh',
    isInt: false,
    isPct: true,
    mainBase: 0.68,
  },
  8: {
    statType: 8,
    key: 'parryRate',
    label: 'Đỡ đòn',
    isInt: false,
    isPct: true,
    mainBase: 0.68,
  },
  9: {
    statType: 9,
    key: 'hpPct',
    label: 'HP%',
    isInt: false,
    isPct: true,
    mainBase: 3.0,
  },
  10: {
    statType: 10,
    key: 'atkPct',
    label: 'ATK%',
    isInt: false,
    isPct: true,
    mainBase: 3.0,
  },
  11: {
    statType: 11,
    key: 'defPct',
    label: 'DEF%',
    isInt: false,
    isPct: true,
    mainBase: 3.5,
  },
};

export const SLOT_MAIN_STAT_POOLS: Record<number, number[]> = {
  1: [2, 10, 5], // Vũ Khí: ATK, ATK%, Crit Rate
  2: [1, 9, 3, 11], // Mũ / Nón: HP, HP%, DEF, DEF%
  3: [3, 11, 1, 9], // Áo Giáp: DEF, DEF%, HP, HP%
  4: [4, 1, 9, 7], // Giày: Speed, HP, HP%, Né tránh
  5: [5, 6, 2, 10], // Phụ Kiện: Crit Rate, Crit Damage, ATK, ATK%
  6: [2, 10, 6, 8], // Găng Tay: ATK, ATK%, Crit Damage, Đỡ đòn
};

export const ALL_SUB_STAT_TYPES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export interface EquipRarityTierInfo {
  rarity: number;
  name: string;
  maxEnhance: number;
  subStatCount: number;
  mainGrowth: number;
  rarityBaseMult: number;
}

export const EQUIP_RARITY_TIERS: Record<number, EquipRarityTierInfo> = {
  0: {
    rarity: 0,
    name: 'Phổ Thông',
    maxEnhance: 20,
    subStatCount: 1,
    mainGrowth: 0.04,
    rarityBaseMult: 1.0,
  },
  1: {
    rarity: 1,
    name: 'Hiếm',
    maxEnhance: 40,
    subStatCount: 2,
    mainGrowth: 0.045,
    rarityBaseMult: 1.25,
  },
  2: {
    rarity: 2,
    name: 'Sử Thi',
    maxEnhance: 60,
    subStatCount: 3,
    mainGrowth: 0.05,
    rarityBaseMult: 1.55,
  },
  3: {
    rarity: 3,
    name: 'Huyền Thoại',
    maxEnhance: 80,
    subStatCount: 4,
    mainGrowth: 0.055,
    rarityBaseMult: 1.92,
  },
  4: {
    rarity: 4,
    name: 'Thần Thoại',
    maxEnhance: 100,
    subStatCount: 5,
    mainGrowth: 0.06,
    rarityBaseMult: 2.38,
  },
};

export const SUB_STAT_RANGES: Record<number, Record<number, [number, number]>> =
  {
    1: {
      0: [90, 130],
      1: [140, 190],
      2: [210, 280],
      3: [300, 380],
      4: [410, 510],
    },
    2: {
      0: [9, 14],
      1: [16, 23],
      2: [26, 36],
      3: [39, 52],
      4: [56, 72],
    },
    3: {
      0: [5, 8],
      1: [10, 15],
      2: [17, 24],
      3: [27, 36],
      4: [40, 52],
    },
    4: {
      0: [0.5, 0.7],
      1: [0.8, 1.1],
      2: [1.2, 1.6],
      3: [1.7, 2.2],
      4: [2.4, 3.0],
    },
    5: {
      0: [0.5, 0.7],
      1: [0.8, 1.0],
      2: [1.1, 1.4],
      3: [1.5, 1.9],
      4: [2.1, 2.5],
    },
    6: {
      0: [1.0, 1.4],
      1: [1.6, 2.2],
      2: [2.4, 3.2],
      3: [3.4, 4.4],
      4: [4.8, 6.0],
    },
    7: {
      0: [0.16, 0.23],
      1: [0.26, 0.34],
      2: [0.38, 0.49],
      3: [0.53, 0.68],
      4: [0.75, 0.9],
    },
    8: {
      0: [0.16, 0.23],
      1: [0.26, 0.34],
      2: [0.38, 0.49],
      3: [0.53, 0.68],
      4: [0.75, 0.9],
    },
    9: {
      0: [0.7, 1.1],
      1: [1.2, 1.7],
      2: [1.8, 2.5],
      3: [2.7, 3.6],
      4: [3.9, 5.0],
    },
    10: {
      0: [0.7, 1.1],
      1: [1.2, 1.7],
      2: [1.8, 2.5],
      3: [2.7, 3.6],
      4: [3.9, 5.0],
    },
    11: {
      0: [0.8, 1.3],
      1: [1.4, 2.0],
      2: [2.1, 2.9],
      3: [3.1, 4.1],
      4: [4.4, 5.6],
    },
  };

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function formatEquipRollValue(statType: number, val: number): number {
  const meta = EQUIP_STAT_META[statType];
  if (!meta) return 0;
  return meta.isInt ? Math.round(val) : round2(val);
}

export function getMainStatBaseRange(
  statType: number,
  rarity: number,
): { min: number; max: number; mid: number } {
  const meta = EQUIP_STAT_META[statType];
  const tier = EQUIP_RARITY_TIERS[rarity] || EQUIP_RARITY_TIERS[0];
  if (!meta) return { min: 0, max: 0, mid: 0 };
  const rawMid = meta.mainBase * tier.rarityBaseMult;
  return {
    min: formatEquipRollValue(statType, rawMid * 0.92),
    max: formatEquipRollValue(statType, rawMid * 1.08),
    mid: formatEquipRollValue(statType, rawMid),
  };
}

export function computeMainStatValueAtLevel(
  statType: number,
  baseValue: number,
  rarity: number,
  enhanceLevel: number,
): number {
  const tier = EQUIP_RARITY_TIERS[rarity] || EQUIP_RARITY_TIERS[0];
  const lv = Math.max(0, Math.min(tier.maxEnhance, Math.trunc(enhanceLevel)));
  const mult = 1 + lv * tier.mainGrowth;
  return formatEquipRollValue(statType, baseValue * mult);
}

export function getSubStatBaseRange(
  statType: number,
  rarity: number,
): { min: number; max: number; mid: number } {
  const range = SUB_STAT_RANGES[statType]?.[rarity];
  if (!range) return { min: 0, max: 0, mid: 0 };
  const [min, max] = range;
  return {
    min,
    max,
    mid: formatEquipRollValue(statType, (min + max) / 2),
  };
}

/**
 * Kiểm tra & chuẩn hóa thông số Trang bị động đền bù gửi qua thư.
 * Đảm bảo chỉ số chính, chỉ số phụ, phẩm chất và cấp cường hóa nằm đúng trong ngưỡng cân bằng 1:1 của Unity Game.
 */
export function validateAndNormalizeCustomEquipment(
  raw: unknown,
  itemId: string,
  expectedSlot?: number,
): CustomForgedEquipmentSpec {
  if (!raw || typeof raw !== 'object') {
    throw new BadRequestException(
      `Dữ liệu cấu hình chỉ số trang bị cho "${itemId}" không hợp lệ.`,
    );
  }
  const obj = raw as Record<string, unknown>;

  const slot = Math.trunc(Number(obj.Slot ?? expectedSlot ?? 0));
  if (!Number.isInteger(slot) || slot < 1 || slot > 6) {
    throw new BadRequestException(
      `Vị trí ô trang bị (Slot) của "${itemId}" phải nằm trong khoảng 1..6 (Vũ Khí, Mũ, Áo Giáp, Giày, Phụ Kiện, Găng Tay).`,
    );
  }
  if (
    expectedSlot !== undefined &&
    expectedSlot >= 1 &&
    expectedSlot <= 6 &&
    slot !== expectedSlot
  ) {
    throw new BadRequestException(
      `Vị trí ô trang bị (${EQUIP_SLOT_LABELS[slot]}) không khớp với mẫu trang bị "${itemId}" (${EQUIP_SLOT_LABELS[expectedSlot]}).`,
    );
  }

  const rarity = Math.trunc(Number(obj.Rarity ?? 0));
  if (!Number.isInteger(rarity) || rarity < 0 || rarity > 4) {
    throw new BadRequestException(
      `Phẩm chất trang bị (Rarity) của "${itemId}" phải từ 0 (Phổ Thông) đến 4 (Thần Thoại).`,
    );
  }
  const tier = EQUIP_RARITY_TIERS[rarity];

  const enhanceLevel = Math.trunc(Number(obj.EnhanceLevel ?? 0));
  if (
    !Number.isInteger(enhanceLevel) ||
    enhanceLevel < 0 ||
    enhanceLevel > tier.maxEnhance
  ) {
    throw new BadRequestException(
      `Cấp cường hóa của trang bị phẩm chất ${tier.name} chỉ được phép từ +0 đến +${tier.maxEnhance} (nhận được: +${enhanceLevel}).`,
    );
  }

  // Kiểm tra MainStat
  if (!obj.MainStat || typeof obj.MainStat !== 'object') {
    throw new BadRequestException(
      `Trang bị "${itemId}" thiếu thông số chỉ số chính (MainStat).`,
    );
  }
  const rawMain = obj.MainStat as Record<string, unknown>;
  const mainStatType = Math.trunc(Number(rawMain.StatType ?? 0));
  const allowedMainPool = SLOT_MAIN_STAT_POOLS[slot] || [];
  if (!allowedMainPool.includes(mainStatType)) {
    const allowedLabels = allowedMainPool
      .map((st) => EQUIP_STAT_META[st]?.label || String(st))
      .join(', ');
    throw new BadRequestException(
      `Ô ${EQUIP_SLOT_LABELS[slot]} chỉ cho phép chỉ số chính thuộc [${allowedLabels}].`,
    );
  }

  const mainMeta = EQUIP_STAT_META[mainStatType];
  const mainRange = getMainStatBaseRange(mainStatType, rarity);
  const rawMainBase = Number(rawMain.BaseValue);
  if (!Number.isFinite(rawMainBase)) {
    throw new BadRequestException(
      `Giá trị gốc chỉ số chính (${mainMeta.label}) không hợp lệ.`,
    );
  }
  const mainBaseValue = formatEquipRollValue(mainStatType, rawMainBase);
  const eps = mainMeta.isInt ? 1 : 0.05;
  if (
    mainBaseValue < mainRange.min - eps ||
    mainBaseValue > mainRange.max + eps
  ) {
    throw new BadRequestException(
      `Giá trị gốc (+0) của chỉ số chính ${mainMeta.label} ở phẩm chất ${tier.name} phải nằm trong ngưỡng cân bằng [${mainRange.min} – ${mainRange.max}] (nhận được: ${mainBaseValue}).`,
    );
  }
  const clampedMainBase = Math.max(
    mainRange.min,
    Math.min(mainRange.max, mainBaseValue),
  );
  const computedMainValue = computeMainStatValueAtLevel(
    mainStatType,
    clampedMainBase,
    rarity,
    enhanceLevel,
  );

  const normalizedMainStat: CustomEquipmentStatRoll = {
    StatType: mainStatType,
    BaseValue: clampedMainBase,
    Value: computedMainValue,
    UpgradeCount: 0,
  };

  // Kiểm tra SubStats
  const rawSubs = Array.isArray(obj.SubStats) ? obj.SubStats : [];
  if (rawSubs.length !== tier.subStatCount) {
    throw new BadRequestException(
      `Trang bị phẩm chất ${tier.name} bắt buộc phải có đúng ${tier.subStatCount} dòng chỉ số phụ (nhận được: ${rawSubs.length} dòng).`,
    );
  }

  const maxTotalUpgrades = Math.floor(enhanceLevel / 10);
  let totalUpgradeCount = 0;
  const seenSubTypes = new Set<number>();
  const normalizedSubStats: CustomEquipmentStatRoll[] = [];

  for (let i = 0; i < rawSubs.length; i++) {
    const subItem = rawSubs[i];
    if (!subItem || typeof subItem !== 'object') {
      throw new BadRequestException(
        `Dòng chỉ số phụ thứ #${i + 1} không hợp lệ.`,
      );
    }
    const subRec = subItem as Record<string, unknown>;
    const subType = Math.trunc(Number(subRec.StatType ?? 0));
    const subMeta = EQUIP_STAT_META[subType];
    if (!subMeta || !ALL_SUB_STAT_TYPES.includes(subType)) {
      throw new BadRequestException(
        `Loại chỉ số phụ ở dòng #${i + 1} không tồn tại trong hệ thống.`,
      );
    }
    if (subType === mainStatType) {
      throw new BadRequestException(
        `Dòng chỉ số phụ #${i + 1} (${subMeta.label}) không được trùng với chỉ số chính (${mainMeta.label}).`,
      );
    }
    if (seenSubTypes.has(subType)) {
      throw new BadRequestException(
        `Các dòng chỉ số phụ không được trùng nhau (bị trùng dòng ${subMeta.label}).`,
      );
    }
    seenSubTypes.add(subType);

    const upgradeCount = Math.max(
      0,
      Math.trunc(Number(subRec.UpgradeCount ?? 0)),
    );
    if (upgradeCount > maxTotalUpgrades) {
      throw new BadRequestException(
        `Số lần cường hóa mốc +10 của dòng phụ ${subMeta.label} (${upgradeCount}) vượt quá giới hạn tối đa (${maxTotalUpgrades}) ở cấp +${enhanceLevel}.`,
      );
    }
    totalUpgradeCount += upgradeCount;

    const subRange = getSubStatBaseRange(subType, rarity);
    const rawSubBase = Number(subRec.BaseValue);
    if (!Number.isFinite(rawSubBase)) {
      throw new BadRequestException(
        `Giá trị gốc của dòng phụ ${subMeta.label} không hợp lệ.`,
      );
    }
    const subBaseValue = formatEquipRollValue(subType, rawSubBase);
    const subEps = subMeta.isInt ? 1 : 0.05;
    if (
      subBaseValue < subRange.min - subEps ||
      subBaseValue > subRange.max + subEps
    ) {
      throw new BadRequestException(
        `Giá trị gốc của dòng phụ ${subMeta.label} ở phẩm chất ${tier.name} phải nằm trong ngưỡng hợp lệ [${subRange.min} – ${subRange.max}] (nhận được: ${subBaseValue}).`,
      );
    }
    const clampedSubBase = Math.max(
      subRange.min,
      Math.min(subRange.max, subBaseValue),
    );

    const minTotalVal = formatEquipRollValue(
      subType,
      subRange.min * (1 + upgradeCount),
    );
    const maxTotalVal = formatEquipRollValue(
      subType,
      subRange.max * (1 + upgradeCount),
    );
    const defaultTotalVal = formatEquipRollValue(
      subType,
      clampedSubBase + upgradeCount * subRange.mid,
    );
    const rawTotalVal =
      subRec.Value !== undefined && Number.isFinite(Number(subRec.Value))
        ? formatEquipRollValue(subType, Number(subRec.Value))
        : defaultTotalVal;

    if (
      rawTotalVal < minTotalVal - subEps * (1 + upgradeCount) ||
      rawTotalVal > maxTotalVal + subEps * (1 + upgradeCount)
    ) {
      throw new BadRequestException(
        `Tổng giá trị dòng phụ ${subMeta.label} (với +${upgradeCount} lần nhảy mốc) phải nằm trong khoảng [${minTotalVal} – ${maxTotalVal}].`,
      );
    }
    const clampedTotalVal =
      upgradeCount === 0
        ? clampedSubBase
        : Math.max(minTotalVal, Math.min(maxTotalVal, rawTotalVal));

    normalizedSubStats.push({
      StatType: subType,
      BaseValue: clampedSubBase,
      Value: clampedTotalVal,
      UpgradeCount: upgradeCount,
    });
  }

  if (totalUpgradeCount > maxTotalUpgrades) {
    throw new BadRequestException(
      `Tổng số lượt nhảy mốc +10 của các dòng phụ (${totalUpgradeCount}) không được vượt quá ${maxTotalUpgrades} lượt ở cấp cường hóa +${enhanceLevel}.`,
    );
  }

  return {
    TemplateId: itemId,
    Slot: slot,
    Rarity: rarity,
    EnhanceLevel: enhanceLevel,
    IsLocked: obj.IsLocked === true,
    SetId: typeof obj.SetId === 'string' ? obj.SetId.trim().slice(0, 64) : '',
    MainStat: normalizedMainStat,
    SubStats: normalizedSubStats,
  };
}
