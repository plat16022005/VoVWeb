"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { BlogPost, blogsService } from "@/services/blogs.service";
import {
  facebookSocialService,
  FacebookMetrics,
  FacebookFeedPost,
} from "@/services/facebookSocial.service";
import FacebookSocialHubModal from "./FacebookSocialHubModal";
import CreateFacebookPostModal from "./CreateFacebookPostModal";
import FacebookLiveFeedView from "./FacebookLiveFeedView";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";

export default function ManagerFacebookTab() {
  const currentUser = useAuth();
  const canPublishFB = currentUser?.role === "Admin" || hasPermission(currentUser, "content.facebook.publish");
  const canBot = currentUser?.role === "Admin" || hasPermission(currentUser, "content.facebook.bot");
  const canViewFB = currentUser?.role === "Admin" || hasPermission(currentUser, "content.facebook.view");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published_fb" | "not_published_fb" | "auto_reply_on">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sub-view Switcher: Bảng Tin Trực Tiếp vs Đồng Bộ Blog
  const [activeViewMode, setActiveViewMode] = useState<"live_feed" | "blog_sync">("live_feed");
  const [feedPosts, setFeedPosts] = useState<FacebookFeedPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Modal State
  const [activeModalPost, setActiveModalPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Cache metrics cho các bài viết đã liên kết Facebook: Record<postId, FacebookMetrics>
  const [metricsMap, setMetricsMap] = useState<Record<string, FacebookMetrics>>({});
  const [loadingMetricsMap, setLoadingMetricsMap] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tải danh sách bài viết từ Firestore
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const allPosts = await blogsService.getAllPosts();
      setPosts(allPosts);

      // Tự động tải metrics cho các bài đã đăng Facebook
      const fbPosts = allPosts.filter((p) => p.facebookPostId && p.facebookPostId !== "[object Object]");
      fbPosts.forEach((p) => {
        if (p.facebookPostId) {
          fetchPostMetrics(p.id, p.facebookPostId);
        }
      });
    } catch (err) {
      console.warn("Lỗi tải danh sách bài viết:", err);
      showToast("Không thể tải danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải danh sách bài viết thực tế trực tiếp từ Fanpage (Meta Graph API)
  const loadFeedPosts = useCallback(async () => {
    try {
      setLoadingFeed(true);
      setFeedError(null);
      const res = await facebookSocialService.getPagePosts(30);
      setFeedPosts(res.posts || []);
    } catch (err) {
      console.warn("Lỗi tải bài viết Fanpage:", err);
      setFeedError(err instanceof Error ? err.message : "Không thể tải danh sách bài viết từ Fanpage");
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadFeedPosts();
  }, [loadPosts, loadFeedPosts]);

  // Lấy chỉ số tương tác thực tế cho 1 bài viết Facebook
  const fetchPostMetrics = async (postId: string, fbPostId: string) => {
    if (!fbPostId || fbPostId === "[object Object]") return;
    setLoadingMetricsMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await facebookSocialService.getMetrics(fbPostId);
      setMetricsMap((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.warn(`Lỗi lấy metrics cho post ${postId}:`, err);
    } finally {
      setLoadingMetricsMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Làm mới toàn bộ dữ liệu (cả Firestore bài blog lẫn Bảng tin trực tiếp Fanpage)
  const handleRefreshAll = async () => {
    soundEngine.playClick();
    setIsRefreshing(true);
    await Promise.all([loadPosts(), loadFeedPosts()]);
    setIsRefreshing(false);
    soundEngine.playCelestialChime();
    showToast("Đã đồng bộ lại toàn bộ dữ liệu Fanpage Facebook!");
  };

  // Toggle nhanh Auto-Reply Bot trực tiếp từ bảng
  const handleQuickToggleAutoReply = async (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canBot) {
      showToast("Tài khoản chưa được cấp quyền điều chỉnh Bot Auto-Reply.");
      return;
    }
    soundEngine.playClick();
    const nextState = !post.facebookAutoReplyEnabled;
    const defaultMsg =
      post.facebookAutoReplyMessage ||
      "Chào Chỉ Huy {name}! Cảm ơn bạn đã quan tâm và để lại bình luận cho Valkyria of Veyra. Hãy tiếp tục theo dõi Fanpage để cập nhật các tin tức và đợt Closed Beta mới nhất nhé! ✨";

    try {
      await blogsService.updateFacebookAutoReply(post.id, nextState, defaultMsg);
      const updatedPost: BlogPost = {
        ...post,
        facebookAutoReplyEnabled: nextState,
        facebookAutoReplyMessage: defaultMsg,
      };
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updatedPost : p)));
      soundEngine.playCelestialChime();
      showToast(
        nextState
          ? `Đã BẬT bot tự động trả lời cho bài: "${post.title.slice(0, 30)}..."`
          : `Đã TẮT bot tự động trả lời cho bài: "${post.title.slice(0, 30)}..."`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi bật/tắt tự động trả lời");
    }
  };

  // Mở Social Hub Modal cho một bài viết
  const handleOpenSocialHub = (post: BlogPost) => {
    soundEngine.playClick();
    setActiveModalPost(post);
    setIsModalOpen(true);
  };

  // Mở Modal Soạn & Đăng bài Facebook mới
  const handleOpenCreateModal = () => {
    if (!canPublishFB) {
      showToast("Tài khoản chưa được cấp quyền đăng bài Facebook (content.facebook.publish).");
      return;
    }
    soundEngine.playClick();
    setIsCreateModalOpen(true);
  };

  // Callback khi đăng bài Facebook thành công
  const handlePostCreated = (newPost: BlogPost) => {
    setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
    showToast(`Đã xuất bản bài viết "${newPost.title.slice(0, 35)}..." lên Fanpage Facebook!`);
    loadFeedPosts();
    if (newPost.facebookPostId) {
      fetchPostMetrics(newPost.id, newPost.facebookPostId);
    }
  };

  // Lọc bài viết
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchExcerpt = p.excerpt?.toLowerCase().includes(q);
        if (!matchTitle && !matchExcerpt) return false;
      }

      // 2. Filter Status
      if (filterStatus === "published_fb") {
        if (!p.facebookPostId) return false;
      } else if (filterStatus === "not_published_fb") {
        if (p.facebookPostId) return false;
      } else if (filterStatus === "auto_reply_on") {
        if (!p.facebookAutoReplyEnabled) return false;
      }

      // 3. Filter Category
      if (selectedCategory !== "all") {
        if (p.category !== selectedCategory) return false;
      }

      return true;
    });
  }, [posts, searchQuery, filterStatus, selectedCategory]);

  // Thống kê tổng quan (Aggregated KPIs)
  const stats = useMemo(() => {
    const total = posts.length;
    const publishedFb = posts.filter((p) => Boolean(p.facebookPostId)).length;
    const autoReplyOn = posts.filter((p) => Boolean(p.facebookAutoReplyEnabled)).length;

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    Object.values(metricsMap).forEach((m) => {
      totalLikes += m.likes || 0;
      totalComments += m.comments || 0;
      totalShares += m.shares || 0;
    });

    return {
      total,
      publishedFb,
      notPublishedFb: total - publishedFb,
      autoReplyOn,
      totalLikes,
      totalComments,
      totalShares,
    };
  }, [posts, metricsMap]);

  return (
    <div className="space-y-6 font-[family-name:var(--font-inter)] animate-fade-in">
      {/* 1. FANPAGE CONNECTION BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1438] via-[#080d24] to-[#0c1438] border border-[#1877F2]/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(24,119,242,0.25)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#1877F2]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Fanpage Brand Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white text-3xl font-bold shadow-[0_0_25px_rgba(24,119,242,0.6)]">
                f
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#070a1e] flex items-center justify-center text-[10px] text-white font-bold" title="Kết nối trực tiếp">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-[family-name:var(--font-rajdhani)]">
                  Valkyria of Veyra (Official Fanpage)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                  🟢 ĐÃ KẾT NỐI CHÍNH THỨC
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono">
                <span className="text-[#3fe9d6] font-bold">Kênh Truyền Thông Chính Thức</span>
                <span>•</span>
                <span className="text-slate-400">Đồng Bộ Tự Động</span>
                <span>•</span>
                <span className="text-[#f5c767]">Turn-Based RPG Official</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {canPublishFB && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1877F2] via-[#2563eb] to-[#0ea5e9] hover:opacity-95 text-white text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(24,119,242,0.4)] hover:shadow-[0_0_25px_rgba(24,119,242,0.6)]"
              >
                <span className="text-base font-black">+</span>
                <span>Đăng Bài Lên Facebook</span>
              </button>
            )}

            <a
              href="https://www.facebook.com/1422359914290932"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] hover:text-white border border-[#1877F2]/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(24,119,242,0.2)]"
            >
              <span>Mở Fanpage</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#1877F2]" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? "Đang Đồng Bộ..." : "Làm Mới Tất Cả"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. OVERVIEW METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Bài Đã Đăng FB */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d26] border border-white/10 shadow-lg flex flex-col justify-between hover:border-[#1877F2]/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">Bài Viết Fanpage</span>
            <span className="text-base">📢</span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-rajdhani)] tracking-wide">
              {stats.publishedFb} <span className="text-sm font-normal text-slate-500">/ {stats.total}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
            <span className="text-emerald-400">✓ {Math.round((stats.publishedFb / (stats.total || 1)) * 100)}%</span>
            <span>đã lên sóng FB</span>
          </div>
        </div>

        {/* Card 2: Tổng Lượt Thích / Cảm Xúc */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d26] border border-white/10 shadow-lg flex flex-col justify-between hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">Lượt Cảm Xúc (Reactions)</span>
            <span className="text-base">👍❤️</span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-[#3fe9d6] font-[family-name:var(--font-rajdhani)] tracking-wide">
              {formatNumber(stats.totalLikes)}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Tương tác tích lũy thời gian thực
          </div>
        </div>

        {/* Card 3: Tổng Bình Luận */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d26] border border-white/10 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">Bình Luận Chỉ Huy</span>
            <span className="text-base">💬</span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-[#f5c767] font-[family-name:var(--font-rajdhani)] tracking-wide">
              {formatNumber(stats.totalComments)}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Thảo luận cộng đồng game
          </div>
        </div>

        {/* Card 4: Bot Tự Động Rep */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d26] border border-white/10 shadow-lg flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">Auto-Reply Bot</span>
            <span className="text-base">🤖</span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-[family-name:var(--font-rajdhani)] tracking-wide">
              {stats.autoReplyOn} <span className="text-sm font-normal text-slate-500">Bài Bật</span>
            </div>
          </div>
          <div className="text-[11px] text-emerald-300 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sẵn sàng phản hồi tự động</span>
          </div>
        </div>
      </div>

      {/* 2.5 VIEW SELECTOR TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveViewMode("live_feed");
            }}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === "live_feed"
                ? "bg-gradient-to-r from-[#1877F2] to-[#2563eb] text-white shadow-[0_0_20px_rgba(24,119,242,0.4)]"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <span>📢</span>
            <span>BẢNG TIN FANPAGE TRỰC TIẾP</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
              {feedPosts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveViewMode("blog_sync");
            }}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeViewMode === "blog_sync"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <span>📑</span>
            <span>ĐỒNG BỘ BÀI VIẾT BLOG</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
              {posts.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
          {activeViewMode === "live_feed"
            ? "Đang hiển thị toàn bộ bài viết thời gian thực từ Meta Graph API"
            : "Đang hiển thị danh sách bài blog trên web liên kết Facebook"}
        </div>
      </div>

      {/* 3. NỘI DUNG THEO TAB CHỌN */}
      {activeViewMode === "live_feed" ? (
        <FacebookLiveFeedView
          posts={feedPosts}
          loading={loadingFeed}
          error={feedError}
          onRefresh={loadFeedPosts}
          onOpenSocialHub={handleOpenSocialHub}
        />
      ) : (
        <>
          {/* 3. SEARCH & FILTER TOOLBAR */}
          <div className="p-4 rounded-2xl bg-[#080c24] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài viết Facebook theo tiêu đề..."
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
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Status */}
          <div className="flex items-center gap-1 bg-[#050716] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === "all"
                  ? "bg-[#1877F2] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tất Cả ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus("published_fb")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === "published_fb"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Đã Đăng FB ({stats.publishedFb})
            </button>
            <button
              onClick={() => setFilterStatus("not_published_fb")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === "not_published_fb"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Chưa Đăng ({stats.notPublishedFb})
            </button>
            <button
              onClick={() => setFilterStatus("auto_reply_on")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === "auto_reply_on"
                  ? "bg-[#3fe9d6] text-[#060814] shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bot Bật ({stats.autoReplyOn})
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#050716] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-[#1877F2]"
          >
            <option value="all">Mọi Chuyên Mục</option>
            <option value="Tin Tức">Tin Tức</option>
            <option value="Cập Nhật">Cập Nhật</option>
            <option value="Hướng Dẫn">Hướng Dẫn</option>
            <option value="Cốt Truyện">Cốt Truyện</option>
            <option value="Sự Kiện">Sự Kiện</option>
          </select>
        </div>
      </div>

      {/* 4. POSTS LIST TABLE */}
      <div className="rounded-2xl bg-[#090d26] border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📑</span>
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
              Danh Sách Bài Viết Facebook ({filteredPosts.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Hiển thị {filteredPosts.length} / {posts.length} bài
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-10 h-10 rounded-full border-2 border-[#1877F2] border-t-transparent animate-spin" />
            <p className="text-xs font-mono">Đang tải danh sách bài viết...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="text-3xl">📭</div>
            <p className="text-xs">Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredPosts.map((post) => {
              const isLinked = Boolean(post.facebookPostId);
              const metrics = metricsMap[post.id];
              const isLoadingMetrics = loadingMetricsMap[post.id];
              const autoReplyActive = Boolean(post.facebookAutoReplyEnabled);

              return (
                <div
                  key={post.id}
                  className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Left: Thumbnail & Post Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                      {post.coverUrl ? (
                        <Image
                          src={post.coverUrl}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold">
                          VoV
                        </div>
                      )}
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-slate-300 backdrop-blur-sm">
                        {post.category}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          onClick={() => handleOpenSocialHub(post)}
                          className="text-sm font-bold text-white hover:text-[#3fe9d6] transition-colors cursor-pointer truncate max-w-xl"
                          title={post.title}
                        >
                          {post.title}
                        </h4>

                        {/* Status Badges */}
                        {isLinked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            ĐÃ ĐĂNG FB
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold font-mono">
                            CHƯA ĐĂNG
                          </span>
                        )}

                        {post.status === "Published" ? (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">
                            Blog Public
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                            Bản Nháp
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        {post.excerpt || "Không có trích dẫn mô tả."}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>Tác giả: <strong className="text-slate-400">{post.authorName || "Admin"}</strong></span>
                        <span>•</span>
                        <span>
                          {post.facebookPublishedAt
                            ? `Đăng FB: ${new Date(post.facebookPublishedAt).toLocaleString("vi-VN")}`
                            : `Cập nhật: ${new Date(post.updatedAt).toLocaleDateString("vi-VN")}`}
                        </span>
                        {post.facebookPostId && (
                          <>
                            <span>•</span>
                            <span className="text-[#1877F2] truncate max-w-[140px]" title={post.facebookPostId}>
                              ID: {post.facebookPostId}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Live Facebook Metrics & Auto-Reply Indicator */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-6 self-start lg:self-auto py-2 lg:py-0 border-t lg:border-t-0 border-white/5">
                    {/* Metrics Stream */}
                    {isLinked ? (
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <div className="p-2 rounded-xl bg-[#050716] border border-white/10 flex items-center gap-1.5 text-slate-300" title="Lượt Thích / Cảm xúc">
                          <span>👍</span>
                          <span className="font-bold text-white">
                            {isLoadingMetrics ? "..." : metrics ? formatNumber(metrics.likes) : "0"}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#050716] border border-white/10 flex items-center gap-1.5 text-[#f5c767]" title="Lượt Bình Luận">
                          <span>💬</span>
                          <span className="font-bold">
                            {isLoadingMetrics ? "..." : metrics ? formatNumber(metrics.comments) : "0"}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#050716] border border-white/10 flex items-center gap-1.5 text-emerald-400" title="Lượt Chia Sẻ">
                          <span>🔁</span>
                          <span className="font-bold">
                            {isLoadingMetrics ? "..." : metrics ? formatNumber(metrics.shares) : "0"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 font-mono italic">
                        Chưa có dữ liệu Facebook
                      </div>
                    )}

                    {/* Auto-Reply Bot Pill with Quick Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickToggleAutoReply(post, e)}
                      disabled={!canBot}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                        !canBot ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      } ${
                        autoReplyActive
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700"
                      }`}
                      title={
                        canBot
                          ? "Bấm để bật/tắt nhanh Auto-Reply Bot cho bài viết này"
                          : "Bạn chưa được cấp quyền điều chỉnh Bot Auto-Reply"
                      }
                    >
                      <span>🤖</span>
                      <span>Bot: {autoReplyActive ? "BẬT" : "TẮT"}</span>
                    </button>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenSocialHub(post)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#0ea5e9] hover:from-[#166fe5] hover:to-[#0284c7] text-white text-xs font-bold shadow-[0_0_15px_rgba(24,119,242,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isLinked ? "💬 Quản Lý & Bình Luận" : "📢 Đăng Lên Facebook"}</span>
                    </button>

                    {post.facebookPostUrl && (
                      <a
                        href={post.facebookPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-[#1877F2] border border-white/10 transition-colors"
                        title="Mở bài viết trực tiếp trên Facebook"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* 5. MODAL XỬ LÝ (FacebookSocialHubModal) */}
      {activeModalPost && (
        <FacebookSocialHubModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setActiveModalPost(null);
          }}
          post={activeModalPost}
          onPostUpdated={(updated) => {
            setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setActiveModalPost(updated);
            if (updated.facebookPostId) {
              fetchPostMetrics(updated.id, updated.facebookPostId);
            }
          }}
        />
      )}

      {/* 6. MODAL ĐĂNG BÀI FACEBOOK MỚI (CreateFacebookPostModal) */}
      <CreateFacebookPostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        availableBlogPosts={posts}
        onPublished={handlePostCreated}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#090d24] border border-[#1877F2]/60 text-white text-xs font-bold shadow-[0_0_30px_rgba(24,119,242,0.4)] animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

