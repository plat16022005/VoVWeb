"use client";

import { soundEngine } from "@/services/audio.service";

const SOCIAL_CHANNELS = [
  { name: "Discord", icon: "💬", color: "hover:border-[#5865f2] hover:text-[#5865f2]" },
  { name: "Facebook", icon: "🌐", color: "hover:border-[#1877f2] hover:text-[#1877f2]" },
  { name: "YouTube", icon: "▶️", color: "hover:border-[#ff0000] hover:text-[#ff0000]" },
  { name: "TikTok", icon: "🎵", color: "hover:border-[#00f2fe] hover:text-[#00f2fe]" },
  { name: "HoYoLAB / VoVLab", icon: "⭐", color: "hover:border-[#f5c767] hover:text-[#f5c767]" },
];

export default function CommunitySection() {
  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#060817] flex justify-center">
      <div className="w-full max-w-5xl mx-auto text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] mb-3">
          GIA NHẬP CỘNG ĐỒNG CHỈ HUY VEYRA
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mb-8">
          Theo dõi các trang chính thức của Valkyria of Veyra để nhận giftcode độc quyền và chia sẻ chiến thuật cùng cộng đồng Chỉ Huy khắp cả nước.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {SOCIAL_CHANNELS.map((soc) => (
            <button
              key={soc.name}
              onClick={() => soundEngine.playClick()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f1430] border border-white/15 text-slate-300 transition-all font-semibold text-xs cursor-pointer ${soc.color}`}
            >
              <span>{soc.icon}</span>
              <span>{soc.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
