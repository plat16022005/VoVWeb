"use client";

import { useState, useMemo } from "react";
import {
  PlayerEquipmentDetailItem,
  PlayerFullServerDetailResponse,
  PlayerInventoryItemDetail,
  formatCompactCurrency,
  getHeroQualityMeta,
  playerDataService,
} from "@/services/playerData.service";
import {
  EQUIP_SLOT_OPTIONS,
  ITEM_TYPE_OPTIONS,
  getItemRarityMeta,
  getItemTypeMeta,
} from "@/services/itemConfig.service";
import { soundEngine } from "@/services/audio.service";

interface PlayerServerDetailModalProps {
  detail: PlayerFullServerDetailResponse;
  canRevoke: boolean;
  onClose: () => void;
  onUpdated: (
    nextDetail: PlayerFullServerDetailResponse,
    toastMsg: string
  ) => void;
}

type DetailTab = "overview" | "inventory" | "equipments" | "heroes";

export default function PlayerServerDetailModal({
  detail,
  canRevoke,
  onClose,
  onUpdated,
}: PlayerServerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  // Bộ lọc Túi đồ (Inventory)
  const [invSearch, setInvSearch] = useState("");
  const [invTypeFilter, setInvTypeFilter] = useState<number | "ALL">("ALL");

  // Bộ lọc Kho Trang Bị (Equipments)
  const [eqSlotFilter, setEqSlotFilter] = useState<number | "ALL">("ALL");
  const [eqOwnerFilter, setEqOwnerFilter] = useState<
    "ALL" | "EQUIPPED" | "FREE"
  >("ALL");

  // Đội hình đang xem ở tab Kho Tướng & Đội Hình
  const [viewingTeamIndex, setViewingTeamIndex] = useState<number>(
    () => detail.formation.ActiveTeamIndex || 1
  );

  // Hộp thoại Thu hồi Vật phẩm xếp chồng (Inventory)
  const [revokingItem, setRevokingItem] =
    useState<PlayerInventoryItemDetail | null>(null);
  const [revokeAmount, setRevokeAmount] = useState<number>(1);
  const [revokeAllFlag, setRevokeAllFlag] = useState<boolean>(false);
  const [revokeReason, setRevokeReason] = useState<string>("");
  const [revokeSubmitting, setRevokeSubmitting] = useState<boolean>(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Hộp thoại Thu hồi Trang bị thực thể (Equipments)
  const [revokingEquip, setRevokingEquip] =
    useState<PlayerEquipmentDetailItem | null>(null);
  const [equipRevokeReason, setEquipRevokeReason] = useState<string>("");
  const [equipRevokeSubmitting, setEquipRevokeSubmitting] =
    useState<boolean>(false);
  const [equipRevokeError, setEquipRevokeError] = useState<string | null>(null);

  const filteredInventory = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return detail.inventory.filter((it) => {
      if (invTypeFilter !== "ALL" && it.type !== invTypeFilter) return false;
      if (q) {
        return (
          it.itemId.toLowerCase().includes(q) ||
          it.itemName.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [detail.inventory, invSearch, invTypeFilter]);

  const filteredEquipments = useMemo(() => {
    return detail.equipments.filter((eq) => {
      if (eqSlotFilter !== "ALL" && eq.slot !== eqSlotFilter) return false;
      if (eqOwnerFilter === "EQUIPPED" && !eq.equippedHeroId) return false;
      if (eqOwnerFilter === "FREE" && eq.equippedHeroId) return false;
      return true;
    });
  }, [detail.equipments, eqSlotFilter, eqOwnerFilter]);

  const currentTeamSlots = useMemo(() => {
    if (viewingTeamIndex === 2) return detail.formation.Team2;
    if (viewingTeamIndex === 3) return detail.formation.Team3;
    return detail.formation.Team1;
  }, [detail.formation, viewingTeamIndex]);

  const handleOpenRevokeItem = (item: PlayerInventoryItemDetail) => {
    soundEngine.playClick();
    setRevokingItem(item);
    setRevokeAmount(1);
    setRevokeAllFlag(item.quantity === 1);
    setRevokeReason("");
    setRevokeError(null);
  };

  const handleConfirmRevokeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingItem || !canRevoke) return;
    setRevokeSubmitting(true);
    setRevokeError(null);

    try {
      const res = await playerDataService.revokeInventoryItem(
        detail.serverId,
        detail.uid,
        {
          itemId: revokingItem.itemId,
          amount: revokeAllFlag ? revokingItem.quantity : revokeAmount,
          revokeAll: revokeAllFlag,
          reason: revokeReason.trim(),
        }
      );
      soundEngine.playCelestialChime();
      onUpdated(
        res.playerDetail,
        `Đã thu hồi ${res.revokedQuantity.toLocaleString("vi-VN")}x "${res.revokedItemName}" khỏi túi đồ của ${detail.profile.InGameName}.`
      );
      setRevokingItem(null);
    } catch (err: unknown) {
      setRevokeError(
        err instanceof Error
          ? err.message
          : "Không thể thu hồi vật phẩm. Vui lòng thử lại."
      );
    } finally {
      setRevokeSubmitting(false);
    }
  };

  const handleOpenRevokeEquip = (eq: PlayerEquipmentDetailItem) => {
    soundEngine.playClick();
    setRevokingEquip(eq);
    setEquipRevokeReason("");
    setEquipRevokeError(null);
  };

  const handleConfirmRevokeEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingEquip || !canRevoke) return;
    setEquipRevokeSubmitting(true);
    setEquipRevokeError(null);

    try {
      const res = await playerDataService.revokeEquipment(
        detail.serverId,
        detail.uid,
        {
          equipUid: revokingEquip.equipUid,
          reason: equipRevokeReason.trim(),
        }
      );
      soundEngine.playCelestialChime();
      onUpdated(
        res.playerDetail,
        `Đã thu hồi trang bị "${res.revokedItemName}"${
          res.unequippedHeroId
            ? ` (đã tự động tháo khỏi tướng ${res.unequippedHeroId})`
            : ""
        } của ${detail.profile.InGameName}.`
      );
      setRevokingEquip(null);
    } catch (err: unknown) {
      setEquipRevokeError(
        err instanceof Error
          ? err.message
          : "Không thể thu hồi trang bị. Vui lòng thử lại."
      );
    } finally {
      setEquipRevokeSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[93vh] flex flex-col rounded-3xl bg-[#080c22] border border-[#3fe9d6]/35 shadow-[0_0_65px_rgba(63,233,214,0.18)] overflow-hidden text-slate-100">
        {/* Header Hồ sơ Nhân vật & Máy chủ */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#0c1438] via-[#090d24] to-[#0c1438] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#3fe9d6] to-[#f5c767] p-0.5 shrink-0 shadow-[0_0_15px_rgba(63,233,214,0.3)]">
              <div className="w-full h-full rounded-[14px] bg-[#060814] flex items-center justify-center font-bold text-lg text-[#f5c767] font-[family-name:var(--font-rajdhani)]">
                {detail.profile.InGameName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wide">
                  {detail.profile.InGameName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#3fe9d6]/15 border border-[#3fe9d6]/35 text-xs font-mono font-bold text-[#3fe9d6]">
                  Lv.{detail.profile.Level}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#f5c767]/15 border border-[#f5c767]/35 text-xs font-mono font-bold text-[#f5c767]">
                  Lực Chiến:{" "}
                  {detail.profile.TotalCombatPower.toLocaleString("vi-VN")} (
                  {formatCompactCurrency(detail.profile.TotalCombatPower)})
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-xs font-mono text-emerald-300">
                  {detail.serverName} ({detail.serverId})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400 mt-1">
                <span>
                  Tài khoản:{" "}
                  <strong className="text-slate-200">
                    {detail.account.username}
                  </strong>
                </span>
                {detail.account.playerCode && (
                  <span>
                    Mã ID:{" "}
                    <strong className="text-[#3fe9d6]">
                      #{detail.account.playerCode}
                    </strong>
                  </span>
                )}
                {detail.account.email && (
                  <span>Email: {detail.account.email}</span>
                )}
                <span>UID: {detail.uid}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="self-end sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
          >
            Đóng Hồ Sơ
          </button>
        </div>

        {/* Thanh điều hướng 4 Tab chuyên sâu */}
        <div className="px-6 pt-3 border-b border-white/10 bg-[#060814]/80 flex flex-wrap items-center gap-2 shrink-0">
          {[
            {
              id: "overview" as const,
              label: "1. Hồ Sơ, Tiền Tệ & Tiến Trình Ải",
              badge: `Ải ${detail.progress.MaxStage}`,
            },
            {
              id: "inventory" as const,
              label: "2. Túi Đồ Vật Phẩm",
              badge: `${detail.inventory.length} loại`,
            },
            {
              id: "equipments" as const,
              label: "3. Kho Trang Bị Động",
              badge: `${detail.equipments.length} món`,
            },
            {
              id: "heroes" as const,
              label: "4. Kho Tướng & Đội Hình 3×3",
              badge: `${detail.heroes.length} Valkyria`,
            },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id);
                }}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  active
                    ? "border-[#3fe9d6] text-[#3fe9d6] bg-[#3fe9d6]/10"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    active
                      ? "bg-[#3fe9d6]/20 text-[#3fe9d6]"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Nội dung từng Tab */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* ==================== TAB 1: TỔNG QUAN, TIỀN TỆ & TIẾN TRÌNH VƯỢT ẢI ==================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Số dư Tiền tệ & Thể lực (Wallet) */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#f5c767] mb-3">
                  Số Dư Tiền Tệ &amp; Năng Lượng Hiện Tại (Wallet)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#090d24] border border-[#f5c767]/35">
                    <div className="text-[11px] font-mono text-slate-400">
                      Số Dư Vàng (Gold)
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#f5c767] mt-1">
                      {detail.wallet.Gold.toLocaleString("vi-VN")}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Hiển thị in-game:{" "}
                      {formatCompactCurrency(detail.wallet.Gold)}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#090d24] border border-[#3fe9d6]/35">
                    <div className="text-[11px] font-mono text-slate-400">
                      Số Dư Ngọc (Gems)
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#3fe9d6] mt-1">
                      {detail.wallet.Gems.toLocaleString("vi-VN")}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Hiển thị in-game:{" "}
                      {formatCompactCurrency(detail.wallet.Gems)}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#090d24] border border-emerald-500/35">
                    <div className="text-[11px] font-mono text-slate-400">
                      Thể Lực Chiến Dịch (Energy)
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                      {detail.wallet.Energy.toLocaleString("vi-VN")}{" "}
                      <span className="text-sm text-slate-400">
                        / {detail.wallet.MaxEnergy}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Giới hạn hồi tự nhiên: {detail.wallet.MaxEnergy}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#090d24] border border-purple-500/35">
                    <div className="text-[11px] font-mono text-slate-400">
                      Kinh Nghiệm &amp; Đổi Tên
                    </div>
                    <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
                      Lv.{detail.profile.Level}{" "}
                      <span className="text-xs text-slate-400">
                        ({detail.profile.Exp.toLocaleString("vi-VN")} EXP)
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Số lần đã đổi tên: {detail.profile.RenameCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tiến trình Vượt Ải Chiến Dịch (Progress) */}
              <div className="p-5 rounded-2xl bg-[#090d24] border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
                      Tiến Trình Vượt Ải Chiến Dịch PVE (Campaign Progress)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Theo dõi ải cao nhất đang mở khóa, số sao đạt được tại từng ải và các rương mốc sao chương đã nhận.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-3 py-1.5 rounded-xl bg-[#3fe9d6]/15 border border-[#3fe9d6]/35 text-[#3fe9d6] font-bold">
                      Ải Hiện Tại: {detail.progress.MaxStage}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-[#f5c767]/15 border border-[#f5c767]/35 text-[#f5c767] font-bold">
                      Tổng Sao: {detail.progress.TotalStars} ★ (
                      {detail.progress.ClearedStagesCount} ải đã hoàn thành)
                    </span>
                  </div>
                </div>

                {detail.progress.Stages.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-slate-400 bg-[#060814]/60 rounded-xl border border-dashed border-white/10">
                    Người chơi hiện đang ở ải khởi đầu ({detail.progress.MaxStage}
                    ), chưa ghi nhận ải hoàn thành có sao.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                    {detail.progress.Stages.map((st) => (
                      <div
                        key={st.stageId}
                        className="p-2.5 rounded-xl bg-[#060814] border border-white/10 flex flex-col items-center justify-center text-center"
                      >
                        <div className="text-xs font-mono font-bold text-white">
                          Ải {st.stageId}
                        </div>
                        <div className="text-xs font-mono text-[#f5c767] mt-1 tracking-widest">
                          {"★".repeat(st.stars)}
                          <span className="text-slate-600">
                            {"★".repeat(Math.max(0, 3 - st.stars))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rương mốc sao đã nhận */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">
                    Rương mốc sao chương đã nhận (
                    {detail.progress.ClaimedChests.length}):
                  </span>
                  {detail.progress.ClaimedChests.length === 0 ? (
                    <span className="text-slate-500">Chưa nhận rương nào</span>
                  ) : (
                    detail.progress.ClaimedChests.map((chestId) => (
                      <span
                        key={chestId}
                        className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300"
                      >
                        {chestId}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: TÚI ĐỒ VẬT PHẨM (INVENTORY) & THU HỒI ==================== */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              {/* Thanh công cụ lọc túi đồ */}
              <div className="p-4 rounded-2xl bg-[#090d24] border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setInvTypeFilter("ALL");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                      invTypeFilter === "ALL"
                        ? "bg-[#3fe9d6] text-[#050814] font-bold"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Tất Cả ({detail.inventory.length})
                  </button>
                  {ITEM_TYPE_OPTIONS.map((opt) => {
                    const count = detail.inventory.filter(
                      (i) => i.type === opt.value
                    ).length;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setInvTypeFilter(opt.value);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                          invTypeFilter === opt.value
                            ? "bg-[#3fe9d6] text-[#050814] font-bold"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {opt.shortLabel} ({count})
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="Tìm tên vật phẩm hoặc mã ItemId trong túi đồ..."
                  className="w-full md:w-72 px-3.5 py-2 rounded-xl bg-[#060814] border border-white/10 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none"
                />
              </div>

              {filteredInventory.length === 0 ? (
                <div className="py-14 text-center rounded-2xl bg-[#090d24]/70 border border-dashed border-white/15 space-y-2">
                  <div className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
                    Không Có Vật Phẩm Nào Khớp Điều Kiện
                  </div>
                  <p className="text-xs text-slate-400">
                    Túi đồ của người chơi hiện không có vật phẩm thuộc bộ lọc này.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredInventory.map((item) => {
                    const rarityMeta = getItemRarityMeta(item.rarity);
                    const typeMeta = getItemTypeMeta(item.type);

                    return (
                      <div
                        key={item.itemId}
                        className="p-4 rounded-2xl bg-[#090d24] border border-white/10 hover:border-white/25 transition-all flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Ô ảnh vật phẩm đổi màu theo phẩm chất (không dán nhãn đè góc) */}
                          <div
                            className={`w-14 h-14 rounded-2xl border-2 shrink-0 flex items-center justify-center overflow-hidden ${rarityMeta.borderClass}`}
                          >
                            {item.iconUrl ? (
                              <img
                                src={item.iconUrl}
                                alt={item.itemName}
                                className="w-full h-full object-contain p-1.5"
                              />
                            ) : (
                              <span
                                className="text-[10px] font-mono font-bold text-center px-1"
                                style={{ color: rarityMeta.hexColor }}
                              >
                                {typeMeta.shortLabel}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="font-bold text-sm text-white truncate">
                              {item.itemName}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${rarityMeta.badgeClass}`}
                              >
                                [{rarityMeta.tier}] {rarityMeta.label}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                                {typeMeta.shortLabel}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate">
                              Mã: <span className="text-[#3fe9d6]">{item.itemId}</span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between shrink-0 gap-2">
                          <div className="px-2.5 py-1 rounded-xl bg-[#060814] border border-white/10 text-right">
                            <div className="text-[10px] font-mono text-slate-400">
                              Số lượng
                            </div>
                            <div className="text-sm font-bold font-mono text-emerald-300">
                              x{item.quantity.toLocaleString("vi-VN")}
                            </div>
                          </div>

                          {canRevoke && (
                            <button
                              type="button"
                              onClick={() => handleOpenRevokeItem(item)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                            >
                              Thu Hồi / Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: KHO TRANG BỊ ĐỘNG (EQUIPMENTS) & THU HỒI ==================== */}
          {activeTab === "equipments" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#090d24] border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEqSlotFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono cursor-pointer ${
                      eqSlotFilter === "ALL"
                        ? "bg-[#f5c767] text-[#050814] font-bold"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    Mọi Vị Trí ({detail.equipments.length})
                  </button>
                  {EQUIP_SLOT_OPTIONS.filter((s) => s.value > 0).map((s) => {
                    const count = detail.equipments.filter(
                      (e) => e.slot === s.value
                    ).length;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setEqSlotFilter(s.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono cursor-pointer ${
                          eqSlotFilter === s.value
                            ? "bg-[#f5c767] text-[#050814] font-bold"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {s.label.split("(")[0].trim()} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { id: "ALL" as const, label: "Tất cả" },
                    { id: "EQUIPPED" as const, label: "Đang mặc trên tướng" },
                    { id: "FREE" as const, label: "Trong kho rảnh" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setEqOwnerFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono cursor-pointer ${
                        eqOwnerFilter === f.id
                          ? "bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 font-bold"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredEquipments.length === 0 ? (
                <div className="py-14 text-center rounded-2xl bg-[#090d24]/70 border border-dashed border-white/15 space-y-2">
                  <div className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
                    Chưa Có Trang Bị Thực Thể Trong Kho
                  </div>
                  <p className="text-xs text-slate-400">
                    Người chơi hiện chưa sở hữu món trang bị nào khớp với bộ lọc hiện tại.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEquipments.map((eq) => {
                    const rarityMeta = getItemRarityMeta(eq.rarity);
                    return (
                      <div
                        key={eq.equipUid}
                        className="p-4 rounded-2xl bg-[#090d24] border border-white/10 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`w-14 h-14 rounded-2xl border-2 shrink-0 flex items-center justify-center overflow-hidden ${rarityMeta.borderClass}`}
                            >
                              {eq.iconUrl ? (
                                <img
                                  src={eq.iconUrl}
                                  alt={eq.itemName}
                                  className="w-full h-full object-contain p-1.5"
                                />
                              ) : (
                                <span
                                  className="text-[10px] font-mono font-bold text-center px-1"
                                  style={{ color: rarityMeta.hexColor }}
                                >
                                  {eq.slotLabel}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-white">
                                  {eq.itemName}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[#f5c767]/15 border border-[#f5c767]/40 text-xs font-mono font-bold text-[#f5c767]">
                                  +{eq.enhanceLevel} / {eq.maxEnhanceLevel}
                                </span>
                                {eq.isLocked && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono text-amber-300">
                                    Đã Khóa
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${rarityMeta.badgeClass}`}
                                >
                                  [{rarityMeta.tier}] {rarityMeta.label}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                                  {eq.slotLabel}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[#3fe9d6]/10 border border-[#3fe9d6]/30 text-[10px] font-mono text-[#3fe9d6]">
                                  Điểm CP: +{eq.combatScore.toLocaleString("vi-VN")}
                                </span>
                              </div>

                              <div className="text-[11px] font-mono text-slate-400">
                                Mã thực thể:{" "}
                                <span className="text-slate-300">
                                  {eq.equipUid}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {eq.equippedHeroId ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-mono font-bold text-emerald-300">
                                Đang mặc: {eq.equippedHeroName}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400">
                                Trong kho
                              </span>
                            )}

                            {canRevoke && (
                              <button
                                type="button"
                                onClick={() => handleOpenRevokeEquip(eq)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                              >
                                Thu Hồi Trang Bị
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Chỉ số chính & dòng phụ */}
                        <div className="p-3 rounded-xl bg-[#060814] border border-white/10 space-y-2 text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">
                              Chỉ số chính (MainStat):
                            </span>
                            <span className="font-bold text-[#f5c767]">
                              {eq.mainStat
                                ? eq.mainStat.formattedValue
                                : "Chưa có"}
                            </span>
                          </div>

                          {eq.subStats.length > 0 && (
                            <div className="pt-2 border-t border-white/5 space-y-1">
                              <div className="text-[11px] text-slate-400">
                                Dòng phụ ({eq.subStats.length} dòng):
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {eq.subStats.map((sub, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-slate-200"
                                  >
                                    {sub.formattedValue}
                                    {sub.upgradeCount > 0 && (
                                      <strong className="text-[#3fe9d6] ml-1">
                                        (+{sub.upgradeCount})
                                      </strong>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 4: KHO TƯỚNG VALKYRIA & ĐỘI HÌNH 3x3 ==================== */}
          {activeTab === "heroes" && (
            <div className="space-y-6">
              {/* 1. Bàn Cờ Đội Hình 3x3 */}
              <div className="p-5 rounded-2xl bg-[#090d24] border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
                      Đội Hình Chiến Đấu Bàn Cờ 3×3 (Formation)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Đội hình đang kích hoạt xuất chiến:{" "}
                      <strong className="text-[#3fe9d6]">
                        Đội Hình #{detail.formation.ActiveTeamIndex}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((tIdx) => {
                      const isCurrentActive =
                        detail.formation.ActiveTeamIndex === tIdx;
                      const isViewing = viewingTeamIndex === tIdx;
                      return (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setViewingTeamIndex(tIdx);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                            isViewing
                              ? "bg-[#3fe9d6] text-[#050814] border-[#3fe9d6]"
                              : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
                          }`}
                        >
                          Đội #{tIdx}
                          {isCurrentActive ? " (Đang Dùng)" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                  {Array.from({ length: 9 }).map((_, slotIdx) => {
                    const occupant = currentTeamSlots.find(
                      (s) => s.SlotIndex === slotIdx
                    );
                    const rowLabel =
                      slotIdx < 3
                        ? "Tiền Tuyến"
                        : slotIdx < 6
                          ? "Trung Tuyến"
                          : "Hậu Phương";
                    return (
                      <div
                        key={slotIdx}
                        className={`p-3 rounded-2xl border flex items-center gap-3 min-h-[74px] ${
                          occupant
                            ? "bg-[#0e1538] border-[#3fe9d6]/50 shadow-[0_0_15px_rgba(63,233,214,0.12)]"
                            : "bg-[#060814]/60 border-white/10 border-dashed"
                        }`}
                      >
                        {occupant ? (
                          <>
                            <img
                              src={occupant.HeroImage || "/images/default_hero.png"}
                              alt={occupant.HeroName}
                              onError={(e) => {
                                e.currentTarget.src = "/images/default_hero.png";
                              }}
                              className="w-11 h-11 rounded-xl object-cover object-top border border-white/20 shrink-0 bg-[#050814]"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {occupant.HeroName}
                              </div>
                              <div className="text-[10px] font-mono text-[#f5c767]">
                                Lv.{occupant.Level} · {"★".repeat(occupant.Star)}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                Ô #{slotIdx} ({rowLabel})
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full text-center text-[11px] font-mono text-slate-500">
                            Ô #{slotIdx} · {rowLabel} (Trống)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Danh sách Kho Tướng Valkyria */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#3fe9d6]">
                  Kho Tướng Valkyria Sở Hữu ({detail.heroes.length})
                </h3>

                {detail.heroes.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl bg-[#090d24]/70 border border-dashed border-white/15 text-xs font-mono text-slate-400">
                    Người chơi chưa sở hữu chiến binh Valkyria nào trên cụm máy chủ này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detail.heroes.map((hero) => {
                      const qMeta = getHeroQualityMeta(hero.quality);
                      return (
                        <div
                          key={hero.heroId}
                          className="p-4 rounded-2xl bg-[#090d24] border border-white/10 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5 min-w-0">
                              <img
                                src={hero.image || "/images/default_hero.png"}
                                alt={hero.heroName}
                                onError={(e) => {
                                  e.currentTarget.src = "/images/default_hero.png";
                                }}
                                className="w-16 h-20 rounded-xl object-cover object-top border border-white/15 shrink-0 bg-[#050814]"
                              />
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-base text-white">
                                    {hero.heroName}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-[#f5c767]/15 border border-[#f5c767]/40 text-[10px] font-mono font-bold text-[#f5c767]">
                                    {hero.rarityLabel}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${qMeta.badgeClass}`}
                                  >
                                    Phẩm chất: {hero.qualityName} (+{hero.quality})
                                  </span>
                                  {hero.inActiveTeam && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300">
                                      Đang Xuất Chiến (Ô #{hero.activeSlotIndex})
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs font-mono text-[#f5c767]">
                                  {"★".repeat(hero.star)}
                                  <span className="text-slate-600">
                                    {"★".repeat(Math.max(0, 5 - hero.star))}
                                  </span>{" "}
                                  · Vai trò:{" "}
                                  <span className="text-slate-300">
                                    {hero.role}
                                  </span>
                                </div>

                                <div className="text-xs font-mono text-slate-300">
                                  Cấp độ:{" "}
                                  <strong className="text-[#3fe9d6]">
                                    Lv.{hero.level} / {hero.maxLevel}
                                  </strong>{" "}
                                  ({hero.exp.toLocaleString("vi-VN")} /{" "}
                                  {hero.maxExpForLevel.toLocaleString("vi-VN")} EXP)
                                </div>

                                <div className="text-[11px] font-mono text-slate-400">
                                  Cấp kỹ năng: [Lv.{hero.skillLvs[0] || 1}, Lv.
                                  {hero.skillLvs[1] || 1}, Lv.
                                  {hero.skillLvs[2] || 1}]
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[10px] font-mono text-slate-400">
                                Lực Chiến Tướng
                              </div>
                              <div className="text-base font-bold font-mono text-[#f5c767]">
                                {hero.combatPower.toLocaleString("vi-VN")}
                              </div>
                            </div>
                          </div>

                          {/* 6 Ô trang bị đang mặc trên người Tướng */}
                          <div className="pt-2 border-t border-white/5">
                            <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                              Trang bị đang mặc ({hero.equippedSlots.length}/6 ô):
                            </div>
                            {hero.equippedSlots.length === 0 ? (
                              <div className="text-[11px] font-mono text-slate-500">
                                Chưa mặc trang bị nào
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {hero.equippedSlots.map((slotEq) => {
                                  const rMeta = getItemRarityMeta(slotEq.rarity);
                                  return (
                                    <span
                                      key={slotEq.slot}
                                      className={`px-2 py-1 rounded-lg text-[11px] font-mono border ${rMeta.badgeClass}`}
                                      title={`${slotEq.slotLabel}: ${slotEq.itemName} (+${slotEq.enhanceLevel}) — ${slotEq.mainStatText}`}
                                    >
                                      [{slotEq.slotLabel}] {slotEq.itemName} +
                                      {slotEq.enhanceLevel}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL XÁC NHẬN THU HỒI VẬT PHẨM (INVENTORY) ==================== */}
      {revokingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmRevokeItem}
            className="w-full max-w-md rounded-2xl bg-[#090d24] border border-rose-500/45 p-6 space-y-4 text-slate-100 shadow-2xl"
          >
            <div>
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
                Thu Hồi / Xóa Vật Phẩm Trong Túi Đồ
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Nhân vật:{" "}
                <strong className="text-white">
                  {detail.profile.InGameName}
                </strong>{" "}
                ({detail.serverId})
              </p>
            </div>

            {revokeError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-mono text-rose-200">
                {revokeError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#060814] border border-white/10 space-y-1 text-xs font-mono">
              <div className="font-bold text-white">{revokingItem.itemName}</div>
              <div className="text-slate-400">
                Mã vật phẩm:{" "}
                <span className="text-[#3fe9d6]">{revokingItem.itemId}</span>
              </div>
              <div className="text-slate-400">
                Số lượng hiện có:{" "}
                <strong className="text-emerald-300">
                  {revokingItem.quantity.toLocaleString("vi-VN")}
                </strong>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-mono text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeAllFlag}
                  onChange={(e) => setRevokeAllFlag(e.target.checked)}
                  className="w-4 h-4 rounded accent-rose-500"
                />
                <span>
                  Xóa / Thu hồi toàn bộ ({revokingItem.quantity.toLocaleString("vi-VN")} vật phẩm)
                </span>
              </label>

              {!revokeAllFlag && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Số lượng muốn thu hồi (1 –{" "}
                    {revokingItem.quantity.toLocaleString("vi-VN")}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={revokingItem.quantity}
                    value={revokeAmount}
                    onChange={(e) =>
                      setRevokeAmount(
                        Math.max(
                          1,
                          Math.min(
                            revokingItem.quantity,
                            Number(e.target.value) || 1
                          )
                        )
                      )
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#060814] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-rose-400"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Lý do thu hồi / xóa vật phẩm *
                </label>
                <textarea
                  rows={2}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="VD: Thu hồi vật phẩm phát nhầm qua thư đền bù / Xử lý trục lợi lỗi sự kiện..."
                  className="w-full p-3 rounded-xl bg-[#060814] border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={revokeSubmitting}
                onClick={() => setRevokingItem(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={revokeSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                {revokeSubmitting ? "Đang Thu Hồi..." : "Xác Nhận Thu Hồi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL XÁC NHẬN THU HỒI TRANG BỊ (EQUIPMENTS) ==================== */}
      {revokingEquip && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmRevokeEquip}
            className="w-full max-w-md rounded-2xl bg-[#090d24] border border-rose-500/45 p-6 space-y-4 text-slate-100 shadow-2xl"
          >
            <div>
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
                Thu Hồi &amp; Xóa Trang Bị Của Người Chơi
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Nhân vật:{" "}
                <strong className="text-white">
                  {detail.profile.InGameName}
                </strong>{" "}
                ({detail.serverId})
              </p>
            </div>

            {equipRevokeError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-mono text-rose-200">
                {equipRevokeError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#060814] border border-white/10 space-y-1 text-xs font-mono">
              <div className="font-bold text-white">
                {revokingEquip.itemName} (+{revokingEquip.enhanceLevel})
              </div>
              <div className="text-slate-400">
                Mã thực thể:{" "}
                <span className="text-[#3fe9d6]">{revokingEquip.equipUid}</span>
              </div>
              {revokingEquip.equippedHeroId && (
                <div className="text-amber-300">
                  * Trang bị này đang mặc trên tướng{" "}
                  <strong>{revokingEquip.equippedHeroName}</strong>. Hệ thống sẽ tự động tháo khỏi tướng và cập nhật lại Lực chiến.
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">
                Lý do thu hồi trang bị *
              </label>
              <textarea
                rows={2}
                value={equipRevokeReason}
                onChange={(e) => setEquipRevokeReason(e.target.value)}
                placeholder="VD: Thu hồi trang bị phát nhầm / Xử lý trang bị bất thường..."
                className="w-full p-3 rounded-xl bg-[#060814] border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={equipRevokeSubmitting}
                onClick={() => setRevokingEquip(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={equipRevokeSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                {equipRevokeSubmitting ? "Đang Thu Hồi..." : "Xác Nhận Thu Hồi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
