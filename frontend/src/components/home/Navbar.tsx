"use client";

import { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/services/audio.service";
import { useAuth, useIsMounted } from "@/services/auth.service";

interface NavbarProps {
  bgmPlaying: boolean;
  onToggleBgm: () => void;
  onOpenPlayModal: () => void;
}

const NAV_ITEMS = [
  { label: "Trang Chủ", href: "/", isRoute: true, active: true },
  { label: "Tin Tức", href: "#news", isRoute: false },
  { label: "Valkyria", href: "#characters", isRoute: false },
  { label: "Vùng Đất", href: "#worlds", isRoute: false },
  { label: "Bảng Chiến Tích", href: "#leaderboard", isRoute: false },
  { label: "Phúc Lợi", href: "#milestones", isRoute: false },
  { label: "Sự Kiện", href: "/events", isRoute: true },
] as const;

export default function Navbar({
  bgmPlaying,
  onToggleBgm,
  onOpenPlayModal,
}: NavbarProps) {
  const isMounted = useIsMounted();
  const currentUser = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = () => {
    soundEngine.playClick();
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full flex flex-col items-center backdrop-blur-xl bg-[#070919]/85 border-b border-[#f5c767]/20 transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Left Side: Mobile Menu Hamburger & Compact BGM Soundwave */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Menu Button (Visible on < lg) */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setMobileMenuOpen((prev) => !prev);
            }}
            aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={mobileMenuOpen}
            className={`lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
              mobileMenuOpen
                ? "bg-[#f5c767]/20 border-[#f5c767] text-[#f5c767] shadow-[0_0_12px_rgba(245,199,103,0.35)]"
                : "bg-white/5 border-white/15 text-slate-200 hover:text-white hover:border-[#f5c767]/50"
            }`}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Compact Soundwave BGM Button */}
          <button
            onClick={onToggleBgm}
            title={bgmPlaying ? "Tắt Nhạc Nền Veyra" : "Bật Nhạc Nền Veyra (BGM)"}
            aria-label={bgmPlaying ? "Tắt Nhạc Nền" : "Bật Nhạc Nền"}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all cursor-pointer ${bgmPlaying
              ? "bg-[#f5c767]/20 border-[#f5c767] text-[#f5c767] shadow-[0_0_12px_rgba(245,199,103,0.4)] scale-105"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
              }`}
          >
            <div className="flex items-end gap-[3px] h-3.5 w-4 justify-center">
              <span className={`w-[2.5px] bg-current rounded-full ${bgmPlaying ? "eq-bar-1" : "h-1.5"}`} />
              <span className={`w-[2.5px] bg-current rounded-full ${bgmPlaying ? "eq-bar-2" : "h-3.5"}`} />
              <span className={`w-[2.5px] bg-current rounded-full ${bgmPlaying ? "eq-bar-3" : "h-2"}`} />
              <span className={`w-[2.5px] bg-current rounded-full ${bgmPlaying ? "eq-bar-4" : "h-1"}`} />
            </div>
          </button>
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 font-[family-name:var(--font-rajdhani)] text-base tracking-wider uppercase font-semibold whitespace-nowrap">
          {NAV_ITEMS.map((item) =>
            item.isRoute ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => soundEngine.playClick()}
                className={
                  "active" in item && item.active
                    ? "text-[#f5c767] hover:text-[#fff] transition-colors relative py-1 whitespace-nowrap after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#f5c767] after:shadow-[0_0_8px_#f5c767]"
                    : "text-slate-300 hover:text-[#f5c767] transition-colors py-1 whitespace-nowrap"
                }
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => soundEngine.playClick()}
                className="text-slate-300 hover:text-[#f5c767] transition-colors py-1 whitespace-nowrap"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Right Controls: Login & Play CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Login Button / User Profile */}
          {!isMounted ? (
            <div
              className="hsr-btn-glass text-xs sm:text-sm py-2 sm:py-2.5 px-2.5 sm:px-4 flex items-center gap-2 opacity-60 pointer-events-none"
              aria-hidden="true"
            >
              <span className="w-2 h-2 rounded-full bg-[#f5c767]/40 animate-pulse" />
              <span className="w-12 sm:w-16 h-3 bg-white/10 rounded animate-pulse" />
            </div>
          ) : currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentUser.role === "Admin" && (
                <Link
                  href="/admin"
                  onClick={() => soundEngine.playClick()}
                  className="hsr-btn-glass text-[11px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 cursor-pointer transition-all flex items-center gap-1.5 border-red-500/50 text-red-300 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  title="Vào Trung Tâm Quản Trị Hệ Thống (Admin)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="font-mono font-bold tracking-wider">ADMIN</span>
                </Link>
              )}
              {currentUser.role === "Manager" && (
                <Link
                  href="/manager"
                  onClick={() => soundEngine.playClick()}
                  className="hsr-btn-glass text-[11px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 cursor-pointer transition-all flex items-center gap-1.5 border-[#f5c767]/50 text-[#f5c767] hover:shadow-[0_0_12px_rgba(245,199,103,0.4)]"
                  title="Vào Cổng Điều Hành Vận Hành (Manager Portal)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f5c767] animate-pulse" />
                  <span className="font-mono font-bold tracking-wider">MANAGER</span>
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => soundEngine.playClick()}
                className="hsr-btn-glass text-xs sm:text-sm py-1.5 sm:py-2.5 px-2.5 sm:px-4 cursor-pointer transition-all flex items-center gap-1.5 sm:gap-2 border-[#3fe9d6]/50 text-[#3fe9d6] hover:shadow-[0_0_15px_rgba(63,233,214,0.35)] group"
                title={`Hồ Sơ Chỉ Huy: ${currentUser.username} (${currentUser.email})`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#f5c767] to-[#3fe9d6] flex items-center justify-center text-[10px] font-bold text-[#060814] shadow-[0_0_6px_rgba(63,233,214,0.4)] shrink-0">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : "V"}
                </div>
                <span className="max-w-[75px] sm:max-w-[110px] truncate font-mono font-semibold text-[11px] sm:text-xs">
                  {currentUser.username || "CHỈ HUY"}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30 hidden md:inline">
                  HỒ SƠ
                </span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => soundEngine.playClick()}
              className="hsr-btn-glass text-[11px] sm:text-sm py-2 sm:py-2.5 px-2.5 sm:px-4 cursor-pointer transition-all flex items-center gap-1.5 sm:gap-2 hover:border-[#f5c767] hover:text-[#f5c767]"
              title="Đăng Nhập Tài Khoản"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>ĐĂNG NHẬP</span>
            </Link>
          )}

          {/* Main Action Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenPlayModal();
            }}
            className="hsr-btn-gold text-[11px] sm:text-sm py-2 sm:py-2.5 px-3 sm:px-6 cursor-pointer whitespace-nowrap"
          >
            <span>TẢI NGAY</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden w-full border-t border-[#f5c767]/20 bg-[#070919]/95 backdrop-blur-2xl px-4 py-4 shadow-[0_15px_40px_rgba(0,0,0,0.85)]">
          <nav className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-2 font-[family-name:var(--font-rajdhani)] text-sm tracking-wider uppercase font-bold">
            {NAV_ITEMS.map((item) =>
              item.isRoute ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    "active" in item && item.active
                      ? "bg-[#f5c767]/15 border-[#f5c767]/50 text-[#f5c767]"
                      : "bg-white/5 border-white/10 text-slate-200 hover:text-[#f5c767] hover:border-[#f5c767]/40"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs opacity-60">→</span>
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={handleNavClick}
                  className="px-3.5 py-2.5 rounded-xl border bg-white/5 border-white/10 text-slate-200 hover:text-[#f5c767] hover:border-[#f5c767]/40 transition-all flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <span className="text-xs opacity-60">→</span>
                </a>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
