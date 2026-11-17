"use client";

import { useMemo, useState } from "react";
import { GachaSeasonDocument, formatDisplayDateTime } from "@/data/gacha";
import { soundEngine } from "@/services/audio.service";

interface GachaSeasonsListProps {
  seasons: GachaSeasonDocument[];
  loading: boolean;
  canEdit: boolean;
  canActivate: boolean;
  canDelete: boolean;
  onRefresh: () => void;
  onCreateNew: () => void;
  onOpenSeason: (season: GachaSeasonDocument) => void;
  onCloneSeason: (season: GachaSeasonDocument) => void;
  onEditSeasonMeta: (season: GachaSeasonDocument) => void;
  onActivateSeason: (season: GachaSeasonDocument) => void;
  onDeactivateSeason: (season: GachaSeasonDocument) => void;
  onDeleteDraftSeason: (season: GachaSeasonDocument) => void;
}

export default function GachaSeasonsList({
  seasons,
  loading,
  canEdit,
  canActivate,
  canDelete,
  onRefresh,
  onCreateNew,
  onOpenSeason,
  onCloneSeason,
  onEditSeasonMeta,
  onActivateSeason,
  onDeactivateSeason,
  onDeleteDraftSeason,
}: GachaSeasonsListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DRAFT">(
    "ALL"
  );

  const stats = useMemo(() => {
    const totalSeasons = seasons.length;
    const activeSeason = seasons.find((s) => s.IsActive);
    const draftCount = seasons.filter((s) => !s.IsActive).length;
    const totalBanners = seasons.reduce(
      (sum, s) => sum + Object.keys(s.Banners || {}).length,
      0
    );
    return { totalSeasons, activeSeason, draftCount, totalBanners };
  }, [seasons]);

  const filteredSeasons = useMemo(() => {
    const q = search.toLowerCase().trim();
    return seasons.filter((s) => {
      if (statusFilter === "ACTIVE" && !s.IsActive) return false;
      if (statusFilter === "DRAFT" && s.IsActive) return false;
      if (!q) return true;
      return (
        s.SeasonId.toLowerCase().includes(q) ||
        s.SeasonName.toLowerCase().includes(q) ||
        (s.UpdatedBy || "").toLowerCase().includes(q)
      );
    });
  }, [seasons, search, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-lg">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Tổng Số Mùa</span>
            <span className="text-base">🌠</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-rajdhani)]">
              {stats.totalSeasons}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Mùa Gacha
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-emerald-500/30 shadow-lg">
          <div className="text-xs font-mono text-emerald-300 uppercase tracking-wider flex items-center justify-between">
            <span>Đang Phát Hành</span>
            <span className="text-base">⚡</span>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-emerald-300 font-[family-name:var(--font-rajdhani)] truncate">
              {stats.activeSeason ? stats.activeSeason.SeasonId : "Chưa bật"}
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate">
              {stats.activeSeason
                ? stats.activeSeason.SeasonName
                : "Chưa có mùa nào phát hành"}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-[#f5c767]/30 shadow-lg">
          <div className="text-xs font-mono text-[#f5c767] uppercase tracking-wider flex items-center justify-between">
            <span>Tổng Banner Con</span>
            <span className="text-base">🎴</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#f5c767] font-[family-name:var(--font-rajdhani)]">
              {stats.totalBanners}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Cấu hình banner
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-[#3fe9d6]/30 shadow-lg">
          <div className="text-xs font-mono text-[#3fe9d6] uppercase tracking-wider flex items-center justify-between">
            <span>Mùa Bản Nháp</span>
            <span className="text-base">📝</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#3fe9d6] font-[family-name:var(--font-rajdhani)]">
              {stats.draftCount}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Sẵn sàng chỉnh sửa
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOOLBAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo SeasonId, tên mùa hoặc người cập nhật..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans placeholder:text-slate-500 focus:outline-none focus:border-[#3fe9d6]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { id: "ALL", label: "Tất Cả" },
                { id: "ACTIVE", label: "Đang Mở" },
                { id: "DRAFT", label: "Bản Nháp" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setStatusFilter(f.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? "bg-[#3fe9d6] text-[#060814]"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              soundEngine.playClick();
              onRefresh();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono font-semibold cursor-pointer disabled:opacity-50"
          >
            {loading ? "⏳ Đang tải..." : "↺ Làm Mới"}
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onCreateNew();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] hover:brightness-110 text-[#060814] text-xs font-mono font-bold shadow-[0_0_20px_rgba(245,199,103,0.35)] transition-all cursor-pointer"
            >
              ✨ Tạo Mùa Mới
            </button>
          )}
        </div>
      </div>

      {/* 3. SEASONS LIST */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#f5c767]/30 border-t-[#f5c767] rounded-full animate-spin" />
          <div className="text-xs font-mono text-slate-400">
            Đang tải danh sách Mùa Banner Gacha từ máy chủ...
          </div>
        </div>
      ) : filteredSeasons.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#090d24]/60 border border-dashed border-white/15 space-y-3">
          <div className="text-4xl">🌠</div>
          <h4 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
            {seasons.length === 0
              ? "Chưa Có Mùa Banner Gacha Nào"
              : "Không Tìm Thấy Mùa Phù Hợp"}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {seasons.length === 0
              ? "Hãy khởi tạo mùa đầu tiên (ví dụ: season_01) để thiết lập hệ thống Banner Triệu Hồi cho Game Client."
              : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSeasons.map((season) => {
            const bannerList = Object.values(season.Banners || {});
            const activeBannerCount = bannerList.filter((b) => b.IsActive).length;

            return (
              <div
                key={season.SeasonId}
                className={`p-5 sm:p-6 rounded-3xl bg-[#090d24]/95 border transition-all shadow-xl ${
                  season.IsActive
                    ? "border-emerald-500/45 shadow-[0_0_30px_rgba(16,185,129,0.12)]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30 text-xs font-mono font-bold">
                        {season.SeasonId}
                      </span>

                      {season.IsActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ĐANG PHÁT HÀNH
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 text-[11px] font-mono">
                          BẢN NHÁP
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
                        Version {season.Version}
                      </span>

                      <span className="px-2.5 py-0.5 rounded bg-[#f5c767]/15 border border-[#f5c767]/30 text-[#f5c767] text-[11px] font-mono font-bold">
                        {activeBannerCount}/{bannerList.length} Banner Đang Mở
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white font-[family-name:var(--font-rajdhani)] tracking-wide">
                      {season.SeasonName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
                      <span>
                        Thời gian:{" "}
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
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Người sửa:{" "}
                        <strong className="text-[#f5c767]">
                          {season.UpdatedBy || "Admin"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        onOpenSeason(season);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] hover:brightness-110 text-[#060814] text-xs font-mono font-bold shadow-[0_0_15px_rgba(63,233,214,0.25)] cursor-pointer"
                    >
                      🎴 Quản Lý Banner ({bannerList.length})
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onCloneSeason(season);
                        }}
                        className="px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-200 text-xs font-mono font-semibold cursor-pointer"
                        title="Nhân bản mùa này sang mùa mới"
                      >
                        📑 Nhân Bản
                      </button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onEditSeasonMeta(season);
                        }}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono cursor-pointer"
                        title="Sửa tên & thời gian mùa"
                      >
                        ✏️ Sửa Mùa
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
                          className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold cursor-pointer"
                        >
                          ⏸️ Tắt Mở
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            onActivateSeason(season);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold cursor-pointer"
                        >
                          ⚡ Kích Hoạt
                        </button>
                      ))}

                    {canDelete && !season.IsActive && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onDeleteDraftSeason(season);
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-mono cursor-pointer"
                        title="Xóa mùa nháp"
                      >
                        🗑️ Xóa
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

