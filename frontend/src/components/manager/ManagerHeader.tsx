"use client";

import { useEffect, useState } from "react";
import { soundEngine } from "@/services/audio.service";
import { ManagerTab } from "./ManagerSidebar";

export type ManagerSectionKey =
  | "overview"
  | "content:overview"
  | "content:blog"
  | "content:facebook"
  | "gamedata:characters"
  | "gamedata:gacha"
  | "gamedata:items"
  | "gamedata:worlds"
  | "events:minigames"
  | "events:giftcodes"
  | "support:mail";

interface ManagerHeaderProps {
  currentTab: ManagerTab;
  sectionKey?: ManagerSectionKey;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const SECTION_META: Record<
  ManagerSectionKey,
  { group?: string; title: string; subtitle: string }
> = {
  overview: {
    title: "Cổng Điều Hành Vận Hành (Manager Portal)",
    subtitle:
      "Tổng quan các phân hệ nghiệp vụ, trạng thái phiên làm việc và sổ tay quy chuẩn vận hành.",
  },
  "content:overview": {
    group: "Quản Lý Nội Dung",
    title: "Tổng Quan Nội Dung & Truyền Thông",
    subtitle:
      "Thống kê tổng hợp bài viết Blog, tin tức trang chủ và tương tác kênh Fanpage chính thức.",
  },
  "content:blog": {
    group: "Quản Lý Nội Dung",
    title: "Blog & Tin Tức Trang Chủ",
    subtitle:
      "Soạn thảo, kiểm duyệt, xuất bản và quản lý bài viết tin tức chính thức của Valkyria of Veyra.",
  },
  "content:facebook": {
    group: "Quản Lý Nội Dung",
    title: "Fanpage Facebook & Tương Tác",
    subtitle:
      "Đăng bài trực tiếp lên Fanpage, theo dõi chỉ số tương tác và cấu hình trả lời bình luận tự động.",
  },
  "gamedata:characters": {
    group: "Dữ Liệu Game",
    title: "Chiến Binh Valkyria",
    subtitle:
      "Thiết lập hồ sơ nhân vật, thông tin cá nhân, chỉ số chiến đấu và bộ kỹ năng cho game và trang chủ.",
  },
  "gamedata:gacha": {
    group: "Dữ Liệu Game",
    title: "Banner Gacha Theo Mùa",
    subtitle:
      "Quản lý mùa phát hành, tỷ lệ triệu hồi, cơ chế Pity, pool tướng và hình ảnh Banner Gacha.",
  },
  "gamedata:items": {
    group: "Dữ Liệu Game",
    title: "Vật Phẩm & Trang Bị",
    subtitle:
      "Cấu hình danh mục vật phẩm, trang bị chỉ số động, nguyên liệu và phần thưởng trong game.",
  },
  "gamedata:worlds": {
    group: "Dữ Liệu Game",
    title: "Bản Đồ Thế Giới Veyra",
    subtitle:
      "Quản lý thông tin các vùng đất đại lục Veyra và cấu hình phó bản chiến dịch.",
  },
  "events:minigames": {
    group: "Quản Lý Sự Kiện",
    title: "Minigame & Sự Kiện Web",
    subtitle:
      "Vận hành sự kiện Minigame Unity WebGL (.zip + .html), nhiệm vụ nhận lượt và phần thưởng.",
  },
  "events:giftcodes": {
    group: "Quản Lý Sự Kiện",
    title: "Mã Quà Tặng (Giftcode)",
    subtitle:
      "Phát hành mã quà tặng theo chiến dịch, quản lý lượt nhập, phạm vi máy chủ và quà đính kèm.",
  },
  "support:mail": {
    group: "Hỗ Trợ Người Chơi",
    title: "Hòm Thư Hệ Thống (Mailbox)",
    subtitle:
      "Soạn và gửi thư toàn server, thư cá nhân đính kèm quà và đền bù xử lý báo lỗi theo từng cụm máy chủ.",
  },
};

const FALLBACK_BY_TAB: Record<ManagerTab, ManagerSectionKey> = {
  overview: "overview",
  content: "content:overview",
  gamedata: "gamedata:characters",
  events: "events:minigames",
  support: "support:mail",
};

export default function ManagerHeader({
  currentTab,
  sectionKey,
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

  const resolvedKey = sectionKey || FALLBACK_BY_TAB[currentTab];
  const tabInfo = SECTION_META[resolvedKey];

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
            {tabInfo.group && (
              <>
                <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  {tabInfo.group}
                </span>
                <span className="hidden sm:inline-block text-slate-600 text-xs">/</span>
              </>
            )}
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
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c1026] border border-[#f5c767]/20 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Giờ Server:</span>
          <span className="text-[#f5c767] font-semibold">
            {serverTime || "Đang đồng bộ..."}
          </span>
        </div>

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
