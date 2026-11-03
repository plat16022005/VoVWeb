"use client";

import { soundEngine } from "@/services/audio.service";

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  isRefreshing: boolean;
  totalAccounts: number;
}

export default function AdminHeader({
  onOpenMobileSidebar,
  onOpenCreateModal,
  onRefresh,
  onExportCsv,
  isRefreshing,
  totalAccounts,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full h-20 bg-[#070919]/80 backdrop-blur-xl border-b border-[#3fe9d6]/20 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
          aria-label="Mở menu quản trị"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>VOV CORE</span>
            <span>/</span>
            <span className="text-[#3fe9d6]">TỔNG HÀNH DINH</span>
            <span>/</span>
            <span className="text-[#f5c767]">QUẢN LÝ TÀI KHOẢN</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase flex items-center gap-2.5">
            DANH SÁCH CHỈ HUY & TÀI KHOẢN
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
              {totalAccounts} bản ghi
            </span>
          </h1>
        </div>
      </div>

      {/* Right Controls: Server status, Refresh, Export, Create */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Server Ping */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b0e24] border border-white/10 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="text-slate-400">Cụm Máy Chủ:</span>
          <span className="text-white font-semibold">Veyra-01</span>
          <span className="text-emerald-400 font-bold">(24ms)</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onRefresh();
          }}
          disabled={isRefreshing}
          title="Tải lại danh sách"
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-[#3fe9d6]/40 transition-all flex items-center gap-1.5 text-xs font-mono disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#3fe9d6]" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Làm Mới</span>
        </button>

        {/* Export CSV */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onExportCsv();
          }}
          title="Xuất tệp CSV"
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-[#f5c767]/40 transition-all flex items-center gap-1.5 text-xs font-mono"
        >
          <svg className="w-4 h-4 text-[#f5c767]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Xuất CSV</span>
        </button>

        {/* Create Account Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenCreateModal();
          }}
          className="relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-[family-name:var(--font-rajdhani)] tracking-wider uppercase text-black bg-gradient-to-r from-[#3fe9d6] to-[#f5c767] hover:brightness-110 shadow-[0_0_20px_rgba(63,233,214,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tạo Tài Khoản</span>
        </button>
      </div>
    </header>
  );
}
