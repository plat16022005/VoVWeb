"use client";

import { useState } from "react";
import {
  GachaSeasonDocument,
  isoToLocalDateTimeInput,
  localDateTimeInputToUtcIso,
  toUtcIsoString,
} from "@/data/gacha";
import { GachaApiError } from "@/services/gacha.service";
import { soundEngine } from "@/services/audio.service";

export type SeasonModalMode = "create" | "clone" | "edit";

interface SeasonFormModalProps {
  isOpen: boolean;
  mode: SeasonModalMode;
  sourceSeason?: GachaSeasonDocument | null;
  existingSeasonIds: string[];
  onClose: () => void;
  onSubmit: (payload: {
    mode: SeasonModalMode;
    SeasonId: string;
    SeasonName: string;
    StartTime: string;
    EndTime: string;
    IsActive?: boolean;
    syncLimitedBannerTimes?: boolean;
  }) => Promise<void>;
}

function buildInitialSeasonState(
  mode: SeasonModalMode,
  sourceSeason: GachaSeasonDocument | null | undefined,
  existingCount: number
) {
  const nextNum = String(existingCount + 1).padStart(2, "0");
  const now = new Date();
  const plus18 = new Date(now.getTime() + 18 * 24 * 3600 * 1000);

  if (mode === "edit" && sourceSeason) {
    return {
      seasonId: sourceSeason.SeasonId,
      seasonName: sourceSeason.SeasonName,
      startLocal: isoToLocalDateTimeInput(sourceSeason.StartTime),
      endLocal: isoToLocalDateTimeInput(sourceSeason.EndTime),
      activateImmediately: sourceSeason.IsActive,
      syncLimitedBannerTimes: true,
    };
  }
  if (mode === "clone" && sourceSeason) {
    return {
      seasonId: `season_${nextNum}`,
      seasonName: `${sourceSeason.SeasonName} (Bản sao)`,
      startLocal: isoToLocalDateTimeInput(now.toISOString()),
      endLocal: isoToLocalDateTimeInput(plus18.toISOString()),
      activateImmediately: false,
      syncLimitedBannerTimes: true,
    };
  }
  return {
    seasonId: `season_${nextNum}`,
    seasonName: "",
    startLocal: isoToLocalDateTimeInput(now.toISOString()),
    endLocal: isoToLocalDateTimeInput(plus18.toISOString()),
    activateImmediately: false,
    syncLimitedBannerTimes: true,
  };
}

export default function SeasonFormModal({
  isOpen,
  mode,
  sourceSeason,
  existingSeasonIds,
  onClose,
  onSubmit,
}: SeasonFormModalProps) {
  const initial = buildInitialSeasonState(
    mode,
    sourceSeason,
    existingSeasonIds.length
  );

  const [seasonId, setSeasonId] = useState(initial.seasonId);
  const [seasonName, setSeasonName] = useState(initial.seasonName);
  const [startLocal, setStartLocal] = useState(initial.startLocal);
  const [endLocal, setEndLocal] = useState(initial.endLocal);
  const [activateImmediately, setActivateImmediately] = useState(
    initial.activateImmediately
  );
  const [syncLimitedBannerTimes, setSyncLimitedBannerTimes] = useState(
    initial.syncLimitedBannerTimes
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const startUtc = localDateTimeInputToUtcIso(startLocal);
  const endUtc = localDateTimeInputToUtcIso(endLocal);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedId = seasonId.trim().toLowerCase();

    setSaving(true);
    try {
      await onSubmit({
        mode,
        SeasonId: trimmedId,
        SeasonName: seasonName.trim(),
        StartTime: toUtcIsoString(startUtc),
        EndTime: toUtcIsoString(endUtc),
        IsActive: mode === "create" ? activateImmediately : undefined,
        syncLimitedBannerTimes:
          mode === "clone" ? syncLimitedBannerTimes : undefined,
      });
      soundEngine.playSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof GachaApiError && err.errors.length > 0) {
        setErrorMsg(err.errors.join("\n"));
      } else {
        setErrorMsg(
          err instanceof Error && err.message
            ? err.message
            : "Không thể lưu thông tin mùa Gacha."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-[family-name:var(--font-inter)]">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#090d24] border border-[#3fe9d6]/30 shadow-[0_0_50px_rgba(63,233,214,0.2)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#060814]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3fe9d6]/25 to-[#f5c767]/25 border border-[#3fe9d6]/40 flex items-center justify-center text-xl">
              {mode === "clone" ? "📑" : mode === "edit" ? "✏️" : "🌠"}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wide">
                {mode === "clone"
                  ? `Nhân Bản Mùa Từ [${sourceSeason?.SeasonId}]`
                  : mode === "edit"
                  ? `Chỉnh Sửa Thông Tin Mùa [${sourceSeason?.SeasonId}]`
                  : "Tạo Mới Mùa Phát Hành Banner Gacha"}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {mode === "clone"
                  ? "Giữ nguyên toàn bộ banner thường, pool tướng và quy đổi quà trùng."
                  : mode === "edit"
                  ? "Cập nhật tên hiển thị và khung thời gian hiệu lực của mùa."
                  : "Khởi tạo mùa mới để cấu hình danh sách banner triệu hồi."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <span>⚠️</span>
              <span className="whitespace-pre-line">{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300 font-semibold">
                Mã Mùa (SeasonId) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={seasonId}
                disabled={mode === "edit"}
                onChange={(e) => setSeasonId(e.target.value.toLowerCase())}
                placeholder="season_01"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none disabled:opacity-50"
              />
              <p className="text-[10px] font-mono text-slate-500">
                Chỉ chữ thường không dấu, số, gạch dưới (`a-z`, `0-9`, `_`)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300 font-semibold">
                Tên Mùa (SeasonName) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="Mùa 1: Khởi Nguyên Valkyria"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-sans text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300 font-semibold">
                Thời Gian Bắt Đầu <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none"
              />
              {startUtc && (
                <div className="text-[10px] font-mono text-slate-400">
                  UTC: <span className="text-[#3fe9d6]">{startUtc}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300 font-semibold">
                Thời Gian Kết Thúc <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none"
              />
              {endUtc && (
                <div className="text-[10px] font-mono text-slate-400">
                  UTC: <span className="text-[#3fe9d6]">{endUtc}</span>
                </div>
              )}
            </div>
          </div>

          {mode === "clone" && sourceSeason && (
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#060814] border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={syncLimitedBannerTimes}
                onChange={(e) => setSyncLimitedBannerTimes(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-black/40 text-[#3fe9d6]"
              />
              <div className="text-xs">
                <div className="font-semibold text-white">
                  Đồng bộ thời gian mở/đóng cho các banner Giới Hạn / Tân Thủ theo mùa mới
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Banner Thường (Standard) mở vĩnh viễn (`null`) sẽ giữ nguyên không thay đổi.
                </div>
              </div>
            </label>
          )}

          {mode === "create" && (
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#060814] border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={activateImmediately}
                onChange={(e) => setActivateImmediately(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-black/40 text-[#f5c767]"
              />
              <div className="text-xs">
                <div className="font-semibold text-white">
                  Kích hoạt phát hành ngay sau khi tạo
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Mặc định nên để Bản Nháp để thêm đủ Banner trước khi bật Live.
                </div>
              </div>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-semibold cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] hover:brightness-110 text-[#060814] text-xs font-mono font-bold shadow-[0_0_20px_rgba(63,233,214,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#060814] border-t-transparent rounded-full animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <span>
                  {mode === "clone"
                    ? "📑 Nhân Bản Mùa"
                    : mode === "edit"
                    ? "💾 Lưu Thay Đổi"
                    : "✨ Tạo Mùa Mới"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

