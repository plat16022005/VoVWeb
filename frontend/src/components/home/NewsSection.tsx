"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { soundEngine } from "@/services/audio.service";
import { blogsService, BlogPost } from "@/services/blogs.service";
import BlogDetailModal from "@/components/modals/BlogDetailModal";

interface NewsSectionProps {
  onOpenPlayModal: () => void;
  onOpenTrailerModal?: () => void;
}

const CATEGORIES = [
  "TẤT CẢ",
  "TIN TỨC",
  "CẬP NHẬT",
  "HƯỚNG DẪN",
  "CỐT TRUYỆN",
  "SỰ KIỆN",
] as const;

const ITEMS_PER_PAGE = 4;

export default function NewsSection({ onOpenPlayModal }: NewsSectionProps) {
  const [newsFilter, setNewsFilter] = useState<string>("TẤT CẢ");
  const [firestorePosts, setFirestorePosts] = useState<BlogPost[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal read blog state
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch published blogs from Firestore
  useEffect(() => {
    let cancelled = false;
    blogsService
      .getPublishedPosts()
      .then((posts) => {
        if (!cancelled) setFirestorePosts(posts);
      })
      .catch((err) => {
        console.warn("Không thể tải bài blog từ Firestore:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBlogs(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Reset về trang 1 mỗi khi đổi tab danh mục
  useEffect(() => {
    setCurrentPage(1);
  }, [newsFilter]);

  const formatDate = (ts: number | null) =>
    ts
      ? new Date(ts).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Vừa xong";

  const handleOpenBlog = (post: BlogPost) => {
    soundEngine.playClick();
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  // Lọc và sắp xếp bài viết theo thời gian mới nhất (Newest first)
  const sortedFilteredPosts = useMemo(() => {
    return [...firestorePosts]
      .filter((p) => {
        if (newsFilter === "TẤT CẢ") return true;
        return (
          p.category.toUpperCase().includes(newsFilter) ||
          newsFilter.includes(p.category.toUpperCase())
        );
      })
      .sort((a, b) => {
        const timeA = a.publishedAt || a.updatedAt || a.createdAt || 0;
        const timeB = b.publishedAt || b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      });
  }, [firestorePosts, newsFilter]);

  // Bài nổi bật ở cột trái: LUÔN LUÔN là bài viết mới nhất
  const featuredPost = sortedFilteredPosts[0] || null;

  // Danh sách các bài viết còn lại ở cột phải (loại trừ bài nổi bật)
  const remainingPosts = useMemo(() => {
    if (!featuredPost) return [];
    if (sortedFilteredPosts.length <= 1) return [];
    return sortedFilteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [sortedFilteredPosts, featuredPost]);

  const totalPages = Math.max(1, Math.ceil(remainingPosts.length / ITEMS_PER_PAGE));

  // 4 bài viết mới nhất theo trang hiện tại
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return remainingPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [remainingPosts, currentPage]);

  return (
    <section
      id="news"
      className="relative w-full py-20 px-4 sm:px-6 lg:px-8 flex justify-center border-t border-white/5"
    >
      <div className="w-full max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
              <span className="hsr-diamond" /> BẢN TIN VEYRA
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white uppercase font-[family-name:var(--font-rajdhani)]">
              TIN TỨC & BÀI VIẾT NỔI BẬT
            </h2>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 text-xs font-bold font-[family-name:var(--font-rajdhani)]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundEngine.playClick();
                  setNewsFilter(cat);
                }}
                className={`px-4 py-1.5 rounded transition-all cursor-pointer ${
                  newsFilter === cat
                    ? "bg-[#f5c767] text-[#04050d] shadow-[0_0_12px_rgba(245,199,103,0.5)]"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoadingBlogs ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
            <div className="lg:col-span-5 h-96 rounded-2xl bg-white/5 border border-white/10" />
            <div className="lg:col-span-7 space-y-4">
              <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
              <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
              <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
            </div>
          </div>
        ) : sortedFilteredPosts.length === 0 ? (
          /* Empty State khi chưa có bài viết xuất bản */
          <div className="p-12 rounded-2xl bg-[#090d24]/90 border border-white/10 text-center space-y-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-[0.2em] text-[#f5c767]">
              Bản Tin Veyra
            </div>
            <h3 className="text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
              {newsFilter === "TẤT CẢ"
                ? "Chưa Có Bài Viết Nào Được Xuất Bản"
                : `Chưa Có Bài Viết Thuộc Danh Mục "${newsFilter}"`}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Ban Quản Trị đang biên soạn các bản tin sự kiện, cập nhật phiên bản và hướng dẫn chiến thuật mới nhất. Xin Chỉ Huy vui lòng quay lại sau!
            </p>
          </div>
        ) : (
          /* News Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Big Featured Event Banner (Bài viết mới nhất) */}
            {featuredPost && (
              <div className="lg:col-span-5">
                <div
                  className="hsr-card overflow-hidden group cursor-pointer"
                  onClick={() => handleOpenBlog(featuredPost)}
                >
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#060814]">
                    {featuredPost.coverUrl ? (
                      <Image
                        src={featuredPost.coverUrl}
                        alt={featuredPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#090d24] via-[#10173d] to-[#090d24] overflow-hidden">
                        <Image
                          src="/images/hero_bg.jpg"
                          alt={featuredPost.title}
                          fill
                          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090c1f] via-transparent to-transparent" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090c1f] via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 rounded bg-[#f5c767] text-[#04050d] font-bold text-xs uppercase font-[family-name:var(--font-rajdhani)]">
                      {featuredPost.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <span className="text-xs text-[#3fe9d6] font-mono">
                      CẬP NHẬT: {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#f5c767] transition-colors mt-2 mb-3 leading-snug line-clamp-2">
                      {featuredPost.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                      {featuredPost.excerpt || "Bấm vào để đọc toàn bộ bài viết chi tiết..."}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
                      <span>Đọc Toàn Bộ Bài Viết</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Right Column: List of News Articles (Chỉ hiện 4 bài mới nhất mỗi trang, có phân trang) */}
            <div className={`${featuredPost ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col gap-4`}>
              {paginatedList.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#090d24]/60 border border-white/5 text-center text-slate-400 text-xs font-mono">
                  Chưa có thêm bản tin nào khác trong danh mục này.
                </div>
              ) : (
                paginatedList.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleOpenBlog(post)}
                    className="hsr-card p-5 hover:bg-[#131938] transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[#3fe9d6]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-[#3fe9d6]/40 bg-[#3fe9d6]/15 text-[#3fe9d6] uppercase font-[family-name:var(--font-rajdhani)]">
                          {post.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                        {post.authorName && (
                          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                            • {post.authorName}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white group-hover:text-[#f5c767] transition-colors text-base leading-snug truncate">
                        {post.title}
                      </h4>
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">
                        {post.excerpt || "Bấm vào để xem chi tiết bài viết..."}
                      </p>
                    </div>
                    <div className="text-slate-500 group-hover:text-[#f5c767] transition-colors text-xl font-bold flex-shrink-0">
                      →
                    </div>
                  </div>
                ))
              )}

              {/* Pagination Controls (Phân trang cho danh sách bài viết) */}
              {remainingPosts.length > 0 && (
                <div className="flex items-center justify-between pt-3 pb-1 border-t border-white/10 px-2 flex-wrap gap-3">
                  <div className="text-xs font-mono text-slate-400">
                    Trang <span className="text-[#3fe9d6] font-bold">{currentPage}</span> / <span className="text-white font-bold">{totalPages}</span>{" "}
                    (Tổng <span className="text-[#f5c767] font-bold">{remainingPosts.length}</span> bài viết)
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPage > 1) {
                          soundEngine.playClick();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }
                      }}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                        currentPage === 1
                          ? "border-white/5 text-slate-600 cursor-not-allowed bg-transparent opacity-40"
                          : "border-white/10 text-slate-300 hover:text-white hover:border-[#f5c767]/50 hover:bg-[#121636] cursor-pointer"
                      }`}
                    >
                      <span>←</span>
                      <span className="hidden sm:inline">Trước</span>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setCurrentPage(pageNum);
                        }}
                        className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center ${
                          currentPage === pageNum
                            ? "bg-[#f5c767] text-[#04050d] shadow-[0_0_12px_rgba(245,199,103,0.4)] scale-105"
                            : "border border-white/10 text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/5"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPage < totalPages) {
                          soundEngine.playClick();
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }
                      }}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                        currentPage === totalPages
                          ? "border-white/5 text-slate-600 cursor-not-allowed bg-transparent opacity-40"
                          : "border-white/10 text-slate-300 hover:text-white hover:border-[#f5c767]/50 hover:bg-[#121636] cursor-pointer"
                      }`}
                    >
                      <span className="hidden sm:inline">Sau</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Newsletter Subscription Box */}
              <div className="mt-4 p-5 rounded-lg bg-gradient-to-r from-[#111636] to-[#0c1029] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
                    ĐĂNG KÝ BẢN TIN VEYRA
                  </div>
                  <p className="text-xs text-slate-400">
                    Nhận thông báo cập nhật, giftcode và sự kiện mới nhất qua Email.
                  </p>
                </div>
                <button
                  onClick={onOpenPlayModal}
                  className="hsr-btn-glass py-2 px-5 text-xs whitespace-nowrap cursor-pointer"
                >
                  <span>ĐĂNG KÝ NGAY</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blog Detail Reader Modal */}
      <BlogDetailModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
