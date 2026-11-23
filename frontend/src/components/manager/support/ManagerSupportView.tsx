"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";
import SystemMailManager from "./SystemMailManager";

export type SupportSubTab = "mail";

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
  const canSendGlobalReward = hasPermission(
    currentUser,
    "support.mail.send_global_reward"
  );
  const canDelete = hasPermission(currentUser, "support.mail.delete");
  const hasMailAccess =
    hasPermission(currentUser, "support.mail.view") ||
    canSendNotice ||
    canSendPersonalReward ||
    canSendGlobalReward ||
    canDelete;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  if (!hasMailAccess) {
    return (
      <div className="py-20 p-8 rounded-3xl bg-[#090d24]/90 border border-amber-500/30 text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
          Hạn Chế Truy Cập
        </span>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Thao Tác Chi Tiết
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Tài khoản của bạn thuộc nhóm Hỗ Trợ Người Chơi nhưng toàn bộ quyền thao tác chi tiết (Hòm Thư Hệ Thống) đều đang bị hạn chế. Vui lòng liên hệ Quản Trị Viên để mở quyền.
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
          canDelete={canDelete}
          onNotify={showToast}
        />
      )}
    </div>
  );
}
