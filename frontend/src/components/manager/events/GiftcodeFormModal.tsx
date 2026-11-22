"use client";

import { useState, useMemo } from "react";
import {
  CAMPAIGN_CATEGORY_OPTIONS,
  GiftcodeCampaignCategory,
  GiftcodeDocument,
  GiftcodeReferenceItem,
  GiftcodeReferenceServer,
  GiftcodeRewardItem,
  GiftcodeType,
  generateClientRandomCode,
  giftcodesService,
} from "@/services/giftcodes.service";
import { getItemRarityMeta, getItemTypeMeta } from "@/services/itemConfig.service";
import { soundEngine } from "@/services/audio.service";

interface GiftcodeFormModalProps {
  isOpen: boolean;
  editingGiftcode: GiftcodeDocument | null;
  initialMode?: "single" | "batch";
  initialCampaignCategory?: GiftcodeCampaignCategory;
  initialCampaignName?: string;
  existingCampaignNames?: string[];
  referenceItems: GiftcodeReferenceItem[];
  referenceServers: GiftcodeReferenceServer[];
  onClose: () => void;
  onSavedSingle: (saved: GiftcodeDocument, message: string) => void;
  onSavedBatch: (
    batchId: string,
    codes: GiftcodeDocument[],
    message: string
  ) => void;
}

function isoToDateTimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function dateTimeLocalToIso(val: string): string {
  if (!val.trim()) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function GiftcodeFormModal(props: GiftcodeFormModalProps) {
  if (!props.isOpen) return null;
  return (
    <GiftcodeFormModalContent
      key={`${props.editingGiftcode?.Code || "new"}_${props.initialMode || "single"}_${props.initialCampaignCategory || "EVENT"}_${props.initialCampaignName || ""}`}
      editingGiftcode={props.editingGiftcode}
      initialMode={props.initialMode || "single"}
      initialCampaignCategory={props.initialCampaignCategory}
      initialCampaignName={props.initialCampaignName}
      existingCampaignNames={props.existingCampaignNames || []}
      referenceItems={props.referenceItems}
      referenceServers={props.referenceServers}
      onClose={props.onClose}
      onSavedSingle={props.onSavedSingle}
      onSavedBatch={props.onSavedBatch}
    />
  );
}

function GiftcodeFormModalContent({
  editingGiftcode,
  initialMode,
  initialCampaignCategory,
  initialCampaignName,
  existingCampaignNames = [],
  referenceItems,
  referenceServers,
  onClose,
  onSavedSingle,
  onSavedBatch,
}: Omit<GiftcodeFormModalProps, "isOpen"> & { initialMode: "single" | "batch" }) {
  const isEditing = Boolean(editingGiftcode);
  const [mode, setMode] = useState<"single" | "batch">(
    isEditing ? "single" : initialMode
  );

  // Campaign classification
  const [campaignCategory, setCampaignCategory] =
    useState<GiftcodeCampaignCategory>(
      () =>
        editingGiftcode?.CampaignCategory ||
        initialCampaignCategory ||
        "EVENT"
    );
  const [campaignName, setCampaignName] = useState<string>(
    () => editingGiftcode?.CampaignName || initialCampaignName || ""
  );

  // Single mode fields
  const [code, setCode] = useState(() => editingGiftcode?.Code || "");
  const [codeType, setCodeType] = useState<GiftcodeType>(
    () => editingGiftcode?.CodeType || "COMMON"
  );
  const [maxRedemptions, setMaxRedemptions] = useState<number>(
    () => editingGiftcode?.MaxRedemptions ?? 0
  );
  const [maxPerUser, setMaxPerUser] = useState<number>(
    () => editingGiftcode?.MaxPerUser ?? 1
  );
  const [isPublicDisplay, setIsPublicDisplay] = useState<boolean>(
    () => editingGiftcode?.IsPublicDisplay ?? false
  );

  // Batch mode fields
  const [prefix, setPrefix] = useState("VOV");
  const [randomLength, setRandomLength] = useState<number>(8);
  const [batchCount, setBatchCount] = useState<number>(10);

  // Shared metadata
  const [title, setTitle] = useState(() => editingGiftcode?.Title || "");
  const [description, setDescription] = useState(
    () => editingGiftcode?.Description || ""
  );
  const [isActive, setIsActive] = useState<boolean>(
    () => editingGiftcode?.IsActive ?? true
  );
  const [startsAt, setStartsAt] = useState<string>(() =>
    isoToDateTimeLocal(editingGiftcode?.StartsAt)
  );
  const [expiresAt, setExpiresAt] = useState<string>(() =>
    isoToDateTimeLocal(editingGiftcode?.ExpiresAt)
  );
  const [allowedServers, setAllowedServers] = useState<string[]>(() =>
    editingGiftcode?.AllowedServers?.length
      ? editingGiftcode.AllowedServers
      : ["ALL"]
  );

  // Rewards
  const [gold, setGold] = useState<number>(
    () => editingGiftcode?.Rewards?.Gold ?? 0
  );
  const [gems, setGems] = useState<number>(
    () => editingGiftcode?.Rewards?.Gems ?? 0
  );
  const [energy, setEnergy] = useState<number>(
    () => editingGiftcode?.Rewards?.Energy ?? 0
  );
  const [rewardItems, setRewardItems] = useState<GiftcodeRewardItem[]>(
    () => editingGiftcode?.Rewards?.Items || []
  );

  // Item picker helper state
  const [selectedRefItemId, setSelectedRefItemId] = useState<string>(
    () => referenceItems[0]?.ItemId || ""
  );
  const [selectedItemQty, setSelectedItemQty] = useState<number>(1);
  const [itemSearch, setItemSearch] = useState("");
  const [manualItemId, setManualItemId] = useState("");
  const [manualItemName, setManualItemName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Batch generation result state (shows generated codes immediately for copy/CSV)
  const [batchResult, setBatchResult] = useState<{
    batchId: string;
    codes: GiftcodeDocument[];
  } | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  const filteredRefItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return referenceItems;
    return referenceItems.filter(
      (it) =>
        it.ItemId.toLowerCase().includes(q) ||
        it.ItemName.toLowerCase().includes(q)
    );
  }, [referenceItems, itemSearch]);

  const effectiveSelectedItemId = useMemo(() => {
    if (
      selectedRefItemId &&
      filteredRefItems.some((it) => it.ItemId === selectedRefItemId)
    ) {
      return selectedRefItemId;
    }
    return filteredRefItems[0]?.ItemId || "";
  }, [selectedRefItemId, filteredRefItems]);

  const isAllServers = allowedServers.includes("ALL");

  const handleToggleServer = (serverId: string) => {
    soundEngine.playClick();
    if (serverId === "ALL") {
      setAllowedServers(["ALL"]);
      return;
    }
    setAllowedServers((prev) => {
      const withoutAll = prev.filter((s) => s !== "ALL");
      if (withoutAll.includes(serverId)) {
        const next = withoutAll.filter((s) => s !== serverId);
        return next.length > 0 ? next : ["ALL"];
      }
      return [...withoutAll, serverId];
    });
  };

  const handleAddReferenceItem = () => {
    soundEngine.playClick();
    const target = referenceItems.find(
      (it) => it.ItemId === effectiveSelectedItemId
    );
    if (!target) return;
    const qty = Math.max(1, Math.trunc(Number(selectedItemQty) || 1));

    setRewardItems((prev) => {
      const idx = prev.findIndex((r) => r.ItemId === target.ItemId);
      if (idx >= 0) {
        return prev.map((r, i) =>
          i === idx ? { ...r, Quantity: r.Quantity + qty } : r
        );
      }
      return [
        ...prev,
        {
          ItemId: target.ItemId,
          ItemName: target.ItemName,
          Quantity: qty,
          Rarity: target.Rarity,
        },
      ];
    });
    setSelectedItemQty(1);
  };

  const handleAddManualItem = () => {
    soundEngine.playClick();
    const cleanId = manualItemId.trim();
    if (!cleanId) return;
    const qty = Math.max(1, Math.trunc(Number(selectedItemQty) || 1));
    const displayName = manualItemName.trim() || cleanId;

    setRewardItems((prev) => {
      const idx = prev.findIndex((r) => r.ItemId === cleanId);
      if (idx >= 0) {
        return prev.map((r, i) =>
          i === idx ? { ...r, Quantity: r.Quantity + qty } : r
        );
      }
      return [
        ...prev,
        {
          ItemId: cleanId,
          ItemName: displayName,
          Quantity: qty,
          Rarity: 1,
        },
      ];
    });
    setManualItemId("");
    setManualItemName("");
    setSelectedItemQty(1);
  };

  const handleUpdateRewardItemQty = (itemId: string, nextQty: number) => {
    const qty = Math.max(1, Math.trunc(nextQty) || 1);
    setRewardItems((prev) =>
      prev.map((r) => (r.ItemId === itemId ? { ...r, Quantity: qty } : r))
    );
  };

  const handleRemoveRewardItem = (itemId: string) => {
    soundEngine.playClick();
    setRewardItems((prev) => prev.filter((r) => r.ItemId !== itemId));
  };

  const handleCopyBatchCodes = () => {
    if (!batchResult) return;
    soundEngine.playClick();
    const text = batchResult.codes.map((c) => c.Code).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2500);
  };

  const handleExportBatchCsv = () => {
    if (!batchResult) return;
    soundEngine.playClick();
    const headers = ["STT", "Mã Giftcode", "Tên Gói Quà", "Lô Phát Hành", "Hạn Sử Dụng"];
    const rows = batchResult.codes.map((c, idx) =>
      [
        idx + 1,
        c.Code,
        `"${c.Title.replace(/"/g, '""')}"`,
        batchResult.batchId,
        c.ExpiresAt ? new Date(c.ExpiresAt).toLocaleString("vi-VN") : "Vĩnh viễn",
      ].join(",")
    );
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `${batchResult.batchId}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const rewardsPayload = {
        Gold: Math.max(0, Math.trunc(Number(gold) || 0)),
        Gems: Math.max(0, Math.trunc(Number(gems) || 0)),
        Energy: Math.max(0, Math.trunc(Number(energy) || 0)),
        Items: rewardItems,
      };

      const startIso = dateTimeLocalToIso(startsAt);
      const endIso = dateTimeLocalToIso(expiresAt);

      if (mode === "batch" && !isEditing) {
        const res = await giftcodesService.createBatchGiftcodes({
          Prefix: prefix.trim().toUpperCase(),
          RandomLength: Number(randomLength) || 8,
          Count: Number(batchCount) || 10,
          Title: title.trim(),
          Description: description.trim(),
          CampaignCategory: campaignCategory,
          CampaignName: campaignName.trim(),
          IsActive: isActive,
          AllowedServers: allowedServers,
          StartsAt: startIso,
          ExpiresAt: endIso,
          Rewards: rewardsPayload,
        });
        soundEngine.playCelestialChime();
        setBatchResult({ batchId: res.batchId, codes: res.codes });
        onSavedBatch(
          res.batchId,
          res.codes,
          `Đã sinh thành công lô ${res.count} mã quà tặng đơn lẻ (${res.batchId}).`
        );
        return;
      }

      const payload = {
        Code: code.trim().toUpperCase(),
        Title: title.trim(),
        Description: description.trim(),
        CodeType: codeType,
        CampaignCategory: campaignCategory,
        CampaignName: campaignName.trim(),
        IsActive: isActive,
        IsPublicDisplay: codeType === "COMMON" && isPublicDisplay,
        MaxRedemptions:
          codeType === "SINGLE_USE"
            ? 1
            : Math.max(0, Math.trunc(Number(maxRedemptions) || 0)),
        MaxPerUser:
          codeType === "SINGLE_USE"
            ? 1
            : Math.max(1, Math.trunc(Number(maxPerUser) || 1)),
        AllowedServers: allowedServers,
        StartsAt: startIso,
        ExpiresAt: endIso,
        Rewards: rewardsPayload,
      };

      const saved = isEditing
        ? await giftcodesService.updateGiftcode(editingGiftcode!.Code, payload)
        : await giftcodesService.createGiftcode(payload);

      soundEngine.playCelestialChime();
      onSavedSingle(
        saved,
        isEditing
          ? `Đã cập nhật mã quà tặng "${saved.Code}".`
          : `Đã tạo mới mã quà tặng "${saved.Code}".`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể lưu cấu hình mã quà tặng. Vui lòng kiểm tra lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090d24] border border-[#f5c767]/35 shadow-[0_0_60px_rgba(245,199,103,0.18)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1435] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
              {batchResult
                ? `Kết Quả Sinh Lô Mã: ${batchResult.batchId}`
                : isEditing
                  ? `Chỉnh Sửa Mã Quà Tặng: ${editingGiftcode?.Code}`
                  : mode === "batch"
                    ? "Sinh Hàng Loạt Mã Quà Tặng Đơn Lẻ (Batch)"
                    : "Khởi Tạo Mã Quà Tặng Mới (Giftcode)"}
            </h2>
            <p className="text-xs text-slate-400">
              Cấu hình gói phần thưởng đồng bộ trực tiếp với ví tiền tệ (Vàng, Ngọc, Thể Lực) và kho vật phẩm trong game.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-mono"
          >
            Đóng
          </button>
        </div>

        {/* If Batch Generation succeeded, display copyable/exportable result */}
        {batchResult ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-200 space-y-1">
              <div className="font-mono font-bold uppercase text-emerald-300">
                Khởi tạo thành công {batchResult.codes.length} mã đơn lẻ (1 lượt/mã)
              </div>
              <p className="text-slate-300">
                Mã lô phát hành: <strong className="font-mono text-[#f5c767]">{batchResult.batchId}</strong>. Bạn có thể sao chép toàn bộ hoặc xuất tệp CSV để phân phát cho người chơi, đối tác hoặc sự kiện livestream.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyBatchCodes}
                className="px-4 py-2 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono font-bold cursor-pointer"
              >
                {copiedBatch ? "Đã Sao Chép Toàn Bộ Mã" : "Sao Chép Tất Cả Mã"}
              </button>
              <button
                type="button"
                onClick={handleExportBatchCsv}
                className="px-4 py-2 rounded-xl bg-[#f5c767]/15 hover:bg-[#f5c767]/25 border border-[#f5c767]/40 text-[#f5c767] text-xs font-mono font-bold cursor-pointer"
              >
                Xuất Danh Sách CSV
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#060919] border border-white/10 max-h-72 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
              {batchResult.codes.map((c) => (
                <div
                  key={c.Code}
                  className="px-3 py-2 rounded-lg bg-[#0d1435] border border-white/10 text-[#f5c767] text-center select-all"
                >
                  {c.Code}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#3fe9d6] hover:bg-[#6ef5e5] text-[#050814] font-bold text-xs font-mono uppercase cursor-pointer"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-5"
          >
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            {/* Mode Switcher (Create only) */}
            {!isEditing && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setMode("single");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === "single"
                      ? "bg-[#f5c767]/15 border-[#f5c767] text-white"
                      : "bg-[#060919] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-mono font-bold uppercase text-[#f5c767]">
                    Tạo Mã Quà Đơn Lẻ / Dùng Chung
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tự đặt mã sự kiện (VD: VOV2026, LAUNCHDAY) hoặc sinh ngẫu nhiên 1 mã.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setMode("batch");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === "batch"
                      ? "bg-[#3fe9d6]/15 border-[#3fe9d6] text-white"
                      : "bg-[#060919] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-mono font-bold uppercase text-[#3fe9d6]">
                    Sinh Hàng Loạt Theo Lô (1–50 Mã)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Mỗi mã chỉ sử dụng được 1 lần duy nhất cho 1 tài khoản (VIP / Giveaway).
                  </div>
                </button>
              </div>
            )}

            {/* 1. Định danh & Loại mã */}
            <div className="p-5 rounded-2xl bg-[#060919] border border-white/10 space-y-4">
              <div className="text-xs font-mono uppercase text-[#f5c767] font-bold">
                1. Thông Tin Định Danh &amp; Giới Hạn
              </div>

              {mode === "batch" && !isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">
                      Tiền Tố Mã (Prefix — Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) =>
                        setPrefix(
                          e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
                        )
                      }
                      maxLength={12}
                      placeholder="VD: VOV, VIP-, LIVE"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-[#f5c767] focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">
                      Độ Dài Phần Ngẫu Nhiên
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={14}
                      value={randomLength}
                      onChange={(e) =>
                        setRandomLength(
                          Math.min(14, Math.max(6, Number(e.target.value) || 8))
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">
                      Số Lượng Mã Cần Sinh (1–50) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={batchCount}
                      onChange={(e) =>
                        setBatchCount(
                          Math.min(50, Math.max(1, Number(e.target.value) || 1))
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-[#3fe9d6] focus:outline-none focus:border-[#3fe9d6]"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">
                      Mã Quà Tặng (Code) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        disabled={isEditing}
                        onChange={(e) =>
                          setCode(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9_-]/g, "")
                          )
                        }
                        maxLength={32}
                        placeholder="VD: VOV2026, VALKYRIA_VIP"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-[#f5c767] focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
                        required
                      />
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setCode(generateClientRandomCode(8));
                          }}
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-mono text-[#3fe9d6] cursor-pointer shrink-0"
                        >
                          Ngẫu Nhiên
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-mono text-slate-300 mb-1">
                      Loại Mã Quà Tặng
                    </label>
                    <select
                      value={codeType}
                      onChange={(e) => {
                        const next = e.target.value as GiftcodeType;
                        setCodeType(next);
                        if (next === "SINGLE_USE") {
                          setMaxRedemptions(1);
                          setMaxPerUser(1);
                          setIsPublicDisplay(false);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                    >
                      <option value="COMMON">
                        Dùng Chung (Nhiều Chỉ Huy nhập được theo giới hạn)
                      </option>
                      <option value="SINGLE_USE">
                        Đơn Lẻ 1 Lần (Chỉ 1 người nhập duy nhất)
                      </option>
                    </select>
                  </div>

                  {codeType === "COMMON" && (
                    <>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-mono text-slate-300 mb-1">
                          Tổng Lượt Nhập Tối Đa (0 = Không giới hạn)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={10000000}
                          value={maxRedemptions}
                          onChange={(e) =>
                            setMaxRedemptions(
                              Math.max(0, Number(e.target.value) || 0)
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-mono text-slate-300 mb-1">
                          Tối Đa / Tài Khoản
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={maxPerUser}
                          onChange={(e) =>
                            setMaxPerUser(
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]"
                        />
                      </div>

                      <div className="sm:col-span-5 flex items-end">
                        <label className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPublicDisplay}
                            onChange={(e) => setIsPublicDisplay(e.target.checked)}
                            className="accent-[#f5c767]"
                          />
                          <span className="text-[11px] text-slate-200">
                            Công khai mã trên cổng Web
                          </span>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Nhóm / Danh Mục Chiến Dịch
                  </label>
                  <select
                    value={campaignCategory}
                    onChange={(e) =>
                      setCampaignCategory(
                        e.target.value as GiftcodeCampaignCategory
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                  >
                    {CAMPAIGN_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Tên Chiến Dịch Gom Nhóm (VD: Khai Mở S1, Livestream 1.2)
                  </label>
                  <input
                    type="text"
                    list="vov-giftcode-campaign-suggestions"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    maxLength={120}
                    placeholder="Nhập tên chiến dịch mới hoặc chọn chiến dịch có sẵn..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-[#3fe9d6] focus:outline-none focus:border-[#3fe9d6]"
                  />
                  <datalist id="vov-giftcode-campaign-suggestions">
                    {existingCampaignNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Tên Gói Quà Tặng (Hiển Thị Trong Thư) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Gói Quà Tân Thủ Khởi Hành, Gói Quà VIP Livestream"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                    required
                  />
                </div>

                <div className="sm:col-span-4 flex items-end">
                  <label className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="accent-[#3fe9d6]"
                    />
                    <span className="text-xs font-mono text-emerald-300 font-semibold">
                      Kích hoạt ngay
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Ghi Chú / Nội Dung Thông Báo Kèm Thư Quà
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả điều kiện sự kiện hoặc lời nhắn gửi đến Chỉ Huy khi đổi mã..."
                    className="w-full p-3 rounded-xl bg-[#090d24] border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Thời hạn & Phạm vi máy chủ */}
            <div className="p-5 rounded-2xl bg-[#060919] border border-white/10 space-y-4">
              <div className="text-xs font-mono uppercase text-[#3fe9d6] font-bold">
                2. Thời Hạn Hiệu Lực &amp; Phạm Vi Máy Chủ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Bắt Đầu Hiệu Lực (Để trống = Ngay lập tức)
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Hết Hạn Vào Lúc (Để trống = Vĩnh viễn)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-slate-300">
                  Máy Chủ Áp Dụng
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleServer("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-all ${
                      isAllServers
                        ? "bg-[#3fe9d6]/20 border-[#3fe9d6] text-[#3fe9d6] font-bold"
                        : "bg-[#090d24] border-white/15 text-slate-400 hover:text-white"
                    }`}
                  >
                    Tất Cả Cụm Máy Chủ (ALL)
                  </button>
                  {referenceServers.map((srv) => {
                    const checked =
                      !isAllServers && allowedServers.includes(srv.ServerId);
                    return (
                      <button
                        key={srv.ServerId}
                        type="button"
                        onClick={() => handleToggleServer(srv.ServerId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-all ${
                          checked
                            ? "bg-[#f5c767]/20 border-[#f5c767] text-[#f5c767] font-bold"
                            : "bg-[#090d24] border-white/15 text-slate-400 hover:text-white"
                        }`}
                      >
                        {srv.Name} ({srv.ServerId})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Cấu hình phần thưởng (Gold, Gems, Energy + ItemConfigs) */}
            <div className="p-5 rounded-2xl bg-[#060919] border border-[#f5c767]/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase text-[#f5c767] font-bold">
                  3. Cấu Hình Phần Thưởng Trong Game *
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Bắt buộc có ít nhất 1 phần thưởng lớn hơn 0
                </span>
              </div>

              {/* Tiền tệ ví */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#f5c767] mb-1">
                    Vàng (Gold)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000000000}
                    value={gold}
                    onChange={(e) =>
                      setGold(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-[#f5c767] focus:outline-none focus:border-[#f5c767]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#3fe9d6] mb-1">
                    Ngọc / Pha Lê (Gems)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10000000}
                    value={gems}
                    onChange={(e) =>
                      setGems(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-[#3fe9d6] focus:outline-none focus:border-[#3fe9d6]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-emerald-300 mb-1">
                    Thể Lực (Energy)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={energy}
                    onChange={(e) =>
                      setEnergy(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Bộ chọn Vật Phẩm từ danh mục Game */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="text-[11px] font-mono uppercase text-slate-300 font-semibold">
                  Vật Phẩm Đính Kèm (Đồng Bộ Từ Kho Vật Phẩm Game)
                </div>

                {referenceItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder="Lọc nhanh vật phẩm..."
                        className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <select
                        value={effectiveSelectedItemId}
                        onChange={(e) => setSelectedRefItemId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                      >
                        {filteredRefItems.length === 0 ? (
                          <option value="">Không có vật phẩm khớp</option>
                        ) : (
                          filteredRefItems.map((it) => {
                            const r = getItemRarityMeta(it.Rarity);
                            const t = getItemTypeMeta(it.Type);
                            return (
                              <option key={it.ItemId} value={it.ItemId}>
                                [{r.tier}] {it.ItemName} ({t.shortLabel} · {it.ItemId})
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <input
                        type="number"
                        min={1}
                        max={999999}
                        value={selectedItemQty}
                        onChange={(e) =>
                          setSelectedItemQty(
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full px-2 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-center text-white focus:outline-none focus:border-[#3fe9d6]"
                        title="Số lượng"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        disabled={!effectiveSelectedItemId}
                        onClick={handleAddReferenceItem}
                        className="w-full py-2 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono font-bold cursor-pointer disabled:opacity-40"
                      >
                        + Thêm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={manualItemId}
                        onChange={(e) => setManualItemId(e.target.value)}
                        placeholder="Mã ItemId (VD: ticket_gacha_standard)"
                        className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-[#3fe9d6]"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={manualItemName}
                        onChange={(e) => setManualItemName(e.target.value)}
                        placeholder="Tên vật phẩm hiển thị"
                        className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={selectedItemQty}
                        onChange={(e) =>
                          setSelectedItemQty(
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full px-2.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddManualItem}
                        className="w-full py-2 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono font-bold cursor-pointer"
                      >
                        + Thêm
                      </button>
                    </div>
                  </div>
                )}

                {/* Danh sách vật phẩm đã gắn */}
                {rewardItems.length > 0 && (
                  <div className="space-y-2">
                    {rewardItems.map((it) => {
                      const r = getItemRarityMeta(it.Rarity);
                      return (
                        <div
                          key={it.ItemId}
                          className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/10 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${r.badgeClass}`}
                            >
                              {r.tier}
                            </span>
                            <span className="font-semibold text-white truncate">
                              {it.ItemName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              ({it.ItemId})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">
                              SL:
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={999999}
                              value={it.Quantity}
                              onChange={(e) =>
                                handleUpdateRewardItemQty(
                                  it.ItemId,
                                  Number(e.target.value)
                                )
                              }
                              className="w-20 px-2 py-1 rounded-lg bg-[#060919] border border-white/15 text-xs font-mono text-[#f5c767] text-center"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveRewardItem(it.ItemId)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-[11px] font-mono cursor-pointer"
                            >
                              Gỡ
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] hover:brightness-110 text-[#050814] font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? "Đang Xử Lý..."
                  : isEditing
                    ? "Lưu Cập Nhật"
                    : mode === "batch"
                      ? `Sinh ${batchCount} Mã Quà Tặng`
                      : "Tạo Mã Quà Tặng"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
