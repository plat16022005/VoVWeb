"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative w-full py-12 px-4 sm:px-6 lg:px-8 bg-[#03040a] border-t border-white/5 text-xs text-slate-500 font-[family-name:var(--font-inter)] flex justify-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo & Studio */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 drop-shadow-[0_0_10px_rgba(245,199,103,0.3)]">
            <Image
              src="/images/logo_vov.png"
              alt="VoV Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-extrabold text-white font-[family-name:var(--font-rajdhani)] text-base tracking-wider uppercase">
              VOV STUDIO • HOYOVERSE STYLE
            </div>
            <div>Bản quyền trò chơi trực tuyến © 2026 VoV: Star Odyssey.</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
          <a href="#hero" className="hover:text-[#f5c767] transition-colors">
            Điều Khoản Dịch Vụ
          </a>
          <a href="#hero" className="hover:text-[#f5c767] transition-colors">
            Chính Sách Quyền Riêng Tư
          </a>
          <a href="#hero" className="hover:text-[#f5c767] transition-colors">
            Chăm Sóc Khách Hàng
          </a>
          <a href="#hero" className="hover:text-[#f5c767] transition-colors">
            Hệ Thống Phê Duyệt
          </a>
        </div>

        {/* 16+ badge */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-amber-500/20 text-amber-300 font-bold rounded border border-amber-500/40 text-xs">
            16+
          </span>
          <span className="text-[11px] leading-tight">
            Phù hợp lứa tuổi 16+<br />
            Chơi có chừng mực
          </span>
        </div>
      </div>
    </footer>
  );
}
