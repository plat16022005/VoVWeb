"use client";

import Link from "next/link";
import { soundEngine } from "@/services/audio.service";

interface NavbarProps {
  bgmPlaying: boolean;
  onToggleBgm: () => void;
  onOpenPlayModal: () => void;
}

export default function Navbar({
  bgmPlaying,
  onToggleBgm,
  onOpenPlayModal,
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full flex justify-center backdrop-blur-xl bg-[#070919]/85 border-b border-[#f5c767]/20 transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left Side: Logo & Compact BGM Soundwave */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Compact Soundwave BGM Button (Left-aligned, icon-only) */}
          <button
            onClick={onToggleBgm}
            title={bgmPlaying ? "Tắt Nhạc Nền Vũ Trụ" : "Bật Nhạc Nền Vũ Trụ (BGM)"}
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

        {/* Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-8 font-[family-name:var(--font-rajdhani)] text-base tracking-wider uppercase font-semibold">
          <Link
            href="/"
            onClick={() => soundEngine.playClick()}
            className="text-[#f5c767] hover:text-[#fff] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#f5c767] after:shadow-[0_0_8px_#f5c767]"
          >
            Trang Chủ
          </Link>
          <a
            href="#news"
            onClick={() => soundEngine.playClick()}
            className="text-slate-300 hover:text-[#f5c767] transition-colors py-1"
          >
            Tin Tức
          </a>
          <a
            href="#characters"
            onClick={() => soundEngine.playClick()}
            className="text-slate-300 hover:text-[#f5c767] transition-colors py-1"
          >
            Nhân Vật
          </a>
          <a
            href="#worlds"
            onClick={() => soundEngine.playClick()}
            className="text-slate-300 hover:text-[#f5c767] transition-colors py-1"
          >
            Thế Giới
          </a>
          <a
            href="#leaderboard"
            onClick={() => soundEngine.playClick()}
            className="text-slate-300 hover:text-[#f5c767] transition-colors py-1"
          >
            Bảng Khai Phá
          </a>
          <a
            href="#milestones"
            onClick={() => soundEngine.playClick()}
            className="text-slate-300 hover:text-[#f5c767] transition-colors py-1"
          >
            Phúc Lợi
          </a>
        </nav>

        {/* Right Controls: Login & Play CTA */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Login Button */}
          <Link
            href="/login"
            onClick={() => soundEngine.playClick()}
            className="hsr-btn-glass text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 cursor-pointer hover:border-[#f5c767] hover:text-[#f5c767] transition-all"
            title="Đăng Nhập Tài Khoản"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">ĐĂNG NHẬP</span>
          </Link>

          {/* Main Action Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenPlayModal();
            }}
            className="hsr-btn-gold text-xs sm:text-sm py-2 sm:py-2.5 px-4 sm:px-6 cursor-pointer"
          >
            <span>TẢI NGAY</span>
          </button>
        </div>
      </div>
    </header>
  );
}
