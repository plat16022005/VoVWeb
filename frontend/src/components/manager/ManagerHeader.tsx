"use client";

import { useEffect, useState } from "react";
import { soundEngine } from "@/services/audio.service";
import { authService } from "@/services/auth.service";
import { ManagerTab } from "./ManagerSidebar";

interface ManagerHeaderProps {
  currentTab: ManagerTab;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TAB_TITLES: Record<ManagerTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Cổng Điều Hành Vận Hành (Manager Portal)",
    subtitle: "Tổng quan các phân hệ nghiệp vụ, trạng thái phiên làm việc và sổ tay quy chuẩn vận hành.",
  },
  content: {
    title: "Trung Tâm Quản Lý Nội Dung (Content Hub)",
    subtitle: "Điều phối bài viết Blog, tin tức game và Fanpage mạng xã hội chính thức.",
  },
  gamedata: {
    title: "Quản Lý Dữ Liệu Game (Game Master Data)",
    subtitle: "Thiết lập thông số chiến binh Valkyria, Banner Gacha theo mùa, kỹ năng và thế giới Veyra.",
  },
  events: {
    title: "Trung Tâm Quản Lý Sự Kiện & Minigame (Event Hub)",
    subtitle: "Hợp nhất bản build Unity WebGL (.zip) và giao diện (.html), cấu hình nhiệm vụ nhận lượt và phần thưởng.",
  },
};

export default function ManagerHeader({
  currentTab,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing,
}: ManagerHeaderProps) {
  const [serverTime, setServerTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setServerTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " (UTC+7)"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabInfo = TAB_TITLES[currentTab];

  return (
    <header className="h-20 bg-[#070919]/80 backdrop-blur-md border-b border-[#f5c767]/20 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Menu Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenMobileMenu();
          }}
          className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white truncate font-[family-name:var(--font-rajdhani)] tracking-wide">
              {tabInfo.title}
            </h1>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#f5c767] animate-ping" />
          </div>
          <p className="text-xs text-slate-400 truncate hidden md:block">
            {tabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Server Clock & Refresh */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Server Time Ticker */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c1026] border border-[#f5c767]/20 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Giờ Server:</span>
          <span className="text-[#f5c767] font-semibold">{serverTime || "Đang đồng bộ..."}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onRefresh();
          }}
          disabled={isRefreshing}
          title="Làm mới dữ liệu vận hành"
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#3fe9d6]" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </header>
  );
}

