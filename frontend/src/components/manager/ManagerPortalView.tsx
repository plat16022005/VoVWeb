"use client";

import { useState } from "react";
import StarCanvas from "@/components/common/StarCanvas";
import ManagerSidebar, { ManagerTab } from "./ManagerSidebar";
import ManagerHeader from "./ManagerHeader";
import ManagerOverviewTab from "./ManagerOverviewTab";
import ManagerGiftcodesTab from "./ManagerGiftcodesTab";
import ManagerMailboxTab from "./ManagerMailboxTab";
import ManagerEventsTab from "./ManagerEventsTab";
import ManagerPlayersTab from "./ManagerPlayersTab";
import ManagerBlogTab from "./ManagerBlogTab";
import CreateGiftcodeModal from "./CreateGiftcodeModal";
import SendMailModal from "./SendMailModal";
import BroadcastModal from "./BroadcastModal";
import {
  ManagerGiftcode,
  ManagerServerMail,
  BroadcastAnnouncement,
  ManagerPlayerRecord,
  MOCK_BROADCASTS,
} from "@/data/mockManagerData";
import { soundEngine } from "@/services/audio.service";

export default function ManagerPortalView() {
  const [currentTab, setCurrentTab] = useState<ManagerTab>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isCreateGiftcodeOpen, setIsCreateGiftcodeOpen] = useState(false);
  const [isSendMailOpen, setIsSendMailOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [mailPrefillPlayer, setMailPrefillPlayer] = useState<{
    uid: string;
    name: string;
  } | null>(null);

  // Active Broadcast ticker on top
  const [activeBroadcasts, setActiveBroadcasts] = useState<BroadcastAnnouncement[]>(MOCK_BROADCASTS);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Đã đồng bộ dữ liệu vận hành từ cụm máy chủ game!");
    }, 600);
  };

  const handleCreateGiftcodeSuccess = (newCode: ManagerGiftcode) => {
    showToast(`Đã kích hoạt thành công Giftcode [${newCode.code}]!`);
    setCurrentTab("giftcodes");
  };

  const handleSendMailSuccess = (newMail: ManagerServerMail) => {
    showToast(`Đã phát lệnh gửi thư [${newMail.title}] thành công!`);
    setCurrentTab("mailbox");
  };

  const handleBroadcastSuccess = (newBc: BroadcastAnnouncement) => {
    setActiveBroadcasts((prev) => [newBc, ...prev]);
    showToast(`Đã kích hoạt phát sóng dòng thông báo khẩn toàn máy chủ!`);
  };

  const handleDirectMailToPlayer = (player: ManagerPlayerRecord) => {
    setMailPrefillPlayer({ uid: player.uid, name: player.commanderName });
    setIsSendMailOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex font-[family-name:var(--font-inter)] selection:bg-[#f5c767]/30 selection:text-white relative overflow-x-hidden">
      {/* Background Star Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <StarCanvas />
      </div>

      {/* Manager Sidebar */}
      <ManagerSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          soundEngine.playClick();
          setCurrentTab(tab);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 z-10 relative">
        {/* Header */}
        <ManagerHeader
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCreateGiftcode={() => setIsCreateGiftcodeOpen(true)}
          onOpenSendMail={() => {
            setMailPrefillPlayer(null);
            setIsSendMailOpen(true);
          }}
          onOpenBroadcast={() => setIsBroadcastOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Live Marquee Ticker if active */}
        {activeBroadcasts.length > 0 && activeBroadcasts[0].isActive && (
          <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border-b border-[#f5c767]/30 px-4 py-2 flex items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping flex-shrink-0" />
              <span className="font-bold text-[#f5c767] uppercase flex-shrink-0">
                [LIVE MARQUEE TICKER]:
              </span>
              <span className="text-slate-200 truncate">
                {activeBroadcasts[0].message}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-slate-400 hidden sm:inline">
                {activeBroadcasts[0].targetServer}
              </span>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveBroadcasts((prev) =>
                    prev.map((b, idx) => (idx === 0 ? { ...b, isActive: false } : b))
                  );
                }}
                className="text-slate-400 hover:text-white"
                title="Tắt ticker này"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tab Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === "overview" && (
            <ManagerOverviewTab
              onNavigateTab={(tab) => {
                soundEngine.playClick();
                setCurrentTab(tab);
              }}
              onOpenCreateGiftcode={() => setIsCreateGiftcodeOpen(true)}
              onOpenSendMail={() => {
                setMailPrefillPlayer(null);
                setIsSendMailOpen(true);
              }}
              onOpenBroadcast={() => setIsBroadcastOpen(true)}
            />
          )}

          {currentTab === "giftcodes" && (
            <ManagerGiftcodesTab
              onOpenCreateGiftcode={() => setIsCreateGiftcodeOpen(true)}
            />
          )}

          {currentTab === "mailbox" && (
            <ManagerMailboxTab
              onOpenSendMail={() => {
                setMailPrefillPlayer(null);
                setIsSendMailOpen(true);
              }}
            />
          )}

          {currentTab === "events" && <ManagerEventsTab />}

          {currentTab === "players" && (
            <ManagerPlayersTab
              onDirectMailToPlayer={handleDirectMailToPlayer}
            />
          )}

          {currentTab === "blog" && <ManagerBlogTab />}

          {currentTab === "broadcast" && (
            <div className="p-8 rounded-2xl bg-[#090d24]/90 border border-white/10 text-center space-y-4">
              <div className="text-4xl">📢</div>
              <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
                Quản Lý Dòng Tin Phát Sóng Khẩn Cấp (Live Ticker)
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Các dòng thông báo cuộn ngang trên đỉnh màn hình trò chơi dùng để nhắc lịch bảo trì máy chủ, thông báo sự kiện đột xuất hoặc tôn vinh người chơi.
              </p>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setIsBroadcastOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs hover:brightness-110 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"
              >
                + Soạn & Phát Sóng Thông Báo Mới
              </button>

              <div className="mt-8 text-left space-y-3 max-w-2xl mx-auto">
                <div className="text-xs font-mono uppercase text-slate-400">
                  Lịch Sử Các Bản Tin Đã Phát ({activeBroadcasts.length})
                </div>
                {activeBroadcasts.map((bc) => (
                  <div
                    key={bc.id}
                    className="p-4 rounded-xl bg-[#0c1026] border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-white font-medium truncate">
                        {bc.message}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-2">
                        <span>Máy chủ: {bc.targetServer}</span>
                        <span>•</span>
                        <span>Hạn: {bc.activeUntil}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                        bc.isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-white/5 text-slate-400 border border-white/10"
                      }`}
                    >
                      {bc.isActive ? "ĐANG CHẠY" : "ĐÃ TẮT"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CreateGiftcodeModal
        isOpen={isCreateGiftcodeOpen}
        onClose={() => setIsCreateGiftcodeOpen(false)}
        onCreateSuccess={handleCreateGiftcodeSuccess}
      />

      <SendMailModal
        isOpen={isSendMailOpen}
        onClose={() => {
          setIsSendMailOpen(false);
          setMailPrefillPlayer(null);
        }}
        onSendSuccess={handleSendMailSuccess}
        prefillPlayer={mailPrefillPlayer}
      />

      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        onBroadcastSuccess={handleBroadcastSuccess}
      />

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

