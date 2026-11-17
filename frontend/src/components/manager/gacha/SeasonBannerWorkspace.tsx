"use client";

import { useMemo, useState } from "react";
import { GachaHeroReference } from "@/services/gacha.service";
import {
  BANNER_TYPE_OPTIONS,
  GachaBannerConfig,
  GachaSeasonDocument,
  formatDisplayDateTime,
} from "@/data/gacha";
import { GameItemConfig } from "@/services/itemConfig.service";
import { soundEngine } from "@/services/audio.service";
import SeasonBannerEditor from "./SeasonBannerEditor";

interface SeasonBannerWorkspaceProps {
  season: GachaSeasonDocument;
  heroes: GachaHeroReference[];
  items: GameItemConfig[];
  loadingRefs: boolean;
  canEdit: boolean;
  canActivate: boolean;
  canDelete: boolean;
  onBackToList: () => void;
  onEditSeasonMeta: (season: GachaSeasonDocument) => void;
  onActivateSeason: (season: GachaSeasonDocument) => void;
  onDeactivateSeason: (season: GachaSeasonDocument) => void;
  onSaveBanner: (
    seasonId: string,
    banner: GachaBannerConfig,
    meta: {
      isNew: boolean;
      oldBannerImageKey?: string;
      oldBannerTabImageKey?: string;
    }
  ) => Promise<void>;
  onToggleBannerActive: (
    seasonId: string,
    banner: GachaBannerConfig
  ) => Promise<void>;
  onDeleteBanner: (seasonId: string, banner: GachaBannerConfig) => void;
}

export default function SeasonBannerWorkspace({
  season,
  heroes,
  items,
  loadingRefs,
  canEdit,
  canActivate,
  canDelete,
  onBackToList,
  onEditSeasonMeta,
  onActivateSeason,
  onDeactivateSeason,
  onSaveBanner,
  onToggleBannerActive,
  onDeleteBanner,
}: SeasonBannerWorkspaceProps) {
  const [editingBanner, setEditingBanner] = useState<GachaBannerConfig | null>(
    null
  );
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sortedBanners = useMemo(() => {
    return Object.values(season.Banners || {}).sort(
      (a, b) => (a.SortOrder || 0) - (b.SortOrder || 0)
    );
  }, [season.Banners]);

  const heroMap = useMemo(() => {
    const m = new Map<string, GachaHeroReference>();
    heroes.forEach((h) => m.set(h.id, h));
    return m;
  }, [heroes]);

  const itemMap = useMemo(() => {
    const m = new Map<string, GameItemConfig>();
    items.forEach((it) => m.set(it.id, it));
    return m;
  }, [items]);

  if (isCreatingBanner || editingBanner) {
    return (
      <SeasonBannerEditor
        season={season}
        initialBanner={isCreatingBanner ? null : editingBanner}
        heroes={heroes}
        items={items}
        loadingRefs={loadingRefs}
        readOnly={!canEdit}
        onCancel={() => {
          setIsCreatingBanner(false);
          setEditingBanner(null);
        }}
        onSave={async (banner, meta) => {
          await onSaveBanner(season.SeasonId, banner, meta);
          setIsCreatingBanner(false);
          setEditingBanner(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. SEASON HEADER CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0c1438] via-[#090d24] to-[#0c1438] border border-[#f5c767]/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onBackToList();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
              >
                ← Danh Sách Mùa
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30 text-xs font-mono font-bold">
                {season.SeasonId}
              </span>

              {season.IsActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ĐANG PHÁT HÀNH (LIVE)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-white/15 text-xs font-mono font-bold">
                  <span>📝</span>
                  BẢN NHÁP (DRAFT)
                </span>
              )}

              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
                v{season.Version}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-rajdhani)] tracking-wide">
              {season.SeasonName}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
              <span>
                Hiệu lực:{" "}
                <strong className="text-slate-200">
                  {formatDisplayDateTime(season.StartTime)} →{" "}
                  {formatDisplayDateTime(season.EndTime)}
                </strong>
              </span>
              <span>•</span>
              <span>
                Cập nhật:{" "}
                <strong className="text-slate-200">
                  {formatDisplayDateTime(season.LastUpdated)}
                </strong>{" "}
                bởi <strong className="text-[#f5c767]">{season.UpdatedBy || "Admin"}</strong>
              </span>
            </div>
          </div>

          {/* Season Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onEditSeasonMeta(season);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 cursor-pointer"
              >
                ✏️ Sửa Thông Tin Mùa
              </button>
            )}

            {canActivate &&
              (season.IsActive ? (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onDeactivateSeason(season);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold cursor-pointer"
                >
                  ⏸️ Tạm Ngưng Mùa
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onActivateSeason(season);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  ⚡ Kích Hoạt Phát Hành
                </button>
              ))}

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setIsCreatingBanner(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] hover:brightness-110 text-[#060814] text-xs font-mono font-bold shadow-[0_0_20px_rgba(245,199,103,0.35)] cursor-pointer"
              >
                ✨ + Thêm Banner Mới
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BANNERS LIST IN THIS SEASON */}
      {sortedBanners.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#090d24]/70 border border-dashed border-white/15 space-y-3">
          <div className="text-4xl">🌠</div>
          <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
            Mùa Này Chưa Có Banner Triệu Hồi Nào
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hãy bấm <strong>+ Thêm Banner Mới</strong> để thiết lập các banner Limited (Giới hạn), Standard (Thường) hoặc Novice (Tân thủ) cho mùa này.
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsCreatingBanner(true);
              }}
              className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#060814] text-xs font-mono font-bold cursor-pointer"
            >
              ✨ Tạo Banner Đầu Tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {sortedBanners.map((banner) => {
            const typeMeta = BANNER_TYPE_OPTIONS.find(
              (o) => o.value === banner.BannerType
            );
            const accentColor = typeMeta?.defaultColor || "#F4D03F";
            const ticketItem = itemMap.get(banner.Cost.TicketItemId);
            const totalPoolCount =
              (banner.Pool.UR?.length || 0) +
              (banner.Pool.SSR?.length || 0) +
              (banner.Pool.SR?.length || 0) +
              (banner.Pool.R?.length || 0);

            return (
              <div
                key={banner.BannerId}
                className="rounded-3xl bg-[#090d24]/95 border border-white/10 hover:border-white/25 overflow-hidden shadow-xl flex flex-col justify-between transition-all"
              >
                {/* Banner Image Header */}
                <div>
                  <div
                    className="relative h-44 bg-[#04050d] border-b-2 overflow-hidden"
                    style={{ borderColor: accentColor }}
                  >
                    {banner.BannerImageUrl ? (
                      <img
                        src={banner.BannerImageUrl}
                        alt={banner.Title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                        Chưa có ảnh nền banner
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d24] via-[#090d24]/30 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-white">
                          #{banner.SortOrder}
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border text-[10px] font-mono font-bold uppercase"
                          style={{
                            borderColor: `${accentColor}80`,
                            color: accentColor,
                          }}
                        >
                          {typeMeta?.label || banner.BannerType}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold backdrop-blur-md border ${banner.IsActive
                            ? "bg-emerald-500/25 text-emerald-200 border-emerald-400/50"
                            : "bg-slate-900/80 text-slate-300 border-white/20"
                          }`}
                      >
                        {banner.IsActive ? "🟢 Đang Mở" : "⏸️ Đang Tắt"}
                      </span>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-[#3fe9d6] truncate">
                          {banner.BannerId}
                        </div>
                        <h3 className="text-lg font-black text-white font-[family-name:var(--font-rajdhani)] truncate">
                          {banner.Title}
                        </h3>
                        {banner.Subtitle && (
                          <p className="text-xs text-slate-300 truncate">
                            {banner.Subtitle}
                          </p>
                        )}
                      </div>

                      {banner.BannerTabImageUrl && (
                        <img
                          src={banner.BannerTabImageUrl}
                          alt="Tab"
                          className="w-16 h-10 rounded-lg object-cover border border-white/30 shrink-0 shadow-lg"
                        />
                      )}
                    </div>
                  </div>

                  {/* Specs Summary */}
                  <div className="p-4 sm:p-5 space-y-3 text-xs">
                    {/* Rate-up Heroes */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400 mr-1">
                        Tiêu điểm:
                      </span>
                      {banner.RateUpHeroIds.length > 0 ? (
                        banner.RateUpHeroIds.map((hid) => {
                          const ch = heroMap.get(hid);
                          return (
                            <span
                              key={hid}
                              className="px-2 py-0.5 rounded-lg bg-[#f5c767]/15 border border-[#f5c767]/40 text-[#f5c767] text-[11px] font-mono font-bold"
                            >
                              ★ {ch?.name || hid}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500 italic">
                          Không có Rate-Up riêng
                        </span>
                      )}
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
                      <div className="p-2.5 rounded-xl bg-[#060814] border border-white/5">
                        <div className="text-slate-500 text-[10px]">Chi phí quay</div>
                        <div className="text-white font-semibold truncate mt-0.5">
                          {banner.Cost.TicketPerRoll}×{" "}
                          {ticketItem?.name || banner.Cost.TicketItemId || "?"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {banner.Cost.AllowGemFallback
                            ? `Hoặc ${banner.Cost.GemCostPerRoll} Gems`
                            : "Chỉ dùng Vé"}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#060814] border border-white/5">
                        <div className="text-slate-500 text-[10px]">Pity & Bảo hiểm</div>
                        <div className="text-[#3fe9d6] font-semibold truncate mt-0.5">
                          {banner.Pity.SharedPityGroup}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Soft {banner.Pity.SoftPityStart} / Hard{" "}
                          {banner.Pity.HardPityCount}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#060814] border border-white/5 col-span-2 sm:col-span-1">
                        <div className="text-slate-500 text-[10px]">Tỷ lệ & Pool</div>
                        <div className="text-rose-300 font-semibold mt-0.5">
                          SSR {(banner.RarityRates.SSR * 100).toFixed(2)}% · UR{" "}
                          {(banner.RarityRates.UR * 100).toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {totalPoolCount} Valkyria trong Pool
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span>
                        Lịch mở:{" "}
                        <strong className="text-slate-200">
                          {banner.StartTime && banner.EndTime
                            ? `${formatDisplayDateTime(banner.StartTime)} → ${formatDisplayDateTime(banner.EndTime)}`
                            : "Mở vĩnh viễn"}
                        </strong>
                      </span>
                      {banner.MaxTotalRolls > 0 && (
                        <span className="text-amber-300">
                          Tối đa {banner.MaxTotalRolls} lượt/TK
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 sm:px-5 py-3.5 border-t border-white/10 bg-[#060814]/60 flex flex-wrap items-center justify-between gap-2">
                  {canActivate ? (
                    <button
                      type="button"
                      disabled={togglingId === banner.BannerId}
                      onClick={async () => {
                        soundEngine.playClick();
                        setTogglingId(banner.BannerId);
                        try {
                          await onToggleBannerActive(season.SeasonId, banner);
                        } finally {
                          setTogglingId(null);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer disabled:opacity-50 ${banner.IsActive
                          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40"
                        }`}
                    >
                      {togglingId === banner.BannerId
                        ? "Đang cập nhật..."
                        : banner.IsActive
                          ? "⏸️ Tạm Tắt Banner"
                          : "▶️ Bật Mở Banner"}
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500">
                      {banner.IsActive ? "Trạng thái: Đang Mở" : "Trạng thái: Tắt"}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setEditingBanner(banner);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 text-[#3fe9d6] border border-[#3fe9d6]/40 text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      {canEdit ? "✏️ Cấu Hình Chi Tiết" : "👁️ Xem Chi Tiết"}
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onDeleteBanner(season.SeasonId, banner);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-mono transition-all cursor-pointer"
                        title="Xóa banner khỏi mùa"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

