"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONSUMABLE_EFFECT_OPTIONS,
  EQUIP_SLOT_OPTIONS,
  GameConsumableEffectType,
  GameEquipSlot,
  GameItemRarity,
  GameItemType,
  ITEM_RARITY_OPTIONS,
  ITEM_TYPE_OPTIONS,
  ItemConfigDocument,
  getItemRarityMeta,
  getItemTypeMeta,
  itemConfigService,
} from "@/services/itemConfig.service";
import {
  deleteItemTempImages,
  uploadItemIconImage,
} from "@/services/r2Upload.service";
import { soundEngine } from "@/services/audio.service";

interface ItemFormModalProps {
  isOpen: boolean;
  editingItem: ItemConfigDocument | null;
  heroIdSuggestions?: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: (saved: ItemConfigDocument, message: string) => void;
}

export default function ItemFormModal(props: ItemFormModalProps) {
  if (!props.isOpen) return null;
  return (
    <ItemFormModalContent
      key={props.editingItem?.ItemId || "new"}
      editingItem={props.editingItem}
      heroIdSuggestions={props.heroIdSuggestions}
      onClose={props.onClose}
      onSaved={props.onSaved}
    />
  );
}

function ItemFormModalContent({
  editingItem,
  heroIdSuggestions = [],
  onClose,
  onSaved,
}: Omit<ItemFormModalProps, "isOpen">) {
  const isEditing = Boolean(editingItem);

  const [itemId, setItemId] = useState(() => editingItem?.ItemId || "item_");
  const [itemName, setItemName] = useState(() => editingItem?.ItemName || "");
  const [description, setDescription] = useState(
    () => editingItem?.Description || ""
  );
  const [type, setType] = useState<GameItemType>(
    () => editingItem?.Type ?? GameItemType.Material
  );
  const [rarity, setRarity] = useState<GameItemRarity>(
    () => editingItem?.Rarity ?? GameItemRarity.Common
  );
  const [maxStack, setMaxStack] = useState<number>(
    () => editingItem?.MaxStack ?? 9999
  );
  const [dropLocationHint, setDropLocationHint] = useState(
    () =>
      editingItem?.DropLocationHint ||
      "Rớt tại các ải cốt truyện hoặc sự kiện"
  );

  // Consumable (Type === 0)
  const [consumableType, setConsumableType] =
    useState<GameConsumableEffectType>(
      () => editingItem?.ConsumableType ?? GameConsumableEffectType.AddExpToHero
    );
  const [effectValue, setEffectValue] = useState<number>(
    () => editingItem?.EffectValue ?? 500
  );

  // Equipment (Type === 2 - mẫu Slot & SetId, chỉ số sinh động trên Server)
  const [slot, setSlot] = useState<GameEquipSlot>(
    () => editingItem?.Slot ?? GameEquipSlot.Weapon
  );
  const [setId, setSetId] = useState<string>(() => editingItem?.SetId || "");

  // Shard (Type === 3)
  const [targetHeroId, setTargetHeroId] = useState(
    () => editingItem?.TargetHeroId || "hero_hitomi"
  );
  const [requiredShardsToSummon, setRequiredShardsToSummon] = useState<number>(
    () => editingItem?.RequiredShardsToSummon ?? 50
  );

  // Icon / Hình ảnh vật phẩm
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [iconUrl, setIconUrl] = useState<string>(
    () => editingItem?.IconUrl || ""
  );
  const [iconKey, setIconKey] = useState<string>(
    () => editingItem?.IconKey || ""
  );
  const [tempUploadedKeys, setTempUploadedKeys] = useState<string[]>([]);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [iconErrorMsg, setIconErrorMsg] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rarityMeta = getItemRarityMeta(rarity);
  const typeMeta = getItemTypeMeta(type);

  const normalizeImageBlobToFile = useCallback((blob: Blob | File): File => {
    const rawType = (blob.type || "image/png").toLowerCase();
    let mime = "image/png";
    let ext = "png";
    if (rawType.includes("jpeg") || rawType.includes("jpg")) {
      mime = "image/jpeg";
      ext = "jpg";
    } else if (rawType.includes("webp")) {
      mime = "image/webp";
      ext = "webp";
    }

    if (
      blob instanceof File &&
      blob.name &&
      /\.(png|jpe?g|webp)$/i.test(blob.name)
    ) {
      return blob;
    }

    return new File([blob], `clipboard_${Date.now()}.${ext}`, {
      type: mime,
    });
  }, []);

  const handleUploadIconFile = useCallback(
    async (rawFile: Blob | File) => {
      setIconErrorMsg(null);
      if (rawFile.type && !rawFile.type.startsWith("image/")) {
        setIconErrorMsg(
          "Định dạng tệp không hợp lệ. Chỉ hỗ trợ ảnh PNG, JPG/JPEG hoặc WebP."
        );
        return;
      }
      const file = normalizeImageBlobToFile(rawFile);
      if (file.size > 5 * 1024 * 1024) {
        setIconErrorMsg("Dung lượng ảnh biểu tượng vật phẩm tối đa là 5MB.");
        return;
      }

      try {
        setUploadingIcon(true);
        setUploadProgress(0);
        const res = await uploadItemIconImage(
          file,
          { itemId: itemId.trim() || "item_icon" },
          (pct) => setUploadProgress(pct)
        );
        if (res.key) {
          setTempUploadedKeys((prev) =>
            prev.includes(res.key) ? prev : [...prev, res.key]
          );
        }
        setIconUrl(res.publicUrl);
        setIconKey(res.key);
        soundEngine.playCelestialChime();
      } catch (err: unknown) {
        setIconErrorMsg(
          err instanceof Error && err.message
            ? err.message
            : "Không thể tải ảnh biểu tượng lên kho lưu trữ."
        );
      } finally {
        setUploadingIcon(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [itemId, normalizeImageBlobToFile]
  );

  // Lắng nghe tổ hợp phím Ctrl+V / Cmd+V trên toàn bộ Modal để dán ảnh từ Clipboard ngay lập tức
  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      if (uploadingIcon || submitting) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            void handleUploadIconFile(blob);
            return;
          }
        }
      }
    };

    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [handleUploadIconFile, submitting, uploadingIcon]);

  const handleCloseWithCleanup = async () => {
    if (submitting || uploadingIcon) return;
    soundEngine.playClick();
    const initialKey = editingItem?.IconKey || "";
    const unusedTempKeys = tempUploadedKeys.filter(
      (k) => k && k !== initialKey
    );
    if (unusedTempKeys.length > 0) {
      void deleteItemTempImages(unusedTempKeys);
    }
    onClose();
  };

  const handleSelectType = (nextType: GameItemType) => {
    soundEngine.playClick();
    setType(nextType);
    if (!isEditing) {
      if (nextType === GameItemType.Equipment) {
        setMaxStack(99);
        if (itemId === "item_" || itemId === "mat_" || itemId === "shard_" || itemId === "ticket_") {
          setItemId("equip_");
        }
      } else if (nextType === GameItemType.Ticket) {
        setMaxStack(999);
        if (itemId === "item_" || itemId === "mat_" || itemId === "equip_" || itemId === "shard_") {
          setItemId("ticket_");
        }
      } else if (nextType === GameItemType.Shard) {
        setMaxStack(9999);
        if (itemId === "item_" || itemId === "mat_" || itemId === "equip_" || itemId === "ticket_") {
          setItemId("shard_hero_");
        }
      } else if (nextType === GameItemType.Material) {
        setMaxStack(9999);
        if (itemId === "item_" || itemId === "equip_" || itemId === "shard_" || itemId === "ticket_") {
          setItemId("mat_");
        }
      } else {
        setMaxStack(9999);
        if (itemId === "mat_" || itemId === "equip_" || itemId === "shard_" || itemId === "ticket_") {
          setItemId("item_");
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: Partial<ItemConfigDocument> & {
        ItemId: string;
        ItemName: string;
      } = {
        ItemId: itemId.trim().toLowerCase(),
        ItemName: itemName.trim(),
        Description: description.trim(),
        Type: type,
        Rarity: rarity,
        MaxStack: Number(maxStack) || 9999,
        DropLocationHint: dropLocationHint.trim(),
        ConsumableType:
          type === GameItemType.Consumable
            ? consumableType
            : GameConsumableEffectType.None,
        EffectValue:
          type === GameItemType.Consumable ? Number(effectValue) || 0 : 0,
        Slot: type === GameItemType.Equipment ? slot : GameEquipSlot.None,
        SetId: type === GameItemType.Equipment ? setId.trim() : "",
        TargetHeroId:
          type === GameItemType.Shard ? targetHeroId.trim() : "",
        RequiredShardsToSummon:
          type === GameItemType.Shard
            ? Number(requiredShardsToSummon) || 50
            : 50,
        IconUrl: iconUrl.trim(),
        IconKey: iconUrl.trim() ? iconKey.trim() : "",
      };

      const saved = isEditing
        ? await itemConfigService.updateItemConfig(payload.ItemId, payload)
        : await itemConfigService.createItemConfig(payload);

      const initialKey = editingItem?.IconKey || "";
      const orphanTemps = tempUploadedKeys.filter(
        (k) => k && k !== (payload.IconKey || "") && k !== initialKey
      );
      if (orphanTemps.length > 0) {
        void deleteItemTempImages(orphanTemps);
      }

      soundEngine.playCelestialChime();
      onSaved(
        saved,
        isEditing
          ? `Đã cập nhật vật phẩm "${saved.ItemName}" (${saved.ItemId}).`
          : `Đã tạo mới vật phẩm "${saved.ItemName}" (${saved.ItemId}).`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể lưu cấu hình vật phẩm. Vui lòng kiểm tra lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090d24] border border-[#3fe9d6]/35 shadow-[0_0_60px_rgba(63,233,214,0.18)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1435] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
              {isEditing
                ? `Chỉnh Sửa Vật Phẩm: ${editingItem?.ItemName}`
                : "Khởi Tạo Vật Phẩm & Trang Bị Mới"}
            </h2>
            <p className="text-xs text-slate-400">
              Cấu trúc chuẩn đồng bộ trực tiếp với hệ thống túi đồ, trang bị và mảnh tướng trong Game Client Unity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCloseWithCleanup()}
            disabled={submitting || uploadingIcon}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-mono"
          >
            Đóng
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* 1. Phân loại vật phẩm (ItemType 0..4) */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase text-[#3fe9d6] font-bold">
              1. Nhóm Phân Loại Vật Phẩm (ItemType)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ITEM_TYPE_OPTIONS.map((opt) => {
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectType(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${active
                      ? "bg-[#3fe9d6]/15 border-[#3fe9d6] text-white shadow-[0_0_15px_rgba(63,233,214,0.2)]"
                      : "bg-[#060919] border-white/10 text-slate-400 hover:text-white hover:border-white/25"
                      }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#3fe9d6]">
                      Type {opt.value}
                    </div>
                    <div className="text-xs font-bold mt-0.5">
                      {opt.shortLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Định danh cơ bản */}
          <div className="p-5 rounded-2xl bg-[#060919] border border-white/10 space-y-4">
            <div className="text-xs font-mono uppercase text-[#f5c767] font-bold">
              2. Định Danh & Phẩm Chất
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Mã Định Danh (ItemId) *
                </label>
                <input
                  type="text"
                  value={itemId}
                  disabled={isEditing}
                  onChange={(e) => setItemId(e.target.value.toLowerCase())}
                  placeholder="VD: item_exp_book_small, equip_sword_ssr"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-[#3fe9d6] focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
                  required
                />
                {!isEditing && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Tiền tố chuẩn:
                    </span>
                    {["item_", "mat_", "equip_", "shard_hero_", "ticket_"].map(
                      (prefix) => (
                        <button
                          key={prefix}
                          type="button"
                          onClick={() => setItemId(prefix)}
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-300 cursor-pointer"
                        >
                          {prefix}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-6">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Tên Hiển Thị Vật Phẩm (ItemName) *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="VD: Sách EXP Cao Cấp, Thánh Kiếm Valkyria"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                  required
                />
              </div>

              <div className="sm:col-span-7">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Phẩm Chất / Độ Hiếm (ItemRarity)
                </label>
                <select
                  value={rarity}
                  onChange={(e) =>
                    setRarity(Number(e.target.value) as GameItemRarity)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                >
                  {ITEM_RARITY_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      [{r.tier}] {r.label} (Rarity {r.value})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Xếp Chồng Tối Đa (MaxStack)
                </label>
                <input
                  type="number"
                  min={1}
                  max={999999}
                  value={maxStack}
                  onChange={(e) => setMaxStack(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]"
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Gợi Ý Nguồn Rơi / Nhận Vật Phẩm (DropLocationHint)
                </label>
                <input
                  type="text"
                  value={dropLocationHint}
                  onChange={(e) => setDropLocationHint(e.target.value)}
                  placeholder="VD: Rớt từ Ải 1-1 đến 2-5, Tháp Thử Thách Tầng 50, Cửa hàng Đấu Trường..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Mô Tả Công Dụng & Xuất Xứ (Description)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết công dụng của vật phẩm trong trò chơi..."
                  className="w-full p-3 rounded-xl bg-[#090d24] border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
                />
              </div>
            </div>
          </div>

          {/* 2.5. Hình Ảnh / Biểu Tượng Vật Phẩm (IconUrl) */}
          <div className="p-5 rounded-2xl bg-[#060919] border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono uppercase text-[#3fe9d6] font-bold">
                  3. Biểu Tượng Vật Phẩm (Item Icon)
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hiển thị trong Danh mục Vật phẩm, Hòm thư Đền bù, Giftcode và Túi đồ người chơi theo cụm máy chủ.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/10 border border-[#3fe9d6]/30 text-[10px] font-mono text-[#3fe9d6]">
                PNG / JPG / WebP · Tối đa 5MB (Khuyến nghị 256×256)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Khung xem trước ô vật phẩm theo phẩm chất */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#090d24] border border-white/10 space-y-2">
                <div
                  className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 flex items-center justify-center transition-colors ${rarityMeta.borderClass}`}
                >
                  {iconUrl ? (
                    <>
                      <img
                        src={iconUrl}
                        alt={itemName || itemId}
                        className="w-full h-full object-contain p-1.5"
                      />
                      <button
                        type="button"
                        disabled={uploadingIcon || submitting}
                        onClick={() => {
                          soundEngine.playClick();
                          setIconUrl("");
                          setIconKey("");
                        }}
                        className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 hover:bg-rose-600 text-white text-[10px] font-mono border border-white/20 transition-colors cursor-pointer"
                        title="Gỡ ảnh hiện tại"
                      >
                        Gỡ
                      </button>
                    </>
                  ) : (
                    <div className="text-center px-2 space-y-1">
                      <div
                        className="text-xs font-mono font-bold"
                        style={{ color: rarityMeta.hexColor }}
                      >
                        {typeMeta.shortLabel}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Chưa có ảnh
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-400 truncate max-w-full">
                  {itemName.trim() || itemId.trim() || "Ô vật phẩm mẫu"}
                </span>
              </div>

              {/* Khu vực kéo thả tải ảnh & nhập URL */}
              <div className="sm:col-span-8 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  disabled={uploadingIcon || submitting}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUploadIconFile(file);
                  }}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!uploadingIcon && !submitting) setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (uploadingIcon || submitting) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file) void handleUploadIconFile(file);
                  }}
                  onClick={() => {
                    if (!uploadingIcon && !submitting) {
                      soundEngine.playClick();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`p-4 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer space-y-2 ${dragOver
                    ? "border-[#3fe9d6] bg-[#3fe9d6]/10"
                    : uploadingIcon
                      ? "border-[#f5c767] bg-[#f5c767]/5"
                      : "border-white/15 bg-[#090d24]/80 hover:border-[#3fe9d6]/60 hover:bg-white/[0.02]"
                    }`}
                >
                  {uploadingIcon ? (
                    <div className="space-y-2 py-1">
                      <div className="text-xs font-mono font-bold text-[#f5c767]">
                        Đang tải biểu tượng vật phẩm lên kho lưu trữ... {uploadProgress}%
                      </div>
                      <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#3fe9d6] to-[#f5c767] transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-mono font-semibold text-white">
                        Tải ảnh lên
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Ưu tiên ảnh PNG nền trong suốt tỷ lệ 1:1 để hiển thị đẹp nhất trong Túi Đồ
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Hoặc dán trực tiếp đường dẫn ảnh (IconUrl):
                  </label>
                  <input
                    type="text"
                    value={iconUrl}
                    disabled={uploadingIcon || submitting}
                    onChange={(e) => {
                      setIconUrl(e.target.value);
                      if (!e.target.value.trim()) {
                        setIconKey("");
                      }
                    }}
                    placeholder="https://... hoặc để trống nếu dùng biểu tượng mặc định"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
                  />
                </div>

                {iconErrorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-mono">
                    {iconErrorMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Cấu hình riêng theo từng Type */}
          {type === GameItemType.Consumable && (
            <div className="p-5 rounded-2xl bg-[#060919] border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-emerald-300 font-bold">
                  4. Thuộc Tính Vật Phẩm Tiêu Hao (Consumable)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Kích hoạt khi người chơi bấm Sử Dụng trong Túi Đồ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Hiệu Ứng Khi Sử Dụng (ConsumableEffectType)
                  </label>
                  <select
                    value={consumableType}
                    onChange={(e) =>
                      setConsumableType(
                        Number(e.target.value) as GameConsumableEffectType
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    {CONSUMABLE_EFFECT_OPTIONS.map((eff) => (
                      <option key={eff.value} value={eff.value}>
                        [{eff.value}] {eff.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Giá Trị Hiệu Ứng (EffectValue)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100000000}
                    value={effectValue}
                    onChange={(e) =>
                      setEffectValue(Math.max(0, Number(e.target.value) || 0))
                    }
                    placeholder="VD: 500 EXP, 60 Energy"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {type === GameItemType.Equipment && (
            <div className="p-5 rounded-2xl bg-[#060919] border border-[#f5c767]/35 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase text-[#f5c767] font-bold">
                  4. Định Danh Mẫu Trang Bị (Equipment — Chỉ Số Động)
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#f5c767]/15 border border-[#f5c767]/30 text-[11px] font-mono text-[#f5c767]">
                  Chỉ số chính &amp; dòng phụ sinh ngẫu nhiên trên Server
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Vị Trí Trang Bị (EquipSlot)
                  </label>
                  <select
                    value={slot}
                    onChange={(e) =>
                      setSlot(Number(e.target.value) as GameEquipSlot)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#f5c767]"
                  >
                    {EQUIP_SLOT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        [{s.value}] {s.label} — {s.hint}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Mã Bộ Trang Bị (SetId — Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={setId}
                    onChange={(e) => setSetId(e.target.value)}
                    placeholder="VD: set_valkyria (để trống nếu không thuộc bộ)"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-[#f5c767] focus:outline-none focus:border-[#f5c767]"
                  />
                </div>
              </div>
            </div>
          )}

          {type === GameItemType.Shard && (
            <div className="p-5 rounded-2xl bg-[#060919] border border-purple-500/35 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-purple-300 font-bold">
                  4. Thuộc Tính Mảnh Ghép Triệu Hồi Tướng (Shard)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Dùng để ghép hoặc đột phá sao cho Valkyria
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Mã Tướng Valkyria Liên Kết (TargetHeroId) *
                  </label>
                  <input
                    type="text"
                    list="vov-hero-id-list"
                    value={targetHeroId}
                    onChange={(e) => setTargetHeroId(e.target.value)}
                    placeholder="VD: hero_hitomi"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400"
                    required
                  />
                  <datalist id="vov-hero-id-list">
                    {heroIdSuggestions.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.id})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Số Mảnh Cần Để Triệu Hồi (RequiredShardsToSummon)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={requiredShardsToSummon}
                    onChange={(e) =>
                      setRequiredShardsToSummon(
                        Math.max(1, Number(e.target.value) || 50)
                      )
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => void handleCloseWithCleanup()}
              disabled={submitting || uploadingIcon}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingIcon}
              className="px-6 py-2.5 rounded-xl bg-[#3fe9d6] hover:bg-[#6ef5e5] text-[#050814] font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? "Đang Lưu..."
                : uploadingIcon
                  ? "Đang Tải Ảnh..."
                  : isEditing
                    ? "Lưu Cập Nhật"
                    : "Tạo Vật Phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
