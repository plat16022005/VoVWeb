"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CAMPAIGN_CATEGORY_OPTIONS,
  GiftcodeCampaignCategory,
  GiftcodeComputedStatus,
  GiftcodeDocument,
  GiftcodeReferenceItem,
  GiftcodeReferenceServer,
  GiftcodeType,
  computeGiftcodeStatus,
  getCampaignCategoryMeta,
  giftcodesService,
} from "@/services/giftcodes.service";
import { soundEngine } from "@/services/audio.service";
import GiftcodeFormModal from "./GiftcodeFormModal";

interface GiftcodesManagerProps {
  canEdit: boolean;
  canToggle: boolean;
  canDelete: boolean;
  onNotify: (message: string) => void;
}

const STATUS_BADGES: Record<
  GiftcodeComputedStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  ACTIVE: {
    label: "ĐANG HOẠT ĐỘNG",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
    dotClass: "bg-emerald-400",
  },
  SCHEDULED: {
    label: "CHỜ KÍCH HOẠT",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/35",
    dotClass: "bg-sky-400",
  },
  DISABLED: {
    label: "TẠM KHÓA",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/35",
    dotClass: "bg-amber-400",
  },
  EXPIRED: {
    label: "HẾT HẠN",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/35",
    dotClass: "bg-slate-400",
  },
  DEPLETED: {
    label: "HẾT LƯỢT",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/35",
    dotClass: "bg-rose-400",
  },
};

function formatDateShort(iso?: string): string {
  if (!iso) return "Không giới hạn";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEffectiveCampaignName(gift: GiftcodeDocument): string {
  return gift.CampaignName?.trim() || "Chiến Dịch Chung (Chưa Gắn Nhóm)";
}

interface CampaignGroupBucket {
  key: string;
  category: GiftcodeCampaignCategory;
  campaignName: string;
  rawCampaignName: string;
  codes: GiftcodeDocument[];
  activeCount: number;
  totalRedemptions: number;
  latestCreatedAt: number;
}

export default function GiftcodesManager({
  canEdit,
  canToggle,
  canDelete,
  onNotify,
}: GiftcodesManagerProps) {
  const [giftcodes, setGiftcodes] = useState<GiftcodeDocument[]>([]);
  const [referenceItems, setReferenceItems] = useState<GiftcodeReferenceItem[]>(
    []
  );
  const [referenceServers, setReferenceServers] = useState<
    GiftcodeReferenceServer[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View mode & Filters
  const [viewMode, setViewMode] = useState<"campaign" | "list">("campaign");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<
    "ALL" | GiftcodeCampaignCategory
  >("ALL");
  const [filterCampaign, setFilterCampaign] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | GiftcodeComputedStatus
  >("ALL");
  const [filterType, setFilterType] = useState<"ALL" | GiftcodeType>("ALL");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"single" | "batch">("single");
  const [formInitCategory, setFormInitCategory] = useState<
    GiftcodeCampaignCategory | undefined
  >(undefined);
  const [formInitCampaignName, setFormInitCampaignName] = useState<
    string | undefined
  >(undefined);
  const [editingGiftcode, setEditingGiftcode] =
    useState<GiftcodeDocument | null>(null);
  const [deletingGiftcode, setDeletingGiftcode] =
    useState<GiftcodeDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [list, refs] = await Promise.all([
        giftcodesService.getAllGiftcodes(),
        giftcodesService
          .getReferences()
          .catch(() => ({ items: [], servers: [] })),
      ]);
      setGiftcodes(list);
      setReferenceItems(refs.items);
      setReferenceServers(refs.servers);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách mã quà tặng từ máy chủ."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      giftcodesService.getAllGiftcodes(),
      giftcodesService.getReferences().catch(() => ({ items: [], servers: [] })),
    ])
      .then(([list, refs]) => {
        if (!active) return;
        setGiftcodes(list);
        setReferenceItems(refs.items);
        setReferenceServers(refs.servers);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách mã quà tặng từ máy chủ."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const existingCampaignNames = useMemo(() => {
    const names = new Set<string>();
    for (const g of giftcodes) {
      if (g.CampaignName?.trim()) {
        names.add(g.CampaignName.trim());
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "vi"));
  }, [giftcodes]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: giftcodes.length };
    for (const opt of CAMPAIGN_CATEGORY_OPTIONS) {
      counts[opt.value] = 0;
    }
    for (const g of giftcodes) {
      const cat = g.CampaignCategory || "EVENT";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [giftcodes]);

  const stats = useMemo(() => {
    let activeCount = 0;
    let totalRedemptions = 0;
    const campaignKeys = new Set<string>();
    for (const g of giftcodes) {
      const st = computeGiftcodeStatus(g);
      if (st === "ACTIVE" || st === "SCHEDULED") activeCount++;
      totalRedemptions += g.CurrentRedemptions || 0;
      campaignKeys.add(
        `${g.CampaignCategory || "EVENT"}::${getEffectiveCampaignName(g)}`
      );
    }
    return {
      total: giftcodes.length,
      campaignCount: campaignKeys.size,
      activeCount,
      totalRedemptions,
    };
  }, [giftcodes]);

  const filteredGiftcodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return giftcodes.filter((g) => {
      if (
        filterCategory !== "ALL" &&
        (g.CampaignCategory || "EVENT") !== filterCategory
      ) {
        return false;
      }
      if (
        filterCampaign !== "ALL" &&
        getEffectiveCampaignName(g) !== filterCampaign
      ) {
        return false;
      }
      if (filterType !== "ALL" && g.CodeType !== filterType) return false;
      if (filterStatus !== "ALL" && computeGiftcodeStatus(g) !== filterStatus) {
        return false;
      }
      if (q) {
        const matchCode = g.Code.toLowerCase().includes(q);
        const matchTitle = g.Title.toLowerCase().includes(q);
        const matchCampaign = (g.CampaignName || "").toLowerCase().includes(q);
        const matchBatch = (g.BatchId || "").toLowerCase().includes(q);
        const matchDesc = (g.Description || "").toLowerCase().includes(q);
        return (
          matchCode || matchTitle || matchCampaign || matchBatch || matchDesc
        );
      }
      return true;
    });
  }, [
    giftcodes,
    filterCategory,
    filterCampaign,
    filterStatus,
    filterType,
    searchQuery,
  ]);

  const campaignGroups = useMemo<CampaignGroupBucket[]>(() => {
    const map = new Map<string, CampaignGroupBucket>();
    for (const g of filteredGiftcodes) {
      const cat = g.CampaignCategory || "EVENT";
      const displayName = getEffectiveCampaignName(g);
      const key = `${cat}::${displayName}`;
      const existing = map.get(key);
      const st = computeGiftcodeStatus(g);
      const isAct = st === "ACTIVE" || st === "SCHEDULED";
      const createdTs = new Date(g.CreatedAt).getTime() || 0;

      if (existing) {
        existing.codes.push(g);
        if (isAct) existing.activeCount += 1;
        existing.totalRedemptions += g.CurrentRedemptions || 0;
        if (createdTs > existing.latestCreatedAt) {
          existing.latestCreatedAt = createdTs;
        }
      } else {
        map.set(key, {
          key,
          category: cat,
          campaignName: displayName,
          rawCampaignName: g.CampaignName?.trim() || "",
          codes: [g],
          activeCount: isAct ? 1 : 0,
          totalRedemptions: g.CurrentRedemptions || 0,
          latestCreatedAt: createdTs,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.latestCreatedAt - a.latestCreatedAt
    );
  }, [filteredGiftcodes]);

  const openCreateModal = (
    mode: "single" | "batch",
    presetCategory?: GiftcodeCampaignCategory,
    presetCampaignName?: string
  ) => {
    soundEngine.playClick();
    setEditingGiftcode(null);
    setFormMode(mode);
    setFormInitCategory(
      presetCategory || (filterCategory !== "ALL" ? filterCategory : undefined)
    );
    setFormInitCampaignName(presetCampaignName);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (gift: GiftcodeDocument) => {
    if (!canToggle) return;
    soundEngine.playClick();
    try {
      const updated = await giftcodesService.toggleGiftcodeActive(
        gift.Code,
        !gift.IsActive
      );
      setGiftcodes((prev) =>
        prev.map((item) => (item.Code === updated.Code ? updated : item))
      );
      onNotify(
        updated.IsActive
          ? `Đã kích hoạt lại mã quà tặng "${updated.Code}".`
          : `Đã tạm khóa mã quà tặng "${updated.Code}".`
      );
    } catch (err: unknown) {
      onNotify(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái mã quà tặng."
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGiftcode || !canDelete) return;
    soundEngine.playClick();
    setIsDeleting(true);
    try {
      await giftcodesService.deleteGiftcode(deletingGiftcode.Code);
      setGiftcodes((prev) =>
        prev.filter((item) => item.Code !== deletingGiftcode.Code)
      );
      soundEngine.playCelestialChime();
      onNotify(`Đã xóa vĩnh viễn mã quà tặng "${deletingGiftcode.Code}".`);
      setDeletingGiftcode(null);
    } catch (err: unknown) {
      onNotify(
        err instanceof Error ? err.message : "Không thể xóa mã quà tặng."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCodesToCsv = (list: GiftcodeDocument[], filePrefix: string) => {
    soundEngine.playClick();
    if (list.length === 0) return;
    const headers = [
      "Mã Giftcode",
      "Danh Mục Chiến Dịch",
      "Tên Chiến Dịch",
      "Tên Gói Quà",
      "Loại Mã",
      "Lô",
      "Trạng Thái",
      "Đã Đổi",
      "Giới Hạn",
      "Vàng",
      "Ngọc",
      "Thể Lực",
      "Vật Phẩm",
      "Hạn Sử Dụng",
    ];
    const rows = list.map((g) => {
      const st = STATUS_BADGES[computeGiftcodeStatus(g)].label;
      const catLabel = getCampaignCategoryMeta(g.CampaignCategory).label;
      const itemsText = g.Rewards.Items.map(
        (it) => `${it.ItemName} x${it.Quantity}`
      ).join("; ");
      return [
        g.Code,
        `"${catLabel.replace(/"/g, '""')}"`,
        `"${getEffectiveCampaignName(g).replace(/"/g, '""')}"`,
        `"${g.Title.replace(/"/g, '""')}"`,
        g.CodeType === "SINGLE_USE" ? "Đơn lẻ" : "Dùng chung",
        g.BatchId || "",
        st,
        g.CurrentRedemptions,
        g.MaxRedemptions || "Không giới hạn",
        g.Rewards.Gold,
        g.Rewards.Gems,
        g.Rewards.Energy,
        `"${itemsText.replace(/"/g, '""')}"`,
        formatDateShort(g.ExpiresAt),
      ].join(",");
    });
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute(
      "download",
      `${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderGiftcodeRows = (
    list: GiftcodeDocument[],
    showCampaignColumn: boolean
  ) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-[#060814] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
            <th className="py-3 px-4">Mã Quà &amp; Gói Thưởng</th>
            {showCampaignColumn && <th className="py-3 px-4">Chiến Dịch</th>}
            <th className="py-3 px-4">Loại &amp; Trạng Thái</th>
            <th className="py-3 px-4">Phần Thưởng Trong Game</th>
            <th className="py-3 px-4">Lượt Đổi</th>
            <th className="py-3 px-4">Hạn Dùng &amp; Máy Chủ</th>
            <th className="py-3 px-4 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {list.map((gift) => {
            const status = computeGiftcodeStatus(gift);
            const stMeta = STATUS_BADGES[status];
            const catMeta = getCampaignCategoryMeta(gift.CampaignCategory);
            return (
              <tr
                key={gift.Code}
                className="hover:bg-white/[0.025] transition-colors"
              >
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        navigator.clipboard.writeText(gift.Code);
                        setCopiedCode(gift.Code);
                        setTimeout(() => setCopiedCode(null), 2000);
                      }}
                      className="font-mono font-bold text-sm text-[#f5c767] hover:underline cursor-pointer"
                      title="Bấm để sao chép mã"
                    >
                      {gift.Code}
                    </button>
                    {copiedCode === gift.Code && (
                      <span className="text-[10px] font-mono text-emerald-300">
                        Đã chép
                      </span>
                    )}
                    {gift.IsPublicDisplay && (
                      <span className="px-1.5 py-0.5 rounded bg-[#3fe9d6]/15 border border-[#3fe9d6]/30 text-[9px] font-mono text-[#3fe9d6]">
                        CÔNG KHAI
                      </span>
                    )}
                  </div>
                  <div className="text-white font-semibold mt-0.5">
                    {gift.Title}
                  </div>
                  {gift.BatchId && (
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Lô: {gift.BatchId}
                    </div>
                  )}
                </td>

                {showCampaignColumn && (
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${catMeta.badgeClass}`}
                    >
                      {catMeta.shortLabel}
                    </span>
                    <div className="text-[11px] text-slate-200 mt-1 max-w-[180px] truncate">
                      {getEffectiveCampaignName(gift)}
                    </div>
                  </td>
                )}

                <td className="py-3.5 px-4 whitespace-nowrap space-y-1.5">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${stMeta.badgeClass}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${stMeta.dotClass}`}
                      />
                      {stMeta.label}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {gift.CodeType === "SINGLE_USE"
                      ? "Đơn lẻ (1 lượt duy nhất)"
                      : `Dùng chung · ${gift.MaxPerUser} lần/tài khoản`}
                  </div>
                </td>

                <td className="py-3.5 px-4 max-w-xs">
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {gift.Rewards.Gold > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/30">
                        {gift.Rewards.Gold.toLocaleString("vi-VN")} Vàng
                      </span>
                    )}
                    {gift.Rewards.Gems > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30">
                        {gift.Rewards.Gems.toLocaleString("vi-VN")} Ngọc
                      </span>
                    )}
                    {gift.Rewards.Energy > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        +{gift.Rewards.Energy.toLocaleString("vi-VN")} Thể Lực
                      </span>
                    )}
                    {gift.Rewards.Items.map((it) => (
                      <span
                        key={it.ItemId}
                        className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-200 border border-purple-500/30"
                      >
                        {it.ItemName} ×{it.Quantity}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                  <div className="text-white font-bold">
                    {gift.CurrentRedemptions.toLocaleString("vi-VN")}
                    {" / "}
                    {gift.MaxRedemptions > 0
                      ? gift.MaxRedemptions.toLocaleString("vi-VN")
                      : "∞"}
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="text-[11px] font-mono text-slate-200">
                    HSD: {formatDateShort(gift.ExpiresAt)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Server:{" "}
                    {gift.AllowedServers.includes("ALL")
                      ? "Tất cả cụm"
                      : gift.AllowedServers.join(", ")}
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setEditingGiftcode(gift);
                          setFormMode("single");
                          setFormInitCategory(undefined);
                          setFormInitCampaignName(undefined);
                          setIsFormOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/35 text-[#3fe9d6] text-xs font-mono font-semibold cursor-pointer"
                      >
                        Sửa
                      </button>
                    )}

                    {canToggle && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(gift)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border cursor-pointer ${
                          gift.IsActive
                            ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-300"
                            : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-300"
                        }`}
                      >
                        {gift.IsActive ? "Khóa" : "Mở"}
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setDeletingGiftcode(gift);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-xs font-mono font-semibold cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}

                    {!canEdit && !canToggle && !canDelete && (
                      <span className="text-[11px] font-mono text-slate-500">
                        Chỉ xem
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#090d24]/95 border border-[#f5c767]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5">
          <div className="text-xs font-mono text-[#f5c767] uppercase tracking-wider">
            Trung Tâm Phát Hành Mã Quà Tặng Theo Chiến Dịch
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wide">
            QUẢN LÝ MÃ QUÀ TẶNG (GIFTCODE) &amp; CHIẾN DỊCH
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Phân loại mã dùng chung và lô mã đơn lẻ theo từng chiến dịch (Ra Mắt, Sự Kiện, Livestream, Đền Bù, Đối Tác/VIP), gắn trực tiếp Vàng, Ngọc, Thể Lực và vật phẩm trong game.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              void loadData();
            }}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-mono cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Làm Mới"}
          </button>

          <button
            type="button"
            onClick={() =>
              exportCodesToCsv(filteredGiftcodes, "vov_giftcodes")
            }
            disabled={filteredGiftcodes.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-mono font-bold cursor-pointer disabled:opacity-40"
          >
            Xuất CSV
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => openCreateModal("batch")}
                className="px-4 py-2.5 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono font-bold cursor-pointer"
              >
                + Sinh Hàng Loạt
              </button>

              <button
                type="button"
                onClick={() => openCreateModal("single")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814] font-bold text-xs font-mono hover:brightness-110 transition-all cursor-pointer"
              >
                + Tạo Mã Quà Mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10">
          <div className="text-xs font-mono text-slate-400">Tổng Mã Quà Tặng</div>
          <div className="text-2xl font-bold text-white font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.total} Mã
          </div>
          <div className="text-[11px] font-mono text-[#3fe9d6] mt-1">
            Toàn bộ chiến dịch &amp; lô đơn lẻ
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-purple-500/25">
          <div className="text-xs font-mono text-slate-400">Số Chiến Dịch</div>
          <div className="text-2xl font-bold text-purple-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.campaignCount} Chiến Dịch
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Phân nhóm theo mục tiêu vận hành
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-emerald-500/25">
          <div className="text-xs font-mono text-slate-400">Đang Hiệu Lực</div>
          <div className="text-2xl font-bold text-emerald-400 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.activeCount} Mã
          </div>
          <div className="text-[11px] font-mono text-emerald-300 mt-1">
            Sẵn sàng cho Chỉ Huy đổi thưởng
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-[#f5c767]/30">
          <div className="text-xs font-mono text-slate-400">Tổng Lượt Đã Đổi</div>
          <div className="text-2xl font-bold text-[#f5c767] font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.totalRedemptions.toLocaleString("vi-VN")} Lượt
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Ghi nhận tự động từ máy chủ game
          </div>
        </div>
      </div>

      {/* Campaign Category Filter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setFilterCategory("ALL");
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            filterCategory === "ALL"
              ? "bg-[#3fe9d6]/15 border-[#3fe9d6] text-white"
              : "bg-[#090d24]/90 border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <div className="text-[10px] font-mono uppercase">Tất Cả Nhóm</div>
          <div className="text-lg font-bold font-mono mt-0.5 text-white">
            {categoryCounts.ALL || 0}
          </div>
        </button>

        {CAMPAIGN_CATEGORY_OPTIONS.map((cat) => {
          const active = filterCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setFilterCategory(cat.value);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                active
                  ? `${cat.badgeClass} ring-1 ring-current`
                  : `bg-[#090d24]/90 ${cat.borderClass} text-slate-300 hover:bg-white/5`
              }`}
            >
              <div className="text-[10px] font-mono uppercase truncate">
                {cat.shortLabel}
              </div>
              <div className="text-lg font-bold font-mono mt-0.5">
                {categoryCounts[cat.value] || 0}
              </div>
            </button>
          );
        })}
      </div>

      {/* View Mode + Status/Campaign/Search Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-[#060814] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setViewMode("campaign");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === "campaign"
                    ? "bg-[#f5c767] text-[#060814]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Nhóm Theo Chiến Dịch ({campaignGroups.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setViewMode("list");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[#3fe9d6] text-[#060814]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Danh Sách Phẳng ({filteredGiftcodes.length})
              </button>
            </div>

            {existingCampaignNames.length > 0 && (
              <select
                value={filterCampaign}
                onChange={(e) => setFilterCampaign(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#060814] border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
              >
                <option value="ALL">Mọi chiến dịch</option>
                {existingCampaignNames.map((name) => (
                  <option key={name} value={name}>
                    Chiến dịch: {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as "ALL" | GiftcodeType)
              }
              className="px-3 py-2 rounded-xl bg-[#060814] border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
            >
              <option value="ALL">Mọi loại mã</option>
              <option value="COMMON">Mã dùng chung</option>
              <option value="SINGLE_USE">Mã đơn lẻ (1 lần)</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã, tên chiến dịch, gói quà, mã lô..."
              className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-[#060814] border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#3fe9d6]"
            />
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
          {(
            [
              { id: "ALL", label: "Mọi Trạng Thái" },
              { id: "ACTIVE", label: "Đang Mở" },
              { id: "SCHEDULED", label: "Chờ Mở" },
              { id: "DISABLED", label: "Tạm Khóa" },
              { id: "EXPIRED", label: "Hết Hạn" },
              { id: "DEPLETED", label: "Hết Lượt" },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setFilterStatus(btn.id);
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                filterStatus === btn.id
                  ? "bg-[#f5c767]/20 border-[#f5c767] text-[#f5c767] font-bold"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-14 rounded-2xl bg-[#090d24]/90 border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#f5c767] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Đang tải danh sách mã quà tặng...
          </span>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs font-mono">
          {errorMsg}
        </div>
      ) : filteredGiftcodes.length === 0 ? (
        <div className="p-14 rounded-2xl bg-[#090d24]/80 border border-dashed border-white/15 text-center space-y-4">
          <h4 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
            {giftcodes.length === 0
              ? "Chưa Có Mã Quà Tặng Nào Được Phát Hành"
              : "Không Tìm Thấy Mã Quà Tặng Khớp Bộ Lọc"}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {giftcodes.length === 0
              ? "Hãy khởi tạo mã quà tặng đầu tiên và phân loại theo chiến dịch (Ra Mắt, Sự Kiện, Livestream, Đền Bù...)."
              : "Thử thay đổi bộ lọc danh mục chiến dịch, trạng thái hoặc từ khóa tìm kiếm."}
          </p>
          {giftcodes.length === 0 && canEdit && (
            <button
              type="button"
              onClick={() => openCreateModal("single")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814] font-bold text-xs font-mono cursor-pointer"
            >
              + Khởi Tạo Mã Quà Đầu Tiên
            </button>
          )}
        </div>
      ) : viewMode === "campaign" ? (
        <div className="space-y-4">
          {campaignGroups.map((group) => {
            const catMeta = getCampaignCategoryMeta(group.category);
            const isCollapsed = Boolean(collapsedGroups[group.key]);
            return (
              <div
                key={group.key}
                className={`rounded-2xl bg-[#090d24]/95 border ${catMeta.borderClass} overflow-hidden shadow-xl`}
              >
                {/* Campaign Header */}
                <div className="px-5 py-4 bg-[#0c1230]/90 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCollapsedGroups((prev) => ({
                        ...prev,
                        [group.key]: !prev[group.key],
                      }));
                    }}
                    className="flex flex-wrap items-center gap-2.5 text-left cursor-pointer"
                  >
                    <span className="text-xs font-mono text-slate-400 w-4">
                      {isCollapsed ? "▸" : "▾"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${catMeta.badgeClass}`}
                    >
                      {catMeta.label}
                    </span>
                    <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
                      {group.campaignName}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
                      {group.codes.length} mã
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
                      {group.activeCount} đang mở
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#f5c767]/10 border border-[#f5c767]/25 text-[11px] font-mono text-[#f5c767]">
                      {group.totalRedemptions.toLocaleString("vi-VN")} lượt đổi
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        exportCodesToCsv(
                          group.codes,
                          `campaign_${group.category.toLowerCase()}`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-semibold cursor-pointer"
                    >
                      Xuất CSV
                    </button>

                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            openCreateModal(
                              "single",
                              group.category,
                              group.rawCampaignName
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#f5c767]/15 hover:bg-[#f5c767]/25 border border-[#f5c767]/35 text-[#f5c767] text-[11px] font-mono font-bold cursor-pointer"
                        >
                          + Thêm Mã
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openCreateModal(
                              "batch",
                              group.category,
                              group.rawCampaignName
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/35 text-[#3fe9d6] text-[11px] font-mono font-bold cursor-pointer"
                        >
                          + Sinh Lô
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!isCollapsed && renderGiftcodeRows(group.codes, false)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#090d24]/95 border border-white/10 overflow-hidden shadow-2xl">
          {renderGiftcodeRows(filteredGiftcodes, true)}
          <div className="px-5 py-3 border-t border-white/10 bg-[#060814]/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Hiển thị{" "}
              <strong className="text-[#f5c767]">
                {filteredGiftcodes.length}
              </strong>{" "}
              / {giftcodes.length} mã quà tặng
            </span>
            <span>Đồng bộ tập trung với máy chủ trò chơi</span>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa / Sinh Hàng Loạt */}
      <GiftcodeFormModal
        isOpen={isFormOpen}
        editingGiftcode={editingGiftcode}
        initialMode={formMode}
        initialCampaignCategory={formInitCategory}
        initialCampaignName={formInitCampaignName}
        existingCampaignNames={existingCampaignNames}
        referenceItems={referenceItems}
        referenceServers={referenceServers}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGiftcode(null);
        }}
        onSavedSingle={(saved, message) => {
          setGiftcodes((prev) => {
            const exists = prev.some((i) => i.Code === saved.Code);
            if (exists) {
              return prev.map((i) => (i.Code === saved.Code ? saved : i));
            }
            return [saved, ...prev];
          });
          onNotify(message);
        }}
        onSavedBatch={(_batchId, codes, message) => {
          setGiftcodes((prev) => [...codes, ...prev]);
          onNotify(message);
        }}
      />

      {/* Modal Xác Nhận Xóa */}
      {deletingGiftcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#090d24] border border-rose-500/40 p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
              Xác Nhận Xóa Mã Quà Tặng
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn mã quà tặng{" "}
              <strong className="font-mono text-[#f5c767]">
                {deletingGiftcode.Code}
              </strong>{" "}
              ({deletingGiftcode.Title})? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingGiftcode(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
