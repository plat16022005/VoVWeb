"use client";

import Image from "next/image";
import { soundEngine } from "@/services/audio.service";

interface HeroSectionProps {
  serverOnline: boolean;
  onOpenPlayModal: () => void;
  onOpenTrailerModal: () => void;
}

export default function HeroSection({
  serverOnline,
  onOpenPlayModal,
  onOpenTrailerModal,
}: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Cinematic Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/bg.png"
          alt="Astral Express Crossing Galaxy"
          fill
          className="object-cover object-center scale-105 animate-cosmic-float"
          priority
        />
        {/* Radial cosmic vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04050d] via-transparent to-[#04050d]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#04050d]/90 via-transparent to-[#04050d]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#04050d_95%)]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto text-center mt-12 flex flex-col items-center">
        <div className="relative w-56 h-24 sm:w-64 sm:h-24 md:w-112 md:h-56 mb-4 drop-shadow-[0_0_25px_rgba(245,199,103,0.35)]">
          <Image
            src="/images/logo_vov.png"
            alt="Valkyria of Veyra Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        {/* Version / Category Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a0d24]/80 border border-[#f5c767]/40 shadow-[0_0_20px_rgba(245,199,103,0.2)] mb-6 backdrop-blur-md">
          <span className="hsr-diamond" />
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-chakra-petch)]">
            Valkyria of Veyra
          </span>
          <span className="hsr-diamond" />
        </div>

        {/* Grand Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-4 uppercase font-[family-name:var(--font-chakra-petch)]">
          <span className="drop-shadow-[0_3px_6px_rgba(0,0,0,0.75)]">
            CÁC NỮ CHIẾN BINH
          </span>
          <br />
          <span className="text-gold-gradient text-5xl sm:text-7xl md:text-8xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.75)]">
            XUẤT KÍCH!
          </span>
        </h1>

        {/* Slogan & Description */}
        <p className="max-w-2xl text-slate-100 font-medium text-sm sm:text-base md:text-lg mb-8 leading-relaxed font-[family-name:var(--font-inter)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]">
          Thế giới Veyra kỳ ảo. Sát cánh cùng các Valkyria chiến đấu và khám phá mọi miền đất.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md mb-12">
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenPlayModal();
            }}
            className="hsr-btn-gold w-full sm:w-auto text-base sm:text-lg py-3.5 px-8 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>TẢI GAME NGAY</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenTrailerModal();
            }}
            className="hsr-btn-glass w-full sm:w-auto text-base sm:text-lg py-3.5 px-8 cursor-pointer"
          >
            <svg className="w-5 h-5 text-[#3fe9d6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>XEM TRAILER PV</span>
          </button>
        </div>



        {/* Floating Indicators: Live Server & 16+ Age Rating */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-slate-400">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
            <span className={`w-2.5 h-2.5 rounded-full ${serverOnline ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"}`} />
            <span>
              Máy Chủ:{" "}
              <strong className={serverOnline ? "text-emerald-400" : "text-rose-400"}>
                {serverOnline ? "Hoạt Động" : "Bảo Trì"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px]">
              16+
            </span>
            <span>Game Nhập Vai Chiến Thuật Theo Lượt (Turn-Based RPG)</span>
          </div>
        </div>

        {/* Scroll down indicator (safely positioned below indicators) */}
        <div className="flex flex-col items-center gap-2 text-slate-400 text-xs font-[family-name:var(--font-rajdhani)] tracking-widest uppercase mt-8 sm:mt-10">
          <span>Khám Phá Veyra</span>
          <div className="w-5 h-8 border-2 border-[#f5c767]/40 rounded-full flex justify-center p-1">
            <span className="w-1 h-2 bg-[#f5c767] rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
