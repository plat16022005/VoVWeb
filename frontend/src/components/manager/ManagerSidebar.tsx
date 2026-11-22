"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";
import { hasPermissionGroup } from "@/data/permissions";
import GameLogo from "@/components/common/GameLogo";

export type ManagerTab = "overview" | "content" | "gamedata" | "events";

interface ManagerSidebarProps {
  currentTab?: ManagerTab;
  onSelectTab?: (tab: ManagerTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function ManagerSidebar({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}: ManagerSidebarProps) {
  const pathname = usePathname();
  const currentUser = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  const navItems: {
    id: ManagerTab;
    title: string;
    href: string;
    badge?: string;
    badgeColor?: string;
    icon: React.ReactNode;
  }[] = [
      {
        id: "overview",
        title: "Tổng Quan Vận Hành",
        href: "/manager",
        badge: "Live",
        badgeColor: "border-[#3fe9d6]/40 text-[#3fe9d6] bg-[#3fe9d6]/10",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
      ...(hasPermissionGroup(currentUser, "content_management")
        ? [
          {
            id: "content" as ManagerTab,
            title: "Quản Lý Nội Dung",
            href: "/manager/contents",
            badge: "Blog & FB",
            badgeColor: "border-[#f5c767]/40 text-[#f5c767] bg-[#f5c767]/10",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            ),
          },
        ]
        : []),
      ...(hasPermissionGroup(currentUser, "game_data")
        ? [
          {
            id: "gamedata" as ManagerTab,
            title: "Dữ Liệu Game",
            href: "/manager/gamedata",
            badge: "Valkyria & Gacha",
            badgeColor: "border-[#3fe9d6]/40 text-[#3fe9d6] bg-[#3fe9d6]/10",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
          },
        ]
        : []),
      ...(hasPermissionGroup(currentUser, "event_management")
        ? [
          {
            id: "events" as ManagerTab,
            title: "Quản Lý Sự Kiện",
            href: "/manager/events",
            badge: "Event & Code",
            badgeColor: "border-[#f5c767]/40 text-[#f5c767] bg-[#f5c767]/10",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ]
        : []),
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#060814]/95 backdrop-blur-xl border-r border-[#f5c767]/20 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
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
              <GameLogo
                className="w-14 h-10 drop-shadow-[0_0_12px_rgba(245,199,103,0.35)] group-hover:scale-105 transition-transform"
                sizes="56px"
              />
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
              const isActive =
                pathname === item.href ||
                (item.id === "content" &&
                  (pathname.startsWith("/manager/contents") ||
                    pathname.startsWith("/manager/content"))) ||
                (item.id === "gamedata" &&
                  (pathname.startsWith("/manager/gamedata") ||
                    pathname.startsWith("/manager/gacha"))) ||
                (item.id === "events" &&
                  pathname.startsWith("/manager/events")) ||
                (item.id === "overview" && pathname === "/manager") ||
                currentTab === item.id;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    soundEngine.playClick();
                    if (onSelectTab) onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${isActive
                    ? "bg-gradient-to-r from-[#f5c767]/20 via-[#f5c767]/10 to-transparent text-[#f5c767] border-l-4 border-[#f5c767] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-colors ${isActive ? "text-[#f5c767]" : "text-slate-400 group-hover:text-[#3fe9d6]"
                        }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-left font-medium">{item.title}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.badgeColor || "border-white/10 text-slate-400 bg-white/5"
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
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

