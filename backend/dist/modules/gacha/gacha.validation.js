import { HERO_RARITY_KEYS, } from './gacha.types.js';
export const VALID_ID_REGEX = /^[a-z0-9_]+$/;
export function asRecord(val) {
    return val && typeof val === 'object' && !Array.isArray(val)
        ? val
        : {};
}
export function createDefaultDuplicateConversion() {
    return {
        UR: { ShardAmount: 50, BonusItemId: '', BonusQty: 5 },
        SSR: { ShardAmount: 30, BonusItemId: '', BonusQty: 3 },
        SR: { ShardAmount: 10, BonusItemId: '', BonusQty: 2 },
        R: { ShardAmount: 5, BonusItemId: '', BonusQty: 2 },
    };
}
export function toUtcIsoString(dateInput) {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (Number.isNaN(d.getTime()))
        return '';
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
export function normalizeBanner(bannerId, raw) {
    const rawCost = asRecord(raw?.Cost);
    const rawPity = asRecord(raw?.Pity);
    const rawRates = asRecord(raw?.RarityRates);
    const rawPool = asRecord(raw?.Pool);
    const rawDup = asRecord(raw?.DuplicateConversion);
    const defaultsDup = createDefaultDuplicateConversion();
    const pool = {};
    const rarityRates = {};
    const dupConversion = {};
    for (const tier of HERO_RARITY_KEYS) {
        rarityRates[tier] = Number(rawRates[tier] ?? 0);
        const tierPool = rawPool[tier];
        pool[tier] = Array.isArray(tierPool)
            ? tierPool.map((entry) => {
                const rec = asRecord(entry);
                return {
                    HeroId: String(rec.HeroId || '').trim(),
                    Weight: Number(rec.Weight ?? 100),
                };
            })
            : [];
        const dupRec = asRecord(rawDup[tier]);
        dupConversion[tier] = {
            ShardAmount: Number(dupRec.ShardAmount ?? defaultsDup[tier].ShardAmount),
            BonusItemId: String(dupRec.BonusItemId ?? defaultsDup[tier].BonusItemId).trim(),
            BonusQty: Number(dupRec.BonusQty ?? defaultsDup[tier].BonusQty),
        };
    }
    const bType = String(raw?.BannerType || 'limited');
    return {
        BannerId: String(raw?.BannerId || bannerId).trim(),
        Title: String(raw?.Title || bannerId).trim(),
        Subtitle: String(raw?.Subtitle || '').trim(),
        Description: String(raw?.Description || '').trim(),
        BannerType: bType === 'standard' || bType === 'novice' ? bType : 'limited',
        SortOrder: Number(raw?.SortOrder ?? 1),
        BannerImageUrl: String(raw?.BannerImageUrl || '').trim(),
        BannerImageKey: String(raw?.BannerImageKey || '').trim(),
        BannerTabImageUrl: raw?.BannerTabImageUrl
            ? String(raw.BannerTabImageUrl).trim()
            : undefined,
        BannerTabImageKey: raw?.BannerTabImageKey
            ? String(raw.BannerTabImageKey).trim()
            : undefined,
        BannerArtKey: raw?.BannerArtKey
            ? String(raw.BannerArtKey).trim()
            : undefined,
        IsActive: Boolean(raw?.IsActive ?? true),
        StartTime: raw?.StartTime ? String(raw.StartTime) : null,
        EndTime: raw?.EndTime ? String(raw.EndTime) : null,
        MaxTotalRolls: Number(raw?.MaxTotalRolls ?? 0),
        Cost: {
            TicketItemId: String(rawCost?.TicketItemId || '').trim(),
            TicketPerRoll: Number(rawCost?.TicketPerRoll ?? 1),
            AllowGemFallback: Boolean(rawCost?.AllowGemFallback ?? false),
            GemCostPerRoll: Number(rawCost?.GemCostPerRoll ?? 0),
            MultiRollCount: Number(rawCost?.MultiRollCount ?? 10),
        },
        Pity: {
            SharedPityGroup: String(rawPity?.SharedPityGroup || 'limited_hero').trim(),
            SoftPityStart: Number(rawPity?.SoftPityStart ?? 70),
            SoftPityStepRate: Number(rawPity?.SoftPityStepRate ?? 0.05),
            HardPityCount: Number(rawPity?.HardPityCount ?? 90),
            GuaranteedSrEvery: Number(rawPity?.GuaranteedSrEvery ?? 10),
            EnableRateUpGuarantee: Boolean(rawPity?.EnableRateUpGuarantee ?? false),
            RateUpWinChance: Number(rawPity?.RateUpWinChance ?? 0),
        },
        RarityRates: rarityRates,
        RateUpHeroIds: Array.isArray(raw?.RateUpHeroIds)
            ? raw.RateUpHeroIds.map((id) => String(id).trim()).filter(Boolean)
            : [],
        Pool: pool,
        DuplicateConversion: dupConversion,
    };
}
export function normalizeSeason(docId, data) {
    const rawBanners = asRecord(data?.Banners);
    const banners = {};
    Object.entries(rawBanners).forEach(([key, val]) => {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            banners[key] = normalizeBanner(key, val);
        }
    });
    return {
        SeasonId: String(data?.SeasonId || docId),
        SeasonName: String(data?.SeasonName || docId),
        Version: Number(data?.Version ?? 1),
        IsActive: Boolean(data?.IsActive ?? false),
        StartTime: String(data?.StartTime || ''),
        EndTime: String(data?.EndTime || ''),
        LastUpdated: String(data?.LastUpdated || ''),
        UpdatedBy: String(data?.UpdatedBy || ''),
        Banners: banners,
    };
}
export function validateSeasonInput(input) {
    const errors = [];
    if (!input.SeasonId.trim()) {
        errors.push('Mã mùa (SeasonId) không được để trống.');
    }
    else if (!VALID_ID_REGEX.test(input.SeasonId.trim())) {
        errors.push('SeasonId chỉ được chứa chữ thường không dấu, số và dấu gạch dưới (^[a-z0-9_]+$).');
    }
    if (!input.SeasonName.trim()) {
        errors.push('Tên mùa phát hành (SeasonName) không được để trống.');
    }
    else if (input.SeasonName.trim().length > 200) {
        errors.push('Tên mùa phát hành (SeasonName) tối đa 200 ký tự.');
    }
    const startMs = Date.parse(input.StartTime);
    const endMs = Date.parse(input.EndTime);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
        errors.push('Thời gian bắt đầu và kết thúc của mùa không hợp lệ.');
    }
    else if (startMs >= endMs) {
        errors.push('Thời gian bắt đầu mùa phải nhỏ hơn thời gian kết thúc.');
    }
    return { valid: errors.length === 0, errors };
}
export function validateBannerConfig(banner, existingBannerIdsInSeason, isEditing = false) {
    const errors = [];
    if (!banner.BannerId.trim()) {
        errors.push('Mã banner (BannerId) không được để trống.');
    }
    else if (!VALID_ID_REGEX.test(banner.BannerId)) {
        errors.push('BannerId chỉ được chứa chữ thường không dấu, số và dấu gạch dưới (^[a-z0-9_]+$).');
    }
    else if (!isEditing && existingBannerIdsInSeason?.includes(banner.BannerId)) {
        errors.push(`BannerId "${banner.BannerId}" đã tồn tại trong mùa này.`);
    }
    if (!banner.Title.trim()) {
        errors.push('Tiêu đề banner (Title) không được để trống.');
    }
    if (!Number.isFinite(banner.SortOrder) || banner.SortOrder < 0) {
        errors.push('Thứ tự hiển thị (SortOrder) phải >= 0.');
    }
    if (!Number.isFinite(banner.MaxTotalRolls) || banner.MaxTotalRolls < 0) {
        errors.push('Giới hạn tổng lượt quay (MaxTotalRolls) phải >= 0.');
    }
    if (!banner.BannerImageUrl.trim()) {
        errors.push('Vui lòng tải lên ảnh nền chính của banner (PNG hoặc JPG).');
    }
    else if (/\.webp(\?|$)/i.test(banner.BannerImageUrl)) {
        errors.push('Ảnh nền banner tuyệt đối không được dùng định dạng .webp (chỉ nhận .png, .jpg, .jpeg).');
    }
    if (banner.BannerTabImageUrl &&
        /\.webp(\?|$)/i.test(banner.BannerTabImageUrl)) {
        errors.push('Ảnh tab banner tuyệt đối không được dùng định dạng .webp.');
    }
    const hasStart = Boolean(banner.StartTime);
    const hasEnd = Boolean(banner.EndTime);
    if (hasStart !== hasEnd) {
        errors.push('Nếu thiết lập lịch riêng cho banner, phải có đủ cả StartTime và EndTime (hoặc để cả hai trống nếu mở vĩnh viễn).');
    }
    else if (hasStart && hasEnd) {
        const startMs = Date.parse(banner.StartTime);
        const endMs = Date.parse(banner.EndTime);
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
            errors.push('Lịch mở/đóng riêng của banner không hợp lệ.');
        }
        else if (startMs >= endMs) {
            errors.push('Thời gian mở banner (StartTime) phải nhỏ hơn EndTime.');
        }
    }
    if (!banner.Cost.TicketItemId.trim()) {
        errors.push('Vui lòng chọn vật phẩm vé tiêu hao (TicketItemId).');
    }
    if (!Number.isFinite(banner.Cost.TicketPerRoll) || banner.Cost.TicketPerRoll < 1) {
        errors.push('Số vé tiêu hao mỗi lượt (TicketPerRoll) phải >= 1.');
    }
    if (!Number.isFinite(banner.Cost.MultiRollCount) || banner.Cost.MultiRollCount < 1) {
        errors.push('Số lượt quay nhiều (MultiRollCount) phải >= 1.');
    }
    if (banner.Cost.AllowGemFallback) {
        if (!Number.isFinite(banner.Cost.GemCostPerRoll) || banner.Cost.GemCostPerRoll <= 0) {
            errors.push('Khi bật dùng Gems bù vé (AllowGemFallback), số Gems mỗi lượt (GemCostPerRoll) phải > 0.');
        }
    }
    else if (!Number.isFinite(banner.Cost.GemCostPerRoll) || banner.Cost.GemCostPerRoll < 0) {
        errors.push('Số Gems mỗi lượt (GemCostPerRoll) phải >= 0.');
    }
    if (!banner.Pity.SharedPityGroup.trim()) {
        errors.push('Nhóm Pity dùng chung (SharedPityGroup) không được để trống.');
    }
    else if (!VALID_ID_REGEX.test(banner.Pity.SharedPityGroup.trim())) {
        errors.push('SharedPityGroup chỉ được chứa chữ thường không dấu, số và gạch dưới (^[a-z0-9_]+$).');
    }
    if (banner.Pity.SoftPityStart < 0 || banner.Pity.SoftPityStepRate < 0 || banner.Pity.SoftPityStepRate > 1) {
        errors.push('SoftPityStart phải >= 0 và SoftPityStepRate phải nằm trong khoảng 0 -> 1.');
    }
    if (banner.Pity.HardPityCount < 0) {
        errors.push('HardPityCount phải >= 0.');
    }
    if (banner.Pity.HardPityCount > 0 &&
        banner.Pity.HardPityCount <= banner.Pity.SoftPityStart) {
        errors.push('Khi bật Hard Pity (HardPityCount > 0), HardPityCount phải lớn hơn SoftPityStart.');
    }
    if (banner.Pity.GuaranteedSrEvery < 0) {
        errors.push('GuaranteedSrEvery phải >= 0.');
    }
    if (banner.Pity.RateUpWinChance < 0 || banner.Pity.RateUpWinChance > 1) {
        errors.push('Tỷ lệ trúng Rate-Up (RateUpWinChance) phải nằm trong khoảng 0 -> 1.');
    }
    let totalRate = 0;
    for (const tier of HERO_RARITY_KEYS) {
        const rate = Number(banner.RarityRates[tier] ?? 0);
        if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
            errors.push(`Tỷ lệ bậc ${tier} phải nằm trong khoảng 0 đến 1.`);
        }
        totalRate += rate;
    }
    if (Math.abs(totalRate - 1.0) >= 0.0001) {
        errors.push(`Tổng tỷ lệ 4 bậc UR + SSR + SR + R phải đúng bằng 1.0 (100%), hiện tại đang là ${totalRate.toFixed(4)} (${(totalRate * 100).toFixed(2)}%).`);
    }
    const poolHeroIdsHighTier = new Set();
    for (const tier of HERO_RARITY_KEYS) {
        const rate = Number(banner.RarityRates[tier] ?? 0);
        const entries = banner.Pool[tier] || [];
        if (rate > 0 && entries.length === 0) {
            errors.push(`Bậc ${tier} có tỷ lệ > 0 (${(rate * 100).toFixed(2)}%) nhưng danh sách Pool[${tier}] đang trống.`);
        }
        const seenInTier = new Set();
        for (const entry of entries) {
            if (!entry.HeroId.trim()) {
                errors.push(`Phát hiện mục trống HeroId trong Pool[${tier}].`);
            }
            else if (seenInTier.has(entry.HeroId)) {
                errors.push(`Tướng "${entry.HeroId}" bị trùng lặp trong Pool[${tier}].`);
            }
            else {
                seenInTier.add(entry.HeroId);
            }
            if (!Number.isFinite(entry.Weight) || entry.Weight <= 0) {
                errors.push(`Trọng số (Weight) của tướng "${entry.HeroId || '?'}" trong Pool[${tier}] phải > 0.`);
            }
            if (tier === 'UR' || tier === 'SSR') {
                poolHeroIdsHighTier.add(entry.HeroId);
            }
        }
    }
    for (const heroId of banner.RateUpHeroIds) {
        if (!poolHeroIdsHighTier.has(heroId)) {
            errors.push(`Tướng tiêu điểm Rate-Up "${heroId}" bắt buộc phải nằm trong Pool.SSR hoặc Pool.UR của banner.`);
        }
    }
    if (banner.Pity.EnableRateUpGuarantee &&
        banner.RateUpHeroIds.filter(Boolean).length === 0) {
        errors.push('Khi bật bảo hiểm Rate-Up (50/50), vui lòng chọn ít nhất 1 tướng tiêu điểm trong RateUpHeroIds.');
    }
    for (const tier of HERO_RARITY_KEYS) {
        const rule = banner.DuplicateConversion[tier];
        if (!rule || rule.ShardAmount < 0 || rule.BonusQty < 0) {
            errors.push(`Quy đổi trùng bậc ${tier} phải có số lượng Mảnh và Quà thưởng >= 0.`);
        }
        if (rule && rule.BonusQty > 0 && !rule.BonusItemId.trim()) {
            errors.push(`Quy đổi trùng bậc ${tier} có BonusQty > 0 nhưng chưa chọn vật phẩm BonusItemId.`);
        }
    }
    return { valid: errors.length === 0, errors };
}
export function sanitizeBannerForFirestore(banner) {
    const clean = {
        BannerId: banner.BannerId.trim(),
        Title: banner.Title.trim(),
        Subtitle: banner.Subtitle.trim(),
        Description: banner.Description.trim(),
        BannerType: banner.BannerType,
        SortOrder: Math.trunc(Number(banner.SortOrder) || 0),
        BannerImageUrl: banner.BannerImageUrl.trim(),
        BannerImageKey: banner.BannerImageKey.trim(),
        IsActive: Boolean(banner.IsActive),
        StartTime: banner.StartTime ? toUtcIsoString(banner.StartTime) : null,
        EndTime: banner.EndTime ? toUtcIsoString(banner.EndTime) : null,
        MaxTotalRolls: Math.max(0, Math.trunc(Number(banner.MaxTotalRolls) || 0)),
        Cost: {
            TicketItemId: banner.Cost.TicketItemId.trim(),
            TicketPerRoll: Math.max(1, Math.trunc(Number(banner.Cost.TicketPerRoll) || 1)),
            AllowGemFallback: Boolean(banner.Cost.AllowGemFallback),
            GemCostPerRoll: Math.max(0, Math.trunc(Number(banner.Cost.GemCostPerRoll) || 0)),
            MultiRollCount: Math.max(1, Math.trunc(Number(banner.Cost.MultiRollCount) || 10)),
        },
        Pity: {
            SharedPityGroup: banner.Pity.SharedPityGroup.trim(),
            SoftPityStart: Math.max(0, Math.trunc(Number(banner.Pity.SoftPityStart) || 0)),
            SoftPityStepRate: Math.max(0, Number(banner.Pity.SoftPityStepRate) || 0),
            HardPityCount: Math.max(0, Math.trunc(Number(banner.Pity.HardPityCount) || 0)),
            GuaranteedSrEvery: Math.max(0, Math.trunc(Number(banner.Pity.GuaranteedSrEvery) || 0)),
            EnableRateUpGuarantee: Boolean(banner.Pity.EnableRateUpGuarantee),
            RateUpWinChance: Math.min(1, Math.max(0, Number(banner.Pity.RateUpWinChance) || 0)),
        },
        RarityRates: {
            UR: Number(banner.RarityRates.UR) || 0,
            SSR: Number(banner.RarityRates.SSR) || 0,
            SR: Number(banner.RarityRates.SR) || 0,
            R: Number(banner.RarityRates.R) || 0,
        },
        RateUpHeroIds: Array.from(new Set(banner.RateUpHeroIds.map((h) => h.trim()).filter(Boolean))),
        Pool: {
            UR: (banner.Pool.UR || []).map((e) => ({
                HeroId: e.HeroId.trim(),
                Weight: Math.max(1, Math.trunc(Number(e.Weight) || 1)),
            })),
            SSR: (banner.Pool.SSR || []).map((e) => ({
                HeroId: e.HeroId.trim(),
                Weight: Math.max(1, Math.trunc(Number(e.Weight) || 1)),
            })),
            SR: (banner.Pool.SR || []).map((e) => ({
                HeroId: e.HeroId.trim(),
                Weight: Math.max(1, Math.trunc(Number(e.Weight) || 1)),
            })),
            R: (banner.Pool.R || []).map((e) => ({
                HeroId: e.HeroId.trim(),
                Weight: Math.max(1, Math.trunc(Number(e.Weight) || 1)),
            })),
        },
        DuplicateConversion: {
            UR: {
                ShardAmount: Math.max(0, Math.trunc(Number(banner.DuplicateConversion.UR?.ShardAmount) || 0)),
                BonusItemId: (banner.DuplicateConversion.UR?.BonusItemId || '').trim(),
                BonusQty: Math.max(0, Math.trunc(Number(banner.DuplicateConversion.UR?.BonusQty) || 0)),
            },
            SSR: {
                ShardAmount: Math.max(0, Math.trunc(Number(banner.DuplicateConversion.SSR?.ShardAmount) || 0)),
                BonusItemId: (banner.DuplicateConversion.SSR?.BonusItemId || '').trim(),
                BonusQty: Math.max(0, Math.trunc(Number(banner.DuplicateConversion.SSR?.BonusQty) || 0)),
            },
            SR: {
                ShardAmount: Math.max(0, Math.trunc(Number(banner.DuplicateConversion.SR?.ShardAmount) || 0)),
                BonusItemId: (banner.DuplicateConversion.SR?.BonusItemId || '').trim(),
                BonusQty: Math.max(0, Math.trunc(Number(banner.DuplicateConversion.SR?.BonusQty) || 0)),
            },
            R: {
                ShardAmount: Math.max(0, Math.trunc(Number(banner.DuplicateConversion.R?.ShardAmount) || 0)),
                BonusItemId: (banner.DuplicateConversion.R?.BonusItemId || '').trim(),
                BonusQty: Math.max(0, Math.trunc(Number(banner.DuplicateConversion.R?.BonusQty) || 0)),
            },
        },
    };
    if (banner.BannerTabImageUrl?.trim()) {
        clean.BannerTabImageUrl = banner.BannerTabImageUrl.trim();
    }
    if (banner.BannerTabImageKey?.trim()) {
        clean.BannerTabImageKey = banner.BannerTabImageKey.trim();
    }
    if (banner.BannerArtKey?.trim()) {
        clean.BannerArtKey = banner.BannerArtKey.trim();
    }
    return clean;
}
export function collectOtherReferencedKeys(seasons, exclude) {
    const used = new Set();
    for (const season of seasons) {
        if (exclude && !exclude.bannerId && season.SeasonId === exclude.seasonId) {
            continue;
        }
        for (const [bId, banner] of Object.entries(season.Banners || {})) {
            if (exclude &&
                exclude.seasonId === season.SeasonId &&
                exclude.bannerId === bId) {
                continue;
            }
            if (banner.BannerImageKey)
                used.add(banner.BannerImageKey);
            if (banner.BannerTabImageKey)
                used.add(banner.BannerTabImageKey);
        }
    }
    return used;
}
//# sourceMappingURL=gacha.validation.js.map