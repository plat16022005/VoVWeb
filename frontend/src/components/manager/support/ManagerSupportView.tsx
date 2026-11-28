"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";
import SystemMailManager from "./SystemMailManager";
import PlayerDataManager from "./PlayerDataManager";
import PlayerActivityLogsManager from "./PlayerActivityLogsManager";

export type SupportSubTab = "mail" | "players" | "activity";

export default function ManagerSupportView({
  initialSubTab = "mail",
}: { initialSubTab?: SupportSubTab } = {}) {
  const currentUser = useAuth();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canSendNotice = hasPermission(currentUser, "support.mail.send_notice");
  const canSendPersonalReward = hasPermission(
    currentUser,
    "support.mail.send_personal"
  );
  const canForgeEquipment =
    hasPermission(currentUser, "support.mail.forge_equipment") ||
    canSendPersonalReward;
  const canSendGlobalReward = hasPermission(
    currentUser,
    "support.mail.send_global_reward"
  );
  const canDelete = hasPermission(currentUser, "support.mail.delete");
  const hasMailAccess =
    hasPermission(currentUser, "support.mail.view") ||
    canSendNotice ||
    canSendPersonalReward ||
    canForgeEquipment ||
    canSendGlobalReward ||
    canDelete;

  const canRevokePlayerItem = hasPermission(
    currentUser,
    "support.player.revoke_item"
  );
  const hasPlayerDataAccess =
    hasPermission(currentUser, "support.player.view") || canRevokePlayerItem;

  const hasPlayerActivityLogsAccess =
    hasPermission(currentUser, "support.player.activity_logs") ||
    hasPlayerDataAccess;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  if (
    (initialSubTab === "mail" && !hasMailAccess) ||
    (initialSubTab === "players" && !hasPlayerDataAccess) ||
    (initialSubTab === "activity" && !hasPlayerActivityLogsAccess)
  ) {
    return (
      <div className="py-20 p-8 rounded-3xl bg-[#090d24]/90 border border-amber-500/30 text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
          Hạn Chế Truy Cập
        </span>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Thao Tác Chi Tiết
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Tài khoản của bạn thuộc nhóm Hỗ Trợ Người Chơi nhưng chưa được mở quyền thao tác cho chức năng này. Vui lòng liên hệ Quản Trị Viên để được cấp quyền.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl bg-[#090d24] border-l-2 border-emerald-400 border-t border-r border-b border-white/15 text-white text-xs font-mono font-semibold shadow-2xl">
          {toastMsg}
        </div>
      )}

      {initialSubTab === "mail" && (
        <SystemMailManager
          canSendNotice={canSendNotice}
          canSendPersonalReward={canSendPersonalReward}
          canSendGlobalReward={canSendGlobalReward}
          canForgeEquipment={canForgeEquipment}
          canDelete={canDelete}
          onNotify={showToast}
        />
      )}

      {initialSubTab === "players" && (
        <PlayerDataManager
          canRevoke={canRevokePlayerItem}
          onNotify={showToast}
        />
      )}

      {initialSubTab === "activity" && (
        <PlayerActivityLogsManager
          canViewPlayerDetail={hasPlayerDataAccess}
          canRevoke={canRevokePlayerItem}
          onNotify={showToast}
        />
      )}
    </div>
  );
}
