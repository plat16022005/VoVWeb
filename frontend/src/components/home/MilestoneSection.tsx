"use client";

import { soundEngine } from "@/services/audio.service";

interface MilestoneSectionProps {
  onOpenRewardsModal: () => void;
}

export default function MilestoneSection({
  onOpenRewardsModal,
}: MilestoneSectionProps) {
  return (
    <section
      id="milestones"
      className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#04050d] via-[#090d24] to-[#04050d] border-t border-b border-[#f5c767]/15 flex justify-center"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)] mb-2">
            <span className="hsr-diamond" /> CỘT MỐC ĐĂNG KÝ TOÀN CẦU <span className="hsr-diamond" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)]">
            PHÚC LỢI KHỞI HÀNH <span className="text-gold-gradient">5.000.000 CHỈ HUY</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            Tất cả các cột mốc đã chính thức được mở khóa! Đăng ký ngay để nhận trọn bộ quà tặng độc quyền khi bước vào thế giới VoV.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="relative mb-12 max-w-5xl mx-auto w-full">
          {/* Glowing Bar Background */}
          <div className="h-4 bg-[#10142e] rounded-full overflow-hidden border border-[#f5c767]/30 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#d8a83a] via-[#f5c767] to-[#3fe9d6] shadow-[0_0_20px_rgba(245,199,103,0.8)] relative"
              style={{ width: "100%" }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Milestones Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {/* Milestone 1 */}
            <div className="hsr-card p-4 text-center border-[#f5c767]/40 bg-[#0e132e]/90">
              <div className="text-xs font-bold text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
                500.000 Người
              </div>
              <div className="text-2xl my-2">🪙</div>
              <div className="font-bold text-sm text-white">50.000 Tín Dụng</div>
              <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ ĐÃ ĐẠT
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="hsr-card p-4 text-center border-[#f5c767]/40 bg-[#0e132e]/90">
              <div className="text-xs font-bold text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
                1.000.000 Người
              </div>
              <div className="text-2xl my-2">🎫</div>
              <div className="font-bold text-sm text-white">Vé Tinh Cầu x3</div>
              <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ ĐÃ ĐẠT
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="hsr-card p-4 text-center border-[#f5c767]/40 bg-[#0e132e]/90">
              <div className="text-xs font-bold text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
                3.000.000 Người
              </div>
              <div className="text-2xl my-2">👑</div>
              <div className="font-bold text-sm text-white">Khung Avatar Độc Quyền</div>
              <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ ĐÃ ĐẠT
              </div>
            </div>

            {/* Milestone 4 (Ultimate) */}
            <div className="hsr-card p-4 text-center border-[#3fe9d6]/60 bg-gradient-to-b from-[#141d40] to-[#0e132e] shadow-[0_0_25px_rgba(63,233,214,0.25)]">
              <div className="text-xs font-bold text-[#3fe9d6] uppercase font-[family-name:var(--font-rajdhani)]">
                5.000.000 Người
              </div>
              <div className="text-2xl my-2">⭐</div>
              <div className="font-bold text-sm text-[#3fe9d6]">Nhân Vật 4 Sao & Vé x10</div>
              <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40">
                ★ PHÚC LỢI TỐI THƯỢNG
              </div>
            </div>
          </div>
        </div>

        {/* Action to Claim Code */}
        <div className="text-center">
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenRewardsModal();
            }}
            className="hsr-btn-gold py-3 px-8 text-sm sm:text-base font-bold cursor-pointer"
          >
            <span>NHẬN MÃ QUÀ TẶNG KHỞI HÀNH (GIFTCODE)</span>
          </button>
        </div>
      </div>
    </section>
  );
}
