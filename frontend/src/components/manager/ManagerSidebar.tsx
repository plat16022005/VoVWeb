"use client";

import Link from "next/link";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";

export type ManagerTab =
  | "overview"
  | "giftcodes"
  | "mailbox"
  | "events"
  | "players"
  | "blog"
  | "broadcast";

interface ManagerSidebarProps {
  currentTab: ManagerTab;
  onSelectTab: (tab: ManagerTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function ManagerSidebar({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}: ManagerSidebarProps) {
  const currentUser = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  const navItems: {
    id: ManagerTab;
    title: string;
    badge?: string;
    badgeColor?: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "overview",
      title: "Tổng Quan Vận Hành",
      badge: "Realtime",
      badgeColor: "border-[#3fe9d6]/40 text-[#3fe9d6] bg-[#3fe9d6]/10",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "giftcodes",
      title: "Quản Lý Giftcode",
      badge: "5 Active",
      badgeColor: "border-[#f5c767]/40 text-[#f5c767] bg-[#f5c767]/10",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      id: "mailbox",
      title: "Hòm Thư & Đền Bù",
      badge: "Mới",
      badgeColor: "border-purple-400/40 text-purple-300 bg-purple-500/10",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "events",
      title: "Sự Kiện & Banner",
      badge: "4 Live",
      badgeColor: "border-cyan-400/40 text-cyan-300 bg-cyan-500/10",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      id: "players",
      title: "Hỗ Trợ Người Chơi",
      badge: "Tra cứu",
      badgeColor: "border-emerald-400/40 text-emerald-300 bg-emerald-500/10",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "blog",
      title: "Viết Blog & Tin Tức",
      badge: "Editor",
      badgeColor: "border-[#f5c767]/40 text-[#f5c767] bg-[#f5c767]/10",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      id: "broadcast",
      title: "Thông Báo Khẩn Cấp",
      badge: "Live Ticker",
      badgeColor: "border-rose-400/40 text-rose-300 bg-rose-500/10",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#060814]/95 backdrop-blur-xl border-r border-[#f5c767]/20 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
            <Link
              href="/"
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f5c767] via-[#9b51e0] to-[#3fe9d6] p-[1.5px] shadow-[0_0_15px_rgba(245,199,103,0.35)] group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#060814] rounded-[10px] flex items-center justify-center font-[family-name:var(--font-rajdhani)] font-black text-xl text-[#f5c767]">
                  MGR
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-rajdhani)] text-lg font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
                  OPERATIONS
                  <span className="w-2 h-2 rounded-full bg-[#f5c767] animate-ping" />
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                  Veyra LiveOps Hub
                </span>
              </div>
            </Link>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Manager User Pill */}
          <div className="p-3.5 mx-4 my-4 rounded-xl bg-[#0c1026]/90 border border-[#f5c767]/30 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f5c767] to-[#e67e22] p-0.5 flex-shrink-0 shadow-[0_0_10px_rgba(245,199,103,0.3)]">
              <div className="w-full h-full bg-[#070919] rounded-[7px] flex items-center justify-center font-bold text-sm text-[#f5c767]">
                {currentUser?.username ? currentUser.username[0].toUpperCase() : "M"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate">
                  {currentUser?.username || "Điều Phối Trưởng"}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  MANAGER
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate block font-mono">
                {currentUser?.email || "manager@veyra.ops"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Phân Hệ Vận Hành Game</span>
              <span className="text-[#3fe9d6] text-[9px]">ONLINE</span>
            </div>

            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEngine.playClick();
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-gradient-to-r from-[#f5c767]/20 via-[#f5c767]/10 to-transparent text-[#f5c767] border-l-4 border-[#f5c767] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "text-slate-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-colors ${
                        isActive ? "text-[#f5c767]" : "text-slate-400 group-hover:text-[#3fe9d6]"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-left font-medium">{item.title}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        item.badgeColor || "border-white/10 text-slate-400 bg-white/5"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            onClick={() => soundEngine.playClick()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-[#f5c767] hover:bg-white/5 transition-colors border border-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Trở Về Trang Chủ Veyra</span>
          </Link>

          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>LiveOps v1.2.0</span>
            <span className="flex items-center gap-1.5 text-[#f5c767]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c767] animate-pulse" />
              Cụm S1 & S2 Hoạt Động
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

