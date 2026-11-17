"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BlogPost, blogsService } from "@/services/blogs.service";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";

interface ManagerContentOverviewTabProps {
  onNavigateSubTab: (subTab: "blog" | "facebook") => void;
}

export default function ManagerContentOverviewTab({
  onNavigateSubTab,
}: ManagerContentOverviewTabProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    blogsService
      .getAllPosts()
      .then((data) => {
        if (active) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Lỗi tải bài viết trong Content Overview:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === "Published").length;
  const draftPosts = totalPosts - publishedPosts;
  const facebookPosts = posts.filter((p) => Boolean(p.facebookPostId)).length;
  const autoReplyPosts = posts.filter((p) => Boolean(p.facebookAutoReplyEnabled)).length;

  // Phân bổ chuyên mục
  const categoryStats = posts.reduce((acc, p) => {
    const cat = p.category || "Tin Tức";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 pb-8 font-[family-name:var(--font-inter)] animate-fade-in">
      {/* 1. CONTENT BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1438] via-[#080d24] to-[#0c1438] border border-[#f5c767]/30 p-6 shadow-[0_0_50px_rgba(245,199,103,0.15)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f5c767] via-[#9b51e0] to-[#3fe9d6] p-[2px] shadow-[0_0_20px_rgba(245,199,103,0.4)] shrink-0">
              <div className="w-full h-full bg-[#060814] rounded-[14px] flex items-center justify-center font-[family-name:var(--font-rajdhani)] font-black text-2xl text-[#f5c767]">
                CNT
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wide font-[family-name:var(--font-rajdhani)]">
                  Bảng Điều Khiển Nội Dung & Truyền Thông
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thống kê toàn diện bài viết Blog, tin tức trang chủ và chỉ số tương tác mạng xã hội Fanpage Facebook.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                soundEngine.playClick();
                onNavigateSubTab("blog");
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814] font-bold text-xs shadow-[0_0_15px_rgba(245,199,103,0.4)] hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>📝</span>
              <span>Viết Blog Mới</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onNavigateSubTab("facebook");
              }}
              className="px-4 py-2.5 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-white border border-[#1877F2]/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>📘</span>
              <span>Đăng Bài Facebook</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL METRICS STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Bài Viết Blog */}
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-[#f5c767]/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
              Bài Viết Blog
            </span>
            <span className="text-lg">📝</span>
          </div>
          <div className="text-3xl font-black text-white font-[family-name:var(--font-rajdhani)] tracking-wide my-1">
            {loading ? "..." : formatNumber(totalPosts)}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <span className="text-emerald-400">✓ {publishedPosts} đã xuất bản</span>
            <span>•</span>
            <span className="text-amber-400">{draftPosts} bản nháp</span>
          </div>
        </div>

        {/* Card 2: Bài Facebook Fanpage */}
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-[#1877F2]/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
              Fanpage Facebook
            </span>
            <span className="w-5 h-5 rounded bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs">
              f
            </span>
          </div>
          <div className="text-3xl font-black text-white font-[family-name:var(--font-rajdhani)] tracking-wide my-1">
            {loading ? "..." : formatNumber(facebookPosts)}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <span className="text-[#1877F2]">Đã đồng bộ lên Fanpage</span>
          </div>
        </div>

        {/* Card 3: Auto-Reply Bot */}
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
              Auto-Reply Bot
            </span>
            <span className="text-lg">🤖</span>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-[family-name:var(--font-rajdhani)] tracking-wide my-1">
            {loading ? "..." : `${autoReplyPosts} Bài`}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300">Tự động trả lời bình luận</span>
          </div>
        </div>

        {/* Card 4: Kênh Fanpage Kết Nối */}
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-[#3fe9d6]/40 transition-all duration-300 relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
              Kênh Mạng Xã Hội
            </span>
            <span className="text-lg">📡</span>
          </div>
          <div className="text-2xl font-black text-[#3fe9d6] font-[family-name:var(--font-rajdhani)] tracking-wide my-1">
            Fanpage Facebook
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <span>Trang Cộng Đồng Chính Thức</span>
          </div>
        </div>
      </div>

      {/* 3. TWO COLUMNS: BÀI VIẾT GẦN ĐÂY & PHÂN BỔ CHUYÊN MỤC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Danh Sách Bài Viết Mới Nhất */}
        <div className="lg:col-span-2 rounded-2xl bg-[#090d24]/90 border border-white/10 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📰</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
                Bài Viết Mới Cập Nhật Gần Đây
              </h3>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onNavigateSubTab("blog");
              }}
              className="text-xs font-mono text-[#f5c767] hover:underline"
            >
              Xem tất cả ({totalPosts}) →
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs font-mono">
              <div className="w-8 h-8 border-2 border-[#f5c767] border-t-transparent rounded-full animate-spin" />
              <span>Đang tải danh sách bài viết...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">
              Chưa có bài viết nào trong hệ thống.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#050716] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.coverUrl ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden relative shrink-0 border border-white/10">
                        <Image
                          src={p.coverUrl}
                          alt={p.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-lg shrink-0">
                        📝
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-xs truncate hover:text-[#f5c767] transition-colors">
                        {p.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                        <span className="px-1.5 py-0.2 rounded bg-white/5 text-[#f5c767]">
                          {p.category || "Tin Tức"}
                        </span>
                        <span>•</span>
                        <span>{p.status === "Published" ? "🟢 Đã xuất bản" : "🟡 Bản nháp"}</span>
                        {p.facebookPostId && (
                          <>
                            <span>•</span>
                            <span className="text-[#1877F2]">✓ Đã lên Facebook</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onNavigateSubTab("blog");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white shrink-0"
                  >
                    Biên tập
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Phân Bổ Chuyên Mục & Kênh */}
        <div className="space-y-6">
          {/* Chuyên mục */}
          <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="text-lg">📊</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
                Phân Bổ Theo Chuyên Mục
              </h3>
            </div>

            <div className="space-y-2.5">
              {Object.entries(categoryStats).map(([cat, count]) => {
                const percent = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">{cat}</span>
                      <span className="text-[#f5c767] font-bold">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#f5c767] to-[#e6b143] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0c1438] to-[#070a1e] border border-[#1877F2]/30 p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Thao Tác Nhanh
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Xuất bản bài viết Blog chất lượng cao và đồng bộ ngay lên Facebook Fanpage để mở rộng tương tác cộng đồng game thủ.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onNavigateSubTab("blog");
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-left text-slate-200 hover:text-white flex items-center justify-between"
              >
                <span>Soạn thảo bài viết mới</span>
                <span>→</span>
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onNavigateSubTab("facebook");
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-xs font-mono text-left text-[#1877F2] hover:text-white flex items-center justify-between"
              >
                <span>Quản lý bình luận Fanpage</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

