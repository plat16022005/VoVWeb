"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  GameConsumableEffectType,
  GameItemType,
  ITEM_RARITY_OPTIONS,
  ItemConfigDocument,
  getConsumableEffectMeta,
  getEquipSlotMeta,
  getItemRarityMeta,
  getItemTypeMeta,
  itemConfigService,
} from "@/services/itemConfig.service";
import { soundEngine } from "@/services/audio.service";
import ItemFormModal from "./ItemFormModal";

interface GameItemsManagerProps {
  canEdit: boolean;
  canDelete: boolean;
  heroIdSuggestions?: Array<{ id: string; name: string }>;
  onNotify: (type: "success" | "error" | "info", message: string) => void;
}

export default function GameItemsManager({
  canEdit,
  canDelete,
  heroIdSuggestions = [],
  onNotify,
}: GameItemsManagerProps) {
  const [items, setItems] = useState<ItemConfigDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<number | "ALL">("ALL");
  const [filterRarity, setFilterRarity] = useState<number | "ALL">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemConfigDocument | null>(
    null
  );
  const [deletingItem, setDeletingItem] = useState<ItemConfigDocument | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const list = await itemConfigService.getAllItemConfigs();
      setItems(list);
    } catch (err: unknown) {
      onNotify(
        "error",
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách vật phẩm từ máy chủ."
      );
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    let cancelled = false;
    itemConfigService
      .getAllItemConfigs()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          onNotify(
            "error",
            err instanceof Error
              ? err.message
              : "Không thể tải danh sách vật phẩm từ máy chủ."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onNotify]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      consumables: items.filter((i) => i.Type === GameItemType.Consumable)
        .length,
      materials: items.filter((i) => i.Type === GameItemType.Material).length,
      equipments: items.filter((i) => i.Type === GameItemType.Equipment).length,
      shards: items.filter((i) => i.Type === GameItemType.Shard).length,
      tickets: items.filter((i) => i.Type === GameItemType.Ticket).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (filterType !== "ALL" && it.Type !== filterType) return false;
      if (filterRarity !== "ALL" && it.Rarity !== filterRarity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = it.ItemId.toLowerCase().includes(q);
        const matchName = it.ItemName.toLowerCase().includes(q);
        const matchDesc = it.Description.toLowerCase().includes(q);
        const matchHint = it.DropLocationHint.toLowerCase().includes(q);
        const matchHero = it.TargetHeroId?.toLowerCase().includes(q);
        const matchSet = it.SetId?.toLowerCase().includes(q);
        return matchId || matchName || matchDesc || matchHint || matchHero || matchSet;
      }
      return true;
    });
  }, [items, filterType, filterRarity, searchQuery]);

  const handleSeedSamples = async () => {
    if (!canEdit) return;
    soundEngine.playClick();
    setSeedLoading(true);
    try {
      const res = await itemConfigService.seedUnitySampleItems();
      setItems(res.items);
      soundEngine.playCelestialChime();
      onNotify(
        "success",
        `Đã đồng bộ chuẩn ${res.seededCount} vật phẩm mẫu từ cấu trúc dự án Unity!`
      );
    } catch (err: unknown) {
      onNotify(
        "error",
        err instanceof Error
          ? err.message
          : "Không thể đồng bộ bộ vật phẩm mẫu."
      );
    } finally {
      setSeedLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem || !canDelete) return;
    soundEngine.playClick();
    setIsDeleting(true);
    try {
      await itemConfigService.deleteItemConfig(deletingItem.ItemId);
      setItems((prev) =>
        prev.filter((i) => i.ItemId !== deletingItem.ItemId)
      );
      soundEngine.playCelestialChime();
      onNotify(
        "success",
        `Đã xóa vật phẩm "${deletingItem.ItemName}" (${deletingItem.ItemId}).`
      );
      setDeletingItem(null);
    } catch (err: unknown) {
      onNotify(
        "error",
        err instanceof Error ? err.message : "Không thể xóa vật phẩm."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTypeSpecificBadge = (item: ItemConfigDocument) => {
    if (item.Type === GameItemType.Consumable) {
      const eff = getConsumableEffectMeta(item.ConsumableType);
      if (item.ConsumableType === GameConsumableEffectType.None) {
        return (
          <span className="text-[11px] font-mono text-slate-400">
            Tiêu hao không chỉ số cố định
          </span>
        );
      }
      return (
        <span className="text-[11px] font-mono text-emerald-300 font-semibold">
          {eff.label}: +{item.EffectValue.toLocaleString("vi-VN")}{" "}
          {eff.unit}
        </span>
      );
    }

    if (item.Type === GameItemType.Equipment) {
      const slotMeta = getEquipSlotMeta(item.Slot);
      return (
        <div className="space-y-0.5 text-[11px] font-mono">
          <div className="text-[#f5c767] font-semibold">
            Vị trí: {slotMeta.label}
          </div>
          <div className="text-slate-400">
            {item.SetId ? `Bộ: ${item.SetId}` : "Chỉ số động (Sinh trên máy chủ)"}
          </div>
        </div>
      );
    }

    if (item.Type === GameItemType.Shard) {
      return (
        <div className="space-y-0.5 text-[11px] font-mono">
          <div className="text-purple-300 font-semibold">
            Tướng liên kết: {item.TargetHeroId || "Chưa gán"}
          </div>
          <div className="text-slate-400">
            Cần {item.RequiredShardsToSummon} mảnh để triệu hồi
          </div>
        </div>
      );
    }

    return (
      <span className="text-[11px] font-mono text-slate-400">
        Xếp chồng tối đa: {item.MaxStack.toLocaleString("vi-VN")} / ô
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Thẻ thống kê theo 5 phân loại ItemType chuẩn Unity */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            id: "ALL" as const,
            label: "Tổng Vật Phẩm",
            count: stats.total,
            accent: "border-white/15 text-white",
          },
          {
            id: GameItemType.Consumable,
            label: "Tiêu Hao (Type 0)",
            count: stats.consumables,
            accent: "border-emerald-500/30 text-emerald-300",
          },
          {
            id: GameItemType.Material,
            label: "Nguyên Liệu (Type 1)",
            count: stats.materials,
            accent: "border-sky-500/30 text-sky-300",
          },
          {
            id: GameItemType.Equipment,
            label: "Trang Bị (Type 2)",
            count: stats.equipments,
            accent: "border-[#f5c767]/35 text-[#f5c767]",
          },
          {
            id: GameItemType.Shard,
            label: "Mảnh Ghép (Type 3)",
            count: stats.shards,
            accent: "border-purple-500/35 text-purple-300",
          },
          {
            id: GameItemType.Ticket,
            label: "Vé / Tiền Tệ (Type 4)",
            count: stats.tickets,
            accent: "border-rose-500/35 text-rose-300",
          },
        ].map((card) => {
          const active = filterType === card.id;
          return (
            <button
              key={String(card.id)}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setFilterType(card.id);
              }}
              className={`p-3.5 rounded-2xl bg-[#090d24]/90 border text-left transition-all cursor-pointer ${
                active
                  ? "ring-1 ring-[#3fe9d6] bg-[#0e1538] border-[#3fe9d6]"
                  : card.accent
              }`}
            >
              <div className="text-[11px] font-mono text-slate-400">
                {card.label}
              </div>
              <div className="text-xl font-bold font-mono mt-1">
                {card.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Thanh công cụ tìm kiếm, lọc phẩm chất & thao tác */}
      <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide">
              Danh Mục Vật Phẩm, Nguyên Liệu &amp; Trang Bị Trò Chơi
            </h3>
            <p className="text-xs text-slate-400">
              Đồng bộ thời gian thực với hệ thống Túi Đồ, Rèn Trang Bị, Triệu Hồi Mảnh Tướng và Đài Chiêu Mộ Gacha trong Game Client.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                void loadItems();
              }}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang tải..." : "Làm Mới"}
            </button>

            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={handleSeedSamples}
                  disabled={seedLoading}
                  className="px-3.5 py-2 rounded-xl bg-[#f5c767]/15 hover:bg-[#f5c767]/25 border border-[#f5c767]/40 text-[#f5c767] text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {seedLoading
                    ? "Đang đồng bộ..."
                    : "Đồng Bộ 9 Vật Phẩm Mẫu Unity"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setEditingItem(null);
                    setIsFormOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#3fe9d6] hover:bg-[#6ef5e5] text-[#050814] text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  + Tạo Vật Phẩm Mới
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bộ lọc tìm kiếm & Rarity */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên vật phẩm, mã ItemId, nguồn rơi hoặc mã tướng (VD: hero_hitomi)..."
              className="w-full px-4 py-2 rounded-xl bg-[#060814] border border-white/10 focus:border-[#3fe9d6] text-xs font-mono text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterRarity("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                filterRarity === "ALL"
                  ? "bg-[#3fe9d6] text-[#050814] font-bold"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              Mọi Phẩm Chất
            </button>
            {ITEM_RARITY_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setFilterRarity(r.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                  filterRarity === r.value
                    ? r.badgeClass + " font-bold"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {r.tier} · {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bảng / Danh sách vật phẩm */}
      {loading ? (
        <div className="py-16 rounded-2xl bg-[#090d24]/80 border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Đang tải danh mục vật phẩm &amp; trang bị...
          </span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 px-6 rounded-2xl bg-[#090d24]/70 border border-dashed border-white/15 text-center space-y-4">
          <h4 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
            Chưa Có Vật Phẩm Phù Hợp Trong Danh Mục
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {items.length === 0
              ? "Hệ thống chưa có cấu hình vật phẩm nào. Bạn có thể khởi tạo ngay 9 vật phẩm mẫu chuẩn từ dự án Unity (Sách EXP, Bình Thể Lực, Vé Chiêu Mộ, Đá Đột Phá, Mảnh Hồn Hitomi, Thánh Kiếm & Chiến Giáp Valkyria)."
              : "Không tìm thấy vật phẩm nào khớp với bộ lọc hiện tại."}
          </p>
          {items.length === 0 && canEdit && (
            <button
              type="button"
              onClick={handleSeedSamples}
              disabled={seedLoading}
              className="px-5 py-2.5 rounded-xl bg-[#f5c767] hover:bg-[#ffda85] text-[#050814] text-xs font-mono font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {seedLoading
                ? "Đang khởi tạo..."
                : "Khởi Tạo 9 Vật Phẩm Mẫu Chuẩn Unity"}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#060814] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Vật Phẩm &amp; Mã Định Danh</th>
                  <th className="py-3.5 px-4">Phân Loại</th>
                  <th className="py-3.5 px-4">Phẩm Chất</th>
                  <th className="py-3.5 px-4">Thông Số Kỹ Thuật (Unity)</th>
                  <th className="py-3.5 px-4">Nguồn Rơi / Gợi Ý</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => {
                  const typeMeta = getItemTypeMeta(item.Type);
                  const rarityMeta = getItemRarityMeta(item.Rarity);
                  return (
                    <tr
                      key={item.ItemId}
                      className="hover:bg-white/[0.025] transition-colors"
                    >
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <div
                            className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 flex items-center justify-center transition-colors ${rarityMeta.borderClass}`}
                          >
                            {item.IconUrl ? (
                              <img
                                src={item.IconUrl}
                                alt={item.ItemName}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <span
                                className="text-[10px] font-mono font-bold text-center leading-tight px-1"
                                style={{ color: rarityMeta.hexColor }}
                              >
                                {typeMeta.shortLabel}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white text-sm truncate">
                              {item.ItemName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.ItemId);
                                  setCopiedId(item.ItemId);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="text-[11px] font-mono text-[#3fe9d6] hover:underline cursor-pointer truncate"
                                title="Sao chép mã ItemId"
                              >
                                {item.ItemId}
                                {copiedId === item.ItemId ? " (Đã chép)" : ""}
                              </button>
                            </div>
                            {item.Description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                                {item.Description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-200">
                          {typeMeta.shortLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${rarityMeta.badgeClass}`}
                        >
                          [{rarityMeta.tier}] {rarityMeta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {renderTypeSpecificBadge(item)}
                      </td>

                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="text-xs text-slate-300 truncate">
                          {item.DropLocationHint || "—"}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          MaxStack: {item.MaxStack.toLocaleString("vi-VN")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playClick();
                                setEditingItem(item);
                                setIsFormOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono font-semibold cursor-pointer"
                            >
                              Sửa
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playClick();
                                setDeletingItem(item);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-mono font-semibold cursor-pointer"
                            >
                              Xóa
                            </button>
                          )}
                          {!canEdit && !canDelete && (
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

          <div className="px-5 py-3 border-t border-white/10 bg-[#060814]/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Hiển thị{" "}
              <strong className="text-[#3fe9d6]">{filteredItems.length}</strong>{" "}
              / {items.length} vật phẩm
            </span>
            <span>Chuẩn cấu trúc ItemConfigData (Unity Engine)</span>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Vật Phẩm */}
      <ItemFormModal
        isOpen={isFormOpen}
        editingItem={editingItem}
        heroIdSuggestions={heroIdSuggestions}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSaved={(saved, message) => {
          setItems((prev) => {
            const exists = prev.some((i) => i.ItemId === saved.ItemId);
            const next = exists
              ? prev.map((i) => (i.ItemId === saved.ItemId ? saved : i))
              : [saved, ...prev];
            return next.sort((a, b) => {
              if (b.Rarity !== a.Rarity) return b.Rarity - a.Rarity;
              if (a.Type !== b.Type) return a.Type - b.Type;
              return a.ItemName.localeCompare(b.ItemName, "vi");
            });
          });
          onNotify("success", message);
        }}
      />

      {/* Modal Xác Nhận Xóa */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#090d24] border border-rose-500/40 p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
              Xác Nhận Xóa Vật Phẩm Khỏi Hệ Thống
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn vật phẩm{" "}
              <strong className="text-white">{deletingItem.ItemName}</strong> (
              <code className="text-[#3fe9d6]">{deletingItem.ItemId}</code>)
              không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingItem(null)}
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
