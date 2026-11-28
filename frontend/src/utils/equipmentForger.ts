export interface CustomEquipmentStatRoll {
  StatType: number;
  BaseValue: number;
  Value: number;
  UpgradeCount: number;
}

export interface CustomForgedEquipmentSpec {
  TemplateId: string;
  Slot: number;
  Rarity: number;
  EnhanceLevel: number;
  IsLocked: boolean;
  SetId: string;
  MainStat: CustomEquipmentStatRoll;
  SubStats: CustomEquipmentStatRoll[];
}

export interface EquipStatMetaInfo {
  statType: number;
  key: string;
  label: string;
  isInt: boolean;
  isPct: boolean;
  mainBase: number;
}

export const EQUIP_SLOT_LABELS: Record<number, string> = {
  1: "Vũ Khí",
  2: "Mũ / Nón",
  3: "Áo Giáp",
  4: "Giày",
  5: "Phụ Kiện",
  6: "Găng Tay",
};

export const EQUIP_STAT_META: Record<number, EquipStatMetaInfo> = {
  1: {
    statType: 1,
    key: "hp",
    label: "HP",
    isInt: true,
    isPct: false,
    mainBase: 500,
  },
  2: {
    statType: 2,
    key: "atk",
    label: "ATK",
    isInt: true,
    isPct: false,
    mainBase: 60,
  },
  3: {
    statType: 3,
    key: "def",
    label: "DEF",
    isInt: true,
    isPct: false,
    mainBase: 35,
  },
  4: {
    statType: 4,
    key: "speed",
    label: "Speed",
    isInt: false,
    isPct: false,
    mainBase: 3.0,
  },
  5: {
    statType: 5,
    key: "critRate",
    label: "Crit Rate",
    isInt: false,
    isPct: true,
    mainBase: 2.2,
  },
  6: {
    statType: 6,
    key: "critDamage",
    label: "Crit Damage",
    isInt: false,
    isPct: true,
    mainBase: 6.0,
  },
  7: {
    statType: 7,
    key: "dodgeRate",
    label: "Né tránh",
    isInt: false,
    isPct: true,
    mainBase: 0.68,
  },
  8: {
    statType: 8,
    key: "parryRate",
    label: "Đỡ đòn",
    isInt: false,
    isPct: true,
    mainBase: 0.68,
  },
  9: {
    statType: 9,
    key: "hpPct",
    label: "HP%",
    isInt: false,
    isPct: true,
    mainBase: 3.0,
  },
  10: {
    statType: 10,
    key: "atkPct",
    label: "ATK%",
    isInt: false,
    isPct: true,
    mainBase: 3.0,
  },
  11: {
    statType: 11,
    key: "defPct",
    label: "DEF%",
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
  tierCode: string;
  maxEnhance: number;
  subStatCount: number;
  mainGrowth: number;
  rarityBaseMult: number;
  badgeClass: string;
  borderClass: string;
}

export const EQUIP_RARITY_TIERS: Record<number, EquipRarityTierInfo> = {
  0: {
    rarity: 0,
    name: "Phổ Thông",
    tierCode: "N",
    maxEnhance: 20,
    subStatCount: 1,
    mainGrowth: 0.04,
    rarityBaseMult: 1.0,
    badgeClass: "bg-slate-400/15 text-slate-200 border-slate-400/40",
    borderClass: "border-slate-400/40",
  },
  1: {
    rarity: 1,
    name: "Hiếm",
    tierCode: "R",
    maxEnhance: 40,
    subStatCount: 2,
    mainGrowth: 0.045,
    rarityBaseMult: 1.25,
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-400/45",
    borderClass: "border-sky-400/45",
  },
  2: {
    rarity: 2,
    name: "Sử Thi",
    tierCode: "SR",
    maxEnhance: 60,
    subStatCount: 3,
    mainGrowth: 0.05,
    rarityBaseMult: 1.55,
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-400/45",
    borderClass: "border-purple-400/45",
  },
  3: {
    rarity: 3,
    name: "Huyền Thoại",
    tierCode: "SSR",
    maxEnhance: 80,
    subStatCount: 4,
    mainGrowth: 0.055,
    rarityBaseMult: 1.92,
    badgeClass: "bg-[#f5c767]/15 text-[#f5c767] border-[#f5c767]/50",
    borderClass: "border-[#f5c767]/50",
  },
  4: {
    rarity: 4,
    name: "Thần Thoại",
    tierCode: "UR",
    maxEnhance: 100,
    subStatCount: 5,
    mainGrowth: 0.06,
    rarityBaseMult: 2.38,
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/50",
    borderClass: "border-rose-500/50",
  },
};

export const SUB_STAT_RANGES: Record<
  number,
  Record<number, [number, number]>
> = {
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

export function formatEquipStatText(statType: number, val: number): string {
  const meta = EQUIP_STAT_META[statType];
  if (!meta) return `+${val}`;
  const formatted = meta.isInt
    ? Math.round(val).toLocaleString("vi-VN")
    : Number(val.toFixed(2)).toString();
  return `${meta.label} +${formatted}${meta.isPct ? "%" : ""}`;
}

export function getMainStatBaseRange(
  statType: number,
  rarity: number
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
  enhanceLevel: number
): number {
  const tier = EQUIP_RARITY_TIERS[rarity] || EQUIP_RARITY_TIERS[0];
  const lv = Math.max(0, Math.min(tier.maxEnhance, Math.trunc(enhanceLevel)));
  const mult = 1 + lv * tier.mainGrowth;
  return formatEquipRollValue(statType, baseValue * mult);
}

export function getSubStatBaseRange(
  statType: number,
  rarity: number
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

export function computeForgedEquipmentCombatScore(
  spec: Pick<CustomForgedEquipmentSpec, "MainStat" | "SubStats">
): number {
  const all = [spec.MainStat, ...(spec.SubStats || [])];
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
    if (!s) continue;
    switch (s.StatType) {
      case 1:
        hp += s.Value;
        break;
      case 2:
        atk += s.Value;
        break;
      case 3:
        def += s.Value;
        break;
      case 4:
        speed += s.Value;
        break;
      case 5:
        critRate += s.Value;
        break;
      case 6:
        critDamage += s.Value;
        break;
      case 7:
        dodgeRate += s.Value;
        break;
      case 8:
        parryRate += s.Value;
        break;
      case 9:
        hpPct += s.Value;
        break;
      case 10:
        atkPct += s.Value;
        break;
      case 11:
        defPct += s.Value;
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
      defPct * 15.0
  );
}

/**
 * Tạo cấu hình trang bị mặc định hợp lệ theo Ô, Phẩm chất và Cấp cường hóa.
 * @param mode 'mid' | 'max' | 'random'
 */
export function buildPresetEquipmentSpec(
  templateId: string,
  slot: number,
  rarity: number,
  enhanceLevel = 0,
  mode: "mid" | "max" | "random" = "mid"
): CustomForgedEquipmentSpec {
  const cleanSlot = slot >= 1 && slot <= 6 ? slot : 1;
  const cleanRarity = Math.max(0, Math.min(4, Math.trunc(rarity)));
  const tier = EQUIP_RARITY_TIERS[cleanRarity];
  const cleanLv = Math.max(
    0,
    Math.min(tier.maxEnhance, Math.trunc(enhanceLevel))
  );

  const mainPool = SLOT_MAIN_STAT_POOLS[cleanSlot] || SLOT_MAIN_STAT_POOLS[1];
  const mainStatType =
    mode === "random"
      ? mainPool[Math.floor(Math.random() * mainPool.length)]
      : mainPool[0];
  const mainRange = getMainStatBaseRange(mainStatType, cleanRarity);
  const mainBase =
    mode === "max"
      ? mainRange.max
      : mode === "random"
        ? formatEquipRollValue(
            mainStatType,
            mainRange.min + Math.random() * (mainRange.max - mainRange.min)
          )
        : mainRange.mid;
  const mainValue = computeMainStatValueAtLevel(
    mainStatType,
    mainBase,
    cleanRarity,
    cleanLv
  );

  const availableSubs = ALL_SUB_STAT_TYPES.filter((st) => st !== mainStatType);
  if (mode === "random") {
    for (let i = availableSubs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = availableSubs[i];
      availableSubs[i] = availableSubs[j];
      availableSubs[j] = tmp;
    }
  }

  const subStats: CustomEquipmentStatRoll[] = [];
  for (let i = 0; i < tier.subStatCount && i < availableSubs.length; i++) {
    const st = availableSubs[i];
    const subRange = getSubStatBaseRange(st, cleanRarity);
    const subBase =
      mode === "max"
        ? subRange.max
        : mode === "random"
          ? formatEquipRollValue(
              st,
              subRange.min + Math.random() * (subRange.max - subRange.min)
            )
          : subRange.mid;
    subStats.push({
      StatType: st,
      BaseValue: subBase,
      Value: subBase,
      UpgradeCount: 0,
    });
  }

  return {
    TemplateId: templateId,
    Slot: cleanSlot,
    Rarity: cleanRarity,
    EnhanceLevel: cleanLv,
    IsLocked: false,
    SetId: "",
    MainStat: {
      StatType: mainStatType,
      BaseValue: mainBase,
      Value: mainValue,
      UpgradeCount: 0,
    },
    SubStats: subStats,
  };
}
