"use client";

import Link from "next/link";
import { useAuth } from "@/services/auth.service";
import { soundEngine } from "@/services/audio.service";
import { hasPermission, hasPermissionGroup, PERMISSION_GROUPS } from "@/data/permissions";

export default function ManagerOverviewTab() {
  const currentUser = useAuth();
  const hasContentGroup = hasPermissionGroup(currentUser, "content_management");
  const hasGameDataGroup = hasPermissionGroup(currentUser, "game_data");
  const hasEventGroup = hasPermissionGroup(currentUser, "event_management");
  const hasSupportGroup = hasPermissionGroup(currentUser, "player_support");
  const hasGachaAccess =
    hasPermission(currentUser, "gamedata.gacha.view") ||
    hasPermission(currentUser, "gamedata.gacha.edit") ||
    hasPermission(currentUser, "gamedata.gacha.activate") ||
    hasPermission(currentUser, "gamedata.gacha.delete");

  // Nhận diện động toàn bộ các nhóm lớn mà tài khoản được cấp
  const activeGroups = PERMISSION_GROUPS.filter((g) => hasPermissionGroup(currentUser, g.id));
  const activeGroupCount = activeGroups.length;
  const activeGroupNames = activeGroups.map((g) => g.title).join(" · ");
  const subPermsCount = currentUser?.permissions?.length || 0;

  return (
    <div className="space-y-6 pb-12 font-[family-name:var(--font-inter)] animate-fade-in">
      {/* 1. WELCOME EXECUTIVE BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1438] via-[#080d24] to-[#0c1438] border border-[#f5c767]/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(245,199,103,0.15)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5c767]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Manager Avatar Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#f5c767] via-[#9b51e0] to-[#3fe9d6] p-[2px] shadow-[0_0_25px_rgba(245,199,103,0.4)] shrink-0">
              <div className="w-full h-full bg-[#060814] rounded-[14px] flex items-center justify-center font-[family-name:var(--font-rajdhani)] font-black text-2xl sm:text-3xl text-[#f5c767]">
                {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "M"}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase font-[family-name:var(--font-rajdhani)]">
                  Xin chào, {currentUser?.username || "Chỉ Huy Vận Hành"}!
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  HOẠT ĐỘNG
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold font-mono">
                  {currentUser?.role === "Admin" ? "QUẢN TRỊ VIÊN" : "QUẢN LÝ (MANAGER)"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-sans">
                Chào mừng bạn đến với <strong>Cổng Điều Hành Vận Hành (Manager Portal)</strong> của Valkyria of Veyra.
                Tại đây bạn có thể theo dõi quyền hạn được cấp và truy cập nhanh vào các phân hệ nghiệp vụ.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                <span>Email: <strong className="text-slate-200">{currentUser?.email || "Chưa thiết lập"}</strong></span>
                <span>•</span>
                <span>Phiên: <strong className="text-[#3fe9d6]">Bảo mật an toàn</strong></span>
                <span>•</span>
                <span>Thời gian: <strong className="text-[#f5c767]">{new Date().toLocaleDateString("vi-VN")}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            {hasContentGroup && (
              <Link
                href="/manager/contents"
                onClick={() => soundEngine.playClick()}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#f5c767] via-[#e6b143] to-[#d49d28] hover:brightness-110 text-[#060814] font-bold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(245,199,103,0.35)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Vào Quản Lý Nội Dung</span>
                <span>→</span>
              </Link>
            )}
            {hasGameDataGroup && (
              <Link
                href="/manager/gamedata"
                onClick={() => soundEngine.playClick()}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] hover:brightness-110 text-[#060814] font-bold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(63,233,214,0.35)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Vào Dữ Liệu Game</span>
                <span>→</span>
              </Link>
            )}
            {hasGachaAccess && (
              <Link
                href="/manager/gacha"
                onClick={() => soundEngine.playClick()}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] hover:brightness-110 text-[#060814] font-bold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(245,199,103,0.3)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Vào Banner Gacha</span>
                <span>→</span>
              </Link>
            )}
            {hasEventGroup && (
              <Link
                href="/manager/events"
                onClick={() => soundEngine.playClick()}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#9b51e0] to-[#3fe9d6] hover:brightness-110 text-white font-bold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(63,233,214,0.3)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Vào Quản Lý Sự Kiện</span>
                <span>→</span>
              </Link>
            )}
            {hasSupportGroup && (
              <Link
                href="/manager/support"
                onClick={() => soundEngine.playClick()}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-[#3fe9d6] hover:brightness-110 text-[#060814] font-bold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Vào Hỗ Trợ Người Chơi</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. SYSTEM & SESSION HEARTBEAT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Vai Trò Tài Khoản */}
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-[#f5c767]/40 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Cấp Độ Tài Khoản</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide">
              {currentUser?.role === "Admin" ? "Quản Trị Viên" : "Quản Lý Vận Hành"}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Phân quyền theo cấp bậc RBAC
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Xác thực hợp lệ</span>
          </div>
        </div>

        {/* Card 2: Quyền Hạn Được Cấp (Tính toán động toàn bộ nhóm lớn & quyền con) */}
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-purple-500/40 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Phân Quyền Đang Có</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-purple-300 font-[family-name:var(--font-rajdhani)] tracking-wide">
              {currentUser?.role === "Admin"
                ? "Toàn Quyền Hệ Thống"
                : activeGroupCount > 0
                  ? `${activeGroupCount} Nhóm Lớn (${subPermsCount} Quyền)`
                  : "Chưa Phân Nhóm"}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1" title={activeGroupNames}>
              {currentUser?.role === "Admin"
                ? "Quản Trị Viên Master"
                : activeGroupCount > 0
                  ? activeGroupNames
                  : "Liên hệ Admin để được cấp"}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Phân quyền tài khoản bảo mật
          </div>
        </div>

        {/* Card 3: Hạ Tầng Máy Chủ Game */}
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-emerald-500/40 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Cụm Máy Chủ Game</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-emerald-400 font-[family-name:var(--font-rajdhani)] tracking-wide">
              Veyra-01 (24ms)
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Unity Engine · Turn-Based RPG
            </div>
          </div>
          <div className="text-[11px] text-emerald-300 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span>Máy chủ trực tuyến ổn định</span>
          </div>
        </div>

        {/* Card 4: Hệ Thống Dữ Liệu */}
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-[#3fe9d6]/40 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Hệ Thống Dữ Liệu</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#3fe9d6] font-[family-name:var(--font-rajdhani)] tracking-wide">
              Đã Kết Nối
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Múi giờ: GMT+7 (Asia/Ho_Chi_Minh)
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Đồng bộ thời gian thực
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL MODULES DIRECTORY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
              Danh Mục Phân Hệ Nghiệp Vụ Vận Hành
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Hệ thống phân quyền theo module độc lập
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Module 1: Quản Lý Nội Dung (Đang hoạt động) */}
          <div className="p-6 rounded-2xl bg-[#090d24]/90 border border-[#f5c767]/30 hover:border-[#f5c767]/60 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#f5c767]">
                  Truyền Thông & Nội Dung
                </span>
                {hasContentGroup ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ĐÃ CẤP QUYỀN
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    CHƯA CẤP QUYỀN
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-rajdhani)] text-lg font-bold text-white group-hover:text-[#f5c767] transition-colors">
                  Quản Lý Nội Dung & Mạng Xã Hội
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                  Biên tập bài viết Blog, tin tức cập nhật trên trang chủ và xuất bản nội dung lên Fanpage Facebook chính thức.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Phân hệ Blog:</span>
                  <span className="text-slate-200">Soạn thảo, Xuất bản, Gỡ bài</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phân hệ Fanpage:</span>
                  <span className="text-slate-200">Đăng bài, Lấy metrics, Bot reply</span>
                </div>
              </div>
            </div>

            {hasContentGroup ? (
              <Link
                href="/manager/contents"
                onClick={() => soundEngine.playClick()}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-[#f5c767] hover:text-[#060814] text-white text-xs font-mono font-bold border border-white/10 hover:border-[#f5c767] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Mở Phân Hệ Nội Dung</span>
                <span>→</span>
              </Link>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/5 text-center text-xs font-mono text-slate-500">
                Liên hệ Quản Trị Viên để được gán quyền
              </div>
            )}
          </div>

          {/* Module 2: Quản Lý Dữ Liệu Game & Valkyria */}
          <div
            className={`p-6 rounded-2xl bg-[#090d24]/90 border transition-all flex flex-col justify-between space-y-4 shadow-xl ${hasGameDataGroup
              ? "border-white/10 hover:border-[#3fe9d6]/40 hover:shadow-[0_0_25px_rgba(63,233,214,0.15)] group"
              : "border-white/5 opacity-60"
              }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#3fe9d6]/20 to-[#9b51e0]/20 border border-[#3fe9d6]/30 flex items-center justify-center text-xs font-mono font-bold text-[#3fe9d6] shadow-inner">
                  DL
                </div>
                {hasGameDataGroup ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
                    ĐƯỢC PHÉP TRUY CẬP
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    CHƯA CẤP QUYỀN
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-rajdhani)] text-lg font-bold text-white group-hover:text-[#3fe9d6] transition-colors">
                  Dữ Liệu Game, Valkyria & Banner Gacha
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                  Quản lý hồ sơ chiến binh Valkyria, bộ kỹ năng, chỉ số HP/ATK/DEF/SPD và hệ thống Banner Gacha theo mùa của đại lục Veyra.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Hồ sơ Valkyria:</span>
                  <span className="text-slate-200">UR / SSR / SR / R</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Triệu Hồi Gacha:</span>
                  <span className="text-slate-200">Mùa, Pity & Pool Tướng</span>
                </div>
              </div>
            </div>

            {hasGameDataGroup ? (
              <Link
                href="/manager/gamedata"
                onClick={() => soundEngine.playClick()}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-[#3fe9d6] hover:text-[#060814] text-white text-xs font-mono font-bold border border-white/10 hover:border-[#3fe9d6] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Mở Dữ Liệu Game</span>
                <span>→</span>
              </Link>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/5 text-center text-xs font-mono text-slate-500">
                Liên hệ Quản Trị Viên để được gán quyền
              </div>
            )}
          </div>

          {/* Module 3: Quản Lý Sự Kiện & Minigame Web */}
          <div
            className={`p-6 rounded-2xl bg-[#090d24]/90 border transition-all flex flex-col justify-between space-y-4 shadow-xl ${hasEventGroup
              ? "border-white/10 hover:border-[#f5c767]/50 hover:shadow-[0_0_25px_rgba(245,199,103,0.15)] group"
              : "border-white/5 opacity-60"
              }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f5c767]/20 to-[#9b51e0]/20 border border-[#f5c767]/30 flex items-center justify-center text-xs font-mono font-bold text-[#f5c767]">
                  EV
                </div>
                {hasEventGroup ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ĐÃ CẤP QUYỀN
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    CHƯA CẤP QUYỀN
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-rajdhani)] text-lg font-bold text-white group-hover:text-[#f5c767] transition-colors">
                  Quản Lý Sự Kiện & Minigame Web
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                  Hợp nhất tự động giao diện .html và bản build Unity WebGL (.zip), quản lý nhiệm vụ nhận lượt và phần thưởng vòng quay.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Bản build Game:</span>
                  <span className="text-slate-200">Unity WebGL (.zip) + .html</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Đồng bộ dữ liệu:</span>
                  <span className="text-emerald-400">Lượt chơi &amp; Phần thưởng</span>
                </div>
              </div>
            </div>

            {hasEventGroup ? (
              <Link
                href="/manager/events"
                onClick={() => soundEngine.playClick()}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-[#f5c767] hover:text-[#060814] text-white text-xs font-mono font-bold border border-white/10 hover:border-[#f5c767] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Mở Quản Lý Sự Kiện</span>
                <span>→</span>
              </Link>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/5 text-center text-xs font-mono text-slate-500">
                Liên hệ Quản Trị Viên để được gán quyền
              </div>
            )}
          </div>

          {/* Module 4: Hỗ Trợ Người Chơi & Hòm Thư Hệ Thống */}
          <div
            className={`p-6 rounded-2xl bg-[#090d24]/90 border transition-all flex flex-col justify-between space-y-4 shadow-xl ${hasSupportGroup
              ? "border-white/10 hover:border-emerald-400/50 hover:shadow-[0_0_25px_rgba(52,211,153,0.15)] group"
              : "border-white/5 opacity-60"
              }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400/20 to-[#3fe9d6]/20 border border-emerald-400/35 flex items-center justify-center text-xs font-mono font-bold text-emerald-300">
                  CS
                </div>
                {hasSupportGroup ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ĐÃ CẤP QUYỀN
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    CHƯA CẤP QUYỀN
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-rajdhani)] text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Hỗ Trợ Người Chơi &amp; Hòm Thư Hệ Thống
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                  Gửi thư toàn server hoặc cá nhân, đính kèm quà tặng, xử lý đền bù báo lỗi và phát thông báo vận hành trong game.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Phạm vi gửi:</span>
                  <span className="text-slate-200">Toàn Server &amp; Cá Nhân</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phân loại thư:</span>
                  <span className="text-emerald-400">Thông Báo · Đền Bù · Quà Tặng</span>
                </div>
              </div>
            </div>

            {hasSupportGroup ? (
              <Link
                href="/manager/support"
                onClick={() => soundEngine.playClick()}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-emerald-400 hover:text-[#060814] text-white text-xs font-mono font-bold border border-white/10 hover:border-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Mở Hỗ Trợ Người Chơi</span>
                <span>→</span>
              </Link>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/5 text-center text-xs font-mono text-slate-500">
                Liên hệ Quản Trị Viên để được gán quyền
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. OPERATIONAL CODE OF CONDUCT (NGUYÊN TẮC VẬN HÀNH DÀNH CHO MANAGER) */}
      <div className="p-6 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-4 shadow-xl">
        <div className="border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
            Sổ Tay & Nguyên Tắc Vận Hành Chuẩn Mực
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#050716] border border-white/5 space-y-2">
            <div className="text-xs font-bold text-[#f5c767] font-mono uppercase">
              1. Bảo Mật Thông Tin
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Tuyệt đối bảo vệ tài khoản quản trị, không tiết lộ mật khẩu, mã xác thực hay thông tin nội bộ cho bất kỳ cá nhân nào ngoài tổ chức.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#050716] border border-white/5 space-y-2">
            <div className="text-xs font-bold text-[#3fe9d6] font-mono uppercase">
              2. Kiểm Duyệt Nội Dung
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Kiểm tra kỹ lưỡng tính chính xác, chính tả và hình ảnh bài viết trước khi xuất bản lên Blog hoặc đăng bài Fanpage mạng xã hội.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#050716] border border-white/5 space-y-2">
            <div className="text-xs font-bold text-purple-300 font-mono uppercase">
              3. Văn Hóa Ứng Xử
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Luôn giữ thái độ hòa nhã, đúng mực và chuyên nghiệp khi thiết lập nội dung bot tự động cũng như khi tương tác với cộng đồng game thủ Veyra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
