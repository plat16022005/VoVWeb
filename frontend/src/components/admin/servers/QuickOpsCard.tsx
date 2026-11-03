"use client";

import { useState } from "react";
import { soundEngine } from "@/services/audio.service";

interface QuickOpsCardProps {
  onOpenBroadcastModal: () => void;
  onRefreshHealth: () => void;
}

export default function QuickOpsCard({
  onOpenBroadcastModal,
  onRefreshHealth,
}: QuickOpsCardProps) {
  const [isFlushingCache, setIsFlushingCache] = useState(false);
  const [isReloadingConfig, setIsReloadingConfig] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  const handleFlushCache = () => {
    soundEngine.playClick();
    setIsFlushingCache(true);
    setTimeout(() => {
      setIsFlushingCache(false);
      setLastActionStatus("Đã làm sạch toàn bộ Redis Cache thành công (342MB giải phóng).");
      setTimeout(() => setLastActionStatus(null), 4000);
    }, 1200);
  };

  const handleReloadConfig = () => {
    soundEngine.playClick();
    setIsReloadingConfig(true);
    setTimeout(() => {
      setIsReloadingConfig(false);
      setLastActionStatus("Đã nạp lại cấu hình Game (Hot-reload) tới 5 cụm máy chủ thành công.");
      setTimeout(() => setLastActionStatus(null), 4000);
    }, 1500);
  };

  return (
    <div className="rounded-2xl bg-[#090c22]/80 backdrop-blur-md border border-[#3fe9d6]/20 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase flex items-center gap-2">
              ĐIỀU HÀNH TÁC VỤ NHANH
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
                Ops Center
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Các lệnh điều khiển nóng trực tiếp tới backend và game cluster.
            </p>
          </div>
        </div>

        {/* Status notification */}
        {lastActionStatus && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{lastActionStatus}</span>
          </div>
        )}

        {/* Action Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3">
          {/* Action 1: Broadcast */}
          <div className="p-3.5 rounded-xl bg-[#060818] border border-white/10 flex items-center justify-between hover:border-[#3fe9d6]/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#3fe9d6]/10 border border-[#3fe9d6]/30 flex items-center justify-center text-[#3fe9d6]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white">Phát Thông Báo Toàn Cụm (World Broadcast)</div>
                <div className="text-[11px] text-slate-400">Gửi thông điệp chạy chữ đỏ in-game tới toàn bộ người chơi.</div>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenBroadcastModal();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#3fe9d6]/10 hover:bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              Phát Tin
            </button>
          </div>

          {/* Action 2: Reload Config */}
          <div className="p-3.5 rounded-xl bg-[#060818] border border-white/10 flex items-center justify-between hover:border-[#9b51e0]/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#9b51e0]/10 border border-[#9b51e0]/30 flex items-center justify-center text-[#9b51e0]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white">Nạp Lại Cấu Hình Game (Hot-reload)</div>
                <div className="text-[11px] text-slate-400">Cập nhật bảng drop rate, sự kiện mà không cần tắt máy chủ.</div>
              </div>
            </div>
            <button
              onClick={handleReloadConfig}
              disabled={isReloadingConfig}
              className="px-3 py-1.5 rounded-lg bg-[#9b51e0]/10 hover:bg-[#9b51e0]/20 text-[#9b51e0] border border-[#9b51e0]/40 text-xs font-mono font-semibold transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {isReloadingConfig ? "Đang Nạp..." : "Nạp Lại"}
            </button>
          </div>

          {/* Action 3: Flush Cache */}
          <div className="p-3.5 rounded-xl bg-[#060818] border border-white/10 flex items-center justify-between hover:border-amber-400/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white">Xóa Bộ Nhớ Đệm (Flush Redis Cache)</div>
                <div className="text-[11px] text-slate-400">Giải phóng dữ liệu session tạm và đồng bộ lại DB.</div>
              </div>
            </div>
            <button
              onClick={handleFlushCache}
              disabled={isFlushingCache}
              className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/40 text-xs font-mono font-semibold transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {isFlushingCache ? "Đang Xóa..." : "Xóa Cache"}
            </button>
          </div>
        </div>
      </div>

      {/* Network check footer */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span>Giao thức kết nối: WebSocket / gRPC</span>
        </div>
        <button
          onClick={() => {
            soundEngine.playClick();
            onRefreshHealth();
          }}
          className="text-[#3fe9d6] hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Kiểm tra lại kết nối</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
