"use client";

import { SystemHealthMetrics } from "@/data/servers";

interface ServerStatsCardsProps {
  health: SystemHealthMetrics;
  isLoading?: boolean;
}

export default function ServerStatsCards({ health, isLoading = false }: ServerStatsCardsProps) {
  const ccuPercentage =
    health.totalCapacity > 0
      ? Math.round((health.totalCcu / health.totalCapacity) * 100)
      : 0;

  if (isLoading && health.totalServersCount === 0) {
    // Skeleton Loading khi đang nạp dữ liệu từ Firebase
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#090c22]/60 border border-white/5 p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-white/10 rounded" />
              <div className="w-12 h-3 bg-white/10 rounded" />
            </div>
            <div className="w-16 h-8 bg-white/15 rounded" />
            <div className="w-32 h-3 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng Số Máy Chủ */}
      <div className="relative overflow-hidden rounded-2xl bg-[#090c22]/80 backdrop-blur-md border border-[#3fe9d6]/20 p-5 group hover:border-[#3fe9d6]/50 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3fe9d6]/5 rounded-full blur-2xl group-hover:bg-[#3fe9d6]/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
            Tổng Số Cụm Máy Chủ
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
            Realms
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-rajdhani)] text-white tracking-tight">
            {health.totalServersCount}
          </span>
          <span className="text-xs font-mono text-slate-400">Máy chủ trong hệ thống</span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{health.onlineServersCount} Hoạt động</span>
          </div>
          {health.maintenanceServersCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{health.maintenanceServersCount} Bảo trì</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Tổng CCU & Sức Chứa */}
      <div className="relative overflow-hidden rounded-2xl bg-[#090c22]/80 backdrop-blur-md border border-[#9b51e0]/20 p-5 group hover:border-[#9b51e0]/50 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9b51e0]/5 rounded-full blur-2xl group-hover:bg-[#9b51e0]/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
            Người Chơi Trực Tuyến (CCU)
          </span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fe9d6] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3fe9d6]" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-rajdhani)] text-white tracking-tight">
            {health.totalCcu.toLocaleString("en-US")}
          </span>
          <span className="text-xs font-mono text-slate-400">
            / {health.totalCapacity.toLocaleString("en-US")} slot
          </span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Tải Toàn Cụm</span>
            <span className={ccuPercentage > 85 ? "text-rose-400 font-bold" : "text-[#3fe9d6] font-bold"}>
              {ccuPercentage}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ccuPercentage > 85
                  ? "bg-gradient-to-r from-amber-400 to-rose-500"
                  : "bg-gradient-to-r from-[#3fe9d6] to-[#9b51e0]"
              }`}
              style={{ width: `${ccuPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Tỷ Lệ Sẵn Sàng Máy Chủ (Uptime) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#090c22]/80 backdrop-blur-md border border-emerald-500/20 p-5 group hover:border-emerald-500/50 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
            Tỷ Lệ Sẵn Sàng (Uptime)
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Online
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-rajdhani)] text-emerald-400 tracking-tight">
            {health.apiUptime}
          </span>
          <span className="text-xs font-mono text-slate-400">Hoạt động liên tục</span>
        </div>
        <div className="mt-3 text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>Khởi chạy trên:</span>
          <span className="text-slate-200 font-semibold">Unity Dedicated Server</span>
        </div>
      </div>

      {/* 4. Độ Trễ Trung Bình (Ping) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#090c22]/80 backdrop-blur-md border border-[#f5c767]/20 p-5 group hover:border-[#f5c767]/50 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5c767]/5 rounded-full blur-2xl group-hover:bg-[#f5c767]/10 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
            Độ Trễ Trung Bình (Ping)
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#f5c767]/10 text-[#f5c767] border border-[#f5c767]/30">
            Tốt
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-rajdhani)] text-[#f5c767] tracking-tight">
            ~{health.averagePing}ms
          </span>
          <span className="text-xs font-mono text-slate-400">Thời gian phản hồi</span>
        </div>
        <div className="mt-3 text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>Khu vực chính:</span>
          <span className="text-slate-200 font-semibold">Đông Nam Á (SEA)</span>
        </div>
      </div>
    </div>
  );
}
