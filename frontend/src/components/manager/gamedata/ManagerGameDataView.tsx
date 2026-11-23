"use client";

import { useState, useEffect } from "react";
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

export default function ManagerGameDataView({
  initialSubTab = "characters",
}: ManagerGameDataViewProps = {}) {
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

  const activeSubTab: GameDataSubTab = initialSubTab;
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

  const shouldLoadCharacters =
    hasCharacterAccess &&
    (activeSubTab === "characters" || activeSubTab === "items");
  const loading = shouldLoadCharacters && !loadedOnce;

  useEffect(() => {
    if (!shouldLoadCharacters) return;
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
  }, [shouldLoadCharacters]);

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
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
          Hạn Chế Truy Cập
        </span>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Thao Tác Chi Tiết
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Tài khoản của bạn thuộc nhóm Dữ Liệu Game nhưng tất cả quyền thao tác nhỏ (Nhân Vật Valkyria, Banner Gacha, Vật Phẩm & Trang Bị) đều đang bị hạn chế. Vui lòng liên hệ Quản Trị Viên để mở quyền.
        </p>
      </div>
    );
  }

  const isSubFeatureDenied =
    (activeSubTab === "characters" && !hasCharacterAccess) ||
    (activeSubTab === "gacha" && !hasGachaAccess) ||
    (activeSubTab === "items" && !hasItemAccess);

  if (isSubFeatureDenied) {
    return (
      <div className="py-20 p-8 rounded-3xl bg-[#090d24]/90 border border-amber-500/30 text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
          Hạn Chế Truy Cập
        </span>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Thao Tác Chức Năng Này
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Tài khoản của bạn chưa được mở quyền truy cập cho mục này trong nhóm Dữ Liệu Game. Vui lòng liên hệ Quản Trị Viên để được cấp quyền.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-[family-name:var(--font-inter)] animate-fade-in">
      {/* ACTIVE FEATURE VIEW */}
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
        <div className="py-20 text-center rounded-2xl bg-[#090d24]/50 border border-dashed border-white/10 space-y-2">
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
