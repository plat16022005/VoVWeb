"use client";

import { useState, useEffect } from "react";
import ManagerBlogTab from "./ManagerBlogTab";
import ManagerFacebookTab from "./ManagerFacebookTab";
import ManagerContentOverviewTab from "./ManagerContentOverviewTab";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";

export type ContentSubTab = "overview" | "blog" | "facebook";

interface ManagerContentHubViewProps {
  initialSubTab?: ContentSubTab;
}

export default function ManagerContentHubView({
  initialSubTab = "overview",
}: ManagerContentHubViewProps) {
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

  const [subTab, setSubTab] = useState<ContentSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab === "facebook" && hasFacebookAccess) {
      setSubTab("facebook");
    } else if (initialSubTab === "blog" && hasBlogAccess) {
      setSubTab("blog");
    } else if (initialSubTab === "overview") {
      setSubTab("overview");
    }
  }, [initialSubTab, hasBlogAccess, hasFacebookAccess]);

  if (!hasBlogAccess && !hasFacebookAccess) {
    return (
      <div className="py-20 p-8 rounded-3xl bg-[#090d24]/90 border border-amber-500/30 text-center space-y-3">
        <div className="text-4xl">⚠️</div>
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
          Chưa Được Cấp Quyền Thao Tác Chi Tiết
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Tài khoản Manager của bạn thuộc nhóm Quản Lý Nội Dung nhưng tất cả quyền thao tác nhỏ (Blog, Fanpage) đều đang bị hạn chế. Vui lòng liên hệ Admin để mở quyền.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-[family-name:var(--font-inter)] animate-fade-in">
      {/* 1. TOP SUB-TABS NAVIGATION (Cụm Chức Năng Nội Dung) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0c1438] via-[#080d24] to-[#0c1438] border border-white/10 shadow-[0_0_35px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Section Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f5c767] via-[#9b51e0] to-[#1877F2] p-[1.5px] shadow-[0_0_15px_rgba(245,199,103,0.3)] shrink-0">
            <div className="w-full h-full bg-[#060814] rounded-[9px] flex items-center justify-center text-lg">
              📰
            </div>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
              Quản Lý Nội Dung & Mạng Xã Hội
            </h2>
            <p className="text-[11px] text-slate-400">
              Điều phối bài viết Blog, tin tức game và các kênh truyền thông chính thức
            </p>
          </div>
        </div>

        {/* Right: Switcher Tabs (3 Sub-Tabs) */}
        <div className="flex items-center p-1 rounded-xl bg-[#050716] border border-white/10 text-xs self-start sm:self-auto shrink-0 flex-wrap gap-1">
          {/* Sub-tab 1: Tổng Quan Nội Dung */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSubTab("overview");
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === "overview"
                ? "bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#060814] shadow-[0_0_15px_rgba(63,233,214,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>📊</span>
            <span>Tổng Quan</span>
          </button>

          {/* Sub-tab 2: Blog & Tin Tức */}
          {hasBlogAccess && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSubTab("blog");
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === "blog"
                  ? "bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814] shadow-[0_0_15px_rgba(245,199,103,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📝</span>
              <span>Blog & Tin Tức</span>
            </button>
          )}

          {/* Sub-tab 3: Mạng Xã Hội Facebook */}
          {hasFacebookAccess && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSubTab("facebook");
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === "facebook"
                  ? "bg-gradient-to-r from-[#1877F2] to-[#0ea5e9] text-white shadow-[0_0_15px_rgba(245,199,103,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-4 h-4 rounded bg-[#1877F2] text-white flex items-center justify-center font-bold text-[10px]">
                f
              </span>
              <span>Fanpage Facebook</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUB-TAB VIEW RENDER */}
      <div className="min-w-0">
        {subTab === "overview" && (
          <div className="animate-fade-in">
            <ManagerContentOverviewTab onNavigateSubTab={(tab) => setSubTab(tab)} />
          </div>
        )}

        {subTab === "blog" && (
          <div className="animate-fade-in">
            <ManagerBlogTab />
          </div>
        )}

        {subTab === "facebook" && (
          <div className="animate-fade-in">
            <ManagerFacebookTab />
          </div>
        )}
      </div>
    </div>
  );
}
