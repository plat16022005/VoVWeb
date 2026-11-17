"use client";

import { useMemo, useState } from "react";
import { GachaHeroReference } from "@/services/gacha.service";
import {
  GachaBannerConfig,
  GachaPoolEntry,
  HERO_RARITY_KEYS,
  HeroRarityKey,
  RARITY_STYLE_META,
} from "@/data/gacha";
import { DEFAULT_HERO_IMAGE } from "@/services/character.service";
import { soundEngine } from "@/services/audio.service";

interface BannerPoolSectionProps {
  banner: GachaBannerConfig;
  heroes: GachaHeroReference[];
  loadingHeroes: boolean;
  readOnly?: boolean;
  onChangeRates: (rates: Record<HeroRarityKey, number>) => void;
  onChangeRateUp: (ids: string[]) => void;
  onChangePool: (pool: Record<HeroRarityKey, GachaPoolEntry[]>) => void;
}

export default function BannerPoolSection({
  banner,
  heroes,
  loadingHeroes,
  readOnly = false,
  onChangeRates,
  onChangeRateUp,
  onChangePool,
}: BannerPoolSectionProps) {
  const [activeTier, setActiveTier] = useState<HeroRarityKey>("SSR");
  const [heroSearch, setHeroSearch] = useState("");
  const [showAllRaritiesInPicker, setShowAllRaritiesInPicker] = useState(false);

  const heroMap = useMemo(() => {
    const m = new Map<string, GachaHeroReference>();
    heroes.forEach((h) => m.set(h.id, h));
    return m;
  }, [heroes]);

  const totalRate = HERO_RARITY_KEYS.reduce(
    (sum, k) => sum + (Number(banner.RarityRates[k]) || 0),
    0
  );
  const isRateSumValid = Math.abs(totalRate - 1.0) < 0.0001;

  // Danh sách tướng hợp lệ làm Rate-Up (từ Pool.SSR & Pool.UR)
  const highTierPoolIds = useMemo(() => {
    const ids = new Set<string>();
    (banner.Pool.UR || []).forEach((e) => ids.add(e.HeroId));
    (banner.Pool.SSR || []).forEach((e) => ids.add(e.HeroId));
    return Array.from(ids);
  }, [banner.Pool.SSR, banner.Pool.UR]);

  const getCharRarityKey = (c: GachaHeroReference): HeroRarityKey => {
    const r = String(c.rarityLabel || "").toUpperCase();
    if (r === "UR") return "UR";
    if (r === "SSR" || c.rarity >= 5) return "SSR";
    if (r === "SR" || c.rarity === 4) return "SR";
    return "R";
  };

  // Tướng có thể thêm vào tier đang chọn
  const availableHeroesForTier = useMemo(() => {
    const currentPoolIds = new Set(
      (banner.Pool[activeTier] || []).map((e) => e.HeroId)
    );
    const q = heroSearch.toLowerCase().trim();

    return heroes.filter((h) => {
      if (currentPoolIds.has(h.id)) return false;
      if (!showAllRaritiesInPicker && getCharRarityKey(h) !== activeTier) {
        return false;
      }
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q) ||
        (h.role || "").toLowerCase().includes(q)
      );
    });
  }, [heroes, banner.Pool, activeTier, heroSearch, showAllRaritiesInPicker]);

  const handleAddHeroToPool = (tier: HeroRarityKey, heroId: string) => {
    soundEngine.playClick();
    const existing = banner.Pool[tier] || [];
    if (existing.some((e) => e.HeroId === heroId)) return;
    onChangePool({
      ...banner.Pool,
      [tier]: [...existing, { HeroId: heroId, Weight: 100 }],
    });
  };

  const handleAddAllMatchingTier = (tier: HeroRarityKey) => {
    soundEngine.playClick();
    const existing = banner.Pool[tier] || [];
    const existingIds = new Set(existing.map((e) => e.HeroId));
    const additions = heroes
      .filter((h) => getCharRarityKey(h) === tier && !existingIds.has(h.id))
      .map((h) => ({ HeroId: h.id, Weight: 100 }));
    if (additions.length === 0) return;
    onChangePool({
      ...banner.Pool,
      [tier]: [...existing, ...additions],
    });
  };

  const handleUpdateWeight = (
    tier: HeroRarityKey,
    heroId: string,
    weight: number
  ) => {
    const next = (banner.Pool[tier] || []).map((e) =>
      e.HeroId === heroId ? { ...e, Weight: weight } : e
    );
    onChangePool({ ...banner.Pool, [tier]: next });
  };

  const handleRemoveFromPool = (tier: HeroRarityKey, heroId: string) => {
    soundEngine.playClick();
    const nextPool = {
      ...banner.Pool,
      [tier]: (banner.Pool[tier] || []).filter((e) => e.HeroId !== heroId),
    };
    onChangePool(nextPool);

    // Nếu không còn trong SSR hay UR thì gỡ khỏi RateUpHeroIds nếu đang được chọn
    if (tier === "SSR" || tier === "UR") {
      const stillInHigh =
        (nextPool.SSR || []).some((e) => e.HeroId === heroId) ||
        (nextPool.UR || []).some((e) => e.HeroId === heroId);
      if (!stillInHigh && banner.RateUpHeroIds.includes(heroId)) {
        onChangeRateUp(banner.RateUpHeroIds.filter((id) => id !== heroId));
      }
    }
  };

  const handleToggleRateUp = (heroId: string) => {
    soundEngine.playClick();
    if (banner.RateUpHeroIds.includes(heroId)) {
      onChangeRateUp(banner.RateUpHeroIds.filter((id) => id !== heroId));
    } else {
      onChangeRateUp([...banner.RateUpHeroIds, heroId]);
    }
  };

  const currentEntries = banner.Pool[activeTier] || [];
  const totalTierWeight = currentEntries.reduce(
    (sum, e) => sum + (Number(e.Weight) > 0 ? Number(e.Weight) : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. TỶ LỆ RƠI CƠ BẢN (RarityRates) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#060814]/80 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-[#3fe9d6] uppercase tracking-wider">
              1. Tỷ Lệ Rơi Theo Bậc (RarityRates)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nhập giá trị thập phân (VD: 0.02 = 2%). Tổng 4 bậc bắt buộc phải bằng 1.0000.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeRates({ UR: 0, SSR: 0.02, SR: 0.18, R: 0.8 });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 cursor-pointer"
                >
                  Mẫu Limited (2% / 18% / 80%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeRates({ UR: 0, SSR: 0.015, SR: 0.185, R: 0.8 });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 cursor-pointer"
                >
                  Mẫu Standard (1.5% / 18.5% / 80%)
                </button>
              </>
            )}

            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                isRateSumValid
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
              }`}
            >
              Tổng: {totalRate.toFixed(4)} ({(totalRate * 100).toFixed(2)}%)
              {isRateSumValid ? " ✓" : " ≠ 1.0"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {HERO_RARITY_KEYS.map((tier) => {
            const meta = RARITY_STYLE_META[tier];
            const val = Number(banner.RarityRates[tier]) || 0;
            const poolLen = (banner.Pool[tier] || []).length;
            const missingPool = val > 0 && poolLen === 0;

            return (
              <div
                key={tier}
                className={`p-3 rounded-xl border ${
                  missingPool
                    ? "bg-rose-950/30 border-rose-500/50"
                    : "bg-[#090d24] border-white/10"
                } space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${meta.bgClass} ${meta.borderClass} ${meta.textClass}`}
                  >
                    {tier}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300 font-bold">
                    {(val * 100).toFixed(2)}%
                  </span>
                </div>

                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  disabled={readOnly}
                  value={banner.RarityRates[tier]}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    onChangeRates({
                      ...banner.RarityRates,
                      [tier]: Number.isFinite(num) ? num : 0,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#04050d] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none"
                />

                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Trong Pool:</span>
                  <span
                    className={
                      missingPool ? "text-rose-400 font-bold" : "text-slate-200"
                    }
                  >
                    {poolLen} tướng {missingPool ? "⚠️" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. TƯỚNG TIÊU ĐIỂM (RateUpHeroIds) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#060814]/80 border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-mono font-bold text-[#f5c767] uppercase tracking-wider">
              2. Valkyria Tiêu Điểm (RateUpHeroIds)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Chọn từ danh sách Valkyria đang có trong Pool SSR hoặc UR của banner này.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-300">
            Đã chọn:{" "}
            <strong className="text-[#f5c767]">
              {banner.RateUpHeroIds.length}
            </strong>{" "}
            tiêu điểm
          </span>
        </div>

        {/* Cảnh báo nếu có RateUpHeroId không nằm trong Pool.SSR/UR */}
        {banner.RateUpHeroIds.some((id) => !highTierPoolIds.includes(id)) && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2">
            <span>
              ⚠️ Có tướng tiêu điểm không nằm trong Pool SSR hoặc Pool UR. Vui lòng thêm vào Pool hoặc gỡ khỏi tiêu điểm.
            </span>
          </div>
        )}

        {highTierPoolIds.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs font-mono text-slate-400">
            Hãy thêm Valkyria vào <strong>Pool SSR</strong> hoặc{" "}
            <strong>Pool UR</strong> ở mục bên dưới trước, sau đó chọn tướng tiêu điểm tại đây.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {highTierPoolIds.map((heroId) => {
              const char = heroMap.get(heroId);
              const isSelected = banner.RateUpHeroIds.includes(heroId);

              return (
                <button
                  key={heroId}
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleToggleRateUp(heroId)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-not-allowed ${
                    isSelected
                      ? "bg-[#f5c767]/20 border-[#f5c767] text-white shadow-[0_0_15px_rgba(245,199,103,0.25)]"
                      : "bg-[#090d24] border-white/10 text-slate-300 hover:border-white/30"
                  }`}
                >
                  <img
                    src={char?.image || DEFAULT_HERO_IMAGE}
                    alt={char?.name || heroId}
                    className="w-8 h-8 rounded-lg object-cover object-top border border-white/15 shrink-0"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes("default_hero")) {
                        img.src = DEFAULT_HERO_IMAGE;
                      }
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {char?.name || heroId}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {heroId} · {char?.rarityLabel || "SSR"}
                    </div>
                  </div>
                  <span
                    className={`ml-1 text-xs font-bold ${
                      isSelected ? "text-[#f5c767]" : "text-slate-500"
                    }`}
                  >
                    {isSelected ? "★" : "☆"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. CẤU HÌNH POOL TƯỚNG THEO TỪNG BẬC */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#060814]/80 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-[#3fe9d6] uppercase tracking-wider">
              3. Danh Sách Pool & Trọng Số Theo Bậc (Pool)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Chọn Valkyria từ dữ liệu game và thiết lập trọng số (Weight &gt; 0) cho từng bậc.
            </p>
          </div>

          {/* Tier Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {HERO_RARITY_KEYS.map((tier) => {
              const count = (banner.Pool[tier] || []).length;
              const active = activeTier === tier;
              const warn =
                (Number(banner.RarityRates[tier]) || 0) > 0 && count === 0;

              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveTier(tier);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-[#3fe9d6] text-[#060814] border-[#3fe9d6] shadow-[0_0_12px_rgba(63,233,214,0.3)]"
                      : warn
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                      : "bg-[#090d24] text-slate-300 border-white/10 hover:border-white/30"
                  }`}
                >
                  <span>{tier}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active ? "bg-black/20 text-black" : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Cột Trái: Danh sách đã có trong Pool[activeTier] */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>
                Đang trong Pool <strong className="text-[#3fe9d6]">{activeTier}</strong> (
                {currentEntries.length} tướng)
              </span>
              <span className="text-[11px] text-slate-400">
                Tổng Weight: <strong className="text-white">{totalTierWeight}</strong>
              </span>
            </div>

            {currentEntries.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#090d24]/60 border border-dashed border-white/10 text-center text-xs font-mono text-slate-400">
                Pool bậc {activeTier} chưa có Valkyria nào. Hãy chọn từ danh sách bên phải.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {currentEntries.map((entry) => {
                  const char = heroMap.get(entry.HeroId);
                  const tierPct =
                    totalTierWeight > 0
                      ? ((entry.Weight / totalTierWeight) * 100).toFixed(1)
                      : "0.0";
                  const effectivePct =
                    totalTierWeight > 0
                      ? (
                          (Number(banner.RarityRates[activeTier]) || 0) *
                          (entry.Weight / totalTierWeight) *
                          100
                        ).toFixed(3)
                      : "0.000";
                  const isRateUp = banner.RateUpHeroIds.includes(entry.HeroId);

                  return (
                    <div
                      key={entry.HeroId}
                      className="p-2.5 rounded-xl bg-[#090d24] border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={char?.image || DEFAULT_HERO_IMAGE}
                          alt={char?.name || entry.HeroId}
                          className="w-9 h-9 rounded-lg object-cover object-top border border-white/15 shrink-0"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (!img.src.includes("default_hero")) {
                              img.src = DEFAULT_HERO_IMAGE;
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {char?.name || entry.HeroId}
                            </span>
                            {isRateUp && (
                              <span className="px-1.5 py-0.2 rounded bg-[#f5c767]/20 text-[#f5c767] border border-[#f5c767]/40 text-[9px] font-mono font-bold">
                                ★ RATE-UP
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {entry.HeroId} · Nội bậc: {tierPct}% · Thực tế: {effectivePct}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            Weight:
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            disabled={readOnly}
                            value={entry.Weight}
                            onChange={(e) =>
                              handleUpdateWeight(
                                activeTier,
                                entry.HeroId,
                                Math.max(0, Number(e.target.value))
                              )
                            }
                            className="w-16 px-2 py-1 rounded-lg bg-[#04050d] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white text-right outline-none"
                          />
                        </div>

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveFromPool(activeTier, entry.HeroId)
                            }
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 text-xs transition-colors cursor-pointer"
                            title="Gỡ khỏi Pool"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cột Phải: Bộ Chọn Tướng Trực Quan */}
          <div className="lg:col-span-5 p-3.5 rounded-xl bg-[#090d24]/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-white">
                Thêm Valkyria Vào {activeTier}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleAddAllMatchingTier(activeTier)}
                  className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 text-[#3fe9d6] border border-[#3fe9d6]/30 text-[10px] font-mono font-bold cursor-pointer"
                >
                  + Thêm tất cả bậc {activeTier}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Tìm tên, HeroId hoặc vai trò..."
                className="w-full px-3 py-1.5 rounded-lg bg-[#04050d] border border-white/15 focus:border-[#3fe9d6] text-xs font-sans text-white outline-none"
              />
              <label className="flex items-center gap-2 text-[11px] font-mono text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllRaritiesInPicker}
                  onChange={(e) => setShowAllRaritiesInPicker(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-[#3fe9d6]"
                />
                <span>Hiện tất cả bậc (không lọc riêng bậc {activeTier})</span>
              </label>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {loadingHeroes ? (
                <div className="py-6 text-center text-xs font-mono text-slate-400">
                  Đang nạp danh sách Valkyria...
                </div>
              ) : availableHeroesForTier.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-slate-500">
                  Không còn Valkyria phù hợp để thêm vào bậc {activeTier}.
                </div>
              ) : (
                availableHeroesForTier.map((char) => (
                  <div
                    key={char.id}
                    className="p-2 rounded-lg bg-[#060814] border border-white/5 hover:border-[#3fe9d6]/40 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={char.image || DEFAULT_HERO_IMAGE}
                        alt={char.name}
                        className="w-7 h-7 rounded-md object-cover object-top border border-white/10 shrink-0"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.src.includes("default_hero")) {
                            img.src = DEFAULT_HERO_IMAGE;
                          }
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {char.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {char.id} · {char.rarityLabel || "R"} · {char.role}
                        </div>
                      </div>
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleAddHeroToPool(activeTier, char.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/15 hover:bg-[#3fe9d6] hover:text-[#060814] text-[#3fe9d6] border border-[#3fe9d6]/30 text-[11px] font-mono font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        + Thêm
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

