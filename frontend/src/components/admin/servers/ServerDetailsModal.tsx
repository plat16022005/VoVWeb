"use client";

import { GameServer } from "@/data/servers";
import { soundEngine } from "@/services/audio.service";

interface ServerDetailsModalProps {
  isOpen: boolean;
  server: GameServer | null;
  onClose: () => void;
}

export default function ServerDetailsModal({
  isOpen,
  server,
  onClose,
}: ServerDetailsModalProps) {
  if (!isOpen || !server) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#090c22] border border-[#3fe9d6]/30 p-6 shadow-[0_0_50px_rgba(63,233,214,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#3fe9d6]">
              <span>NODE DETAILS</span>
              <span>•</span>
              <span>{server.code}</span>
            </div>
            <h3 className="text-lg font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase mt-0.5">
              {server.name}
            </h3>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4">
          {/* Hardware & Network Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#060818] border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Địa Chỉ IP & Port</span>
              <span className="text-xs font-mono font-bold text-white">{server.ipAddress}:{server.port}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#060818] border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Khu Vực & Data Center</span>
              <span className="text-xs font-mono font-bold text-slate-200">{server.location}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#060818] border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Nền Tảng Engine</span>
              <span className="text-xs font-mono font-bold text-[#3fe9d6]">{server.engine}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#060818] border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Tải CPU Hiện Tại</span>
              <span className="text-xs font-mono font-bold text-amber-400">{server.cpuLoad}%</span>
            </div>
            <div className="p-3 rounded-xl bg-[#060818] border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Bộ Nhớ RAM Đã Chiếm</span>
              <span className="text-xs font-mono font-bold text-purple-400">{server.ramUsage}%</span>
            </div>
            <div className="p-3 rounded-xl bg-[#060818] border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Thời Gian Uptime</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{server.uptime}</span>
            </div>
          </div>

          {/* Maintenance Message if any */}
          {server.maintenanceMessage && (
            <div className="p-3 rounded-xl bg-[#9b51e0]/10 border border-[#9b51e0]/30 text-xs font-mono text-purple-200">
              <span className="font-bold text-[#9b51e0] block mb-1">Ghi Chú Bảo Trì:</span>
              {server.maintenanceMessage}
            </div>
          )}

          {/* System Console Snapshot */}
          <div className="rounded-xl bg-[#040614] border border-white/10 p-3 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="text-slate-500 uppercase tracking-wider text-[10px] border-b border-white/5 pb-1">
              Nhật Ký Khởi Chạy Node (Recent Telemetry Log)
            </div>
            <div className="text-slate-400">[INFO] Node initialized with Unity Dedicated Server build {server.version}</div>
            <div className="text-slate-400">[INFO] Network socket bound to UDP port {server.port} successfully.</div>
            <div className="text-slate-400">[HEARTBEAT] Ping sync with Gateway: {server.ping}ms. State: {server.status.toUpperCase()}</div>
            <div className="text-emerald-400">[STATUS] Current concurrent players: {server.ccu}/{server.maxCcu} players.</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
}
