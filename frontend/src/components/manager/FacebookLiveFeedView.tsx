"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { FacebookFeedPost } from "@/services/facebookSocial.service";
import { BlogPost } from "@/services/blogs.service";
import { formatNumber } from "@/utils/format";
import { soundEngine } from "@/services/audio.service";

interface FacebookLiveFeedViewProps {
  posts: FacebookFeedPost[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenSocialHub?: (post: BlogPost) => void;
}

export default function FacebookLiveFeedView({
  posts,
  loading,
  error,
  onRefresh,
  onOpenSocialHub,
}: FacebookLiveFeedViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    soundEngine.playClick();
    setExpandedPostIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter((p) => p.message?.toLowerCase().includes(q) || p.story?.toLowerCase().includes(q));
  }, [posts, searchQuery]);

  const handleOpenHub = (post: FacebookFeedPost) => {
    if (!onOpenSocialHub) return;
    soundEngine.playClick();
    const parsedTime = new Date(post.created_time).getTime() || Date.now();
    const virtualBlogPost: BlogPost = {
      id: post.id,
      title: post.message ? post.message.split("\n")[0].slice(0, 80) : "Bài Đăng Fanpage",
      slug: `fb-${post.id}`,
      excerpt: post.message?.slice(0, 180) || "",
      content: post.message || "",
      category: "Mạng Xã Hội",
      status: "Published",
      coverUrl: post.full_picture || "/images/hero_bg.jpg",
      authorId: "facebook_sync",
      authorName: "Valkyria of Veyra (Official)",
      facebookPostId: post.id,
      facebookPostUrl: post.permalink_url,
      createdAt: parsedTime,
      updatedAt: parsedTime,
      publishedAt: parsedTime,
      facebookPublishedAt: parsedTime,
    };
    onOpenSocialHub(virtualBlogPost);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Filter & Action Bar */}
      <div className="p-4 rounded-2xl bg-[#080c24] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nội dung bài đăng trên Fanpage..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#050716] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1877F2] transition-colors"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              aria-label="Xóa từ khóa"
            >
              ×
            </button>
          )}
        </div>

        {/* Counter & Refresh */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Tổng cộng: <strong className="text-white">{filteredPosts.length}</strong> bài đăng
          </span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onRefresh();
            }}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] hover:text-white border border-[#1877F2]/40 text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? "Đang Tải..." : "Đồng Bộ Lại"}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={onRefresh}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold font-mono cursor-pointer shrink-0"
          >
            Thử Lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#090d26] border border-white/5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-36 bg-white/10 rounded" />
                  <div className="h-2.5 w-24 bg-white/5 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-4/5 bg-white/5 rounded" />
              </div>
              <div className="h-44 w-full bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPosts.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#090d26] border border-white/5 space-y-2">
          <h3 className="text-base font-bold text-white">Chưa Có Bài Viết Nào Trên Bảng Tin Fanpage</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? "Không tìm thấy bài viết nào khớp với từ khóa tìm kiếm của bạn."
              : "Fanpage hiện chưa có bài viết nào hoặc hệ thống đang chờ đồng bộ bài đăng từ Facebook."}
          </p>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPosts.map((post) => {
            const isLong = (post.message?.length || 0) > 220;
            const isExpanded = Boolean(expandedPostIds[post.id]);
            const displayMessage = isLong && !isExpanded
              ? post.message.slice(0, 220) + "..."
              : post.message;

            return (
              <div
                key={post.id}
                className="rounded-2xl bg-[#090d28]/90 border border-white/10 hover:border-[#1877F2]/50 transition-all p-5 shadow-lg flex flex-col justify-between group"
              >
                {/* Header: Page info & time */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(24,119,242,0.5)]">
                        f
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white group-hover:text-[#3fe9d6] transition-colors">
                            Valkyria of Veyra
                          </h4>
                          <span className="px-1.5 py-0.5 rounded bg-[#1877F2]/20 text-[#1877F2] text-[9px] font-mono font-bold">
                            Chính thức
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>{formatDate(post.created_time)}</span>
                          <span>•</span>
                          <span className="text-emerald-400">Công khai</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={post.permalink_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#1877F2]/20 text-slate-400 hover:text-white border border-white/10 text-[11px] font-mono transition-colors flex items-center gap-1"
                      title="Xem bài viết trên Facebook"
                    >
                      <span>Mở FB</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Message body */}
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line mb-3 font-normal">
                    {displayMessage || <span className="text-slate-500 italic">Bài viết dạng hình ảnh / video</span>}
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(post.id)}
                        className="ml-1 text-[#3fe9d6] hover:underline font-semibold cursor-pointer"
                      >
                        {isExpanded ? "Thu gọn" : "Xem thêm"}
                      </button>
                    )}
                  </div>

                  {/* Picture / Media attachment */}
                  {post.full_picture && (
                    <div className="relative w-full h-52 sm:h-60 rounded-xl overflow-hidden bg-black/40 border border-white/5 mb-4 group/img">
                      <Image
                        src={post.full_picture}
                        alt="Facebook Post Media"
                        fill
                        className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                        unoptimized
                      />
                    </div>
                  )}
                </div>

                {/* Footer: Metrics & Interactive buttons */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  {/* Reactions, Comments, Shares Counter */}
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-1 hover:text-rose-400 transition-colors" title="Lượt Thích & Cảm xúc">
                      <span className="text-slate-400">Thích</span>
                      <strong className="text-white">{formatNumber(post.likes)}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 hover:text-[#3fe9d6] transition-colors" title="Bình Luận">
                      <span className="text-slate-400">Bình luận</span>
                      <strong className="text-white">{formatNumber(post.comments)}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 hover:text-[#f5c767] transition-colors" title="Lượt Chia Sẻ">
                      <span className="text-slate-400">Chia sẻ</span>
                      <strong className="text-white">{formatNumber(post.shares)}</strong>
                    </span>
                  </div>

                  {/* Manage / Social Hub button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenHub(post)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/50 hover:to-blue-600/50 text-white border border-purple-500/40 text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
                    >
                      Quản Lý Bình Luận
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
