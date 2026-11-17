import { BadRequestException } from '@nestjs/common';
import { GachaR2Service } from './gacha-r2.service.js';
import { GachaBannerConfig, GachaSeasonDocument } from './gacha.types.js';
import {
  collectOtherReferencedKeys,
  normalizeBanner,
  sanitizeBannerForFirestore,
  validateBannerConfig,
  validateSeasonInput,
} from './gacha.validation.js';

function createValidBanner(
  overrides: Partial<GachaBannerConfig> = {},
): GachaBannerConfig {
  const base = normalizeBanner('limited_valkyria_01', {
    BannerId: 'limited_valkyria_01',
    Title: 'Ánh Sáng Veyra',
    Subtitle: 'Rate Up SSR Giới Hạn',
    Description: 'Thể lệ chuẩn.',
    BannerType: 'limited',
    SortOrder: 1,
    BannerImageUrl: 'https://cdn.example.com/banners/season_01/limited_01.png',
    BannerImageKey: 'banners/season_01/limited_01.png',
    IsActive: true,
    StartTime: '2026-11-14T00:00:00Z',
    EndTime: '2026-12-01T23:59:59Z',
    MaxTotalRolls: 0,
    Cost: {
      TicketItemId: 'item_05',
      TicketPerRoll: 1,
      AllowGemFallback: true,
      GemCostPerRoll: 160,
      MultiRollCount: 10,
    },
    Pity: {
      SharedPityGroup: 'limited_hero',
      SoftPityStart: 70,
      SoftPityStepRate: 0.05,
      HardPityCount: 90,
      GuaranteedSrEvery: 10,
      EnableRateUpGuarantee: true,
      RateUpWinChance: 0.5,
    },
    RarityRates: {
      UR: 0.005,
      SSR: 0.015,
      SR: 0.12,
      R: 0.86,
    },
    RateUpHeroIds: ['hero_ssr_01'],
    Pool: {
      UR: [{ HeroId: 'hero_ur_01', Weight: 100 }],
      SSR: [
        { HeroId: 'hero_ssr_01', Weight: 100 },
        { HeroId: 'hero_ssr_02', Weight: 100 },
      ],
      SR: [{ HeroId: 'hero_sr_01', Weight: 100 }],
      R: [{ HeroId: 'hero_r_01', Weight: 100 }],
    },
    DuplicateConversion: {
      UR: { ShardAmount: 50, BonusItemId: 'item_06', BonusQty: 5 },
      SSR: { ShardAmount: 30, BonusItemId: 'item_06', BonusQty: 3 },
      SR: { ShardAmount: 10, BonusItemId: 'item_06', BonusQty: 2 },
      R: { ShardAmount: 5, BonusItemId: 'item_06', BonusQty: 1 },
    },
  });

  return {
    ...base,
    ...overrides,
  };
}

describe('Gacha Backend Validation & Media Rules', () => {
  describe('validateSeasonInput', () => {
    it('chấp nhận dữ liệu mùa hợp lệ', () => {
      const res = validateSeasonInput({
        SeasonId: 'season_01',
        SeasonName: 'Mùa 1: Khởi Nguyên Valkyria',
        StartTime: '2026-11-14T00:00:00Z',
        EndTime: '2026-12-01T23:59:59Z',
      });
      expect(res.valid).toBe(true);
      expect(res.errors).toEqual([]);
    });

    it('chặn SeasonId viết hoa/ký tự lạ và thời gian StartTime >= EndTime', () => {
      const res = validateSeasonInput({
        SeasonId: 'Season-01!',
        SeasonName: '',
        StartTime: '2026-12-05T00:00:00Z',
        EndTime: '2026-12-01T00:00:00Z',
      });
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateBannerConfig', () => {
    it('chấp nhận cấu hình banner hợp lệ đầy đủ', () => {
      const res = validateBannerConfig(createValidBanner(), ['other_banner'], false);
      expect(res.valid).toBe(true);
      expect(res.errors).toEqual([]);
    });

    it('chặn định dạng ảnh .webp ở cả BannerImageUrl và BannerTabImageUrl', () => {
      const banner = createValidBanner({
        BannerImageUrl: 'https://cdn.example.com/banners/season_01/bg.webp',
        BannerTabImageUrl: 'https://cdn.example.com/banners/season_01/tab.WEBP?v=1',
      });
      const res = validateBannerConfig(banner);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('.webp'))).toBe(true);
      expect(res.errors.filter((e) => e.includes('.webp')).length).toBe(2);
    });

    it('chặn trùng BannerId khi tạo mới nhưng cho phép khi chỉnh sửa', () => {
      const banner = createValidBanner();
      const createRes = validateBannerConfig(
        banner,
        ['limited_valkyria_01'],
        false,
      );
      expect(createRes.valid).toBe(false);

      const editRes = validateBannerConfig(
        banner,
        ['limited_valkyria_01'],
        true,
      );
      expect(editRes.valid).toBe(true);
    });

    it('chặn tổng tỷ lệ RarityRates khác 1.0', () => {
      const banner = createValidBanner({
        RarityRates: { UR: 0.01, SSR: 0.02, SR: 0.1, R: 0.8 },
      });
      const res = validateBannerConfig(banner);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('1.0 (100%)'))).toBe(true);
    });

    it('chặn RateUpHeroIds không nằm trong Pool.SSR hoặc Pool.UR và EnableRateUpGuarantee rỗng', () => {
      const banner = createValidBanner({
        RateUpHeroIds: ['hero_sr_01'],
      });
      const res = validateBannerConfig(banner);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Pool.SSR hoặc Pool.UR'))).toBe(
        true,
      );

      const emptyRateUp = createValidBanner({
        RateUpHeroIds: [],
      });
      const res2 = validateBannerConfig(emptyRateUp);
      expect(res2.valid).toBe(false);
      expect(res2.errors.some((e) => e.includes('RateUpHeroIds'))).toBe(true);
    });

    it('chặn AllowGemFallback bật với GemCostPerRoll = 0, HardPity <= SoftPity và SoftPityStepRate > 1', () => {
      const banner = createValidBanner();
      banner.Cost = { ...banner.Cost, AllowGemFallback: true, GemCostPerRoll: 0 };
      banner.Pity = {
        ...banner.Pity,
        SoftPityStart: 70,
        SoftPityStepRate: 1.2,
        HardPityCount: 60,
      };
      banner.DuplicateConversion = {
        ...banner.DuplicateConversion,
        SR: { ShardAmount: 10, BonusItemId: '', BonusQty: 2 },
      };

      const res = validateBannerConfig(banner);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('GemCostPerRoll'))).toBe(true);
      expect(res.errors.some((e) => e.includes('HardPityCount'))).toBe(true);
      expect(res.errors.some((e) => e.includes('SoftPityStepRate'))).toBe(true);
      expect(res.errors.some((e) => e.includes('BonusItemId'))).toBe(true);
    });
  });

  describe('sanitizeBannerForFirestore & collectOtherReferencedKeys', () => {
    it('lược bỏ field tùy chọn rỗng và giữ nguyên key đang dùng ở mùa nhân bản', () => {
      const banner = createValidBanner({
        BannerTabImageUrl: '',
        BannerTabImageKey: undefined,
        RateUpHeroIds: [' hero_ssr_01 ', 'hero_ssr_01', ''],
      });
      const clean = sanitizeBannerForFirestore(banner);
      expect('BannerTabImageUrl' in clean).toBe(false);
      expect('BannerTabImageKey' in clean).toBe(false);
      expect(clean.RateUpHeroIds).toEqual(['hero_ssr_01']);

      const seasons: GachaSeasonDocument[] = [
        {
          SeasonId: 'season_01',
          SeasonName: 'S1',
          Version: 1,
          IsActive: false,
          StartTime: '2026-11-14T00:00:00Z',
          EndTime: '2026-12-01T23:59:59Z',
          LastUpdated: '2026-11-14T00:00:00Z',
          UpdatedBy: 'admin@vov.gg',
          Banners: { limited_valkyria_01: banner },
        },
        {
          SeasonId: 'season_02',
          SeasonName: 'S2',
          Version: 1,
          IsActive: false,
          StartTime: '2026-12-02T00:00:00Z',
          EndTime: '2026-12-20T23:59:59Z',
          LastUpdated: '2026-11-14T00:00:00Z',
          UpdatedBy: 'admin@vov.gg',
          Banners: { limited_valkyria_01: banner },
        },
      ];

      const usedByOthers = collectOtherReferencedKeys(seasons, {
        seasonId: 'season_01',
      });
      expect(usedByOthers.has('banners/season_01/limited_01.png')).toBe(true);
    });
  });

  describe('GachaR2Service', () => {
    const r2 = new GachaR2Service();
    const envBackup: Record<string, string | undefined> = {};

    beforeEach(() => {
      for (const k of [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_PUBLIC_URL',
        'R2_PUBLIC_DOMAIN',
        'NEXT_PUBLIC_R2_PUBLIC_DOMAIN',
      ]) {
        envBackup[k] = process.env[k];
      }
      delete process.env.R2_PUBLIC_URL;
      delete process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
      process.env.R2_ACCOUNT_ID = 'acct123';
      process.env.R2_ACCESS_KEY_ID = 'key123';
      process.env.R2_SECRET_ACCESS_KEY = 'secret123';
      process.env.R2_BUCKET_NAME = 'vov-assets';
      process.env.R2_PUBLIC_DOMAIN = 'https://cdn.example.com/';
    });

    afterEach(() => {
      for (const [k, v] of Object.entries(envBackup)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    });

    it('tạo presigned PUT URL hợp lệ cho ảnh PNG/JPEG đến 5MB+ và nhận diện R2_PUBLIC_DOMAIN', () => {
      const presigned = r2.createGachaBannerPresignUrl({
        seasonId: 'season_01',
        bannerId: 'limited_valkyria_01',
        variant: 'main',
        fileName: 'hero_banner.png',
        contentType: 'image/png',
        fileSize: 5 * 1024 * 1024,
      });

      expect(presigned.key).toMatch(
        /^banners\/season_01\/limited_valkyria_01_\d+\.png$/,
      );
      expect(presigned.publicUrl).toBe(
        `https://cdn.example.com/${presigned.key}`,
      );
      expect(presigned.uploadUrl).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
      expect(presigned.uploadUrl).toContain(
        'X-Amz-SignedHeaders=content-type%3Bhost',
      );
      expect(presigned.uploadUrl).toContain('X-Amz-Signature=');
    });

    it('chặn upload .webp hoặc vượt quá 10MB', () => {
      expect(() =>
        r2.createGachaBannerPresignUrl({
          seasonId: 'season_01',
          bannerId: 'limited_01',
          fileName: 'banner.webp',
          contentType: 'image/webp',
          fileSize: 1000,
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        r2.createGachaBannerPresignUrl({
          seasonId: 'season_01',
          bannerId: 'limited_01',
          fileName: 'huge.png',
          contentType: 'image/png',
          fileSize: 11 * 1024 * 1024,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
