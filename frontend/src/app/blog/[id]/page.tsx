import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import StarCanvas from "@/components/common/StarCanvas";
import Footer from "@/components/home/Footer";
import { blogsService, BlogPost } from "@/services/blogs.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await blogsService.getPostById(id);
    if (!post || post.status !== "Published") {
      return {
        title: "Bài Viết Không Tồn Tại — Valkyria of Veyra",
      };
    }
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "https://valkyria.veyra.io";
    const postUrl = `${siteUrl}/blog/${post.id}`;

    return {
      title: `${post.title} — Bản Tin Valkyria of Veyra`,
      description: post.excerpt || "Tin tức, sự kiện và cẩm nang chiến thuật mới nhất từ thế giới Valkyria of Veyra.",
      openGraph: {
        title: post.title,
        description: post.excerpt || "Tin tức, sự kiện và cẩm nang chiến thuật mới nhất từ thế giới Valkyria of Veyra.",
        url: postUrl,
        siteName: "Valkyria of Veyra",
        type: "article",
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        images: post.coverUrl
          ? [
              {
                url: post.coverUrl,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || "Tin tức, sự kiện và cẩm nang chiến thuật mới nhất từ thế giới Valkyria of Veyra.",
        images: post.coverUrl ? [post.coverUrl] : [],
      },
    };
  } catch {
    return {
      title: "Bản Tin — Valkyria of Veyra",
    };
  }
}

export default async function BlogPostDetailPage({ params }: PageProps) {
  const { id } = await params;
  let post: BlogPost | null = null;
  let loadError = false;

  try {
    post = await blogsService.getPostById(id);
    if (post && post.status !== "Published") {
      post = null;
    }
  } catch (err) {
    console.error("Lỗi tải bài viết blog:", err);
    loadError = true;
  }

  const formatDate = (ts: number | null) =>
    ts
      ? new Date(ts).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Vừa xong";

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#04050d] text-[#e8eaf6] overflow-x-hidden selection:bg-[#f5c767] selection:text-[#04050d]">
      {/* Background Starry Particles */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <StarCanvas />
      </div>

      {/* Top Simple Navigation Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#070919]/90 border-b border-[#f5c767]/20 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f5c767] via-[#9b51e0] to-[#3fe9d6] p-[1.5px] shadow-[0_0_15px_rgba(245,199,103,0.35)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#060814] rounded-[10px] flex items-center justify-center font-[family-name:var(--font-rajdhani)] font-black text-xl text-[#f5c767]">
                VOV
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-rajdhani)] text-lg font-bold tracking-wider text-white uppercase">
                VALKYRIA OF VEYRA
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#3fe9d6]">
                Bản Tin & Cốt Truyện
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/#news"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Trở Về Bản Tin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Article Content Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        {!post ? (
          <div className="p-12 rounded-2xl bg-[#090d24]/90 border border-white/10 text-center space-y-4 my-16 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="text-4xl">📜</div>
            <h1 className="text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
              {loadError ? "Không Thể Tải Bài Viết" : "Bài Viết Không Tồn Tại Hoặc Đã Bị Gỡ"}
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Bài viết này có thể đang ở chế độ bản nháp hoặc đã được Ban Quản Trị lưu trữ.
            </p>
            <Link
              href="/#news"
              className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e67e22] text-[#060814] font-bold text-xs hover:brightness-110 shadow-[0_0_15px_rgba(245,199,103,0.3)] transition-all"
            >
              Xem Tin Tức Khác
            </Link>
          </div>
        ) : (
          <article className="p-6 sm:p-10 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-6 shadow-[0_4px_40px_rgba(0,0,0,0.6)]">
            {/* Meta tags */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase bg-[#f5c767]/20 text-[#f5c767] border border-[#f5c767]/40">
                {post.category}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Đăng ngày: {formatDate(post.publishedAt || post.createdAt)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-[#3fe9d6]">
                Tác giả: {post.authorName || "Ban Quản Trị Veyra"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-[family-name:var(--font-rajdhani)] leading-tight tracking-wide">
              {post.title}
            </h1>

            {/* Cover Image */}
            {post.coverUrl && (
              <div className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <Image
                  src={post.coverUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#0c112e] border-l-4 border-[#f5c767] text-slate-200 text-sm leading-relaxed italic shadow-inner">
                {post.excerpt}
              </div>
            )}

            {/* Body */}
            <div
              className="blog-editor-content leading-relaxed pt-2"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Back button */}
            <div className="pt-8 border-t border-white/10 flex items-center justify-between">
              <Link
                href="/#news"
                className="text-xs font-mono text-[#f5c767] hover:underline flex items-center gap-1.5"
              >
                <span>← Trở về trang chủ</span>
              </Link>
              <div className="text-xs font-mono text-slate-400">
                © Valkyria of Veyra
              </div>
            </div>
          </article>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

