"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/services/blogs.service";
import { soundEngine } from "@/services/audio.service";

interface BlogDetailModalProps {
  post: BlogPost | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogDetailModal({
  post,
  isOpen,
  onClose,
}: BlogDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

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

  const handleCopyLink = () => {
    soundEngine.playClick();
    const url = `${window.location.origin}/blog/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#090d24] border border-[#f5c767]/40 rounded-2xl overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1336]/90 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#f5c767] animate-pulse flex-shrink-0" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#f5c767] font-semibold truncate">
              {post.category || "BẢN TIN VEYRA"}
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Copy link button */}
            <button
              onClick={handleCopyLink}
              title="Sao chép liên kết bài viết"
              className="p-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:text-white hover:border-[#f5c767]/40 transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <span className="text-emerald-400">Đã chép link</span>
              ) : (
                <span>Chia sẻ</span>
              )}
            </button>

            {/* Direct Full-Page Link */}
            <Link
              href={`/blog/${post.id}`}
              onClick={() => soundEngine.playClick()}
              className="p-1.5 px-2.5 sm:px-3 rounded-lg bg-[#3fe9d6]/10 border border-[#3fe9d6]/30 text-xs font-mono text-[#3fe9d6] hover:bg-[#3fe9d6]/20 transition-colors inline-flex items-center gap-1"
            >
              <span>Toàn trang</span>
            </Link>

            {/* Close button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              aria-label="Đóng"
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 scrollbar-thin scrollbar-thumb-white/10">
          {/* Article Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-rajdhani)] leading-tight">
            {post.title}
          </h1>

          {/* Author & Timestamp Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#f5c767] to-[#3fe9d6] flex items-center justify-center text-[10px] font-bold text-[#060814]">
                {post.authorName ? post.authorName[0].toUpperCase() : "V"}
              </div>
              <span className="text-slate-200 font-semibold">{post.authorName || "Ban Quản Trị Veyra"}</span>
            </div>
            <span>Đăng lúc: {formatDate(post.publishedAt || post.createdAt)}</span>
          </div>

          {/* Cover Image if present */}
          {post.coverUrl && (
            <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <Image
                src={post.coverUrl}
                alt={post.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d24]/60 via-transparent to-transparent" />
            </div>
          )}

          {/* Excerpt Summary */}
          {post.excerpt && (
            <div className="p-4 rounded-xl bg-[#0c112e] border-l-4 border-[#f5c767] text-slate-200 text-sm leading-relaxed italic">
              {post.excerpt}
            </div>
          )}

          {/* Full Rich Text Content */}
          <div
            className="blog-editor-content leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Article Footer */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div>
              Chủ đề: <span className="text-[#3fe9d6]">{post.category}</span> • Valkyria of Veyra News
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

