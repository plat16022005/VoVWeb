"use client";

import { useEffect, useState } from "react";
import { soundEngine } from "@/services/audio.service";
import { authService } from "@/services/auth.service";
import { ManagerTab } from "./ManagerSidebar";

interface ManagerHeaderProps {
  currentTab: ManagerTab;
  onOpenMobileMenu: () => void;
  onOpenCreateGiftcode: () => void;
  onOpenSendMail: () => void;
  onOpenBroadcast: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TAB_TITLES: Record<ManagerTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Trung Tâm Điều Hành Trực Tiếp (LiveOps)",
    subtitle: "Giám sát chỉ số CCU, doanh thu Ruby và lưu lượng người chơi thời gian thực.",
  },
  giftcodes: {
    title: "Quản Lý Mã Phúc Lợi (Giftcode)",
    subtitle: "Thiết lập, phát hành mã thưởng tân thủ, đền bù bảo trì và theo dõi lượt đổi mã.",
  },
  mailbox: {
    title: "Hòm Thư Hệ Thống & Đền Bù Toàn Server",
    subtitle: "Gửi thư thưởng tri ân, đền bù sự cố kèm Ruby, Vé Ước Nguyện và vật phẩm SSR.",
  },
  events: {
    title: "Sự Kiện & Banner Triệu Hồi (Gacha)",
    subtitle: "Theo dõi lịch mở banner Rate-up Valkyria, sự kiện đua top và quà đăng nhập.",
  },
  players: {
    title: "Tra Cứu & Hỗ Trợ Người Chơi (Commanders)",
    subtitle: "Kiểm tra dữ liệu tài khoản người chơi, lực chiến, đội hình và can thiệp hỗ trợ.",
  },
  blog: {
    title: "Soạn Thảo Blog & Tin Tức",
    subtitle: "Viết và xuất bản bài viết với trình soạn thảo văn bản đầy đủ như Word.",
  },
  broadcast: {
    title: "Phát Sóng Thông Báo Khẩn (Marquee Ticker)",
    subtitle: "Đẩy dòng thông báo chạy chữ trên đầu màn hình in-game cho toàn bộ người chơi.",
  },
};

export default function ManagerHeader({
  currentTab,
  onOpenMobileMenu,
  onOpenCreateGiftcode,
  onOpenSendMail,
  onOpenBroadcast,
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

      {/* Right: Server Clock & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Server Time Ticker */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c1026] border border-[#f5c767]/20 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Giờ Server:</span>
          <span className="text-[#f5c767] font-semibold">{serverTime || "Đang đồng bộ..."}</span>
        </div>

        {/* Action: Send Mail Quick Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenSendMail();
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600/30 to-purple-800/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/40 transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Gửi Thư Server</span>
        </button>

        {/* Action: Create Giftcode Quick Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenCreateGiftcode();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#f5c767] to-[#e67e22] text-[#060814] font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(245,199,103,0.3)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Tạo Giftcode</span>
          <span className="sm:hidden">Giftcode</span>
        </button>

        {/* Action: Broadcast Quick Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenBroadcast();
          }}
          title="Phát thông báo khẩn toàn server"
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-rose-300 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </button>

        {/* Refresh Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onRefresh();
          }}
          disabled={isRefreshing}
          title="Làm mới dữ liệu vận hành"
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
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

