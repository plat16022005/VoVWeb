"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";
import { hasPermission, hasPermissionGroup } from "@/data/permissions";
import GameLogo from "@/components/common/GameLogo";

export type ManagerTab = "overview" | "content" | "gamedata" | "events" | "support";

interface SidebarChildItem {
  id: string;
  title: string;
  href: string;
  tag?: string;
}

interface SidebarNavGroup {
  id: ManagerTab;
  title: string;
  href?: string;
  accent: "gold" | "cyan" | "emerald";
  icon: React.ReactNode;
  children?: SidebarChildItem[];
}

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

  // Kiểm tra quyền chi tiết theo từng chức năng nhỏ để hiển thị đúng danh mục sổ ra
  const hasBlogAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "content.blog.view") ||
    hasPermission(currentUser, "content.blog.edit") ||
    hasPermission(currentUser, "content.blog.publish") ||
    hasPermission(currentUser, "content.blog.delete");

  const hasFacebookAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "content.facebook.view") ||
    hasPermission(currentUser, "content.facebook.publish") ||
    hasPermission(currentUser, "content.facebook.bot");

  const hasCharacterAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "gamedata.character.view") ||
    hasPermission(currentUser, "gamedata.character.edit") ||
    hasPermission(currentUser, "gamedata.character.skills") ||
    hasPermission(currentUser, "gamedata.character.delete");

  const hasGachaAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "gamedata.gacha.view") ||
    hasPermission(currentUser, "gamedata.gacha.edit") ||
    hasPermission(currentUser, "gamedata.gacha.activate") ||
    hasPermission(currentUser, "gamedata.gacha.delete");

  const hasItemAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "gamedata.item.view") ||
    hasPermission(currentUser, "gamedata.item.edit") ||
    hasPermission(currentUser, "gamedata.item.delete");

  const hasMinigameAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "event.minigame.view") ||
    hasPermission(currentUser, "event.minigame.edit") ||
    hasPermission(currentUser, "event.minigame.publish") ||
    hasPermission(currentUser, "event.minigame.delete");

  const hasGiftcodeAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "event.giftcode.view") ||
    hasPermission(currentUser, "event.giftcode.edit") ||
    hasPermission(currentUser, "event.giftcode.toggle") ||
    hasPermission(currentUser, "event.giftcode.delete");

  const hasMailAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "support.mail.view") ||
    hasPermission(currentUser, "support.mail.send_notice") ||
    hasPermission(currentUser, "support.mail.send_personal") ||
    hasPermission(currentUser, "support.mail.send_global_reward") ||
    hasPermission(currentUser, "support.mail.delete");

  const hasPlayerDataAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "support.player.view") ||
    hasPermission(currentUser, "support.player.revoke_item");

  const contentChildren: SidebarChildItem[] = [
    ...(hasBlogAccess || hasFacebookAccess
      ? [{ id: "content-overview", title: "Tổng Quan Nội Dung", href: "/manager/contents" }]
      : []),
    ...(hasBlogAccess
      ? [{ id: "content-blog", title: "Blog & Tin Tức", href: "/manager/contents/blog" }]
      : []),
    ...(hasFacebookAccess
      ? [{ id: "content-facebook", title: "Fanpage Facebook", href: "/manager/contents/facebook" }]
      : []),
  ];

  const gameDataChildren: SidebarChildItem[] = [
    ...(hasCharacterAccess
      ? [{ id: "gd-characters", title: "Chiến Binh Valkyria", href: "/manager/gamedata" }]
      : []),
    ...(hasGachaAccess
      ? [{ id: "gd-gacha", title: "Banner Gacha", href: "/manager/gacha" }]
      : []),
    ...(hasItemAccess
      ? [{ id: "gd-items", title: "Vật Phẩm & Trang Bị", href: "/manager/gamedata/items" }]
      : []),
    {
      id: "gd-worlds",
      title: "Bản Đồ Thế Giới",
      href: "/manager/gamedata/worlds",
      tag: "Sắp mở",
    },
  ];

  const eventChildren: SidebarChildItem[] = [
    ...(hasMinigameAccess
      ? [{ id: "ev-minigames", title: "Minigame & Sự Kiện Web", href: "/manager/events" }]
      : []),
    ...(hasGiftcodeAccess
      ? [{ id: "ev-giftcodes", title: "Mã Quà Tặng (Giftcode)", href: "/manager/events/giftcodes" }]
      : []),
  ];

  const supportChildren: SidebarChildItem[] = [
    ...(hasMailAccess
      ? [{ id: "sp-mail", title: "Hòm Thư Hệ Thống", href: "/manager/support" }]
      : []),
    ...(hasPlayerDataAccess
      ? [
          {
            id: "sp-players",
            title: "Dữ Liệu & Túi Đồ Người Chơi",
            href: "/manager/support/players",
          },
        ]
      : []),
  ];

  const navGroups: SidebarNavGroup[] = [
    {
      id: "overview",
      title: "Tổng Quan Vận Hành",
      href: "/manager",
      accent: "cyan",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    ...(hasPermissionGroup(currentUser, "content_management") && contentChildren.length > 0
      ? [
          {
            id: "content" as ManagerTab,
            title: "Quản Lý Nội Dung",
            accent: "gold" as const,
            children: contentChildren,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            ),
          },
        ]
      : []),
    ...(hasPermissionGroup(currentUser, "game_data") && gameDataChildren.length > 0
      ? [
          {
            id: "gamedata" as ManagerTab,
            title: "Dữ Liệu Game",
            accent: "cyan" as const,
            children: gameDataChildren,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
          },
        ]
      : []),
    ...(hasPermissionGroup(currentUser, "event_management") && eventChildren.length > 0
      ? [
          {
            id: "events" as ManagerTab,
            title: "Quản Lý Sự Kiện",
            accent: "gold" as const,
            children: eventChildren,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ]
      : []),
    ...(hasPermissionGroup(currentUser, "player_support") && supportChildren.length > 0
      ? [
          {
            id: "support" as ManagerTab,
            title: "Hỗ Trợ Người Chơi",
            accent: "emerald" as const,
            children: supportChildren,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  // Xác định nhóm đang hoạt động dựa theo pathname hiện tại
  const activeGroupId: ManagerTab =
    pathname.startsWith("/manager/contents") || pathname.startsWith("/manager/content")
      ? "content"
      : pathname.startsWith("/manager/gamedata") || pathname.startsWith("/manager/gacha")
        ? "gamedata"
        : pathname.startsWith("/manager/events")
          ? "events"
          : pathname.startsWith("/manager/support")
            ? "support"
            : currentTab || "overview";

  const [toggledGroups, setToggledGroups] = useState<Record<string, boolean>>({});

  const isGroupExpanded = (groupId: ManagerTab) => {
    if (groupId in toggledGroups) return toggledGroups[groupId];
    return activeGroupId === groupId;
  };

  const handleToggleGroup = (groupId: ManagerTab) => {
    soundEngine.playClick();
    setToggledGroups((prev) => ({
      ...prev,
      [groupId]: !(groupId in prev ? prev[groupId] : activeGroupId === groupId),
    }));
  };

  const getAccentClasses = (accent: SidebarNavGroup["accent"]) => {
    if (accent === "cyan") {
      return {
        parentActive:
          "bg-gradient-to-r from-[#3fe9d6]/15 via-[#3fe9d6]/5 to-transparent text-[#3fe9d6] border-l-4 border-[#3fe9d6]",
        childActive:
          "bg-[#3fe9d6]/12 text-[#3fe9d6] border border-[#3fe9d6]/30 font-semibold",
        dot: "bg-[#3fe9d6]",
      };
    }
    if (accent === "emerald") {
      return {
        parentActive:
          "bg-gradient-to-r from-emerald-400/15 via-emerald-400/5 to-transparent text-emerald-300 border-l-4 border-emerald-400",
        childActive:
          "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 font-semibold",
        dot: "bg-emerald-400",
      };
    }
    return {
      parentActive:
        "bg-gradient-to-r from-[#f5c767]/18 via-[#f5c767]/8 to-transparent text-[#f5c767] border-l-4 border-[#f5c767]",
      childActive:
        "bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/30 font-semibold",
      dot: "bg-[#f5c767]",
    };
  };

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
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
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
          <div className="p-3.5 mx-4 my-4 rounded-xl bg-[#0c1026]/90 border border-[#f5c767]/30 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] shrink-0">
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

          {/* Scrollable Accordion Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Phân Hệ Vận Hành Game</span>
              <span className="text-[#3fe9d6] text-[9px]">ONLINE</span>
            </div>

            {navGroups.map((group) => {
              const accentCls = getAccentClasses(group.accent);
              const hasChildren = Boolean(group.children && group.children.length > 0);
              const isParentActive = activeGroupId === group.id;

              if (!hasChildren && group.href) {
                return (
                  <Link
                    key={group.id}
                    href={group.href}
                    onClick={() => {
                      soundEngine.playClick();
                      if (onSelectTab) onSelectTab(group.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isParentActive
                        ? accentCls.parentActive
                        : "text-slate-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`shrink-0 transition-colors ${
                          isParentActive ? "" : "text-slate-400 group-hover:text-[#3fe9d6]"
                        }`}
                      >
                        {group.icon}
                      </span>
                      <span className="truncate font-medium">{group.title}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#3fe9d6]/80 shrink-0" />
                  </Link>
                );
              }

              const expanded = isGroupExpanded(group.id);

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleToggleGroup(group.id)}
                    aria-expanded={expanded}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                      isParentActive
                        ? accentCls.parentActive
                        : "text-slate-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`shrink-0 transition-colors ${
                          isParentActive ? "" : "text-slate-400 group-hover:text-white"
                        }`}
                      >
                        {group.icon}
                      </span>
                      <span className="truncate text-left font-medium">{group.title}</span>
                    </div>

                    <svg
                      className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                        expanded ? "rotate-180 text-white" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expanded && group.children && (
                    <div className="ml-5 pl-3 py-1 space-y-1 border-l border-white/10">
                      {group.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.id}
                            href={child.href}
                            onClick={() => {
                              soundEngine.playClick();
                              if (onSelectTab) onSelectTab(group.id);
                              onCloseMobile();
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                              isChildActive
                                ? accentCls.childActive
                                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                  isChildActive ? accentCls.dot : "bg-slate-600"
                                }`}
                              />
                              <span className="truncate">{child.title}</span>
                            </div>
                            {child.tag && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                                {child.tag}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
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
              Cụm S1 &amp; S2 Hoạt Động
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
