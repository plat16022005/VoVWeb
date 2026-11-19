"use client";

import { useState, useEffect, useMemo } from "react";
import { Character } from "@/data/characters";
import { characterService, sortCharactersByRarity } from "@/services/character.service";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";
import { soundEngine } from "@/services/audio.service";
import ValkyriaListTab from "./ValkyriaListTab";
import ValkyriaDetailModal from "./ValkyriaDetailModal";
import ValkyriaFormModal from "./ValkyriaFormModal";
import ValkyriaDeleteModal from "./ValkyriaDeleteModal";
import GachaSeasonsManager from "../gacha/GachaSeasonsManager";
import GameItemsManager from "../items/GameItemsManager";

export type GameDataSubTab = "characters" | "gacha" | "items" | "worlds";

interface ManagerGameDataViewProps {
  initialSubTab?: GameDataSubTab;
}

export default function ManagerGameDataView({ initialSubTab }: ManagerGameDataViewProps = {}) {
  const currentUser = useAuth();

  // Permissions
  const canEdit = hasPermission(currentUser, "gamedata.character.edit");
  const canDelete = hasPermission(currentUser, "gamedata.character.delete");
  const canEditSkills = hasPermission(currentUser, "gamedata.character.skills");
  const hasCharacterAccess =
    hasPermission(currentUser, "gamedata.character.view") ||
    canEdit ||
    canEditSkills ||
    canDelete;

  const canGachaEdit = hasPermission(currentUser, "gamedata.gacha.edit");
  const canGachaActivate = hasPermission(currentUser, "gamedata.gacha.activate");
  const canGachaDelete = hasPermission(currentUser, "gamedata.gacha.delete");
  const hasGachaAccess =
    hasPermission(currentUser, "gamedata.gacha.view") ||
    canGachaEdit ||
    canGachaActivate ||
    canGachaDelete;

  const canItemEdit = hasPermission(currentUser, "gamedata.item.edit");
  const canItemDelete = hasPermission(currentUser, "gamedata.item.delete");
  const hasItemAccess =
    hasPermission(currentUser, "gamedata.item.view") ||
    canItemEdit ||
    canItemDelete;

  const [currentSubTab, setCurrentSubTab] = useState<GameDataSubTab>(() => {
    if (initialSubTab === "gacha" && hasGachaAccess) return "gacha";
    if (initialSubTab === "items" && hasItemAccess) return "items";
    if (initialSubTab === "characters" && hasCharacterAccess) return "characters";
    if (initialSubTab === "worlds") return initialSubTab;
    if (hasCharacterAccess) return "characters";
    if (hasGachaAccess) return "gacha";
    if (hasItemAccess) return "items";
    return "characters";
  });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  // Modal States
  const [detailChar, setDetailChar] = useState<Character | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [formChar, setFormChar] = useState<Character | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [deleteChar, setDeleteChar] = useState<Character | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const activeSubTab: GameDataSubTab = useMemo(() => {
    if (currentSubTab === "characters" && !hasCharacterAccess) {
      if (hasGachaAccess) return "gacha";
      if (hasItemAccess) return "items";
    }
    if (currentSubTab === "gacha" && !hasGachaAccess) {
      if (hasCharacterAccess) return "characters";
      if (hasItemAccess) return "items";
    }
    if (currentSubTab === "items" && !hasItemAccess) {
      if (hasCharacterAccess) return "characters";
      if (hasGachaAccess) return "gacha";
    }
    return currentSubTab;
  }, [currentSubTab, hasCharacterAccess, hasGachaAccess, hasItemAccess]);

  const loading = hasCharacterAccess && !loadedOnce;

  useEffect(() => {
    if (!hasCharacterAccess) return;
    let active = true;
    characterService
      .getCharacters()
      .then((data) => {
        if (active) setCharacters(data);
      })
      .catch((err: unknown) => {
        if (active) {
          showToast(
            "error",
            err instanceof Error && err.message
              ? err.message
              : "Không thể nạp dữ liệu nhân vật."
          );
        }
      })
      .finally(() => {
        if (active) setLoadedOnce(true);
      });
    return () => {
      active = false;
    };
  }, [hasCharacterAccess]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormChar(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (char: Character) => {
    setFormChar(char);
    setIsFormOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (char: Character) => {
    setDetailChar(char);
    setIsDetailOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (char: Character) => {
    setDeleteChar(char);
    setIsDeleteOpen(true);
  };

  // Save Character Handler
  const handleSaveCharacter = async (charData: Character) => {
    if (!canEdit) {
      showToast("error", "Tài khoản của bạn không có quyền thêm mới hoặc chỉnh sửa nhân vật.");
      throw new Error("Không có quyền chỉnh sửa nhân vật.");
    }
    try {
      const performer = currentUser?.username || currentUser?.email || "Quản Trị Viên";
      const performerRole = currentUser?.role || "Manager";
      const saved = await characterService.saveCharacter(charData, performer, performerRole);
      setCharacters((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        const updated = idx >= 0 ? [...prev] : [saved, ...prev];
        if (idx >= 0) updated[idx] = saved;
        return sortCharactersByRarity(updated);
      });

      showToast(
        "success",
        `Đã lưu thành công thông tin chiến binh Valkyria ${saved.name}.`
      );
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error && err.message ? err.message : "Lỗi khi lưu nhân vật."
      );
      throw err;
    }
  };

  // Delete Character Handler
  const handleConfirmDelete = async (char: Character) => {
    if (!canDelete) {
      showToast("error", "Tài khoản của bạn không có quyền xóa nhân vật khỏi hệ thống.");
      return;
    }
    setIsDeleting(true);
    try {
      const performer = currentUser?.username || currentUser?.email || "Quản Trị Viên";
      const performerRole = currentUser?.role || "Manager";
      await characterService.deleteCharacter(char.id, char.name, performer, performerRole);
      setCharacters((prev) => prev.filter((c) => c.id !== char.id));
      soundEngine.playSuccess();
      showToast("success", `Đã xóa Valkyria ${char.name} khỏi hệ thống.`);
      setIsDeleteOpen(false);
      setDeleteChar(null);
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error && err.message ? err.message : "Lỗi khi xóa nhân vật."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (!canEdit) {
      showToast("error", "Tài khoản của bạn không có quyền khôi phục danh sách nhân vật.");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn khôi phục danh sách nhân vật mẫu ban đầu không?")) {
      try {
        const performer = currentUser?.username || currentUser?.email || "Quản Trị Viên";
        const performerRole = currentUser?.role || "Admin";
        const defs = await characterService.resetToDefaults(performer, performerRole);
        setCharacters(defs);
        soundEngine.playSuccess();
        showToast("info", "Đã khôi phục danh sách 4 Valkyria mặc định.");
      } catch (err: unknown) {
        showToast(
          "error",
          err instanceof Error && err.message ? err.message : "Lỗi khôi phục mặc định."
        );
      }
    }
  };

  // Sync directly to Server Database
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSyncToFirestore = async () => {
    if (!canEdit) {
      showToast("error", "Tài khoản của bạn không có quyền đồng bộ dữ liệu lên máy chủ.");
      return;
    }
    setIsSyncing(true);
    try {
      const performer = currentUser?.username || currentUser?.email || "Quản Trị Viên";
      const performerRole = currentUser?.role || "Admin";
      await characterService.seedInitialCharacters(performer, performerRole);
      const updated = await characterService.getCharacters();
      setCharacters(updated);
      soundEngine.playSuccess();
      showToast("success", "Đã đồng bộ toàn bộ dữ liệu nhân vật lên hệ thống máy chủ thành công!");
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error && err.message
          ? err.message
          : "Lỗi khi đồng bộ dữ liệu lên hệ thống máy chủ."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  if (!hasCharacterAccess && !hasGachaAccess && !hasItemAccess) {
    return (
      <div className="py-20 p-8 rounded-3xl bg-[#090d24]/90 border border-amber-500/30 text-center space-y-3">
        <div className="text-4xl">⚠️</div>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Thao Tác Chi Tiết
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Tài khoản của bạn thuộc nhóm Dữ Liệu Game nhưng tất cả quyền thao tác nhỏ (Nhân Vật Valkyria, Banner Gacha, Vật Phẩm & Trang Bị) đều đang bị hạn chế. Vui lòng liên hệ Quản Trị Viên để mở quyền.
        </p>
      </div>
    );
  }

  const hasCurrentWritePermission =
    activeSubTab === "gacha"
      ? canGachaEdit || canGachaActivate || canGachaDelete
      : activeSubTab === "items"
      ? canItemEdit || canItemDelete
      : canEdit || canEditSkills || canDelete;

  return (
    <div className="space-y-6 pb-12 font-[family-name:var(--font-inter)] animate-fade-in">
      {/* 1. HEADER HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1438] via-[#080d24] to-[#0c1438] border border-[#3fe9d6]/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(63,233,214,0.15)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3fe9d6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#3fe9d6] via-[#9b51e0] to-[#f5c767] p-[2px] shadow-[0_0_25px_rgba(63,233,214,0.4)] shrink-0">
              <div className="w-full h-full bg-[#060814] rounded-[14px] flex items-center justify-center font-[family-name:var(--font-rajdhani)] font-black text-2xl sm:text-3xl text-[#3fe9d6]">
                {activeSubTab === "gacha" ? "🌠" : "⚔️"}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase font-[family-name:var(--font-rajdhani)]">
                  QUẢN LÝ DỮ LIỆU GAME (GAME MASTER DATA)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 text-[10px] font-bold font-mono">
                  UNITY ENGINE READY
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-sans">
                Trung tâm thiết lập hồ sơ chiến binh Valkyria, bộ kỹ năng, chỉ số chiến đấu, hệ thống Banner Gacha theo mùa và thế giới Veyra.
                Dữ liệu được đồng bộ trực tiếp phục vụ cho Client game và trang chủ chính thức.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                <span>Trạng thái: <strong className="text-emerald-400">Đã Kết Nối An Toàn</strong></span>
                <span>•</span>
                <span>
                  Dữ liệu:{" "}
                  <strong className="text-white">
                    {hasCharacterAccess ? `${characters.length} Valkyria` : "Banner Gacha"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Quyền:{" "}
                  <strong className={hasCurrentWritePermission ? "text-[#3fe9d6]" : "text-amber-300"}>
                    {hasCurrentWritePermission ? "Có quyền quản lý" : "Chỉ xem"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        {hasCharacterAccess && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setCurrentSubTab("characters");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "characters"
                ? "bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_15px_rgba(63,233,214,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <span>⚔️</span>
            <span>Chiến Binh Valkyria ({characters.length})</span>
          </button>
        )}

        {hasGachaAccess && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setCurrentSubTab("gacha");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "gacha"
                ? "bg-[#f5c767]/20 text-[#f5c767] border border-[#f5c767]/40 shadow-[0_0_15px_rgba(245,199,103,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <span>🌠</span>
            <span>Banner Gacha</span>
          </button>
        )}

        {hasItemAccess && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setCurrentSubTab("items");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "items"
                ? "bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_20px_rgba(63,233,214,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <span>🛡️</span>
            <span>Vật Phẩm & Trang Bị</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setCurrentSubTab("worlds");
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "worlds"
              ? "bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40"
              : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <span>🗺️</span>
          <span>Bản Đồ Thế Giới Veyra</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400 font-normal">Sắp mở</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {activeSubTab === "characters" && hasCharacterAccess && (
        <ValkyriaListTab
          characters={characters}
          loading={loading}
          onAddNew={handleOpenAdd}
          onViewDetail={handleOpenDetail}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onResetDefaults={handleResetDefaults}
          onSyncToFirestore={handleSyncToFirestore}
          isSyncing={isSyncing}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeSubTab === "gacha" && hasGachaAccess && <GachaSeasonsManager />}

      {activeSubTab === "items" && hasItemAccess && (
        <GameItemsManager
          canEdit={canItemEdit}
          canDelete={canItemDelete}
          heroIdSuggestions={characters.map((c) => ({ id: c.id, name: c.name }))}
          onNotify={showToast}
        />
      )}

      {activeSubTab === "worlds" && (
        <div className="py-20 text-center rounded-2xl bg-[#090d24]/50 border border-dashed border-white/10 space-y-3">
          <div className="text-4xl">🗺️</div>
          <h4 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)]">
            Phân Hệ Quản Lý Bản Đồ & Vùng Đất Veyra
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
            Dữ liệu các khu vực (Eldoria, Rừng Hư Ảnh, Thành Phố Vô Tận) và thông số ải phó bản sẽ được tích hợp trong bản cập nhật phân hệ tiếp theo.
          </p>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Detail Modal */}
      <ValkyriaDetailModal
        character={detailChar}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailChar(null);
        }}
        onEdit={handleOpenEdit}
        canEdit={canEdit}
      />

      {/* 2. Form Modal (Add / Edit) */}
      <ValkyriaFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setFormChar(null);
        }}
        onSave={handleSaveCharacter}
        initialData={formChar}
        canEdit={canEdit}
        canEditSkills={canEditSkills}
      />

      {/* 3. Delete Confirmation Modal */}
      <ValkyriaDeleteModal
        character={deleteChar}
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteChar(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* TOAST FEEDBACK */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#090d24] border border-[#3fe9d6] text-white text-xs font-semibold shadow-[0_10px_35px_rgba(63,233,214,0.3)] flex items-center gap-2.5 animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-[#3fe9d6] animate-pulse" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

