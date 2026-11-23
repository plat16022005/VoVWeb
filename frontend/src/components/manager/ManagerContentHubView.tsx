"use client";

import { useRouter } from "next/navigation";
import ManagerBlogTab from "./ManagerBlogTab";
import ManagerFacebookTab from "./ManagerFacebookTab";
import ManagerContentOverviewTab from "./ManagerContentOverviewTab";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";

export type ContentSubTab = "overview" | "blog" | "facebook";

interface ManagerContentHubViewProps {
  initialSubTab?: ContentSubTab;
}

export default function ManagerContentHubView({
  initialSubTab = "overview",
}: ManagerContentHubViewProps) {
  const router = useRouter();
  const currentUser = useAuth();

  // Kiểm tra quyền nhánh Blog & Tin Tức
  const hasBlogAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "content.blog.view") ||
    hasPermission(currentUser, "content.blog.edit") ||
    hasPermission(currentUser, "content.blog.publish") ||
    hasPermission(currentUser, "content.blog.delete");

  // Kiểm tra quyền nhánh Facebook Fanpage
  const hasFacebookAccess =
    currentUser?.role === "Admin" ||
    hasPermission(currentUser, "content.facebook.view") ||
    hasPermission(currentUser, "content.facebook.publish") ||
    hasPermission(currentUser, "content.facebook.bot");

  if (!hasBlogAccess && !hasFacebookAccess) {
    return (
      <div className="py-20 p-8 rounded-3xl bg-[#090d24]/90 border border-amber-500/30 text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
          Hạn Chế Truy Cập
        </span>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Thao Tác Chi Tiết
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Tài khoản Manager của bạn thuộc nhóm Quản Lý Nội Dung nhưng tất cả quyền thao tác nhỏ (Blog, Fanpage) đều đang bị hạn chế. Vui lòng liên hệ Quản Trị Viên để mở quyền.
        </p>
      </div>
    );
  }

  if (initialSubTab === "blog" && !hasBlogAccess) {
    return (
      <div className="py-20 p-8 rounded-3xl bg-[#090d24]/90 border border-amber-500/30 text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
          Hạn Chế Truy Cập
        </span>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Quản Lý Blog &amp; Tin Tức
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Vui lòng liên hệ Quản Trị Viên để mở quyền thao tác cho chức năng Blog &amp; Tin Tức.
        </p>
      </div>
    );
  }

  if (initialSubTab === "facebook" && !hasFacebookAccess) {
    return (
      <div className="py-20 p-8 rounded-3xl bg-[#090d24]/90 border border-amber-500/30 text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
          Hạn Chế Truy Cập
        </span>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Quản Lý Fanpage Facebook
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Vui lòng liên hệ Quản Trị Viên để mở quyền thao tác cho chức năng Fanpage Facebook.
        </p>
      </div>
    );
  }

  return (
    <div className="font-[family-name:var(--font-inter)] animate-fade-in min-w-0">
      {initialSubTab === "overview" && (
        <ManagerContentOverviewTab
          onNavigateSubTab={(tab) => {
            router.push(
              tab === "facebook"
                ? "/manager/contents/facebook"
                : "/manager/contents/blog"
            );
          }}
        />
      )}

      {initialSubTab === "blog" && <ManagerBlogTab />}

      {initialSubTab === "facebook" && <ManagerFacebookTab />}
    </div>
  );
}
