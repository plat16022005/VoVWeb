"use client";

import { useState } from "react";
import Link from "next/link";
import StarCanvas from "@/components/common/StarCanvas";
import ManagerSidebar, { ManagerTab } from "./ManagerSidebar";
import ManagerHeader, { ManagerSectionKey } from "./ManagerHeader";
import ManagerOverviewTab from "./ManagerOverviewTab";
import ManagerContentHubView, { ContentSubTab } from "./ManagerContentHubView";
import ManagerGameDataView, { GameDataSubTab } from "./gamedata/ManagerGameDataView";
import ManagerEventsView, { EventHubSubTab } from "./events/ManagerEventsView";
import ManagerSupportView, { SupportSubTab } from "./support/ManagerSupportView";
import { useAuth } from "@/services/auth.service";
import { hasPermissionGroup } from "@/data/permissions";

interface ManagerPortalViewProps {
  initialTab?: ManagerTab;
  initialContentSubTab?: ContentSubTab;
  initialGameDataSubTab?: GameDataSubTab;
  initialEventSubTab?: EventHubSubTab;
  initialSupportSubTab?: SupportSubTab;
}

export default function ManagerPortalView({
  initialTab = "overview",
  initialContentSubTab = "overview",
  initialGameDataSubTab = "characters",
  initialEventSubTab = "minigames",
  initialSupportSubTab = "mail",
}: ManagerPortalViewProps) {
  const currentUser = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Đã đồng bộ lại toàn bộ dữ liệu vận hành!");
    }, 600);
  };

  const sectionKey: ManagerSectionKey =
    initialTab === "content"
      ? `content:${initialContentSubTab}`
      : initialTab === "gamedata"
        ? `gamedata:${initialGameDataSubTab}`
        : initialTab === "events"
          ? `events:${initialEventSubTab}`
          : initialTab === "support"
            ? `support:${initialSupportSubTab}`
            : "overview";

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex font-[family-name:var(--font-inter)] selection:bg-[#f5c767]/30 selection:text-white relative overflow-x-hidden">
      {/* Background Star Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <StarCanvas />
      </div>

      {/* Manager Sidebar Navigation */}
      <ManagerSidebar
        currentTab={initialTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 relative">
        {/* Header Bar */}
        <ManagerHeader
          currentTab={initialTab}
          sectionKey={sectionKey}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Tab Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {initialTab === "overview" && <ManagerOverviewTab />}

          {initialTab === "content" &&
            (hasPermissionGroup(currentUser, "content_management") ? (
              <ManagerContentHubView
                key={initialContentSubTab}
                initialSubTab={initialContentSubTab}
              />
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  Hạn Chế Truy Cập
                </span>
                <h2 className="text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
                  Giới Hạn Quyền Truy Cập
                </h2>
                <p className="text-sm text-slate-400 max-w-md font-sans">
                  Tài khoản của bạn chưa được cấp quyền truy cập Nhóm chức năng{" "}
                  <strong>Quản Lý Nội Dung</strong>. Vui lòng liên hệ Quản Trị Viên (Admin) để được thêm vào nhóm.
                </p>
                <Link
                  href="/manager"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#f5c767] text-white text-xs font-mono font-semibold transition-all"
                >
                  ← Quay lại Tổng Quan Vận Hành
                </Link>
              </div>
            ))}

          {initialTab === "gamedata" &&
            (hasPermissionGroup(currentUser, "game_data") ? (
              <ManagerGameDataView
                key={initialGameDataSubTab}
                initialSubTab={initialGameDataSubTab}
              />
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  Hạn Chế Truy Cập
                </span>
                <h2 className="text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
                  Giới Hạn Quyền Truy Cập
                </h2>
                <p className="text-sm text-slate-400 max-w-md font-sans">
                  Tài khoản của bạn chưa được cấp quyền truy cập Nhóm chức năng{" "}
                  <strong>Dữ Liệu Game &amp; Nhân Vật</strong>. Vui lòng liên hệ Quản Trị Viên (Admin) để được gán quyền.
                </p>
                <Link
                  href="/manager"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#3fe9d6] text-white text-xs font-mono font-semibold transition-all"
                >
                  ← Quay lại Tổng Quan Vận Hành
                </Link>
              </div>
            ))}

          {initialTab === "events" &&
            (hasPermissionGroup(currentUser, "event_management") ? (
              <ManagerEventsView
                key={initialEventSubTab}
                initialSubTab={initialEventSubTab}
              />
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  Hạn Chế Truy Cập
                </span>
                <h2 className="text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
                  Giới Hạn Quyền Truy Cập
                </h2>
                <p className="text-sm text-slate-400 max-w-md font-sans">
                  Tài khoản của bạn chưa được cấp quyền truy cập Nhóm chức năng{" "}
                  <strong>Quản Lý Sự Kiện</strong>. Vui lòng liên hệ Quản Trị Viên (Admin) để được thêm vào nhóm.
                </p>
                <Link
                  href="/manager"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#f5c767] text-white text-xs font-mono font-semibold transition-all"
                >
                  ← Quay lại Tổng Quan Vận Hành
                </Link>
              </div>
            ))}

          {initialTab === "support" &&
            (hasPermissionGroup(currentUser, "player_support") ? (
              <ManagerSupportView
                key={initialSupportSubTab}
                initialSubTab={initialSupportSubTab}
              />
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  Hạn Chế Truy Cập
                </span>
                <h2 className="text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
                  Giới Hạn Quyền Truy Cập
                </h2>
                <p className="text-sm text-slate-400 max-w-md font-sans">
                  Tài khoản của bạn chưa được cấp quyền truy cập Nhóm chức năng{" "}
                  <strong>Hỗ Trợ Người Chơi</strong>. Vui lòng liên hệ Quản Trị Viên (Admin) để được thêm vào nhóm.
                </p>
                <Link
                  href="/manager"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400 text-white text-xs font-mono font-semibold transition-all"
                >
                  ← Quay lại Tổng Quan Vận Hành
                </Link>
              </div>
            ))}
        </main>
      </div>

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl bg-[#090d24] border border-[#f5c767] text-white text-xs font-semibold shadow-[0_10px_35px_rgba(245,199,103,0.3)] flex items-center gap-2.5 animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-[#f5c767] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
