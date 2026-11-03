"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { BlogPost, blogsService } from "@/services/blogs.service";
import {
  facebookSocialService,
  FacebookMetrics,
  FacebookCommentItem,
} from "@/services/facebookSocial.service";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";
import {
  convertBlogToFacebookText,
  extractBlogMedia,
  ExtractedMediaItem,
} from "@/utils/facebookFormatter";

interface FacebookSocialHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost;
  onPostUpdated: (updatedPost: BlogPost) => void;
}

export default function FacebookSocialHubModal({
  isOpen,
  onClose,
  post,
  onPostUpdated,
}: FacebookSocialHubModalProps) {
  const [activeTab, setActiveTab] = useState<"community" | "publish">(() =>
    post.facebookPostId ? "community" : "publish"
  );

  // 1. Tự động trích xuất toàn bộ Media (Ảnh bìa, Ảnh trong bài, Video) theo thứ tự
  const initialMediaList = useMemo(
    () => extractBlogMedia(post.content || "", post.coverUrl),
    [post.content, post.coverUrl]
  );
  const [mediaList, setMediaList] = useState<ExtractedMediaItem[]>(initialMediaList);

  // 2. Tự động chuyển đổi toàn bộ HTML của bài blog sang định dạng văn bản Facebook tối ưu
  const initialRichCaption = useMemo(() => {
    return convertBlogToFacebookText({
      title: post.title,
      excerpt: post.excerpt,
      contentHtml: post.content || "",
      postUrl: `https://valkyria.veyra.io/blog/${post.id}`,
    });
  }, [post.id, post.title, post.excerpt, post.content]);

  const [caption, setCaption] = useState(initialRichCaption);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Cập nhật khi post thay đổi
  useEffect(() => {
    setCaption(initialRichCaption);
    setMediaList(initialMediaList);
  }, [initialRichCaption, initialMediaList]);

  // Community Stream State
  const [metrics, setMetrics] = useState<FacebookMetrics | null>(null);
  const [comments, setComments] = useState<FacebookCommentItem[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  // Reply State
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyBoxId, setActiveReplyBoxId] = useState<string | null>(null);
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  // Tải dữ liệu tương tác & bình luận khi mở tab Community
  const loadCommunityData = useCallback(async (overridePostId?: unknown) => {
    const targetPostId = typeof overridePostId === "string" ? overridePostId : post.facebookPostId;
    if (!targetPostId || targetPostId === "[object Object]") return;
    setIsLoadingCommunity(true);
    try {
      const [metricsData, commentsData] = await Promise.all([
        facebookSocialService.getMetrics(targetPostId).catch(() => null),
        facebookSocialService.getComments(targetPostId).catch(() => ({
          comments: [],
        })),
      ]);

      if (metricsData) {
        setMetrics(metricsData);
      }
      if (commentsData) {
        setComments(commentsData.comments || []);
      }
    } catch (err) {
      console.warn("Lỗi tải tương tác Facebook:", err);
    } finally {
      setIsLoadingCommunity(false);
    }
  }, [post.facebookPostId]);

  useEffect(() => {
    if (!isOpen || !post.facebookPostId) return;
    let active = true;

    Promise.all([
      facebookSocialService.getMetrics(post.facebookPostId).catch(() => null),
      facebookSocialService.getComments(post.facebookPostId).catch(() => ({
        comments: [],
      })),
    ]).then(([metricsData, commentsData]) => {
      if (!active) return;
      if (metricsData) {
        setMetrics(metricsData);
      }
      if (commentsData) {
        setComments(commentsData.comments || []);
      }
      setIsLoadingCommunity(false);
    });

    return () => {
      active = false;
    };
  }, [isOpen, post.facebookPostId]);

  if (!isOpen) return null;

  // Xử lý đăng bài lên Facebook
  const handlePublish = async () => {
    soundEngine.playClick();
    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccessMessage(null);

    try {
      const result = await facebookSocialService.publishPost({
        postId: post.id,
        title: post.title,
        excerpt: post.excerpt,
        coverUrl: post.coverUrl,
        contentHtml: post.content,
        customCaption: caption,
        mediaItems: mediaList,
      });

      // Lưu liên kết Facebook Post ID vào Firestore
      await blogsService.linkFacebookPost(post.id, result.facebookPostId, result.facebookPostUrl);

      const updated = {
        ...post,
        facebookPostId: result.facebookPostId,
        facebookPostUrl: result.facebookPostUrl,
        facebookPublishedAt: Date.now(),
      };
      onPostUpdated(updated);

      soundEngine.playCelestialChime();
      setPublishSuccessMessage(result.message);

      setTimeout(() => {
        setActiveTab("community");
        loadCommunityData(result.facebookPostId);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng bài thất bại";
      setPublishError(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  // Xử lý gửi phản hồi bình luận
  const handleSendReply = async (commentId: string) => {
    const text = replyInputs[commentId]?.trim();
    if (!text) return;

    soundEngine.playClick();
    setSendingReplyId(commentId);

    try {
      const result = await facebookSocialService.replyComment(commentId, text);

      // Thêm phản hồi ngay vào UI local
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const replies = c.replies || [];
            return {
              ...c,
              replies: [
                ...replies,
                {
                  id: result.replyId,
                  from: {
                    name: "Valkyria of Veyra (Official)",
                  },
                  message: text,
                  created_time: new Date().toISOString(),
                },
              ],
            };
          }
          return c;
        })
      );

      // Xóa input và đóng box
      setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
      setActiveReplyBoxId(null);
      soundEngine.playCelestialChime();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gửi phản hồi thất bại");
    } finally {
      setSendingReplyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#070a1e] border border-[#1877F2]/40 shadow-[0_0_60px_rgba(24,119,242,0.3)] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0c1438] via-[#080d24] to-[#0c1438]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white text-xl font-bold shadow-[0_0_20px_rgba(24,119,242,0.5)]">
              f
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                  Facebook Community & Social Hub
                </h3>
                {post.facebookPostId && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    Đã Đồng Bộ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md mt-0.5" title={post.title}>
                {post.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.facebookPostUrl && (
              <a
                href={post.facebookPostUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] border border-[#1877F2]/40 text-xs font-bold transition-all"
              >
                <span>Mở trên FB</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher: Cộng Đồng & Tương Tác vs Đăng / Soạn Thảo */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#050716] border-b border-white/5">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("community");
              loadCommunityData();
            }}
            disabled={!post.facebookPostId}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-30 ${
              activeTab === "community"
                ? "bg-[#1877F2] text-white shadow-[0_0_15px_rgba(24,119,242,0.4)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>💬</span>
            <span>Bình Luận & Tương Tác</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("publish");
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "publish"
                ? "bg-[#1877F2] text-white shadow-[0_0_15px_rgba(24,119,242,0.4)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>📢</span>
            <span>{post.facebookPostId ? "Đăng Lại / Sửa Caption" : "Đăng Lên Fanpage"}</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: CỘNG ĐỒNG, THỐNG KÊ & BÌNH LUẬN TRỰC TIẾP */}
          {activeTab === "community" && (
            <div className="space-y-6 animate-fade-in">
              {/* Top 4 Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Lượt Thích / Cảm xúc */}
                <div className="p-4 rounded-2xl bg-[#0b102b] border border-white/10 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Cảm Xúc</span>
                    <span className="text-base">👍❤️</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-white mt-2">
                    {metrics ? formatNumber(metrics.likes) : "—"}
                  </div>
                  <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1.5">
                    <span>👍 {metrics ? formatNumber(metrics.reactions.like) : "0"}</span>
                    <span>•</span>
                    <span>❤️ {metrics ? formatNumber(metrics.reactions.love) : "0"}</span>
                  </div>
                </div>

                {/* Bình Luận */}
                <div className="p-4 rounded-2xl bg-[#0b102b] border border-white/10 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Bình Luận</span>
                    <span className="text-base">💬</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#f5c767] mt-2">
                    {metrics ? formatNumber(metrics.comments) : "—"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Thảo luận sôi nổi
                  </div>
                </div>

                {/* Lượt Chia Sẻ */}
                <div className="p-4 rounded-2xl bg-[#0b102b] border border-white/10 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Lượt Share</span>
                    <span className="text-base">🔁</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-2">
                    {metrics ? formatNumber(metrics.shares) : "—"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Lan tỏa cộng đồng
                  </div>
                </div>

                {/* Tỉ Lệ Tương Tác */}
                <div className="p-4 rounded-2xl bg-[#0b102b] border border-white/10 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Tiếp Cận</span>
                    <span className="text-base">📈</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#3fe9d6] mt-2">
                    {metrics ? formatNumber(metrics.likes * 14 + metrics.comments * 8) : "—"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Lượt hiển thị ước tính
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="p-5 rounded-2xl bg-[#090d26] border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🗣️</span>
                    <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                      Dòng Bình Luận Từ Game Thủ ({comments.length})
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      loadCommunityData();
                    }}
                    disabled={isLoadingCommunity}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg
                      className={`w-3.5 h-3.5 ${isLoadingCommunity ? "animate-spin text-[#1877F2]" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Làm Mới</span>
                  </button>
                </div>

                {isLoadingCommunity ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-[#1877F2] border-t-transparent animate-spin" />
                    <p className="text-xs">Đang đồng bộ bình luận từ Facebook...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    Chưa có bình luận nào trên Facebook cho bài viết này.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        className="p-4 rounded-xl bg-[#060818] border border-white/5 space-y-2.5 hover:border-white/10 transition-colors"
                      >
                        {/* Comment Header: User Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {cmt.from.avatarUrl ? (
                              <Image
                                src={cmt.from.avatarUrl}
                                alt={cmt.from.name}
                                width={32}
                                height={32}
                                unoptimized
                                className="w-8 h-8 rounded-full object-cover border border-[#1877F2]/40"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1877F2] to-[#3fe9d6] flex items-center justify-center font-bold text-xs text-white">
                                {cmt.from.name[0] || "U"}
                              </div>
                            )}

                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{cmt.from.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {new Date(cmt.created_time).toLocaleString("vi-VN")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                            <span>👍</span>
                            <span>{cmt.like_count}</span>
                          </div>
                        </div>

                        {/* Comment Content */}
                        <p className="text-xs text-slate-200 pl-10 whitespace-pre-wrap leading-relaxed">
                          {cmt.message}
                        </p>

                        {/* Sub-Replies (Các phản hồi bên dưới comment) */}
                        {cmt.replies && cmt.replies.length > 0 && (
                          <div className="ml-10 space-y-2 pt-1 border-l-2 border-[#1877F2]/40 pl-3">
                            {cmt.replies.map((rep) => (
                              <div key={rep.id} className="p-2.5 rounded-lg bg-[#0c1438]/80 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-[#3fe9d6]">
                                  <span>🛡️ {rep.from.name}</span>
                                  <span className="text-[10px] font-normal text-slate-400">
                                    {new Date(rep.created_time).toLocaleString("vi-VN")}
                                  </span>
                                </div>
                                <p className="text-slate-300 text-xs">{rep.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Action Trigger */}
                        <div className="pl-10 pt-1 flex items-center gap-3">
                          <button
                            onClick={() => {
                              soundEngine.playClick();
                              setActiveReplyBoxId(activeReplyBoxId === cmt.id ? null : cmt.id);
                            }}
                            className="text-[11px] font-bold text-[#1877F2] hover:text-[#3fe9d6] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>↩</span>
                            <span>{activeReplyBoxId === cmt.id ? "Hủy Phản Hồi" : "Trả lời dưới danh nghĩa Fanpage"}</span>
                          </button>
                        </div>

                        {/* Inline Reply Input Box */}
                        {activeReplyBoxId === cmt.id && (
                          <div className="ml-10 pt-2 space-y-2 animate-fade-in">
                            <div className="p-3 rounded-xl bg-[#090d24] border border-[#1877F2]/40 space-y-2">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3fe9d6]">
                                <span>✍️</span>
                                <span>Phản hồi với tư cách Fanpage: Valkyria of Veyra (Official)</span>
                              </div>
                              <textarea
                                value={replyInputs[cmt.id] || ""}
                                onChange={(e) =>
                                  setReplyInputs((prev) => ({ ...prev, [cmt.id]: e.target.value }))
                                }
                                placeholder={`Gửi câu trả lời đến ${cmt.from.name}...`}
                                rows={2}
                                className="w-full p-2.5 rounded-lg bg-[#050716] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1877F2]"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setActiveReplyBoxId(null)}
                                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-mono"
                                >
                                  Đóng
                                </button>
                                <button
                                  onClick={() => handleSendReply(cmt.id)}
                                  disabled={sendingReplyId === cmt.id || !replyInputs[cmt.id]?.trim()}
                                  className="px-3.5 py-1 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  {sendingReplyId === cmt.id ? "Đang gửi..." : "Gửi Phản Hồi"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ĐĂNG BÀI LÊN FANPAGE / SOẠN CAPTION */}
          {activeTab === "publish" && (
            <div className="space-y-5 animate-fade-in">
              {publishSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <span>✓</span>
                  <span>{publishSuccessMessage}</span>
                </div>
              )}

              {publishError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span>✕</span>
                  <span>{publishError}</span>
                </div>
              )}

              {/* Thông báo Media phát hiện được từ bài viết */}
              <div className="p-4 rounded-2xl bg-[#090d26] border border-[#3fe9d6]/30 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📸</span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        Tự Động Quét Media Từ Bài Viết
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/30">
                          {mediaList.length} Tệp Phương Tiện
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tất cả ảnh bìa, ảnh trong nội dung và video được trích xuất theo đúng thứ tự xuất hiện để đăng Album lên Fanpage.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCaption(initialRichCaption);
                      setMediaList(initialMediaList);
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#3fe9d6] border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Nạp lại định dạng chuẩn tự động chuyển đổi từ HTML của bài blog"
                  >
                    <span>↺</span>
                    <span>Quét Lại Từ Blog</span>
                  </button>
                </div>

                {/* Danh sách Media xếp theo thứ tự */}
                {mediaList.length > 0 ? (
                  <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 custom-scrollbar">
                    {mediaList.map((item, idx) => (
                      <div
                        key={item.id}
                        className="relative shrink-0 w-28 sm:w-32 rounded-xl bg-[#060818] border border-white/15 overflow-hidden group shadow-md"
                      >
                        <div className="relative w-full aspect-[16/10] bg-black/60 flex items-center justify-center">
                          {item.type === "image" ? (
                            <Image
                              src={item.url}
                              alt={item.label}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-rose-400 gap-1 p-2">
                              <span className="text-xl">🎬</span>
                              <span className="text-[9px] font-mono">Video</span>
                            </div>
                          )}

                          {/* Thứ tự đính kèm badge */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono font-bold text-[#f5c767] border border-white/10">
                            #{idx + 1}
                          </div>

                          {item.isCover && (
                            <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-[#3fe9d6]/90 text-[8px] font-bold text-black uppercase">
                              Bìa
                            </div>
                          )}
                        </div>

                        <div className="p-1.5 text-[10px] text-slate-300 font-mono truncate" title={item.label}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-black/20 text-xs text-slate-400 font-mono text-center">
                    Bài viết chưa có ảnh hoặc video nào. Hệ thống sẽ xuất bản bài đăng dạng văn bản thông báo.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
                {/* Cột soạn thảo Caption Facebook */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span>Nội Dung Bài Đăng (Facebook Caption)</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Đã quét & chuyển đổi sang định dạng Facebook)
                        </span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {caption.length} ký tự
                      </span>
                    </div>

                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={14}
                      className="w-full p-4 rounded-2xl bg-[#090d24] border border-white/10 text-xs text-white leading-relaxed focus:outline-none focus:border-[#1877F2] font-mono whitespace-pre-wrap selection:bg-[#1877F2]/40"
                      placeholder="Nội dung đã được quét tự động từ bài viết blog..."
                    />
                  </div>

                  {/* Hashtag suggestions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">Gợi ý hashtag:</span>
                    {["#ValkyriaOfVeyra", "#VoVRPG", "#AnimeRPG", "#TurnBasedRPG", "#GamingNews"].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            if (!caption.includes(tag)) {
                              setCaption((prev) => `${prev.trim()} ${tag}`);
                            }
                          }}
                          className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[#3fe9d6] text-[10px] border border-white/10 cursor-pointer"
                        >
                          + {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Cột Xem Trước (Facebook Post Live Preview) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Mô Phỏng Trực Tiếp Trên Facebook
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">Live Preview</span>
                  </div>

                  <div className="rounded-2xl bg-[#0b0e24] border border-white/15 overflow-hidden shadow-2xl text-xs font-sans">
                    {/* Header Fanpage */}
                    <div className="p-3 flex items-center gap-2.5 border-b border-white/5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1877F2] to-[#3fe9d6] flex items-center justify-center font-bold text-white text-base shadow">
                        V
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1">
                          <span>Valkyria of Veyra</span>
                          <span className="text-[#1877F2] text-xs">●</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Vừa xong · 🌐 Công khai</div>
                      </div>
                    </div>

                    {/* Nội dung Caption xem trước */}
                    <div className="p-3 text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar font-mono bg-black/20">
                      {caption}
                    </div>

                    {/* Preview Ảnh / Album ảnh */}
                    {mediaList.length > 0 && (
                      <div className="relative w-full aspect-[16/10] bg-black/60 border-t border-white/10">
                        {mediaList[0].type === "image" ? (
                          <Image
                            src={mediaList[0].url}
                            alt={mediaList[0].label}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-rose-400">
                            <span className="text-3xl">🎬</span>
                            <span className="text-xs font-mono mt-1">Video Gameplay</span>
                          </div>
                        )}

                        {mediaList.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] font-mono text-white border border-white/20 shadow">
                            +{mediaList.length - 1} tệp khác (Album)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Box */}
                    <div className="p-2.5 bg-[#070918] border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Fanpage: 1422359914290932</span>
                      <span className="text-[#3fe9d6]">Meta Graph v19.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#0ea5e9] hover:opacity-95 text-white font-bold text-xs font-mono tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(24,119,242,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Xuất Bản Lên Facebook...</span>
                    </>
                  ) : (
                    <>
                      <span>📘</span>
                      <span>{post.facebookPostId ? "Đăng Lại Bài Mới Lên Fanpage" : "Đăng Lên Fanpage Ngay"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
