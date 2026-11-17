"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  BlogPost,
  blogsService,
  DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE,
} from "@/services/blogs.service";
import {
  facebookSocialService,
  FacebookMetrics,
  FacebookCommentItem,
} from "@/services/facebookSocial.service";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";
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
  const currentUser = useAuth();
  const canPublishFB = currentUser?.role === "Admin" || hasPermission(currentUser, "content.facebook.publish");
  const canBot = currentUser?.role === "Admin" || hasPermission(currentUser, "content.facebook.bot");

  const [activeTab, setActiveTab] = useState<"community" | "publish">(() =>
    post.facebookPostId ? "community" : "publish"
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Auto-Reply Bot State
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(() =>
    Boolean(post.facebookAutoReplyEnabled)
  );
  const [autoReplyMessage, setAutoReplyMessage] = useState<string>(() =>
    post.facebookAutoReplyMessage || DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE
  );
  const [repliedCommentIds, setRepliedCommentIds] = useState<string[]>(() =>
    post.facebookRepliedCommentIds || []
  );
  const [isSavingAutoReply, setIsSavingAutoReply] = useState(false);
  const [autoReplySaveSuccess, setAutoReplySaveSuccess] = useState<string | null>(null);
  const [isBatchReplying, setIsBatchReplying] = useState(false);
  const [batchReplyNotice, setBatchReplyNotice] = useState<string | null>(null);
  const autoReplyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lastProcessedCommentsKey = useRef<string>("");

  // Đồng bộ cấu hình auto-reply khi post thay đổi
  useEffect(() => {
    setAutoReplyEnabled(Boolean(post.facebookAutoReplyEnabled));
    setAutoReplyMessage(
      post.facebookAutoReplyMessage || DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE
    );
    setRepliedCommentIds(post.facebookRepliedCommentIds || []);
  }, [
    post.facebookAutoReplyEnabled,
    post.facebookAutoReplyMessage,
    post.facebookRepliedCommentIds,
  ]);

  // Kiểm tra bình luận đã có reply của Fanpage chưa
  const isAlreadyRepliedByPage = useCallback(
    (cmt: FacebookCommentItem): boolean => {
      // Đã có trong danh sách ID đã rep ở Firestore
      if (repliedCommentIds.includes(cmt.id)) return true;
      // Đã có sub-reply từ Official/Fanpage
      if (cmt.replies && cmt.replies.length > 0) {
        const hasOfficialReply = cmt.replies.some((r) => {
          const author = (r.from?.name || "").toLowerCase();
          return (
            author.includes("official") ||
            author.includes("valkyria") ||
            author.includes("veyra") ||
            author.includes("admin")
          );
        });
        if (hasOfficialReply) return true;
      }
      return false;
    },
    [repliedCommentIds]
  );

  // Danh sách các bình luận hợp lệ đang chờ được trả lời tự động
  const pendingCandidateComments = useMemo(() => {
    return comments.filter((c) => !isAlreadyRepliedByPage(c));
  }, [comments, isAlreadyRepliedByPage]);

  // Hàm thực thi tự động trả lời bình luận (Batch Auto-Reply)
  const handleRunBatchAutoReply = useCallback(
    async (
      candidatesToReply?: FacebookCommentItem[],
      templateOverride?: string
    ) => {
      const candidates = candidatesToReply ?? pendingCandidateComments;
      const template = (templateOverride ?? autoReplyMessage).trim();

      if (!candidates || candidates.length === 0) {
        setBatchReplyNotice("Hiện không có bình luận mới nào cần trả lời.");
        setTimeout(() => setBatchReplyNotice(null), 3500);
        return;
      }

      if (!template) {
        setBatchReplyNotice("Vui lòng nhập nội dung mẫu tin nhắn tự động trả lời.");
        setTimeout(() => setBatchReplyNotice(null), 3500);
        return;
      }

      setIsBatchReplying(true);
      setBatchReplyNotice(`Đang tự động trả lời ${candidates.length} bình luận...`);

      const newlyRepliedIds: string[] = [];
      const updatedRepliesMap: Record<string, { id: string; message: string }> = {};

      try {
        for (const cmt of candidates) {
          const userDisplayName = cmt.from?.name || "Chỉ Huy";
          const customizedText = template
            .replace(/\{name\}/g, userDisplayName)
            .replace(/\{post_title\}/g, post.title)
            .trim();

          try {
            const res = await facebookSocialService.replyComment(cmt.id, customizedText);
            if (res.success) {
              newlyRepliedIds.push(cmt.id);
              updatedRepliesMap[cmt.id] = {
                id: res.replyId || `auto-${Date.now()}-${cmt.id}`,
                message: customizedText,
              };
            }
          } catch (replyErr) {
            console.warn(`Lỗi khi auto-reply comment ${cmt.id}:`, replyErr);
          }
        }

        if (newlyRepliedIds.length > 0) {
          try {
            const combined = await blogsService.addFacebookRepliedCommentIds(
              post.id,
              newlyRepliedIds
            );
            setRepliedCommentIds(combined);
            onPostUpdated({
              ...post,
              facebookRepliedCommentIds: combined,
            });
          } catch (dbErr) {
            console.warn("Không thể lưu cache comment ID vào Firestore:", dbErr);
            setRepliedCommentIds((prev) =>
              Array.from(new Set([...prev, ...newlyRepliedIds]))
            );
          }

          // Cập nhật UI comments local ngay tức thì
          setComments((prev) =>
            prev.map((c) => {
              if (updatedRepliesMap[c.id]) {
                const currentSub = c.replies || [];
                return {
                  ...c,
                  replies: [
                    ...currentSub,
                    {
                      id: updatedRepliesMap[c.id].id,
                      from: { name: "Valkyria of Veyra (Official)" },
                      message: updatedRepliesMap[c.id].message,
                      created_time: new Date().toISOString(),
                    },
                  ],
                };
              }
              return c;
            })
          );

          soundEngine.playCelestialChime();
          setBatchReplyNotice(
            `✓ Đã tự động trả lời ${newlyRepliedIds.length} bình luận thành công!`
          );
        } else {
          setBatchReplyNotice("Không thể gửi phản hồi tự động. Vui lòng kiểm tra quyền truy cập Facebook.");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lỗi xử lý tự động trả lời";
        setBatchReplyNotice(`✕ ${msg}`);
      } finally {
        setIsBatchReplying(false);
        setTimeout(() => setBatchReplyNotice(null), 5000);
      }
    },
    [pendingCandidateComments, autoReplyMessage, post, onPostUpdated]
  );

  // Lưu cấu hình Auto-Reply vào Firestore
  const handleSaveAutoReplyConfig = async (
    nextEnabled?: boolean,
    nextMessage?: string
  ) => {
    const enabledToSave =
      typeof nextEnabled === "boolean" ? nextEnabled : autoReplyEnabled;
    const msgToSave =
      typeof nextMessage === "string" ? nextMessage : autoReplyMessage;

    setIsSavingAutoReply(true);
    setAutoReplySaveSuccess(null);
    try {
      await blogsService.updateFacebookAutoReply(post.id, enabledToSave, msgToSave);
      const updated: BlogPost = {
        ...post,
        facebookAutoReplyEnabled: enabledToSave,
        facebookAutoReplyMessage: msgToSave,
      };
      onPostUpdated(updated);
      soundEngine.playCelestialChime();
      setAutoReplySaveSuccess(
        enabledToSave
          ? "✓ Đã kích hoạt & lưu cấu hình tự động trả lời!"
          : "✓ Đã lưu cấu hình (tự động trả lời đang TẮT)."
      );
      setTimeout(() => setAutoReplySaveSuccess(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi lưu cấu hình tự động trả lời");
    } finally {
      setIsSavingAutoReply(false);
    }
  };

  // Toggle Bật / Tắt Auto-Reply
  const handleToggleAutoReply = async () => {
    if (!canBot) {
      alert("Tài khoản chưa được cấp quyền điều chỉnh Bot Auto-Reply.");
      return;
    }
    soundEngine.playClick();
    const next = !autoReplyEnabled;
    setAutoReplyEnabled(next);
    await handleSaveAutoReplyConfig(next, autoReplyMessage);
    // Nếu vừa BẬT và có bình luận đang chờ, kích hoạt trả lời ngay
    if (next && pendingCandidateComments.length > 0) {
      handleRunBatchAutoReply(pendingCandidateComments, autoReplyMessage);
    }
  };

  // Chèn thẻ placeholder vào tin nhắn mẫu
  const handleInsertPlaceholder = (placeholder: string) => {
    soundEngine.playClick();
    const textarea = autoReplyTextareaRef.current;
    if (!textarea) {
      setAutoReplyMessage((prev) => prev + " " + placeholder);
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = autoReplyMessage.substring(0, start);
    const after = autoReplyMessage.substring(end);
    const updated = `${before}${placeholder}${after}`;
    setAutoReplyMessage(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
    }, 10);
  };

  // Khôi phục tin nhắn mẫu mặc định
  const handleResetToDefaultTemplate = () => {
    soundEngine.playClick();
    setAutoReplyMessage(DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE);
  };

  // Tự động quét và rep comment mới khi mở modal hoặc refresh bình luận nếu bot đang BẬT
  useEffect(() => {
    if (!autoReplyEnabled || !isOpen || isBatchReplying) return;
    if (comments.length === 0) return;

    // Tránh quét liên tục nếu tập hợp comment không thay đổi
    const currentKey = comments.map((c) => c.id).join(",");
    if (currentKey === lastProcessedCommentsKey.current) return;

    const unreplied = comments.filter((c) => !isAlreadyRepliedByPage(c));
    if (unreplied.length > 0) {
      lastProcessedCommentsKey.current = currentKey;
      const timer = setTimeout(() => {
        handleRunBatchAutoReply(unreplied, autoReplyMessage);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    comments,
    autoReplyEnabled,
    isOpen,
    isBatchReplying,
    isAlreadyRepliedByPage,
    autoReplyMessage,
    handleRunBatchAutoReply,
  ]);

  // Tải dữ liệu tương tác & bình luận khi mở tab Community
  const loadCommunityData = useCallback(async (overridePostId?: unknown) => {
    const targetPostId = typeof overridePostId === "string" ? overridePostId : post.facebookPostId;
    if (!targetPostId || targetPostId === "[object Object]") return;
    setIsLoadingCommunity(true);
    try {
      const [metricsData, commentsData, storedRepliedIds] = await Promise.all([
        facebookSocialService.getMetrics(targetPostId).catch(() => null),
        facebookSocialService.getComments(targetPostId).catch(() => ({
          comments: [],
        })),
        blogsService.getFacebookRepliedCommentIds(post.id).catch(() => []),
      ]);

      if (metricsData) {
        setMetrics(metricsData);
      }
      if (commentsData) {
        setComments(commentsData.comments || []);
      }
      if (storedRepliedIds && storedRepliedIds.length > 0) {
        setRepliedCommentIds(storedRepliedIds);
      }
    } catch (err) {
      console.warn("Lỗi tải tương tác Facebook:", err);
    } finally {
      setIsLoadingCommunity(false);
    }
  }, [post.facebookPostId, post.id]);

  useEffect(() => {
    if (!isOpen || !post.facebookPostId) return;
    let active = true;

    Promise.all([
      facebookSocialService.getMetrics(post.facebookPostId).catch(() => null),
      facebookSocialService.getComments(post.facebookPostId).catch(() => ({
        comments: [],
      })),
      blogsService.getFacebookRepliedCommentIds(post.id).catch(() => []),
    ]).then(([metricsData, commentsData, storedRepliedIds]) => {
      if (!active) return;
      if (metricsData) {
        setMetrics(metricsData);
      }
      if (commentsData) {
        setComments(commentsData.comments || []);
      }
      if (storedRepliedIds && storedRepliedIds.length > 0) {
        setRepliedCommentIds(storedRepliedIds);
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
    if (!canPublishFB) {
      setPublishError("Tài khoản chưa được cấp quyền đăng bài lên Fanpage Facebook.");
      return;
    }
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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
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

              {/* CARD: TỰ ĐỘNG TRẢ LỜI BÌNH LUẬN (AUTO-REPLY BOT) */}
              <div
                className={`p-5 rounded-2xl transition-all duration-300 border ${
                  autoReplyEnabled
                    ? "bg-gradient-to-b from-[#09152b] via-[#070e22] to-[#060a1a] border-[#10b981]/40 shadow-[0_0_35px_rgba(16,185,129,0.18)]"
                    : "bg-[#080c24] border-white/10"
                } space-y-4`}
              >
                {/* Header Card: Icon, Title & Toggle Switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all ${
                        autoReplyEnabled
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                          : "bg-white/5 text-slate-400 border border-white/10"
                      }`}
                    >
                      🤖
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                          Tự Động Trả Lời Bình Luận (Auto-Reply Bot)
                        </h4>
                        {autoReplyEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                            OFF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tự động phản hồi bình luận mới của Chỉ Huy dưới danh nghĩa Fanpage
                      </p>
                    </div>
                  </div>

                  {/* TOGGLE SWITCH BẬT / TẮT */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span
                      className={`text-xs font-bold font-mono transition-colors ${
                        autoReplyEnabled ? "text-emerald-400" : "text-slate-400"
                      }`}
                    >
                      {autoReplyEnabled ? "ĐANG BẬT" : "ĐANG TẮT"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoReplyEnabled}
                      onClick={handleToggleAutoReply}
                      disabled={isSavingAutoReply || !canBot}
                      title={canBot ? "Bật / tắt bot tự động" : "Bạn chưa được cấp quyền điều chỉnh Bot Auto-Reply"}
                      className={`relative inline-flex h-7 w-14 shrink-0 rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        !canBot ? "cursor-not-allowed" : "cursor-pointer"
                      } ${
                        autoReplyEnabled
                          ? "bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                          : "bg-slate-800 border-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                          autoReplyEnabled ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Form Soạn Mẫu Tin Nhắn Trả Lời Tự Động */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>✍️</span>
                      <span>Mẫu Tin Nhắn Tự Động:</span>
                    </label>

                    {/* Quick Insert Placeholders */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400 text-[10px]">Chèn biến:</span>
                      <button
                        type="button"
                        onClick={() => handleInsertPlaceholder("{name}")}
                        className="px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[#3fe9d6] border border-cyan-500/30 font-mono transition-colors cursor-pointer"
                        title="Chèn tên của người bình luận"
                      >
                        + &#123;name&#125;
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertPlaceholder("{post_title}")}
                        className="px-2 py-0.5 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/30 font-mono transition-colors cursor-pointer"
                        title="Chèn tiêu đề bài viết"
                      >
                        + &#123;post_title&#125;
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToDefaultTemplate}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="Khôi phục lại tin nhắn mẫu mặc định"
                      >
                        ↺ Mặc định
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={autoReplyTextareaRef}
                    value={autoReplyMessage}
                    onChange={(e) => setAutoReplyMessage(e.target.value)}
                    rows={3}
                    placeholder="Nhập nội dung tin nhắn bot sẽ gửi tự động đến Chỉ Huy..."
                    className="w-full p-3 rounded-xl bg-[#050716] border border-white/10 focus:border-[#3fe9d6] text-xs text-white placeholder-slate-500 focus:outline-none transition-all leading-relaxed font-sans"
                  />

                  <p className="text-[10px] text-slate-400 leading-normal">
                    💡 <strong className="text-slate-300">&#123;name&#125;</strong> sẽ được tự động thay thế bằng tên của Chỉ Huy để lại bình luận. Mỗi bình luận chỉ được trả lời một lần duy nhất.
                  </p>
                </div>

                {/* Feedback Alerts */}
                {autoReplySaveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                    <span>✓</span>
                    <span>{autoReplySaveSuccess}</span>
                  </div>
                )}

                {batchReplyNotice && (
                  <div className="p-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 text-cyan-300 text-xs flex items-center gap-2 animate-fade-in">
                    <span className="animate-spin">⚙</span>
                    <span>{batchReplyNotice}</span>
                  </div>
                )}

                {/* Footer Bar: Thống kê & Thao tác */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-mono">
                      🛡️ Đã rep: <strong className="text-white">{repliedCommentIds.length}</strong>
                    </span>

                    {pendingCandidateComments.length > 0 ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[#f5c767] font-mono">
                        ⏳ <strong>{pendingCandidateComments.length}</strong> bình luận mới đang chờ
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                        ✓ Đã phản hồi tất cả
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveAutoReplyConfig()}
                      disabled={isSavingAutoReply}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>💾</span>
                      <span>{isSavingAutoReply ? "Đang lưu..." : "Lưu Cấu Hình"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunBatchAutoReply()}
                      disabled={isBatchReplying || pendingCandidateComments.length === 0}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#0ea5e9] hover:from-[#166fe5] hover:to-[#0284c7] text-white text-xs font-bold shadow-[0_0_15px_rgba(24,119,242,0.4)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <span>⚡</span>
                      <span>{isBatchReplying ? "Đang quét..." : "Quét & Trả Lời Ngay"}</span>
                    </button>
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
                        <div className="pl-10 pt-1 flex flex-wrap items-center gap-2.5">
                          {isAlreadyRepliedByPage(cmt) ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono flex items-center gap-1">
                              <span>✓</span>
                              <span>Đã có phản hồi</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRunBatchAutoReply([cmt])}
                              disabled={isBatchReplying}
                              className="text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              title="Gửi ngay mẫu tin nhắn tự động cho bình luận này"
                            >
                              <span>🤖</span>
                              <span>Gửi tin nhắn mẫu bot</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setActiveReplyBoxId(activeReplyBoxId === cmt.id ? null : cmt.id);
                            }}
                            className="text-[11px] font-bold text-[#1877F2] hover:text-[#3fe9d6] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>↩</span>
                            <span>{activeReplyBoxId === cmt.id ? "Hủy Soạn" : "Trả lời thủ công"}</span>
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
                      <span>Fanpage: Valkyria of Veyra Official</span>
                      <span className="text-[#3fe9d6]">Kênh Truyền Thông Chính Thức</span>
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
    </div>,
    document.body
  );
}
