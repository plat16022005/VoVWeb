"use client";

import { useState } from "react";
import StarCanvas from "@/components/common/StarCanvas";
import AdminSidebar from "../AdminSidebar";
import AccountLogsTable from "../AccountLogsTable";
import TermsLogsTable from "./TermsLogsTable";
import BlogLogsTable from "./BlogLogsTable";
import ServerLogsTable from "./ServerLogsTable";
import GameDataLogsTable from "./GameDataLogsTable";
import GachaLogsTable from "./GachaLogsTable";
import EventLogsTable from "./EventLogsTable";
import ItemLogsTable from "./ItemLogsTable";
import GiftcodeLogsTable from "./GiftcodeLogsTable";
import MailLogsTable from "./MailLogsTable";
import { soundEngine } from "@/services/audio.service";

type ActiveLogTab =
  | "accounts"
  | "terms"
  | "policy"
  | "blogs"
  | "servers"
  | "gamedata"
  | "gacha"
  | "items"
  | "events"
  | "giftcodes"
  | "mail";

interface LogCategoryGroup {
  groupName: string;
  tabs: {
    id: ActiveLogTab;
    label: string;
    badge: string;
    description: string;
  }[];
}

export default function AdminLogsView() {
  const [activeTab, setActiveTab] = useState<ActiveLogTab>("accounts");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const categories: LogCategoryGroup[] = [
    {
      groupName: "Người Dùng & Quyền Hạn",
      tabs: [
        {
          id: "accounts",
          label: "Quản Lý Tài Khoản",
          badge: "User Audit",
          description: "Khóa vi phạm, mở khóa, reset pass, đổi vai trò người chơi",
        },
      ],
    },
    {
      groupName: "Nội Dung & Pháp Lý",
      tabs: [
        {
          id: "terms",
          label: "Điều Khoản Dịch Vụ",
          badge: "Terms Audit",
          description: "Xuất bản phiên bản điều khoản, số lượng mục quy định",
        },
        {
          id: "policy",
          label: "Chính Sách Bảo Mật",
          badge: "Policy Audit",
          description: "Sửa đổi chính sách dữ liệu, bảo mật và quyền riêng tư",
        },
        {
          id: "blogs",
          label: "Quản Lý Blog & Tin Tức",
          badge: "Blog Audit",
          description: "Thao tác tạo, sửa, xuất bản, gỡ và xóa bài viết tin tức",
        },
      ],
    },
    {
      groupName: "Dữ Liệu Game & Chiến Binh",
      tabs: [
        {
          id: "gamedata",
          label: "Dữ Liệu Game",
          badge: "Game Data Audit",
          description: "Thao tác khởi tạo, sửa chỉ số, cập nhật hồ sơ & xóa nhân vật",
        },
        {
          id: "gacha",
          label: "Banner Gacha",
          badge: "Gacha Audit",
          description: "Tạo mùa, kích hoạt mùa, cấu hình tỷ lệ quay, Pity & pool Banner Gacha",
        },
        {
          id: "items",
          label: "Kho Vật Phẩm & Trang Bị",
          badge: "Item Audit",
          description: "Khởi tạo, điều chỉnh chỉ số trang bị, đồng bộ mẫu & gỡ bỏ vật phẩm game",
        },
        {
          id: "events",
          label: "Sự Kiện & Minigame",
          badge: "Event Audit",
          description: "Tạo sự kiện, tải bản build Unity (.zip), cập nhật layout (.html) & phần thưởng",
        },
        {
          id: "giftcodes",
          label: "Mã Quà Tặng (Giftcode)",
          badge: "Giftcode Audit",
          description: "Tạo mã quà tặng, sinh lô hàng loạt, cấu hình gói thưởng, khóa & xóa mã",
        },
      ],
    },
    {
      groupName: "Hạ Tầng & Hỗ Trợ Người Chơi",
      tabs: [
        {
          id: "servers",
          label: "Hạ Tầng & Máy Chủ",
          badge: "Server Audit",
          description: "Bảo trì toàn cục hệ thống, cấu hình bảo trì từng cụm server",
        },
        {
          id: "mail",
          label: "Hòm Thư & Hỗ Trợ Người Chơi",
          badge: "Mailbox Audit",
          description: "Gửi thư toàn server, đền bù báo lỗi cá nhân, đính kèm quà & thu hồi thư",
        },
      ],
    },
  ];

  const allTabs = categories.flatMap((c) => c.tabs);
  const currentTabInfo = allTabs.find((t) => t.id === activeTab) || allTabs[0];

  return (
    <div className="relative min-h-screen w-full bg-[#04050d] text-white flex overflow-x-hidden">
      {/* Background Starry Canvas */}
      <StarCanvas />

      {/* Decorative Sci-Fantasy Nebulas */}
      <div className="fixed top-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-[#3fe9d6]/10 to-[#9b51e0]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-[#f5c767]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Sidebar */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen z-10 w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full h-20 bg-[#070919]/80 backdrop-blur-xl border-b border-[#3fe9d6]/20 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
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
                <span className="text-[#f5c767]">NHẬT KÝ HỆ THỐNG</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase flex items-center gap-2.5">
                NHẬT KÝ HOẠT ĐỘNG
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
                  Phân Hệ Chuyên Biệt
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b0e24] border border-white/10 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-slate-400">Theo Dõi:</span>
              <span className="text-emerald-400 font-bold">Realtime</span>
            </div>
          </div>
        </header>

        {/* Page Inner Container (Always Centered) */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header Description Banner & Quick Selector */}
          <div className={`p-5 sm:p-6 rounded-2xl bg-[#090c21]/95 backdrop-blur-md border border-white/10 shadow-xl space-y-4 relative transition-all ${isDropdownOpen ? "z-50" : "z-10"}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide uppercase flex items-center gap-2 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-[#3fe9d6]" />
                  <span>Trung Tâm Nhật Ký & Kiểm Toán Hoạt Động</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
                    Audit Trail Hub
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Mỗi phân hệ sở hữu cấu trúc nhật ký, trường thông tin và bộ lọc chuyên biệt, giúp quản trị viên theo dõi chuẩn xác từng nghiệp vụ và dễ dàng mở rộng khi hệ sinh thái lớn mạnh.
                </p>
              </div>

              {/* Bộ Chọn Phân Hệ Nhanh (Smart Module Dropdown - Giúp xử lý gọn khi có 5, 10 hay 20 phân hệ) */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#0e1333] hover:bg-[#141b47] border border-[#3fe9d6]/40 hover:border-[#3fe9d6] text-white flex items-center justify-between gap-3 text-xs font-mono transition-all shadow-[0_0_15px_rgba(63,233,214,0.15)] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
                    <span className="font-bold text-white">{currentTabInfo.label}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#3fe9d6]/20 text-[#3fe9d6] font-semibold">
                      {currentTabInfo.badge}
                    </span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu Phân Loại Danh Mục (Scale-ready cho tương lai) */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 sm:w-84 rounded-2xl bg-[#080c24] border border-[#3fe9d6]/50 shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 flex items-center justify-between">
                        <span>Chọn Phân Hệ Tra Cứu</span>
                        <span className="text-[#3fe9d6] font-bold">{allTabs.length} Phân Hệ</span>
                      </div>

                      <div className="max-h-80 overflow-y-auto space-y-3 p-1 mt-1 custom-scrollbar">
                        {categories.map((category) => (
                          <div key={category.groupName} className="space-y-1">
                            <div className="px-2 pt-1 text-[10px] font-mono font-semibold uppercase text-slate-500">
                              {category.groupName}
                            </div>
                            {category.tabs.map((tab) => {
                              const active = activeTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => {
                                    soundEngine.playClick();
                                    setActiveTab(tab.id);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                    active
                                      ? "bg-[#3fe9d6] text-black font-bold shadow-md"
                                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        active ? "bg-black/60" : "bg-[#3fe9d6]/60"
                                      }`}
                                    />
                                    <span className="truncate">{tab.label}</span>
                                  </div>
                                  <span
                                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold shrink-0 ${
                                      active ? "bg-black/20 text-black" : "bg-white/10 text-[#3fe9d6]"
                                    }`}
                                  >
                                    {tab.badge}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Tabs Navigation theo từng Phân Hệ - Bố cục lưới cân đối 4 cột */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 relative z-0">
            {allTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`p-3.5 rounded-2xl font-mono text-left transition-all cursor-pointer flex flex-col justify-between gap-2 border relative overflow-hidden group ${
                    active
                      ? "bg-gradient-to-br from-[#3fe9d6] to-[#0ea5e9] text-black border-[#3fe9d6] shadow-[0_0_25px_rgba(63,233,214,0.35)] scale-[1.02]"
                      : "bg-[#090c21]/90 text-slate-300 border-white/10 hover:border-[#3fe9d6]/40 hover:bg-[#0d1230] hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        active ? "bg-black/60" : "bg-[#3fe9d6]"
                      }`}
                    />
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                        active
                          ? "bg-black/20 text-black font-extrabold"
                          : "bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30 group-hover:bg-[#3fe9d6]/20"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </div>
                  <div>
                    <div
                      className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                        active ? "text-black" : "text-white"
                      }`}
                      title={tab.label}
                    >
                      {tab.label}
                    </div>
                    <div
                      className={`text-[10px] line-clamp-1 mt-0.5 ${
                        active ? "text-black/75 font-semibold" : "text-slate-400"
                      }`}
                      title={tab.description}
                    >
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Nội dung bảng chuyên biệt tương ứng theo Tab */}
          <div>
            {activeTab === "accounts" && <AccountLogsTable />}
            {activeTab === "terms" && <TermsLogsTable type="terms" />}
            {activeTab === "policy" && <TermsLogsTable type="policy" />}
            {activeTab === "blogs" && <BlogLogsTable />}
            {activeTab === "servers" && <ServerLogsTable />}
            {activeTab === "gamedata" && <GameDataLogsTable />}
            {activeTab === "gacha" && <GachaLogsTable />}
            {activeTab === "items" && <ItemLogsTable />}
            {activeTab === "events" && <EventLogsTable />}
            {activeTab === "giftcodes" && <GiftcodeLogsTable />}
            {activeTab === "mail" && <MailLogsTable />}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>© 2026 Valkyria of Veyra · Trung Tâm Kiểm Toán & Hoạt Động (VOV Audit)</div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Turn-Based RPG</span>
            <span>•</span>
            <span className="text-[#3fe9d6]">Phân Hệ Độc Lập</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
