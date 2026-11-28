"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PLAYER_ACTIVITY_CATEGORY_META,
  PlayerActivityLogCategory,
  PlayerGameplayActivityLog,
  formatCompactCurrency,
  formatSignedDelta,
  getPlayerActivityActionLabel,
  getPlayerActivityCategoryMeta,
  playerDataService,
} from "@/services/playerData.service";
import { soundEngine } from "@/services/audio.service";

interface PlayerActivityLogsPanelProps {
  serverId: string;
  targetUid?: string;
  targetInGameName?: string;
  showPlayerColumn?: boolean;
  onSelectPlayerUid?: (uid: string) => void;
}

const CATEGORY_FILTER_ORDER: Array<"ALL" | PlayerActivityLogCategory> = [
  "ALL",
  "GACHA",
  "BATTLE",
  "HERO",
  "EQUIPMENT",
  "ITEM",
  "MAIL",
  "GIFTCODE",
  "AUTH",
  "ADMIN",
];

function formatDateTimeVi(isoOrMs: string | number): string {
  if (!isoOrMs) return "—";
  const d = new Date(isoOrMs);
  if (Number.isNaN(d.getTime())) return String(isoOrMs);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderMetadataSummaryBadges(
  metadata: Record<string, unknown>
): Array<{ label: string; value: string }> {
  if (!metadata || typeof metadata !== "object") return [];
  const items: Array<{ label: string; value: string }> = [];

  const addIfPresent = (key: string, label: string, suffix = "") => {
    const val = metadata[key];
    if (val === undefined || val === null || val === "") return;
    if (Array.isArray(val)) {
      if (val.length > 0) {
        items.push({ label, value: `${val.join(", ")}${suffix}` });
      }
      return;
    }
    if (typeof val === "boolean") {
      items.push({ label, value: val ? "Có" : "Không" });
      return;
    }
    if (typeof val === "number") {
      items.push({
        label,
        value: `${val.toLocaleString("vi-VN")}${suffix}`,
      });
      return;
    }
    if (typeof val === "string") {
      items.push({ label, value: `${val}${suffix}` });
    }
  };

  addIfPresent("stageId", "Ải chiến dịch");
  addIfPresent("starsWon", "Số sao đạt", " ★");
  addIfPresent("energyCost", "Năng lượng tốn");
  addIfPresent("bannerTitle", "Banner");
  addIfPresent("bannerId", "Mã Banner");
  addIfPresent("rollCount", "Số lượt quay");
  addIfPresent("newHeroIds", "Tướng mới nhận");
  addIfPresent("heroId", "Chiến binh");
  if (
    typeof metadata.oldLevel === "number" &&
    typeof metadata.newLevel === "number"
  ) {
    items.push({
      label: "Cấp độ",
      value: `Lv.${metadata.oldLevel} → Lv.${metadata.newLevel}`,
    });
  }
  addIfPresent("totalExpGained", "EXP cộng thêm", " EXP");
  addIfPresent("equipUid", "Mã trang bị");
  addIfPresent("templateId", "Mẫu trang bị");
  addIfPresent("slot", "Vị trí ô");
  addIfPresent("code", "Mã Giftcode");
  addIfPresent("mailId", "Mã thư");
  addIfPresent("claimedCount", "Số thư nhận");
  addIfPresent("totalCombatPower", "Lực chiến", " CP");
  addIfPresent("reason", "Lý do");
  addIfPresent("performedBy", "Người thực hiện");

  return items;
}

export default function PlayerActivityLogsPanel({
  serverId,
  targetUid = "all",
  targetInGameName,
  showPlayerColumn = false,
  onSelectPlayerUid,
}: PlayerActivityLogsPanelProps) {
  const [logs, setLogs] = useState<PlayerGameplayActivityLog[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const [nextCursor, setNextCursor] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | PlayerActivityLogCategory
  >("ALL");
  const [searchInput, setSearchInput] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = useCallback(
    async (cursor = "", append = false) => {
      if (!serverId) return;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      try {
        const isSinglePlayer =
          Boolean(targetUid) && targetUid.toLowerCase() !== "all";
        const res = isSinglePlayer
          ? await playerDataService.getPlayerGameplayActivityLogs(
              serverId,
              targetUid,
              {
                category: selectedCategory,
                search: appliedSearch,
                limit: 50,
                startAfterCreatedAt: cursor || undefined,
              }
            )
          : await playerDataService.getServerGameplayActivityLogs(serverId, {
              targetUid: "all",
              category: selectedCategory,
              search: appliedSearch,
              limit: 50,
              startAfterCreatedAt: cursor || undefined,
            });

        if (append) {
          setLogs((prev) => {
            const seen = new Set(prev.map((l) => `${l.UserId}:${l.LogId}`));
            const merged = [...prev];
            for (const item of res.logs) {
              const key = `${item.UserId}:${item.LogId}`;
              if (!seen.has(key)) {
                seen.add(key);
                merged.push(item);
              }
            }
            return merged;
          });
        } else {
          setLogs(res.logs);
          setCategoryCounts(res.categoryCounts || {});
        }
        setNextCursor(res.nextCursor || "");
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Không thể tải nhật ký hoạt động người chơi."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [serverId, targetUid, selectedCategory, appliedSearch]
  );

  useEffect(() => {
    void loadLogs("", false);
  }, [loadLogs]);

  const totalCountInCategories = useMemo(() => {
    return Object.values(categoryCounts).reduce((sum, n) => sum + n, 0);
  }, [categoryCounts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setAppliedSearch(searchInput.trim());
  };

  return (
    <div className="space-y-4">
      {/* Thanh bộ lọc Danh mục hành động & Tìm kiếm */}
      <div className="p-4 rounded-2xl bg-[#090d24] border border-white/10 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_FILTER_ORDER.map((cat) => {
              const active = selectedCategory === cat;
              const count =
                cat === "ALL"
                  ? totalCountInCategories || logs.length
                  : categoryCounts[cat] || 0;
              const label =
                cat === "ALL"
                  ? "Tất Cả"
                  : PLAYER_ACTIVITY_CATEGORY_META[cat]?.shortLabel || cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 border ${
                    active
                      ? "bg-[#3fe9d6] text-[#050814] border-[#3fe9d6] font-bold shadow-[0_0_12px_rgba(63,233,214,0.25)]"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      active
                        ? "bg-black/20 text-[#050814] font-extrabold"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              soundEngine.playClick();
              void loadLogs("", false);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Làm Mới Nhật Ký"}
          </button>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                targetInGameName
                  ? `Tìm hoạt động của ${targetInGameName} theo nội dung, tên vật phẩm, mã ải, Banner, Giftcode...`
                  : "Tìm theo tên nhân vật, nội dung hành động, vật phẩm, mã ải, Banner, Giftcode..."
              }
              className="w-full px-4 py-2 rounded-xl bg-[#060814] border border-white/10 focus:border-[#3fe9d6] text-xs font-mono text-white placeholder-slate-500 outline-none"
            />
            {(searchInput || appliedSearch) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setAppliedSearch("");
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono font-bold cursor-pointer shrink-0"
          >
            Tìm Kiếm
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs font-mono text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Danh sách bản ghi ActivityLogs */}
      {loading ? (
        <div className="py-14 rounded-2xl bg-[#090d24]/80 border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Đang truy vấn nhật ký hoạt động người chơi trên máy chủ{" "}
            {serverId.toUpperCase()}...
          </span>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-14 px-6 rounded-2xl bg-[#090d24]/70 border border-dashed border-white/15 text-center space-y-2">
          <div className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
            Chưa Có Bản Ghi Nhật Ký Hoạt Động Nào
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Không tìm thấy lịch sử hoạt động khớp với điều kiện lọc hiện tại trên máy chủ{" "}
            <strong>{serverId.toUpperCase()}</strong>. Các hành động trong game (triệu hồi Gacha, vượt ải, nâng cấp tướng, cường hóa trang bị, nhận thư, nhập Giftcode...) sẽ tự động ghi nhận tại đây theo thời gian thực.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const catMeta = getPlayerActivityCategoryMeta(log.Category);
            const actionLabel = getPlayerActivityActionLabel(log.Action);
            const wDelta = log.WalletDelta;
            const hasWalletChange =
              Boolean(wDelta) &&
              (wDelta!.GoldChange !== 0 ||
                wDelta!.GemsChange !== 0 ||
                wDelta!.EnergyChange !== 0);
            const consumedItems = log.ItemsDelta?.Consumed || [];
            const rewardedItems = log.ItemsDelta?.Rewarded || [];
            const metaBadges = renderMetadataSummaryBadges(log.Metadata);
            const isExpanded = expandedLogId === `${log.UserId}:${log.LogId}`;

            return (
              <div
                key={`${log.UserId}:${log.LogId}`}
                className="p-4 rounded-2xl bg-[#090d24]/95 border border-white/10 hover:border-white/25 transition-all space-y-3"
              >
                {/* Dòng 1: Thời gian, Phân loại, Hành động, Người chơi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${catMeta.badgeClass}`}
                    >
                      {catMeta.label}
                    </span>

                    <span className="text-xs font-bold text-white">
                      {actionLabel}
                    </span>

                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
                      {log.Action}
                    </span>

                    {showPlayerColumn && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectPlayerUid) {
                            soundEngine.playClick();
                            onSelectPlayerUid(log.UserId);
                          }
                        }}
                        title="Bấm để lọc riêng lịch sử của người chơi này"
                        className="px-2.5 py-0.5 rounded-lg bg-[#3fe9d6]/12 hover:bg-[#3fe9d6]/20 border border-[#3fe9d6]/35 text-[11px] font-mono text-[#3fe9d6] font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Nhân vật: {log.InGameName}</span>
                        {log.PlayerCode && (
                          <span className="text-slate-300">
                            (#{log.PlayerCode})
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
                    <span>
                      {formatDateTimeVi(log.CreatedAt || log.TimestampMs)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-[10px] text-emerald-300 font-bold">
                      {log.Status}
                    </span>
                  </div>
                </div>

                {/* Dòng 2: Tóm tắt nội dung hành động (Summary) */}
                <div className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                  {log.Summary || actionLabel}
                </div>

                {/* Dòng 3: Đối chiếu Biến động Ví Tiền Tệ (WalletDelta) & Vật phẩm (ItemsDelta) */}
                {(hasWalletChange ||
                  consumedItems.length > 0 ||
                  rewardedItems.length > 0) && (
                  <div className="p-3 rounded-xl bg-[#060814] border border-white/10 space-y-2.5 text-xs font-mono">
                    {hasWalletChange && wDelta && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          Biến động Tiền tệ &amp; Năng lượng:
                        </span>

                        {wDelta.GoldChange !== 0 && (
                          <span
                            className={`px-2.5 py-1 rounded-lg border ${
                              wDelta.GoldChange > 0
                                ? "bg-emerald-500/12 border-emerald-500/35 text-emerald-300"
                                : "bg-rose-500/12 border-rose-500/35 text-rose-300"
                            }`}
                          >
                            Vàng: {formatCompactCurrency(wDelta.GoldBefore)} →{" "}
                            {formatCompactCurrency(wDelta.GoldAfter)}{" "}
                            <strong>
                              ({formatSignedDelta(wDelta.GoldChange)})
                            </strong>
                          </span>
                        )}

                        {wDelta.GemsChange !== 0 && (
                          <span
                            className={`px-2.5 py-1 rounded-lg border ${
                              wDelta.GemsChange > 0
                                ? "bg-[#3fe9d6]/12 border-[#3fe9d6]/35 text-[#3fe9d6]"
                                : "bg-rose-500/12 border-rose-500/35 text-rose-300"
                            }`}
                          >
                            Ngọc: {formatCompactCurrency(wDelta.GemsBefore)} →{" "}
                            {formatCompactCurrency(wDelta.GemsAfter)}{" "}
                            <strong>
                              ({formatSignedDelta(wDelta.GemsChange)})
                            </strong>
                          </span>
                        )}

                        {wDelta.EnergyChange !== 0 && (
                          <span
                            className={`px-2.5 py-1 rounded-lg border ${
                              wDelta.EnergyChange > 0
                                ? "bg-emerald-500/12 border-emerald-500/35 text-emerald-300"
                                : "bg-amber-500/12 border-amber-500/35 text-amber-300"
                            }`}
                          >
                            Thể lực: {wDelta.EnergyBefore} →{" "}
                            {wDelta.EnergyAfter}{" "}
                            <strong>
                              ({formatSignedDelta(wDelta.EnergyChange)})
                            </strong>
                          </span>
                        )}
                      </div>
                    )}

                    {consumedItems.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-rose-300 font-semibold">
                          Tiêu hao / Thu hồi:
                        </span>
                        {consumedItems.map((it, idx) => (
                          <span
                            key={`c-${it.ItemId}-${idx}`}
                            className="px-2.5 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-200 text-[11px]"
                          >
                            -{it.Quantity.toLocaleString("vi-VN")}x{" "}
                            <strong>{it.ItemName}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {rewardedItems.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-emerald-300 font-semibold">
                          Nhận vào Túi đồ:
                        </span>
                        {rewardedItems.map((it, idx) => (
                          <span
                            key={`r-${it.ItemId}-${idx}`}
                            className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-[11px]"
                          >
                            +{it.Quantity.toLocaleString("vi-VN")}x{" "}
                            <strong>{it.ItemName}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dòng 4: Thông tin ngữ cảnh (Metadata) */}
                {(metaBadges.length > 0 ||
                  Object.keys(log.Metadata || {}).length > 0) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                      {metaBadges.map((b, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300"
                        >
                          <span className="text-slate-400">{b.label}:</span>{" "}
                          <strong className="text-white">{b.value}</strong>
                        </span>
                      ))}
                    </div>

                    {Object.keys(log.Metadata || {}).length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setExpandedLogId(
                            isExpanded ? null : `${log.UserId}:${log.LogId}`
                          );
                        }}
                        className="text-[11px] font-mono text-[#3fe9d6] hover:underline cursor-pointer shrink-0"
                      >
                        {isExpanded
                          ? "Ẩn chi tiết thông số ▲"
                          : "Xem thông số chi tiết ▼"}
                      </button>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <pre className="p-3 rounded-xl bg-[#050712] border border-white/10 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(log.Metadata, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}

          {/* Nút phân trang Tải thêm */}
          {nextCursor && logs.length >= 50 && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => {
                  soundEngine.playClick();
                  void loadLogs(nextCursor, true);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#3fe9d6]/40 text-xs font-mono font-bold text-[#3fe9d6] cursor-pointer disabled:opacity-50"
              >
                {loadingMore
                  ? "Đang tải thêm nhật ký..."
                  : "Tải Thêm Nhật Ký Cũ Hơn ↓"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
