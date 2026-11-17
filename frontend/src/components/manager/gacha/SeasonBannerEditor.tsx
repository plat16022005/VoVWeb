"use client";

import { useState } from "react";
import {
  GachaApiError,
  GachaHeroReference,
} from "@/services/gacha.service";
import {
  BANNER_TYPE_OPTIONS,
  BannerType,
  GachaBannerConfig,
  GachaSeasonDocument,
  HERO_RARITY_KEYS,
  HeroRarityKey,
  RARITY_STYLE_META,
  createDefaultBanner,
  isoToLocalDateTimeInput,
  localDateTimeInputToUtcIso,
} from "@/data/gacha";
import { GameItemConfig } from "@/services/itemConfig.service";
import { deleteGachaTempImages } from "@/services/r2Upload.service";
import { soundEngine } from "@/services/audio.service";
import BannerImageUploader from "./BannerImageUploader";
import ItemSelectorField from "./ItemSelectorField";
import BannerPoolSection from "./BannerPoolSection";

interface SeasonBannerEditorProps {
  season: GachaSeasonDocument;
  initialBanner: GachaBannerConfig | null; // null = creating new banner
  heroes: GachaHeroReference[];
  items: GameItemConfig[];
  loadingRefs: boolean;
  readOnly?: boolean;
  onCancel: () => void;
  onSave: (
    banner: GachaBannerConfig,
    meta: {
      isNew: boolean;
      oldBannerImageKey?: string;
      oldBannerTabImageKey?: string;
    }
  ) => Promise<void>;
}

type EditorTab =
  | "identity"
  | "media"
  | "cost_pity"
  | "rates_pool"
  | "duplicate"
  | "json";

export default function SeasonBannerEditor({
  season,
  initialBanner,
  heroes,
  items,
  loadingRefs,
  readOnly = false,
  onCancel,
  onSave,
}: SeasonBannerEditorProps) {
  const isNew = !initialBanner;

  const [activeTab, setActiveTab] = useState<EditorTab>("identity");
  const [saving, setSaving] = useState(false);
  const [tempUploadedKeys, setTempUploadedKeys] = useState<string[]>([]);

  const [draft, setDraft] = useState<GachaBannerConfig>(() => {
    if (initialBanner) {
      return JSON.parse(JSON.stringify(initialBanner));
    }
    const nextSort = Object.keys(season.Banners || {}).length + 1;
    return createDefaultBanner(
      "limited",
      "",
      nextSort,
      season.StartTime || null,
      season.EndTime || null
    );
  });

  const [isPermanentSchedule, setIsPermanentSchedule] = useState<boolean>(() =>
    initialBanner
      ? initialBanner.StartTime === null && initialBanner.EndTime === null
      : false
  );

  const [validationErrorState, setValidationErrorState] = useState<{
    draftRef: GachaBannerConfig;
    permanentRef: boolean;
    errors: string[];
  } | null>(null);

  const validationErrors =
    validationErrorState &&
    validationErrorState.draftRef === draft &&
    validationErrorState.permanentRef === isPermanentSchedule
      ? validationErrorState.errors
      : [];

  const setValidationErrors = (errors: string[]) => {
    setValidationErrorState(
      errors.length > 0
        ? { draftRef: draft, permanentRef: isPermanentSchedule, errors }
        : null
    );
  };

  const handleBannerTypeChange = (nextType: BannerType) => {
    const meta = BANNER_TYPE_OPTIONS.find((o) => o.value === nextType);
    setDraft((prev) => {
      const next = { ...prev, BannerType: nextType };
      if (isNew && meta) {
        next.Pity = {
          ...prev.Pity,
          SharedPityGroup: meta.defaultPityGroup,
          EnableRateUpGuarantee: nextType === "limited",
          RateUpWinChance: nextType === "limited" ? 0.5 : 0,
        };
        if (nextType === "standard") {
          next.StartTime = null;
          next.EndTime = null;
          next.Cost = {
            ...prev.Cost,
            AllowGemFallback: false,
            GemCostPerRoll: 0,
          };
          setIsPermanentSchedule(true);
        } else {
          setIsPermanentSchedule(false);
          if (!prev.StartTime && season.StartTime) next.StartTime = season.StartTime;
          if (!prev.EndTime && season.EndTime) next.EndTime = season.EndTime;
        }
        if (nextType === "novice" && prev.MaxTotalRolls === 0) {
          next.MaxTotalRolls = 50;
        }
      }
      return next;
    });
  };

  const handleTogglePermanent = (permanent: boolean) => {
    setIsPermanentSchedule(permanent);
    setDraft((prev) => ({
      ...prev,
      StartTime: permanent ? null : prev.StartTime || season.StartTime || null,
      EndTime: permanent ? null : prev.EndTime || season.EndTime || null,
    }));
  };

  const handleCancelAndCleanup = async () => {
    soundEngine.playClick();
    // Dọn các ảnh mới upload tạm trong phiên sửa nếu người dùng bấm Hủy mà không lưu
    const initialMainKey = initialBanner?.BannerImageKey || "";
    const initialTabKey = initialBanner?.BannerTabImageKey || "";
    const unusedTempKeys = tempUploadedKeys.filter(
      (k) => k && k !== initialMainKey && k !== initialTabKey
    );
    if (unusedTempKeys.length > 0) {
      await deleteGachaTempImages(unusedTempKeys);
    }
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    setSaving(true);
    setValidationErrors([]);
    try {
      await onSave(draft, {
        isNew,
        oldBannerImageKey: initialBanner?.BannerImageKey,
        oldBannerTabImageKey: initialBanner?.BannerTabImageKey,
      });

      // Dọn các ảnh tạm trung gian (nếu admin upload nhiều lần trong phiên chỉnh sửa trước khi bấm Lưu)
      const orphanTemps = tempUploadedKeys.filter(
        (k) =>
          k &&
          k !== draft.BannerImageKey &&
          k !== (draft.BannerTabImageKey || "") &&
          k !== (initialBanner?.BannerImageKey || "") &&
          k !== (initialBanner?.BannerTabImageKey || "")
      );
      if (orphanTemps.length > 0) {
        await deleteGachaTempImages(orphanTemps);
      }

      soundEngine.playSuccess();
    } catch (err: unknown) {
      if (err instanceof GachaApiError && err.errors.length > 0) {
        setValidationErrors(err.errors);
      } else {
        setValidationErrors([
          err instanceof Error && err.message
            ? err.message
            : "Không thể lưu cấu hình Banner Gacha.",
        ]);
      }
      soundEngine.playClick();
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: EditorTab; label: string; icon: string }[] = [
    { id: "identity", label: "1. Định Danh & Lịch", icon: "🏷️" },
    { id: "media", label: "2. Hình Ảnh CDN", icon: "🖼️" },
    { id: "cost_pity", label: "3. Chi Phí & Pity", icon: "🎫" },
    { id: "rates_pool", label: "4. Tỷ Lệ & Pool", icon: "✨" },
    { id: "duplicate", label: "5. Quà Trùng", icon: "♻️" },
    { id: "json", label: "Xem JSON", icon: "{ }" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      {/* Top Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/95 border border-[#f5c767]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleCancelAndCleanup}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white cursor-pointer shrink-0"
          >
            ← Quay lại mùa
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wide">
                {readOnly
                  ? `Chi Tiết Banner: ${draft.Title || draft.BannerId}`
                  : isNew
                  ? "Tạo Mới Banner Gacha"
                  : `Chỉnh Sửa Banner: ${draft.Title || draft.BannerId}`}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30">
                Mùa: {season.SeasonId}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              {isNew
                ? "Thiết lập đầy đủ thông tin, ảnh, chi phí, pity và pool tướng cho banner mới."
                : `Cập nhật riêng banner "${draft.BannerId}" (tăng Version mùa +1, giữ nguyên các banner khác).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
              validationErrors.length > 0
                ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                : "bg-[#3fe9d6]/10 text-[#3fe9d6] border-[#3fe9d6]/30"
            }`}
          >
            {validationErrors.length > 0
              ? `⚠️ ${validationErrors.length} lỗi cấu hình`
              : `Tổng tỷ lệ: ${HERO_RARITY_KEYS.reduce(
                  (sum, k) => sum + (Number(draft.RarityRates[k]) || 0) * 100,
                  0
                ).toFixed(2)}%`}
          </span>

          {!readOnly && (
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] hover:brightness-110 text-[#060814] text-xs font-mono font-bold shadow-[0_0_20px_rgba(245,199,103,0.35)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#060814] border-t-transparent rounded-full animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Lưu Banner</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 space-y-2">
          <div className="text-xs font-mono font-bold text-rose-300 flex items-center gap-2">
            <span>⚠️</span>
            <span>Không thể lưu vì cấu hình chưa đạt quy chuẩn kiểm tra:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-200 font-sans">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                active
                  ? "bg-[#3fe9d6] text-[#060814] shadow-[0_0_15px_rgba(63,233,214,0.3)]"
                  : "bg-[#090d24] text-slate-300 border border-white/10 hover:text-white hover:border-white/25"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#090d24]/95 border border-white/10 shadow-xl space-y-6">
        {/* TAB 1: IDENTITY & SCHEDULE */}
        {activeTab === "identity" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold">
                  Mã Banner (BannerId) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={draft.BannerId}
                  disabled={!isNew || readOnly}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      BannerId: e.target.value.toLowerCase(),
                    }))
                  }
                  placeholder="banner_s01_limited_hitomi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none disabled:opacity-50"
                />
                <p className="text-[10px] font-mono text-slate-500">
                  Chỉ chữ thường không dấu, số, gạch dưới (`^[a-z0-9_]+$`)
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold">
                  Loại Banner (BannerType)
                </label>
                <select
                  value={draft.BannerType}
                  disabled={readOnly}
                  onChange={(e) =>
                    handleBannerTypeChange(e.target.value as BannerType)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none"
                >
                  {BANNER_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold">
                  Tiêu Đề Chính (Title) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={draft.Title}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, Title: e.target.value }))
                  }
                  placeholder="Ánh Sáng Valkyria"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold">
                  Mô Tả Ngắn (Subtitle)
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={draft.Subtitle}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, Subtitle: e.target.value }))
                  }
                  placeholder="Tăng tỷ lệ triệu hồi Hitomi (SSR)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300 font-semibold">
                Nội Dung Thể Lệ Popup [?] (Description)
              </label>
              <textarea
                rows={3}
                disabled={readOnly}
                value={draft.Description}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, Description: e.target.value }))
                }
                placeholder="Mỗi 10 lượt đảm bảo ít nhất 1 tướng SR trở lên..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs text-white outline-none resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold">
                  Thứ Tự Tab (SortOrder)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={readOnly}
                  value={draft.SortOrder}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      SortOrder: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold">
                  Giới Hạn Lượt Quay / TK (MaxTotalRolls)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={readOnly}
                  value={draft.MaxTotalRolls}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      MaxTotalRolls: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none"
                />
                <p className="text-[10px] font-mono text-slate-500">
                  0 = không giới hạn; VD: 50 cho Tân thủ
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold">
                  Trạng Thái Banner (IsActive)
                </label>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() =>
                    setDraft((p) => ({ ...p, IsActive: !p.IsActive }))
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer ${
                    draft.IsActive
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-800/70 border-white/10 text-slate-400"
                  }`}
                >
                  <span>{draft.IsActive ? "🟢 Đang Mở" : "⏸️ Tạm Tắt"}</span>
                  <span>{draft.IsActive ? "ON" : "OFF"}</span>
                </button>
              </div>
            </div>

            {/* Schedule Block */}
            <div className="p-4 rounded-2xl bg-[#060814]/80 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-mono font-bold text-[#f5c767] uppercase">
                    Lịch Mở Riêng Của Banner
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Banner Thường (Standard) thường đặt mở vĩnh viễn; Banner Limited đặt theo thời gian sự kiện.
                  </p>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-mono text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPermanentSchedule}
                        onChange={(e) => handleTogglePermanent(e.target.checked)}
                        className="rounded border-white/20 bg-black/40 text-[#3fe9d6]"
                      />
                      <span>Mở vĩnh viễn (null)</span>
                    </label>
                    {!isPermanentSchedule && season.StartTime && season.EndTime && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            StartTime: season.StartTime,
                            EndTime: season.EndTime,
                          }))
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/15 border border-[#3fe9d6]/30 text-[#3fe9d6] text-[10px] font-mono cursor-pointer"
                      >
                        Lấy theo giờ Mùa
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!isPermanentSchedule && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-300">
                      Thời Gian Mở (StartTime)
                    </label>
                    <input
                      type="datetime-local"
                      disabled={readOnly}
                      value={isoToLocalDateTimeInput(draft.StartTime)}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          StartTime: localDateTimeInputToUtcIso(e.target.value) || null,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                    />
                    {draft.StartTime && (
                      <div className="text-[10px] font-mono text-[#3fe9d6]">
                        UTC: {draft.StartTime}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-300">
                      Thời Gian Đóng (EndTime)
                    </label>
                    <input
                      type="datetime-local"
                      disabled={readOnly}
                      value={isoToLocalDateTimeInput(draft.EndTime)}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          EndTime: localDateTimeInputToUtcIso(e.target.value) || null,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                    />
                    {draft.EndTime && (
                      <div className="text-[10px] font-mono text-[#3fe9d6]">
                        UTC: {draft.EndTime}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA / IMAGES */}
        {activeTab === "media" && (
          <div className="space-y-5">
            <BannerImageUploader
              label="Ảnh Nền Chính Banner (BannerImageUrl)"
              description="Hiển thị chính trên giao diện Triệu Hồi trong Game Client. Tỷ lệ khuyến nghị 16:9."
              imageKind="main"
              recommendedMaxBytes={5 * 1024 * 1024}
              recommendedLabel="<= 5MB"
              seasonId={season.SeasonId}
              bannerId={draft.BannerId}
              imageUrl={draft.BannerImageUrl}
              imageKey={draft.BannerImageKey}
              required
              disabled={readOnly}
              onTempUploadedKey={(key) =>
                setTempUploadedKeys((prev) => [...prev, key])
              }
              onChange={(url, key) =>
                setDraft((p) => ({
                  ...p,
                  BannerImageUrl: url,
                  BannerImageKey: key,
                }))
              }
            />

            <BannerImageUploader
              label="Ảnh Nút Tab Nhỏ (BannerTabImageUrl)"
              description="Ảnh thu nhỏ cho danh sách tab chuyển đổi giữa các banner trên UI Game."
              imageKind="tab"
              recommendedMaxBytes={5 * 1024 * 1024}
              recommendedLabel="<= 5MB"
              seasonId={season.SeasonId}
              bannerId={draft.BannerId}
              imageUrl={draft.BannerTabImageUrl || ""}
              imageKey={draft.BannerTabImageKey || ""}
              disabled={readOnly}
              onTempUploadedKey={(key) =>
                setTempUploadedKeys((prev) => [...prev, key])
              }
              onChange={(url, key) =>
                setDraft((p) => ({
                  ...p,
                  BannerTabImageUrl: url || undefined,
                  BannerTabImageKey: key || undefined,
                }))
              }
            />

            <div className="p-4 rounded-2xl bg-[#060814]/80 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold">
                  Key Ảnh Fallback Đóng Gói Sẵn (BannerArtKey — Tùy chọn)
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={draft.BannerArtKey || ""}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      BannerArtKey: e.target.value || undefined,
                    }))
                  }
                  placeholder="banner_bg_hitomi"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Dùng làm ảnh dự phòng nội bộ trên Unity Client nếu người chơi gặp lỗi tải mạng.
                </p>
              </div>

              {/* Live Card Preview */}
              <div
                className="relative rounded-2xl overflow-hidden border-2 bg-[#04050d] h-36 flex items-end p-4"
                style={{
                  borderColor:
                    BANNER_TYPE_OPTIONS.find(
                      (o) => o.value === draft.BannerType
                    )?.defaultColor || "#F4D03F",
                }}
              >
                {draft.BannerImageUrl && (
                  <img
                    src={draft.BannerImageUrl}
                    alt="Banner preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-75"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#04050d] via-[#04050d]/40 to-transparent" />
                <div className="relative z-10 w-full">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#f5c767]">
                    {draft.BannerType} · #{draft.SortOrder}
                  </div>
                  <div className="text-base font-black text-white font-[family-name:var(--font-rajdhani)] truncate">
                    {draft.Title || "Tiêu đề Banner"}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {draft.Subtitle || "Mô tả ngắn banner triệu hồi"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COST & PITY */}
        {activeTab === "cost_pity" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COST */}
            <div className="p-5 rounded-2xl bg-[#060814]/80 border border-white/10 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h4 className="text-xs font-mono font-bold text-[#f5c767] uppercase tracking-wider">
                  Chi Phí Triệu Hồi (Cost)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chọn vật phẩm vé triệu hồi từ danh mục Vật Phẩm & cấu hình quy đổi Gems.
                </p>
              </div>

              <ItemSelectorField
                label="Vật Phẩm Vé Triệu Hồi (TicketItemId) *"
                value={draft.Cost.TicketItemId}
                items={items}
                prioritizeTicketType4
                disabled={readOnly}
                loading={loadingRefs}
                onChange={(val) =>
                  setDraft((p) => ({
                    ...p,
                    Cost: { ...p.Cost, TicketItemId: val },
                  }))
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-300">
                    Số Vé / 1 Lượt (TicketPerRoll)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={readOnly}
                    value={draft.Cost.TicketPerRoll}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Cost: {
                          ...p.Cost,
                          TicketPerRoll: Math.max(1, Number(e.target.value) || 1),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-300">
                    Số Lượt Quay Nhiều (MultiRollCount)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={readOnly}
                    value={draft.Cost.MultiRollCount}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Cost: {
                          ...p.Cost,
                          MultiRollCount: Math.max(1, Number(e.target.value) || 10),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090d24] border border-white/10 space-y-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Cho phép dùng Gems khi thiếu vé (AllowGemFallback)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Tự động trừ Gems trong ví nếu người chơi không đủ vé.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={draft.Cost.AllowGemFallback}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Cost: {
                          ...p.Cost,
                          AllowGemFallback: e.target.checked,
                          GemCostPerRoll: e.target.checked
                            ? p.Cost.GemCostPerRoll || 160
                            : 0,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#f5c767]"
                  />
                </label>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-300">
                    Số Gems / 1 Lượt (GemCostPerRoll)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly || !draft.Cost.AllowGemFallback}
                    value={draft.Cost.GemCostPerRoll}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Cost: {
                          ...p.Cost,
                          GemCostPerRoll: Math.max(0, Number(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#04050d] border border-white/15 text-xs font-mono text-white outline-none disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            {/* PITY */}
            <div className="p-5 rounded-2xl bg-[#060814]/80 border border-white/10 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h4 className="text-xs font-mono font-bold text-[#3fe9d6] uppercase tracking-wider">
                  Cơ Chế Bảo Hiểm (Pity)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Thiết lập nhóm dùng chung Pity, Soft/Hard Pity và bảo hiểm lệch banner 50/50.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">
                  Nhóm Dùng Chung Pity (SharedPityGroup) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={draft.Pity.SharedPityGroup}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Pity: {
                          ...p.Pity,
                          SharedPityGroup: e.target.value.toLowerCase(),
                        },
                      }))
                    }
                    placeholder="limited_hero"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                  />
                </div>
                {!readOnly && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["limited_hero", "standard_hero", "novice_hero"].map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            Pity: { ...p.Pity, SharedPityGroup: grp },
                          }))
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          draft.Pity.SharedPityGroup === grp
                            ? "bg-[#3fe9d6]/20 text-[#3fe9d6] border-[#3fe9d6]/40"
                            : "bg-white/5 text-slate-400 border-white/10"
                        }`}
                      >
                        {grp}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-300">
                    Mốc Soft Pity (SoftPityStart)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly}
                    value={draft.Pity.SoftPityStart}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Pity: {
                          ...p.Pity,
                          SoftPityStart: Math.max(0, Number(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-300">
                    Bước Tăng Tỷ Lệ (SoftPityStepRate)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    disabled={readOnly}
                    value={draft.Pity.SoftPityStepRate}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Pity: {
                          ...p.Pity,
                          SoftPityStepRate: Number(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-300">
                    Mốc Hard Pity (HardPityCount)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly}
                    value={draft.Pity.HardPityCount}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Pity: {
                          ...p.Pity,
                          HardPityCount: Math.max(0, Number(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-300">
                    Bảo Hiểm SR Mỗi N Lượt
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly}
                    value={draft.Pity.GuaranteedSrEvery}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Pity: {
                          ...p.Pity,
                          GuaranteedSrEvery: Math.max(0, Number(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090d24] border border-white/10 space-y-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Bảo hiểm 50/50 lệch banner (EnableRateUpGuarantee)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Nếu lần SSR/UR nổ lệch tiêu điểm, lần kế tiếp chắc chắn 100% trúng Rate-Up.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={draft.Pity.EnableRateUpGuarantee}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Pity: {
                          ...p.Pity,
                          EnableRateUpGuarantee: e.target.checked,
                          RateUpWinChance: e.target.checked
                            ? p.Pity.RateUpWinChance || 0.5
                            : 0,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#3fe9d6]"
                  />
                </label>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-slate-300">
                    Tỷ Lệ Trúng Rate-Up (RateUpWinChance, VD: 0.5 = 50%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={readOnly}
                    value={draft.Pity.RateUpWinChance}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        Pity: {
                          ...p.Pity,
                          RateUpWinChance: Number(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#04050d] border border-white/15 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RATES & POOL */}
        {activeTab === "rates_pool" && (
          <BannerPoolSection
            banner={draft}
            heroes={heroes}
            loadingHeroes={loadingRefs}
            readOnly={readOnly}
            onChangeRates={(rates) =>
              setDraft((p) => ({ ...p, RarityRates: rates }))
            }
            onChangeRateUp={(ids) =>
              setDraft((p) => ({ ...p, RateUpHeroIds: ids }))
            }
            onChangePool={(pool) => setDraft((p) => ({ ...p, Pool: pool }))}
          />
        )}

        {/* TAB 5: DUPLICATE CONVERSION */}
        {activeTab === "duplicate" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-mono font-bold text-[#f5c767] uppercase tracking-wider">
                Quy Đổi Quà Khi Trùng Tướng Đã Sở Hữu (DuplicateConversion)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cấu hình số mảnh tướng (ShardAmount) và vật phẩm thưởng thêm (BonusItemId, BonusQty) theo 4 bậc phẩm chất.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HERO_RARITY_KEYS.map((tier: HeroRarityKey) => {
                const meta = RARITY_STYLE_META[tier];
                const rule = draft.DuplicateConversion[tier];

                return (
                  <div
                    key={tier}
                    className="p-4 rounded-2xl bg-[#060814]/80 border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${meta.bgClass} ${meta.borderClass} ${meta.textClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Bậc {tier}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono text-slate-300">
                          Số Mảnh Tướng (ShardAmount)
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={readOnly}
                          value={rule.ShardAmount}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              DuplicateConversion: {
                                ...p.DuplicateConversion,
                                [tier]: {
                                  ...rule,
                                  ShardAmount: Math.max(0, Number(e.target.value) || 0),
                                },
                              },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono text-slate-300">
                          Số Lượng Quà Thêm (BonusQty)
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={readOnly}
                          value={rule.BonusQty}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              DuplicateConversion: {
                                ...p.DuplicateConversion,
                                [tier]: {
                                  ...rule,
                                  BonusQty: Math.max(0, Number(e.target.value) || 0),
                                },
                              },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none"
                        />
                      </div>
                    </div>

                    <ItemSelectorField
                      label="Vật Phẩm Thưởng Thêm (BonusItemId)"
                      value={rule.BonusItemId}
                      items={items}
                      allowEmpty
                      emptyLabel="-- Không tặng vật phẩm thêm --"
                      disabled={readOnly}
                      loading={loadingRefs}
                      onChange={(val) =>
                        setDraft((p) => ({
                          ...p,
                          DuplicateConversion: {
                            ...p.DuplicateConversion,
                            [tier]: { ...rule, BonusItemId: val },
                          },
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: JSON PREVIEW */}
        {activeTab === "json" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-slate-300">
                Xem trước cấu trúc JSON sẽ lưu vào đường dẫn{" "}
                <span className="text-[#3fe9d6]">
                  Banners.{draft.BannerId || "<bannerId>"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
                  soundEngine.playClick();
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 cursor-pointer"
              >
                📋 Sao chép JSON
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#04050d] border border-white/10 text-[11px] font-mono text-[#3fe9d6] overflow-x-auto max-h-[500px] leading-relaxed">
              {JSON.stringify(draft, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </form>
  );
}

