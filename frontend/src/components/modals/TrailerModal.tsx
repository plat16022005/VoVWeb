"use client";

import Image from "next/image";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlayModal: () => void;
}

export default function TrailerModal({
  isOpen,
  onClose,
  onOpenPlayModal,
}: TrailerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-[#090d24] border border-[#f5c767]/40 rounded-xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1336]">
          <div className="flex items-center gap-2">
            <span className="hsr-diamond" />
            <h4 className="font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide">
              TRAILER CHÍNH THỨC: VẠN GIỚI KHỞI HÀNH
            </h4>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          <Image
            src="/images/hero_bg.jpg"
            alt="Trailer keyframe"
            fill
            className="object-cover opacity-60"
          />
          <div className="relative z-10 text-center p-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#f5c767]/20 border-2 border-[#f5c767] flex items-center justify-center text-3xl text-[#f5c767] shadow-[0_0_30px_rgba(245,199,103,0.5)] animate-pulse mb-4 cursor-pointer">
              ▶
            </div>
            <h5 className="text-xl font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
              VALKYRIA OF VEYRA — OFFICIAL CINEMATIC TRAILER
            </h5>
            <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
              Sát cánh cùng các nữ chiến binh Valkyria trong các trận chiến chiến thuật theo lượt (Turn-Based) đỉnh cao trên nền tảng Unity Engine.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0d1336] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Âm nhạc: VoV Universe Soundtrack • Độ phân giải: 4K HDR 60FPS
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenPlayModal();
            }}
            className="hsr-btn-gold py-1.5 px-4 text-xs font-bold"
          >
            <span>CHƠI GAME NGAY</span>
          </button>
        </div>
      </div>
    </div>
  );
}
