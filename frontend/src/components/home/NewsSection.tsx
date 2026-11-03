"use client";

import { useEffect, useState } from "react";
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

export default function NewsSection({ onOpenPlayModal }: NewsSectionProps) {
  const [newsFilter, setNewsFilter] = useState<string>("TẤT CẢ");
  const [firestorePosts, setFirestorePosts] = useState<BlogPost[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);

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

  // Filter Firestore Posts
  const filteredPosts = firestorePosts.filter((p) => {
    if (newsFilter === "TẤT CẢ") return true;
    return (
      p.category.toUpperCase().includes(newsFilter) ||
      newsFilter.includes(p.category.toUpperCase())
    );
  });

  // Bài nổi bật ở cột trái: Bài đầu tiên có ảnh bìa hoặc bài mới nhất trong danh sách lọc
  const featuredPost = filteredPosts.find((p) => Boolean(p.coverUrl)) || filteredPosts[0] || null;
  // Các bài viết hiển thị ở cột phải (loại trừ bài đang được feature nếu có từ 2 bài trở lên)
  const listPosts =
    filteredPosts.length > 1 && featuredPost
      ? filteredPosts.filter((p) => p.id !== featuredPost.id)
      : filteredPosts;

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
        ) : filteredPosts.length === 0 ? (
          /* Empty State khi chưa có bài viết xuất bản */
          <div className="p-12 rounded-2xl bg-[#090d24]/90 border border-white/10 text-center space-y-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="text-4xl">📜</div>
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
            {/* Left Column: Big Featured Event Banner */}
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
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#090d24] via-[#10173d] to-[#090d24] text-5xl">
                        📰
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090c1f] via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 rounded bg-[#f5c767] text-[#04050d] font-bold text-xs uppercase font-[family-name:var(--font-rajdhani)]">
                      ★ {featuredPost.category}
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

            {/* Right Column: List of News Articles */}
            <div className={`${featuredPost ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col gap-4`}>
              {listPosts.map((post) => (
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
              ))}

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
