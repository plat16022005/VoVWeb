"use client";

import {
  MOCK_OPERATION_STATS,
  MOCK_GIFTCODES,
  MOCK_SERVER_MAILS,
  MOCK_EVENTS,
} from "@/data/mockManagerData";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";
import { ManagerTab } from "./ManagerSidebar";

interface ManagerOverviewTabProps {
  onNavigateTab: (tab: ManagerTab) => void;
  onOpenCreateGiftcode: () => void;
  onOpenSendMail: () => void;
  onOpenBroadcast: () => void;
}

export default function ManagerOverviewTab({
  onNavigateTab,
  onOpenCreateGiftcode,
  onOpenSendMail,
  onOpenBroadcast,
}: ManagerOverviewTabProps) {
  return (
    <div className="space-y-6 pb-12">
      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_OPERATION_STATS.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-[#f5c767]/40 transition-all duration-300 relative overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#f5c767]/10 via-[#3fe9d6]/5 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform" />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                {stat.title}
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  stat.isPositive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {stat.change}
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-rajdhani)] tracking-wide mb-1 relative z-10">
              {stat.value}
            </div>

            <div className="text-xs text-slate-400 relative z-10 truncate">
              {stat.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Server Cluster Health & Quick Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Realtime Server Cluster Status */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#090d24]/90 border border-[#3fe9d6]/20 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3fe9d6] animate-pulse" />
              <h2 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
                Trạng Thái Cụm Máy Chủ Veyra
              </h2>
            </div>
            <span className="text-xs font-mono text-[#3fe9d6] bg-[#3fe9d6]/10 px-2.5 py-1 rounded-lg border border-[#3fe9d6]/30">
              Đồng Bộ: Realtime
            </span>
          </div>

          <div className="space-y-3.5">
            {/* S1 */}
            <div className="p-4 rounded-xl bg-[#0c112e] border border-white/5 hover:border-[#3fe9d6]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    S1 - Veyra Khởi Nguyên
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      TẢI ỔN ĐỊNH
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    IP: 103.28.54.12 • Port: 8443 (Unity Game Server)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-300">
                  CCU: <strong className="text-white">9,420</strong> / 15,000
                </span>
                <span className="text-emerald-400 font-semibold">18ms</span>
              </div>
            </div>

            {/* S2 */}
            <div className="p-4 rounded-xl bg-[#0c112e] border border-white/5 hover:border-[#3fe9d6]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    S2 - Băng Phong Lãnh Địa
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      TẢI ỔN ĐỊNH
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    IP: 103.28.54.14 • Port: 8443 (Unity Game Server)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-300">
                  CCU: <strong className="text-white">5,385</strong> / 15,000
                </span>
                <span className="text-emerald-400 font-semibold">22ms</span>
              </div>
            </div>

            {/* S3 */}
            <div className="p-4 rounded-xl bg-[#0c112e] border border-white/5 hover:border-amber-400/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    S3 - Thần Điện Astral
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ĐANG BẢO TRÌ NỘI BỘ
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    IP: 103.28.54.19 • Cập nhật Engine Turn-Based v1.2.6
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">
                  CCU: <strong className="text-amber-300">15 Devs</strong>
                </span>
                <span className="text-amber-400 font-semibold">12ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Matrix */}
        <div className="p-6 rounded-2xl bg-[#090d24]/90 border border-[#f5c767]/20 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div>
            <h2 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase mb-1">
              Thao Tác Nhanh Vận Hành
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Thực thi các lệnh can thiệp tức thời vào máy chủ game.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenCreateGiftcode();
                }}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#f5c767] hover:bg-[#f5c767]/10 transition-all text-left group"
              >
                <div className="text-lg mb-1 group-hover:scale-110 transition-transform">
                  🎁
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-[#f5c767]">
                  Tạo Giftcode
                </div>
                <div className="text-[10px] text-slate-400">Phát mã đền bù</div>
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenSendMail();
                }}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400 hover:bg-purple-500/10 transition-all text-left group"
              >
                <div className="text-lg mb-1 group-hover:scale-110 transition-transform">
                  📬
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-purple-300">
                  Thư Toàn Server
                </div>
                <div className="text-[10px] text-slate-400">Gửi quà đính kèm</div>
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenBroadcast();
                }}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-rose-400 hover:bg-rose-500/10 transition-all text-left group"
              >
                <div className="text-lg mb-1 group-hover:scale-110 transition-transform">
                  📢
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-rose-300">
                  Phát Sóng Khẩn
                </div>
                <div className="text-[10px] text-slate-400">Chạy chữ thông báo</div>
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onNavigateTab("players");
                }}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all text-left group"
              >
                <div className="text-lg mb-1 group-hover:scale-110 transition-transform">
                  🔍
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-emerald-300">
                  Tra Cứu Người Chơi
                </div>
                <div className="text-[10px] text-slate-400">Kiểm tra tài khoản</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Bản quyền dữ liệu: Veyra Engine</span>
            <span className="text-[#f5c767]">Unity RPC Sync</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Dispatched Mails & Active Giftcodes Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Giftcodes Quick Glance */}
        <div className="p-6 rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase flex items-center gap-2">
              <span>Mã Giftcode Đang Hiệu Lực</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f5c767]/20 text-[#f5c767] border border-[#f5c767]/40">
                {MOCK_GIFTCODES.filter((g) => g.status === "ACTIVE").length} Hoạt Động
              </span>
            </h3>
            <button
              onClick={() => onNavigateTab("giftcodes")}
              className="text-xs text-[#f5c767] hover:underline font-mono"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_GIFTCODES.slice(0, 3).map((gc) => (
              <div
                key={gc.id}
                className="p-3.5 rounded-xl bg-[#0c1026] border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#f5c767] tracking-wider">
                      {gc.code}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                      {gc.serverTarget}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {gc.title}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-mono text-slate-200">
                    {formatNumber(gc.totalUses)} / {formatNumber(gc.maxUses)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Hạn: {gc.endDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Server Dispatched Mail Glance */}
        <div className="p-6 rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase flex items-center gap-2">
              <span>Hòm Thư Toàn Cụm Vừa Phát</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Đã Phát
              </span>
            </h3>
            <button
              onClick={() => onNavigateTab("mailbox")}
              className="text-xs text-purple-300 hover:underline font-mono"
            >
              Chi tiết hòm thư →
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_SERVER_MAILS.slice(0, 3).map((mail) => (
              <div
                key={mail.id}
                className="p-3.5 rounded-xl bg-[#0c1026] border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {mail.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                    <span className="text-purple-300">
                      {mail.targetType === "ALL_SERVERS"
                        ? "Toàn Bộ Cụm"
                        : mail.targetServer || mail.targetPlayerName}
                    </span>
                    <span>•</span>
                    <span>{mail.sentAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {mail.rewards.map((r, i) => (
                    <span
                      key={i}
                      title={`${r.name}: x${r.amount}`}
                      className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-[#f5c767]"
                    >
                      {r.icon} x{r.amount}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

