export type BannerType = "limited" | "standard" | "novice";
export type HeroRarityKey = "UR" | "SSR" | "SR" | "R";

export const HERO_RARITY_KEYS: HeroRarityKey[] = ["UR", "SSR", "SR", "R"];

export interface GachaCostConfig {
  TicketItemId: string;
  TicketPerRoll: number;
  AllowGemFallback: boolean;
  GemCostPerRoll: number;
  MultiRollCount: number;
}

export interface GachaPityConfig {
  SharedPityGroup: string;
  SoftPityStart: number;
  SoftPityStepRate: number;
  HardPityCount: number;
  GuaranteedSrEvery: number;
  EnableRateUpGuarantee: boolean;
  RateUpWinChance: number;
}

export interface GachaPoolEntry {
  HeroId: string;
  Weight: number;
}

export interface GachaDuplicateRule {
  ShardAmount: number;
  BonusItemId: string;
  BonusQty: number;
}

export interface GachaBannerConfig {
  BannerId: string;
  Title: string;
  Subtitle: string;
  Description: string;
  BannerType: BannerType;
  SortOrder: number;

  // Ảnh lưu trên Cloudflare R2
  BannerImageUrl: string;
  BannerImageKey: string;
  BannerTabImageUrl?: string;
  BannerTabImageKey?: string;
  BannerArtKey?: string;

  // Trạng thái & thời gian mở
  IsActive: boolean;
  StartTime: string | null;
  EndTime: string | null;
  MaxTotalRolls: number;

  // Cấu hình quay & tỷ lệ
  Cost: GachaCostConfig;
  Pity: GachaPityConfig;
  RarityRates: Record<HeroRarityKey, number>;
  RateUpHeroIds: string[];
  Pool: Record<HeroRarityKey, GachaPoolEntry[]>;
  DuplicateConversion: Record<HeroRarityKey, GachaDuplicateRule>;
}

export interface GachaSeasonDocument {
  SeasonId: string;
  SeasonName: string;
  Version: number;
  IsActive: boolean;
  StartTime: string;
  EndTime: string;
  LastUpdated: string;
  UpdatedBy: string;
  Banners: Record<string, GachaBannerConfig>;
}

export const BANNER_TYPE_OPTIONS: {
  value: BannerType;
  label: string;
  badge: string;
  defaultColor: string;
  defaultPityGroup: string;
  desc: string;
}[] = [
  {
    value: "limited",
    label: "Limited (Giới Hạn)",
    badge: "Rate-Up",
    defaultColor: "#F4D03F",
    defaultPityGroup: "limited_hero",
    desc: "Banner sự kiện theo mùa, hỗ trợ bảo hiểm 50/50 và dùng chung mốc Pity.",
  },
  {
    value: "standard",
    label: "Standard (Thường)",
    badge: "Vĩnh Viễn",
    defaultColor: "#5DADE2",
    defaultPityGroup: "standard_hero",
    desc: "Banner cơ bản mở dài hạn với vé triệu hồi sơ cấp.",
  },
  {
    value: "novice",
    label: "Novice (Tân Thủ)",
    badge: "Giới Hạn Lượt",
    defaultColor: "#3FE9D6",
    defaultPityGroup: "novice_hero",
    desc: "Banner ưu đãi dành cho tài khoản mới với tổng số lượt quay tối đa.",
  },
];

export const RARITY_STYLE_META: Record<
  HeroRarityKey,
  { label: string; color: string; bgClass: string; borderClass: string; textClass: string }
> = {
  UR: {
    label: "UR (Siêu Cấp)",
    color: "#ffffff",
    bgClass: "bg-white/10",
    borderClass: "border-white/40",
    textClass: "text-white",
  },
  SSR: {
    label: "SSR (Huyền Thoại)",
    color: "#ef4444",
    bgClass: "bg-rose-500/15",
    borderClass: "border-rose-500/40",
    textClass: "text-rose-300",
  },
  SR: {
    label: "SR (Tinh Anh)",
    color: "#f5c767",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/40",
    textClass: "text-amber-300",
  },
  R: {
    label: "R (Cơ Bản)",
    color: "#38bdf8",
    bgClass: "bg-sky-500/15",
    borderClass: "border-sky-500/40",
    textClass: "text-sky-300",
  },
};


export function createDefaultDuplicateConversion(): Record<HeroRarityKey, GachaDuplicateRule> {
  return {
    UR: { ShardAmount: 50, BonusItemId: "", BonusQty: 5 },
    SSR: { ShardAmount: 30, BonusItemId: "", BonusQty: 3 },
    SR: { ShardAmount: 10, BonusItemId: "", BonusQty: 2 },
    R: { ShardAmount: 5, BonusItemId: "", BonusQty: 2 },
  };
}

export function createDefaultBanner(
  bannerType: BannerType = "limited",
  bannerId = "",
  sortOrder = 1,
  seasonStartTime: string | null = null,
  seasonEndTime: string | null = null
): GachaBannerConfig {
  const isStandard = bannerType === "standard";
  const isNovice = bannerType === "novice";
  const meta = BANNER_TYPE_OPTIONS.find((b) => b.value === bannerType) || BANNER_TYPE_OPTIONS[0];

  return {
    BannerId: bannerId,
    Title: isStandard ? "Triệu Hồi Thường" : isNovice ? "Triệu Hồi Tân Thủ" : "",
    Subtitle: isStandard ? "Banner cơ bản mở vĩnh viễn" : "",
    Description: isStandard
      ? "Sử dụng vật phẩm triệu hồi sơ cấp để triệu hồi các Valkyria cơ bản."
      : "Mỗi 10 lượt đảm bảo ít nhất 1 tướng SR trở lên. Tối đa 90 lượt chắc chắn nhận tướng SSR.",
    BannerType: bannerType,
    SortOrder: sortOrder,

    BannerImageUrl: "",
    BannerImageKey: "",
    BannerTabImageUrl: "",
    BannerTabImageKey: "",
    BannerArtKey: "",

    IsActive: true,
    StartTime: isStandard ? null : seasonStartTime,
    EndTime: isStandard ? null : seasonEndTime,
    MaxTotalRolls: isNovice ? 50 : 0,

    Cost: {
      TicketItemId: "",
      TicketPerRoll: 1,
      AllowGemFallback: !isStandard,
      GemCostPerRoll: isStandard ? 0 : 160,
      MultiRollCount: 10,
    },
    Pity: {
      SharedPityGroup: meta.defaultPityGroup,
      SoftPityStart: 70,
      SoftPityStepRate: 0.05,
      HardPityCount: 90,
      GuaranteedSrEvery: 10,
      EnableRateUpGuarantee: bannerType === "limited",
      RateUpWinChance: bannerType === "limited" ? 0.5 : 0,
    },
    RarityRates: isStandard
      ? { UR: 0, SSR: 0.015, SR: 0.185, R: 0.8 }
      : { UR: 0, SSR: 0.02, SR: 0.18, R: 0.8 },
    RateUpHeroIds: [],
    Pool: {
      UR: [],
      SSR: [],
      SR: [],
      R: [],
    },
    DuplicateConversion: createDefaultDuplicateConversion(),
  };
}

/** Chuyển đổi ngày giờ sang chuẩn ISO-8601 UTC gọn gàng (YYYY-MM-DDTHH:mm:ssZ) */
export function toUtcIsoString(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Chuyển ISO-8601 UTC sang giá trị cho input type="datetime-local" (theo giờ máy người dùng) */
export function isoToLocalDateTimeInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Chuyển giá trị từ input type="datetime-local" thành chuỗi ISO-8601 UTC */
export function localDateTimeInputToUtcIso(localVal: string): string {
  if (!localVal) return "";
  const d = new Date(localVal);
  if (isNaN(d.getTime())) return "";
  return toUtcIsoString(d);
}

export function formatDisplayDateTime(iso?: string | null): string {
  if (!iso) return "Vĩnh viễn";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}



