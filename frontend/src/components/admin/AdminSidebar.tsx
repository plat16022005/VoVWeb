"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({
  isMobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const currentUser = useAuth();

  const navItems = [
    {
      title: "Quản Lý Tài Khoản",
      href: "/admin",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      active: pathname === "/admin" || pathname === "/admin/accounts",
      badge: "Chính",
    },
    {
      title: "Phân Quyền Quản Trị",
      href: "/admin/permissions",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      active: pathname.startsWith("/admin/permissions"),
      badge: "RBAC",
    },
    {
      title: "Cấu Hình Hệ Thống",
      href: "/admin/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      active: pathname.startsWith("/admin/settings"),
      badge: "Mới",
    },
    {
      title: "Nhật Ký Hoạt Động",
      href: "/admin/logs",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      active: pathname.startsWith("/admin/logs"),
      badge: "Audit",
    },
    {
      title: "Hạ Tầng & Máy Chủ",
      href: "/admin/servers",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      active: pathname.startsWith("/admin/servers"),
      badge: "24ms",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#060814]/95 backdrop-blur-xl border-r border-[#3fe9d6]/20 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 font-[family-name:var(--font-inter)] ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo Header */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
            <Link
              href="/"
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9b51e0] via-[#3fe9d6] to-[#f5c767] p-[1.5px] shadow-[0_0_15px_rgba(63,233,214,0.4)] group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#060814] rounded-[10px] flex items-center justify-center font-[family-name:var(--font-rajdhani)] font-black text-xl text-[#3fe9d6]">
                  VOV
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-rajdhani)] text-lg font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
                  CORE CONTROL
                  <span className="w-2 h-2 rounded-full bg-[#3fe9d6] animate-ping" />
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                  Veyra Operations
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Pill in Sidebar */}
          <div className="p-4 mx-4 my-4 rounded-xl bg-[#0c1026]/80 border border-[#3fe9d6]/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f5c767] to-[#3fe9d6] p-0.5 flex-shrink-0">
              <div className="w-full h-full bg-[#070919] rounded-[7px] flex items-center justify-center font-bold text-sm text-[#f5c767]">
                {currentUser?.username ? currentUser.username[0].toUpperCase() : "A"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate">
                  {currentUser?.username || "Tổng Tư Lệnh"}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                  ADMIN
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate block font-mono">
                {currentUser?.email || "admin@vov.veyra.io"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Phân Hệ Quản Trị
            </div>

            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => {
                  soundEngine.playClick();
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  item.active
                    ? "bg-gradient-to-r from-[#3fe9d6]/20 via-[#3fe9d6]/10 to-transparent text-[#3fe9d6] border-l-4 border-[#3fe9d6] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      item.active ? "text-[#3fe9d6]" : "text-slate-400 group-hover:text-[#f5c767]"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      item.active
                        ? "bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40"
                        : "bg-white/5 text-slate-400 border border-white/10"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            onClick={() => soundEngine.playClick()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-[#f5c767] hover:bg-[#f5c767]/10 transition-colors border border-white/5 hover:border-[#f5c767]/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Trở Về Trang Chủ Veyra</span>
          </Link>

          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>Phiên Bản v1.2.0</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sẵn Sàng
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
