"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/services/auth.service";
import { soundEngine } from "@/services/audio.service";
import {
  hasPermission,
  hasPermissionGroup,
  PERMISSION_GROUPS,
} from "@/data/permissions";

type WorkspaceCategoryFilter =
  | "ALL"
  | "content_management"
  | "game_data"
  | "event_management"
  | "player_support";

export default function ManagerOverviewTab() {
  const currentUser = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  const [workspaceFilter, setWorkspaceFilter] =
    useState<WorkspaceCategoryFilter>("ALL");
  const [permFilter, setPermFilter] = useState<"ALL" | "GRANTED" | "LOCKED">(
    "ALL"
  );
  const [showPermissionMatrix, setShowPermissionMatrix] =
    useState<boolean>(false);

  // Kiểm tra nhóm quyền lớn
  const hasContentGroup = hasPermissionGroup(currentUser, "content_management");
  const hasGameDataGroup = hasPermissionGroup(currentUser, "game_data");
  const hasEventGroup = hasPermissionGroup(currentUser, "event_management");
  const hasSupportGroup = hasPermissionGroup(currentUser, "player_support");

  // Kiểm tra quyền truy cập từng phân hệ con (Sub-modules)
  const canAccessBlog =
    isAdmin ||
    hasPermission(currentUser, "content.blog.view") ||
    hasPermission(currentUser, "content.blog.edit") ||
    hasPermission(currentUser, "content.blog.publish") ||
    hasPermission(currentUser, "content.blog.delete");

  const canAccessFacebook =
    isAdmin ||
    hasPermission(currentUser, "content.facebook.view") ||
    hasPermission(currentUser, "content.facebook.publish") ||
    hasPermission(currentUser, "content.facebook.bot");

  const canAccessCharacters =
    isAdmin ||
    hasPermission(currentUser, "gamedata.character.view") ||
    hasPermission(currentUser, "gamedata.character.edit") ||
    hasPermission(currentUser, "gamedata.character.skills") ||
    hasPermission(currentUser, "gamedata.character.delete");

  const canAccessGacha =
    isAdmin ||
    hasPermission(currentUser, "gamedata.gacha.view") ||
    hasPermission(currentUser, "gamedata.gacha.edit") ||
    hasPermission(currentUser, "gamedata.gacha.activate") ||
    hasPermission(currentUser, "gamedata.gacha.delete");

  const canAccessItems =
    isAdmin ||
    hasPermission(currentUser, "gamedata.item.view") ||
    hasPermission(currentUser, "gamedata.item.edit") ||
    hasPermission(currentUser, "gamedata.item.delete");

  const canAccessMinigames =
    isAdmin ||
    hasPermission(currentUser, "event.minigame.view") ||
    hasPermission(currentUser, "event.minigame.edit") ||
    hasPermission(currentUser, "event.minigame.publish") ||
    hasPermission(currentUser, "event.minigame.delete");

  const canAccessGiftcodes =
    isAdmin ||
    hasPermission(currentUser, "event.giftcode.view") ||
    hasPermission(currentUser, "event.giftcode.edit") ||
    hasPermission(currentUser, "event.giftcode.toggle") ||
    hasPermission(currentUser, "event.giftcode.delete");

  const canAccessMail =
    isAdmin ||
    hasPermission(currentUser, "support.mail.view") ||
    hasPermission(currentUser, "support.mail.send_notice") ||
    hasPermission(currentUser, "support.mail.send_personal") ||
    hasPermission(currentUser, "support.mail.send_global_reward") ||
    hasPermission(currentUser, "support.mail.delete");

  const canAccessPlayerData =
    isAdmin ||
    hasPermission(currentUser, "support.player.view") ||
    hasPermission(currentUser, "support.player.revoke_item");

  // Danh sách các phân hệ con chuyên sâu trong Cổng Điều Hành Manager
  const operationalWorkspaces = useMemo(() => {
    return [
      {
        id: "ws-blog",
        groupId: "content_management" as const,
        groupTitle: "Quản Lý Nội Dung",
        title: "Blog & Tin Tức Trang Chủ",
        href: "/manager/contents/blog",
        accent: "gold" as const,
        hasAccess: hasContentGroup && canAccessBlog,
        description:
          "Soạn thảo bài viết mới, biên tập ảnh bìa, kiểm duyệt xuất bản hoặc gỡ bài viết về trạng thái bản nháp trên trang chủ.",
        capabilities: [
          { id: "content.blog.view", label: "Xem bài viết" },
          { id: "content.blog.edit", label: "Soạn & Sửa" },
          { id: "content.blog.publish", label: "Xuất bản / Gỡ" },
          { id: "content.blog.delete", label: "Xóa bài" },
        ],
      },
      {
        id: "ws-facebook",
        groupId: "content_management" as const,
        groupTitle: "Quản Lý Nội Dung",
        title: "Fanpage Facebook & Bot Auto-Reply",
        href: "/manager/contents/facebook",
        accent: "gold" as const,
        hasAccess: hasContentGroup && canAccessFacebook,
        description:
          "Đồng bộ bài viết lên kênh truyền thông chính thức, theo dõi tương tác bài đăng và cấu hình mẫu tin nhắn Bot trả lời bình luận tự động.",
        capabilities: [
          { id: "content.facebook.view", label: "Xem tương tác" },
          { id: "content.facebook.publish", label: "Đăng Fanpage" },
          { id: "content.facebook.bot", label: "Cấu hình Bot" },
        ],
      },
      {
        id: "ws-characters",
        groupId: "game_data" as const,
        groupTitle: "Dữ Liệu Game & Nhân Vật",
        title: "Hồ Sơ Chiến Binh Valkyria",
        href: "/manager/gamedata",
        accent: "cyan" as const,
        hasAccess: hasGameDataGroup && canAccessCharacters,
        description:
          "Quản lý thông số chiến đấu chuẩn Unity Engine (HP, ATK, DEF, SPD, Crit), vai trò, bộ kỹ năng và tiểu sử các nữ chiến binh Valkyria.",
        capabilities: [
          { id: "gamedata.character.view", label: "Xem hồ sơ" },
          { id: "gamedata.character.edit", label: "Thêm & Sửa" },
          { id: "gamedata.character.skills", label: "Cân bằng chỉ số" },
          { id: "gamedata.character.delete", label: "Xóa nhân vật" },
        ],
      },
      {
        id: "ws-gacha",
        groupId: "game_data" as const,
        groupTitle: "Dữ Liệu Game & Nhân Vật",
        title: "Banner Gacha Theo Mùa",
        href: "/manager/gacha",
        accent: "cyan" as const,
        hasAccess: hasGameDataGroup && canAccessGacha,
        description:
          "Thiết lập mùa phát hành, nhân bản mùa, cấu hình tỷ lệ triệu hồi, cơ chế bảo hiểm Pity, danh sách tướng Rate-Up và vé chiêu mộ.",
        capabilities: [
          { id: "gamedata.gacha.view", label: "Xem mùa & tỷ lệ" },
          { id: "gamedata.gacha.edit", label: "Tạo & Sửa Banner" },
          { id: "gamedata.gacha.activate", label: "Kích hoạt mùa" },
          { id: "gamedata.gacha.delete", label: "Xóa bản nháp" },
        ],
      },
      {
        id: "ws-items",
        groupId: "game_data" as const,
        groupTitle: "Dữ Liệu Game & Nhân Vật",
        title: "Kho Vật Phẩm & Trang Bị",
        href: "/manager/gamedata/items",
        accent: "cyan" as const,
        hasAccess: hasGameDataGroup && canAccessItems,
        description:
          "Định nghĩa danh mục vật phẩm tiêu hao, nguyên liệu, trang bị 6 vị trí (vũ khí, giáp, phụ kiện), mảnh ghép tướng và vé chiêu mộ.",
        capabilities: [
          { id: "gamedata.item.view", label: "Xem kho vật phẩm" },
          { id: "gamedata.item.edit", label: "Tạo & Đồng bộ mẫu" },
          { id: "gamedata.item.delete", label: "Xóa vật phẩm" },
        ],
      },
      {
        id: "ws-minigames",
        groupId: "event_management" as const,
        groupTitle: "Quản Lý Sự Kiện",
        title: "Minigame & Sự Kiện Web (Unity WebGL)",
        href: "/manager/events",
        accent: "purple" as const,
        hasAccess: hasEventGroup && canAccessMinigames,
        description:
          "Tải lên và hợp nhất tự động giao diện .html cùng bản build Unity WebGL (.zip), thiết lập nhiệm vụ nhận lượt, mã mời và bảng thưởng.",
        capabilities: [
          { id: "event.minigame.view", label: "Xem cấu hình" },
          { id: "event.minigame.edit", label: "Tải bản build .zip" },
          { id: "event.minigame.publish", label: "Bật/Tắt công khai" },
          { id: "event.minigame.delete", label: "Xóa sự kiện nháp" },
        ],
      },
      {
        id: "ws-giftcodes",
        groupId: "event_management" as const,
        groupTitle: "Quản Lý Sự Kiện",
        title: "Mã Quà Tặng (Giftcode)",
        href: "/manager/events/giftcodes",
        accent: "purple" as const,
        hasAccess: hasEventGroup && canAccessGiftcodes,
        description:
          "Phát hành mã quà tặng dùng chung hoặc sinh lô mã dùng 1 lần, cấu hình Vàng/Ngọc/Thể Lực/Vật phẩm, giới hạn máy chủ và thời hạn.",
        capabilities: [
          { id: "event.giftcode.view", label: "Xem danh sách mã" },
          { id: "event.giftcode.edit", label: "Tạo mã / Sinh lô" },
          { id: "event.giftcode.toggle", label: "Khóa khẩn cấp" },
          { id: "event.giftcode.delete", label: "Xóa mã" },
        ],
      },
      {
        id: "ws-mailbox",
        groupId: "player_support" as const,
        groupTitle: "Hỗ Trợ Người Chơi",
        title: "Hòm Thư Hệ Thống & Đền Bù (Mailbox)",
        href: "/manager/support",
        accent: "emerald" as const,
        hasAccess: hasSupportGroup && canAccessMail,
        description:
          "Phát thư thông báo bảo trì, gửi thư cá nhân đền bù xử lý lỗi hoặc phát quà toàn máy chủ với bộ mẫu soạn nhanh chuẩn mực.",
        capabilities: [
          { id: "support.mail.view", label: "Xem lịch sử thư" },
          { id: "support.mail.send_notice", label: "Thư thông báo" },
          { id: "support.mail.send_personal", label: "Đền bù cá nhân" },
          { id: "support.mail.send_global_reward", label: "Quà toàn server" },
          { id: "support.mail.delete", label: "Thu hồi & Xóa" },
        ],
      },
      {
        id: "ws-playerdata",
        groupId: "player_support" as const,
        groupTitle: "Hỗ Trợ Người Chơi",
        title: "Dữ Liệu & Túi Đồ Người Chơi Theo Máy Chủ",
        href: "/manager/support/players",
        accent: "emerald" as const,
        hasAccess: hasSupportGroup && canAccessPlayerData,
        description:
          "Tra cứu hồ sơ Chỉ Huy theo từng cụm máy chủ: cấp độ, lực chiến, số dư ví, kho tướng, đội hình, tiến trình vượt ải và thu hồi vật phẩm lỗi.",
        capabilities: [
          { id: "support.player.view", label: "Tra cứu hồ sơ & Túi đồ" },
          { id: "support.player.revoke_item", label: "Thu hồi vật phẩm/trang bị" },
        ],
      },
    ];
  }, [
    hasContentGroup,
    hasGameDataGroup,
    hasEventGroup,
    hasSupportGroup,
    canAccessBlog,
    canAccessFacebook,
    canAccessCharacters,
    canAccessGacha,
    canAccessItems,
    canAccessMinigames,
    canAccessGiftcodes,
    canAccessMail,
    canAccessPlayerData,
  ]);

  const filteredWorkspaces = useMemo(() => {
    if (workspaceFilter === "ALL") return operationalWorkspaces;
    return operationalWorkspaces.filter((ws) => ws.groupId === workspaceFilter);
  }, [operationalWorkspaces, workspaceFilter]);

  const accessibleWorkspacesCount = useMemo(
    () => operationalWorkspaces.filter((ws) => ws.hasAccess).length,
    [operationalWorkspaces]
  );

  return (
    <div className="space-y-7 pb-14 font-[family-name:var(--font-inter)] animate-fade-in">
      {/* 1. EXECUTIVE COMMAND HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d153a] via-[#080d24] to-[#0b102d] border border-[#f5c767]/35 p-5 sm:p-7 lg:p-8 shadow-[0_0_50px_rgba(245,199,103,0.12)]">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#f5c767]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#3fe9d6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: Commander Identity & Session Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#f5c767] via-[#9b51e0] to-[#3fe9d6] p-[2px] shadow-[0_0_25px_rgba(245,199,103,0.35)] shrink-0">
              <div className="w-full h-full bg-[#060814] rounded-[14px] flex items-center justify-center font-[family-name:var(--font-rajdhani)] font-black text-2xl sm:text-3xl text-[#f5c767]">
                {currentUser?.username
                  ? currentUser.username.charAt(0).toUpperCase()
                  : "M"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/40 text-[10px] font-bold font-mono uppercase tracking-wider">
                  TRUNG TÂM ĐIỀU HÀNH VẬN HÀNH
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  TRỰC TUYẾN
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold font-mono">
                  {isAdmin ? "QUẢN TRỊ VIÊN (MASTER)" : "QUẢN LÝ (MANAGER)"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-wide uppercase font-[family-name:var(--font-rajdhani)]">
                Xin chào, {currentUser?.username || "Chỉ Huy Vận Hành"}!
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Chào mừng bạn đến với cổng điều phối tác nghiệp của{" "}
                <strong className="text-[#f5c767]">Valkyria of Veyra</strong>.
                Truy cập nhanh các bàn làm việc Nội Dung, Dữ Liệu Game, Sự Kiện
                WebGL và Hỗ Trợ Người Chơi theo đúng thẩm quyền được phân công.
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-slate-400 pt-0.5">
                <span>
                  Tài khoản:{" "}
                  <strong className="text-slate-200">
                    {currentUser?.email || "Chưa thiết lập"}
                  </strong>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  Phiên làm việc:{" "}
                  <strong className="text-[#3fe9d6]">
                    Xác thực bảo mật RBAC
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowPermissionMatrix((prev) => !prev);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#3fe9d6]/50 text-xs font-mono font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              {showPermissionMatrix
                ? "Ẩn Danh Mục Quyền ↑"
                : "Xem Quyền Hạn Tài Khoản ↓"}
            </button>

            <Link
              href="/"
              onClick={() => soundEngine.playClick()}
              className="px-4 py-2.5 rounded-xl bg-[#f5c767]/15 hover:bg-[#f5c767]/25 border border-[#f5c767]/40 text-xs font-mono font-bold text-[#f5c767] transition-all flex items-center gap-1.5"
            >
              <span>Xem Trang Chủ</span>
              <span>↗</span>
            </Link>
          </div>
        </div>

        {/* Quick Launch Strip (Lối tắt nhanh theo quyền được cấp) */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1">
            Lối tắt tác nghiệp:
          </span>
          {operationalWorkspaces
            .filter((ws) => ws.hasAccess)
            .map((ws) => (
              <Link
                key={ws.id}
                href={ws.href}
                onClick={() => soundEngine.playClick()}
                className="px-3 py-1.5 rounded-xl bg-[#060814]/80 hover:bg-[#141b42] border border-white/10 hover:border-[#f5c767]/50 text-xs font-mono text-slate-200 hover:text-[#f5c767] transition-all flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
                <span>{ws.title}</span>
                <span className="text-[10px] text-slate-500">→</span>
              </Link>
            ))}
          {accessibleWorkspacesCount === 0 && (
            <span className="text-xs font-mono text-amber-300">
              Tài khoản chưa được gán nhóm quyền vận hành. Vui lòng liên hệ Quản
              Trị Viên.
            </span>
          )}
        </div>
      </div>

      {/* 2. INTERACTIVE RBAC PERMISSION MATRIX (HIỂN THỊ KHI BẤM XEM QUYỀN HẠN) */}
      {showPermissionMatrix && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#090d24]/95 border border-[#3fe9d6]/35 space-y-5 shadow-2xl animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3fe9d6]" />
                <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
                  Danh Mục Quyền Tác Nghiệp Của Tài Khoản
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tra cứu các quyền thao tác chuyên biệt đã được Quản Trị Viên cấp
                cho tài khoản của bạn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              {(
                [
                  { key: "ALL", label: "Tất Cả" },
                  { key: "GRANTED", label: "Đã Cấp" },
                  { key: "LOCKED", label: "Chưa Cấp" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setPermFilter(tab.key);
                  }}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    permFilter === tab.key
                      ? "bg-[#3fe9d6]/20 border-[#3fe9d6] text-[#3fe9d6] font-bold"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PERMISSION_GROUPS.map((group) => {
              const groupEnabled = hasPermissionGroup(currentUser, group.id);
              const filteredSubs = group.subPermissions.filter((sp) => {
                const isGranted = isAdmin || hasPermission(currentUser, sp.id);
                if (permFilter === "GRANTED") return isGranted;
                if (permFilter === "LOCKED") return !isGranted;
                return true;
              });

              return (
                <div
                  key={group.id}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                    groupEnabled
                      ? "bg-[#060814]/90 border-white/15"
                      : "bg-[#060814]/50 border-white/5 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
                          {group.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                          {group.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {group.description}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 border ${
                        groupEnabled
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {groupEnabled ? "ĐÃ MỞ NHÓM" : "CHƯA MỞ NHÓM"}
                    </span>
                  </div>

                  {filteredSubs.length === 0 ? (
                    <div className="py-4 text-center text-xs font-mono text-slate-500">
                      Không có quyền nào khớp bộ lọc trong nhóm này.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                      {filteredSubs.map((sp) => {
                        const granted =
                          isAdmin || hasPermission(currentUser, sp.id);
                        return (
                          <div
                            key={sp.id}
                            className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 ${
                              granted
                                ? "bg-emerald-500/[0.06] border-emerald-500/25"
                                : "bg-white/[0.02] border-white/5 opacity-60"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    granted ? "bg-emerald-400" : "bg-slate-500"
                                  }`}
                                />
                                <span className="truncate">{sp.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {sp.description}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                granted
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-white/5 text-slate-500"
                              }`}
                            >
                              {granted ? "ĐÃ CẤP" : "KHÓA"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 9 SUB-MODULES WORKSPACE DIRECTORY (BÀN LÀM VIỆC CÁC PHÂN HỆ NGHIỆP VỤ) */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="hsr-diamond" />
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
                Bàn Làm Việc Các Phân Hệ Nghiệp Vụ
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Chọn trực tiếp từng phân hệ để bắt đầu tác nghiệp. Các thao tác
              bên trong tự động đồng bộ theo quyền hạn được cấp.
            </p>
          </div>

          {/* Filter Tabs by Permission Group */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {(
              [
                { key: "ALL", label: "Tất Cả" },
                { key: "content_management", label: "Nội Dung & MXH" },
                { key: "game_data", label: "Dữ Liệu Game" },
                { key: "event_management", label: "Sự Kiện & Giftcode" },
                { key: "player_support", label: "Hỗ Trợ Người Chơi" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setWorkspaceFilter(tab.key);
                }}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  workspaceFilter === tab.key
                    ? "bg-[#f5c767] text-[#060814] border-[#f5c767] font-bold shadow-[0_0_15px_rgba(245,199,103,0.35)]"
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/25"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWorkspaces.map((ws) => {
            const accentBorder =
              ws.accent === "gold"
                ? "hover:border-[#f5c767]/60"
                : ws.accent === "cyan"
                  ? "hover:border-[#3fe9d6]/60"
                  : ws.accent === "purple"
                    ? "hover:border-purple-400/60"
                    : "hover:border-emerald-400/60";

            const accentBadge =
              ws.accent === "gold"
                ? "text-[#f5c767] bg-[#f5c767]/10 border-[#f5c767]/30"
                : ws.accent === "cyan"
                  ? "text-[#3fe9d6] bg-[#3fe9d6]/10 border-[#3fe9d6]/30"
                  : ws.accent === "purple"
                    ? "text-purple-300 bg-purple-500/10 border-purple-500/30"
                    : "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";

            const accentBtn =
              ws.accent === "gold"
                ? "hover:bg-[#f5c767] hover:text-[#060814] hover:border-[#f5c767]"
                : ws.accent === "cyan"
                  ? "hover:bg-[#3fe9d6] hover:text-[#060814] hover:border-[#3fe9d6]"
                  : ws.accent === "purple"
                    ? "hover:bg-purple-400 hover:text-[#060814] hover:border-purple-400"
                    : "hover:bg-emerald-400 hover:text-[#060814] hover:border-emerald-400";

            return (
              <div
                key={ws.id}
                className={`p-5 sm:p-6 rounded-2xl bg-[#090d24]/90 border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                  ws.hasAccess
                    ? `border-white/10 ${accentBorder} group`
                    : "border-white/5 opacity-65"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Row: Group Tag & Access Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border ${accentBadge}`}
                    >
                      {ws.groupTitle}
                    </span>
                    {ws.hasAccess ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ĐÃ CẤP QUYỀN
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        CHƯA CẤP QUYỀN
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-[family-name:var(--font-rajdhani)] text-lg font-bold text-white group-hover:text-[#f5c767] transition-colors">
                      {ws.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {ws.description}
                    </p>
                  </div>

                  {/* Sub-permission Chips */}
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      Phạm vi thao tác:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ws.capabilities.map((cap) => {
                        const granted =
                          isAdmin || hasPermission(currentUser, cap.id);
                        return (
                          <span
                            key={cap.id}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                              granted
                                ? "bg-white/[0.06] border-white/15 text-slate-200"
                                : "bg-transparent border-white/5 text-slate-500 line-through"
                            }`}
                          >
                            {cap.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {ws.hasAccess ? (
                  <Link
                    href={ws.href}
                    onClick={() => soundEngine.playClick()}
                    className={`w-full py-2.5 px-4 rounded-xl bg-white/5 text-white text-xs font-mono font-bold border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${accentBtn}`}
                  >
                    <span>Mở {ws.title}</span>
                    <span>→</span>
                  </Link>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white/5 text-center text-xs font-mono text-slate-500 border border-white/5">
                    Liên hệ Quản Trị Viên để mở quyền
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. OPERATIONAL WORKFLOW & SECURITY GUIDELINES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Quy trình phối hợp vận hành */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
              Quy Trình Phối Hợp Vận Hành Tiêu Chuẩn
            </h3>
            <span className="text-[11px] font-mono text-[#3fe9d6]">
              Unity Engine · Turn-Based RPG
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-[#050716] border border-white/5 space-y-1.5">
              <div className="text-xs font-bold text-[#f5c767] font-mono uppercase">
                Bước 01 · Chuẩn Bị Dữ Liệu Game
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kiểm tra hồ sơ Valkyria, danh mục Vật Phẩm &amp; Trang Bị trước
                khi cấu hình vào mùa Banner Gacha hoặc bảng thưởng Sự Kiện.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050716] border border-white/5 space-y-1.5">
              <div className="text-xs font-bold text-[#3fe9d6] font-mono uppercase">
                Bước 02 · Phát Hành Sự Kiện &amp; Giftcode
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tải bản build Minigame WebGL (.zip + .html) hoặc khởi tạo chiến
                dịch Giftcode theo đúng phạm vi cụm máy chủ và thời hạn.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050716] border border-white/5 space-y-1.5">
              <div className="text-xs font-bold text-purple-300 font-mono uppercase">
                Bước 03 · Truyền Thông Đa Kênh
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Xuất bản tin tức lên Blog trang chủ, đồng bộ bài đăng sang
                Fanpage chính thức và bật Bot tự động phản hồi bình luận.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050716] border border-white/5 space-y-1.5">
              <div className="text-xs font-bold text-emerald-400 font-mono uppercase">
                Bước 04 · Hỗ Trợ &amp; Chăm Sóc Chỉ Huy
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tra cứu hồ sơ, tiến trình vượt ải, kiểm tra túi đồ theo từng máy
                chủ và gửi thư hệ thống đền bù hoặc phát thưởng nhanh chóng.
              </p>
            </div>
          </div>
        </div>

        {/* Sổ tay nguyên tắc bảo mật & chuẩn mực vận hành */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
                Nguyên Tắc An Toàn Tác Nghiệp
              </h3>
              <span className="text-[11px] font-mono text-[#f5c767]">
                Chuẩn Bảo Mật RBAC
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#050716] border border-white/5 space-y-1">
                <div className="text-xs font-bold text-[#f5c767] font-mono">
                  1. Bảo Mật Phiên &amp; Tài Khoản Quản Lý
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Không chia sẻ tài khoản quản lý; luôn kiểm tra kỹ phạm vi máy
                  chủ trước khi kích hoạt mùa Gacha hoặc gửi thư kèm quà toàn
                  server.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050716] border border-white/5 space-y-1">
                <div className="text-xs font-bold text-[#3fe9d6] font-mono">
                  2. Kiểm Duyệt Nội Dung &amp; Vật Phẩm
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Đảm bảo các mùa Gacha hoặc sự kiện đang soạn thảo được giữ ở
                  trạng thái bản nháp cho tới khi hoàn tất kiểm thử nội bộ.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050716] border border-white/5 space-y-1">
                <div className="text-xs font-bold text-emerald-400 font-mono">
                  3. Minh Bạch Khi Hỗ Trợ Người Chơi
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mọi thao tác gửi thư bồi hoàn hoặc thu hồi vật phẩm/trang bị
                  trong túi đồ người chơi cần ghi rõ lý do nghiệp vụ chính xác.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
