"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GachaBannerConfig, GachaSeasonDocument } from "@/data/gacha";
import { hasPermission } from "@/data/permissions";
import { useAuth } from "@/services/auth.service";
import { gachaService, GachaHeroReference } from "@/services/gacha.service";
import { GameItemConfig, itemConfigService } from "@/services/itemConfig.service";
import { soundEngine } from "@/services/audio.service";
import GachaSeasonsList from "./GachaSeasonsList";
import SeasonBannerWorkspace from "./SeasonBannerWorkspace";
import SeasonFormModal, { SeasonModalMode } from "./SeasonFormModal";
import GachaConfirmModal from "./GachaConfirmModal";

type ConfirmState =
  | { type: "activate"; season: GachaSeasonDocument }
  | { type: "deactivate"; season: GachaSeasonDocument }
  | { type: "delete_season"; season: GachaSeasonDocument }
  | { type: "delete_banner"; seasonId: string; banner: GachaBannerConfig }
  | null;

export default function GachaSeasonsManager() {
  const currentUser = useAuth();

  const canEdit = hasPermission(currentUser, "gamedata.gacha.edit");
  const canActivate = hasPermission(currentUser, "gamedata.gacha.activate");
  const canDelete = hasPermission(currentUser, "gamedata.gacha.delete");

  const [seasons, setSeasons] = useState<GachaSeasonDocument[]>([]);
  const [heroes, setHeroes] = useState<GachaHeroReference[]>([]);
  const [items, setItems] = useState<GameItemConfig[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  const [seasonModal, setSeasonModal] = useState<{
    isOpen: boolean;
    mode: SeasonModalMode;
    sourceSeason: GachaSeasonDocument | null;
  }>({ isOpen: false, mode: "create", sourceSeason: null });

  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const loadSeasons = useCallback(async () => {
    setLoadingSeasons(true);
    try {
      const data = await gachaService.getSeasons();
      setSeasons(data);
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error && err.message
          ? err.message
          : "Không thể nạp danh sách mùa Banner Gacha."
      );
    } finally {
      setLoadingSeasons(false);
    }
  }, [showToast]);

  const loadReferences = useCallback(async () => {
    setLoadingRefs(true);
    try {
      const [heroList, itemList] = await Promise.all([
        gachaService.getReferenceHeroes().catch(() => [] as GachaHeroReference[]),
        itemConfigService.getItems().catch(() => [] as GameItemConfig[]),
      ]);
      setHeroes(heroList);
      setItems(itemList);
    } finally {
      setLoadingRefs(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    gachaService
      .getSeasons()
      .then((data) => {
        if (active) setSeasons(data);
      })
      .catch((err: unknown) => {
        if (active) {
          showToast(
            "error",
            err instanceof Error && err.message
              ? err.message
              : "Không thể nạp danh sách mùa Banner Gacha."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingSeasons(false);
      });

    Promise.all([
      gachaService.getReferenceHeroes().catch(() => [] as GachaHeroReference[]),
      itemConfigService.getItems().catch(() => [] as GameItemConfig[]),
    ])
      .then(([heroList, itemList]) => {
        if (active) {
          setHeroes(heroList);
          setItems(itemList);
        }
      })
      .finally(() => {
        if (active) setLoadingRefs(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  const selectedSeason = useMemo(
    () => seasons.find((s) => s.SeasonId === selectedSeasonId) || null,
    [seasons, selectedSeasonId]
  );

  const handleSeasonModalSubmit = async (payload: {
    mode: SeasonModalMode;
    SeasonId: string;
    SeasonName: string;
    StartTime: string;
    EndTime: string;
    IsActive?: boolean;
    syncLimitedBannerTimes?: boolean;
  }) => {
    if (!canEdit) {
      throw new Error("Tài khoản của bạn không có quyền tạo hoặc chỉnh sửa mùa Gacha.");
    }

    if (payload.mode === "create") {
      const created = await gachaService.createSeason({
        SeasonId: payload.SeasonId,
        SeasonName: payload.SeasonName,
        StartTime: payload.StartTime,
        EndTime: payload.EndTime,
        IsActive: payload.IsActive,
      });
      await loadSeasons();
      setSelectedSeasonId(created.SeasonId);
      showToast("success", `Đã khởi tạo mùa "${created.SeasonName}" thành công.`);
    } else if (payload.mode === "clone" && seasonModal.sourceSeason) {
      const cloned = await gachaService.cloneSeason(
        seasonModal.sourceSeason.SeasonId,
        {
          SeasonId: payload.SeasonId,
          SeasonName: payload.SeasonName,
          StartTime: payload.StartTime,
          EndTime: payload.EndTime,
          syncLimitedBannerTimes: payload.syncLimitedBannerTimes,
        }
      );
      await loadSeasons();
      setSelectedSeasonId(cloned.SeasonId);
      showToast(
        "success",
        `Đã nhân bản mùa "${cloned.SeasonName}" với đầy đủ cấu hình sẵn có.`
      );
    } else if (payload.mode === "edit" && seasonModal.sourceSeason) {
      await gachaService.updateSeasonMetadata(payload.SeasonId, {
        SeasonName: payload.SeasonName,
        StartTime: payload.StartTime,
        EndTime: payload.EndTime,
      });
      await loadSeasons();
      showToast(
        "success",
        `Đã cập nhật thông tin mùa "${payload.SeasonName}".`
      );
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    setConfirmLoading(true);
    try {
      if (confirmState.type === "activate") {
        if (!canActivate) throw new Error("Không có quyền kích hoạt mùa.");
        await gachaService.activateSeason(confirmState.season.SeasonId);
        await loadSeasons();
        soundEngine.playSuccess();
        showToast(
          "success",
          `Đã kích hoạt phát hành mùa "${confirmState.season.SeasonName}"!`
        );
      } else if (confirmState.type === "deactivate") {
        if (!canActivate) throw new Error("Không có quyền tắt mùa phát hành.");
        await gachaService.deactivateSeason(confirmState.season.SeasonId);
        await loadSeasons();
        soundEngine.playSuccess();
        showToast(
          "info",
          `Đã chuyển mùa "${confirmState.season.SeasonName}" về Bản nháp.`
        );
      } else if (confirmState.type === "delete_season") {
        if (!canDelete) throw new Error("Không có quyền xóa mùa Gacha.");
        await gachaService.deleteDraftSeason(confirmState.season.SeasonId);
        if (selectedSeasonId === confirmState.season.SeasonId) {
          setSelectedSeasonId(null);
        }
        await loadSeasons();
        soundEngine.playSuccess();
        showToast(
          "success",
          `Đã xóa mùa nháp "${confirmState.season.SeasonName}".`
        );
      } else if (confirmState.type === "delete_banner") {
        if (!canDelete) throw new Error("Không có quyền xóa banner.");
        await gachaService.deleteBannerFromSeason(
          confirmState.seasonId,
          confirmState.banner.BannerId
        );
        await loadSeasons();
        soundEngine.playSuccess();
        showToast(
          "success",
          `Đã xóa banner "${confirmState.banner.Title}" khỏi mùa.`
        );
      }
      setConfirmState(null);
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error && err.message ? err.message : "Thao tác thất bại."
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSaveBanner = async (
    seasonId: string,
    banner: GachaBannerConfig,
    meta: {
      isNew: boolean;
      oldBannerImageKey?: string;
      oldBannerTabImageKey?: string;
    }
  ) => {
    if (!canEdit) {
      throw new Error("Tài khoản của bạn không có quyền chỉnh sửa banner.");
    }
    await gachaService.saveBannerInSeason(seasonId, banner, {
      isNew: meta.isNew,
    });
    await loadSeasons();
    showToast(
      "success",
      `Đã lưu banner "${banner.Title}" và tăng phiên bản mùa.`
    );
  };

  const handleToggleBannerActive = async (
    seasonId: string,
    banner: GachaBannerConfig
  ) => {
    if (!canActivate) {
      showToast("error", "Bạn không có quyền bật/tắt trạng thái banner.");
      return;
    }
    try {
      await gachaService.toggleBannerActive(
        seasonId,
        banner.BannerId,
        !banner.IsActive
      );
      await loadSeasons();
      showToast(
        "success",
        `Đã ${!banner.IsActive ? "bật mở" : "tạm tắt"} banner "${banner.Title}".`
      );
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error && err.message
          ? err.message
          : "Không thể đổi trạng thái banner."
      );
    }
  };

  return (
    <div className="space-y-6">
      {selectedSeason ? (
        <SeasonBannerWorkspace
          season={selectedSeason}
          heroes={heroes}
          items={items}
          loadingRefs={loadingRefs}
          canEdit={canEdit}
          canActivate={canActivate}
          canDelete={canDelete}
          onBackToList={() => setSelectedSeasonId(null)}
          onEditSeasonMeta={(season) =>
            setSeasonModal({ isOpen: true, mode: "edit", sourceSeason: season })
          }
          onActivateSeason={(season) =>
            setConfirmState({ type: "activate", season })
          }
          onDeactivateSeason={(season) =>
            setConfirmState({ type: "deactivate", season })
          }
          onSaveBanner={handleSaveBanner}
          onToggleBannerActive={handleToggleBannerActive}
          onDeleteBanner={(seasonId, banner) =>
            setConfirmState({ type: "delete_banner", seasonId, banner })
          }
        />
      ) : (
        <GachaSeasonsList
          seasons={seasons}
          loading={loadingSeasons}
          canEdit={canEdit}
          canActivate={canActivate}
          canDelete={canDelete}
          onRefresh={() => {
            loadSeasons();
            loadReferences();
          }}
          onCreateNew={() =>
            setSeasonModal({ isOpen: true, mode: "create", sourceSeason: null })
          }
          onOpenSeason={(season) => setSelectedSeasonId(season.SeasonId)}
          onCloneSeason={(season) =>
            setSeasonModal({
              isOpen: true,
              mode: "clone",
              sourceSeason: season,
            })
          }
          onEditSeasonMeta={(season) =>
            setSeasonModal({ isOpen: true, mode: "edit", sourceSeason: season })
          }
          onActivateSeason={(season) =>
            setConfirmState({ type: "activate", season })
          }
          onDeactivateSeason={(season) =>
            setConfirmState({ type: "deactivate", season })
          }
          onDeleteDraftSeason={(season) =>
            setConfirmState({ type: "delete_season", season })
          }
        />
      )}

      {/* Season Create / Clone / Edit Modal */}
      {seasonModal.isOpen && (
        <SeasonFormModal
          key={`${seasonModal.mode}-${seasonModal.sourceSeason?.SeasonId || "new"}`}
          isOpen={seasonModal.isOpen}
          mode={seasonModal.mode}
          sourceSeason={seasonModal.sourceSeason}
          existingSeasonIds={seasons.map((s) => s.SeasonId)}
          onClose={() =>
            setSeasonModal({ isOpen: false, mode: "create", sourceSeason: null })
          }
          onSubmit={handleSeasonModalSubmit}
        />
      )}

      {/* Confirm Modal */}
      <GachaConfirmModal
        isOpen={Boolean(confirmState)}
        loading={confirmLoading}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
        title={
          confirmState?.type === "activate"
            ? "Kích Hoạt Mùa Phát Hành"
            : confirmState?.type === "deactivate"
            ? "Tạm Ngưng Mùa Phát Hành"
            : confirmState?.type === "delete_season"
            ? "Xác Nhận Xóa Mùa Nháp"
            : "Xác Nhận Xóa Banner"
        }
        subtitle={
          confirmState?.type === "delete_banner"
            ? `${confirmState.seasonId} / ${confirmState.banner.BannerId}`
            : confirmState?.season.SeasonId
        }
        variant={
          confirmState?.type === "activate"
            ? "cyan"
            : confirmState?.type === "deactivate"
            ? "warning"
            : "danger"
        }
        confirmLabel={
          confirmState?.type === "activate"
            ? "Kích Hoạt Ngay"
            : confirmState?.type === "deactivate"
            ? "Chuyển Về Nháp"
            : "Xác Nhận Xóa"
        }
        description={
          confirmState?.type === "activate"
            ? `Kích hoạt mùa "${confirmState.season.SeasonName}" sẽ tự động tắt tất cả các mùa khác đang mở và phát hành cấu hình banner này cho Game Client.`
            : confirmState?.type === "deactivate"
            ? `Tạm ngưng mùa "${confirmState.season.SeasonName}" sẽ chuyển mùa về Bản Nháp. Lưu ý: Nếu chưa có mùa thay thế, Game Client sẽ không có mùa đang mở.`
            : confirmState?.type === "delete_season"
            ? `Bạn có chắc chắn muốn xóa vĩnh viễn mùa nháp "${confirmState.season.SeasonName}" không? Các ảnh riêng không còn dùng chung sẽ được dọn khỏi bộ lưu trữ.`
            : confirmState?.type === "delete_banner"
            ? `Bạn có chắc chắn muốn xóa banner "${confirmState.banner.Title}" (${confirmState.banner.BannerId}) khỏi mùa này không?`
            : ""
        }
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#090d24] border text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-slide-up ${
            toast.type === "error"
              ? "border-rose-500 text-rose-200"
              : toast.type === "info"
              ? "border-[#f5c767] text-amber-100"
              : "border-[#3fe9d6]"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              toast.type === "error"
                ? "bg-rose-400"
                : toast.type === "info"
                ? "bg-[#f5c767]"
                : "bg-[#3fe9d6]"
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
