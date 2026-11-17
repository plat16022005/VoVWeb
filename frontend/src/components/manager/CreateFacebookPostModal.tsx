"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  BlogPost,
  blogsService,
  DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE,
} from "@/services/blogs.service";
import { facebookSocialService } from "@/services/facebookSocial.service";
import { uploadMediaToR2 } from "@/services/r2Upload.service";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";
import { convertBlogToFacebookText } from "@/utils/facebookFormatter";
import GameLogo from "@/components/common/GameLogo";

interface CreateFacebookPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBlogPosts: BlogPost[];
  onPublished: (newOrUpdatedPost: BlogPost) => void;
}

const PRESET_GAME_IMAGES = [
  {
    title: "Veyra Key Visual",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&q=80",
  },
  {
    title: "Closed Beta Banner",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80",
  },
  {
    title: "Valkyria Awakening",
    url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&q=80",
  },
  {
    title: "Event & Giftcode",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",
  },
];

const STANDARD_HASHTAGS = "#ValkyriaOfVeyra #VoVRPG #TurnBasedRPG #GamingNews #Veyra";

export default function CreateFacebookPostModal({
  isOpen,
  onClose,
  availableBlogPosts,
  onPublished,
}: CreateFacebookPostModalProps) {
  const currentUser = useAuth();
  const canPublishFB =
    currentUser?.role === "Admin" || hasPermission(currentUser, "content.facebook.publish");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mode: "direct" (soạn mới trực tiếp) | "from_blog" (chọn từ blog có sẵn)
  const [creationMode, setCreationMode] = useState<"direct" | "from_blog">("direct");
  const [selectedBlogId, setSelectedBlogId] = useState<string>("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tin Tức");
  const [caption, setCaption] = useState(
    `⚔️ VALKYRIA OF VEYRA - BẢN TIN CHÍNH THỨC\n\nKính chào các Chỉ Huy!\n\nChúng tôi xin trân trọng thông báo...\n\n👉 Theo dõi ngay Fanpage để không bỏ lỡ đợt Closed Beta!\n\n${STANDARD_HASHTAGS}`
  );
  const [coverUrl, setCoverUrl] = useState(PRESET_GAME_IMAGES[0].url);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  // File Upload State
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-Reply Bot
  const [enableAutoReply, setEnableAutoReply] = useState(true);
  const [autoReplyMessage, setAutoReplyMessage] = useState(DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE);

  // Status
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Khi chọn bài blog có sẵn
  const handleSelectBlogPost = (blogId: string) => {
    setSelectedBlogId(blogId);
    if (!blogId) return;

    const blog = availableBlogPosts.find((b) => b.id === blogId);
    if (!blog) return;

    soundEngine.playClick();
    setTitle(blog.title);
    setCategory(blog.category || "Tin Tức");
    if (blog.coverUrl) setCoverUrl(blog.coverUrl);

    // Chuyển đổi nội dung blog sang định dạng văn bản Facebook tối ưu
    const richCaption = convertBlogToFacebookText({
      title: blog.title,
      excerpt: blog.excerpt,
      contentHtml: blog.content || "",
      postUrl: `https://valkyria.veyra.io/blog/${blog.id}`,
    });
    setCaption(richCaption);
  };

  // Upload ảnh bìa từ máy tính qua Cloudflare R2
  const handleUploadCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    soundEngine.playClick();
    setIsUploadingCover(true);
    setCoverProgress(0);
    setErrorMessage(null);

    try {
      const res = await uploadMediaToR2(file, (percent) => {
        setCoverProgress(percent);
      });
      setCoverUrl(res.publicUrl);
      soundEngine.playCelestialChime();
    } catch (err: any) {
      console.error("Lỗi upload ảnh:", err);
      setErrorMessage(err?.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Kéo thả file ảnh
  const handleDropCoverFile = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    soundEngine.playClick();
    setIsUploadingCover(true);
    setCoverProgress(0);
    setErrorMessage(null);

    try {
      const res = await uploadMediaToR2(file, (percent) => {
        setCoverProgress(percent);
      });
      setCoverUrl(res.publicUrl);
      soundEngine.playCelestialChime();
    } catch (err: any) {
      console.error("Lỗi upload ảnh kéo thả:", err);
      setErrorMessage(err?.message || "Không thể tải ảnh lên.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Upload nhiều ảnh phụ từ máy tính vào Album
  const handleUploadAdditionalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    e.target.value = "";

    soundEngine.playClick();
    setIsUploadingAdditional(true);
    setErrorMessage(null);

    try {
      for (const file of fileList) {
        const res = await uploadMediaToR2(file);
        setAdditionalImages((prev) => [...prev, res.publicUrl]);
      }
      soundEngine.playCelestialChime();
    } catch (err: any) {
      console.error("Lỗi upload ảnh phụ:", err);
      setErrorMessage(err?.message || "Không thể tải một số ảnh phụ lên.");
    } finally {
      setIsUploadingAdditional(false);
    }
  };

  // Thêm ảnh phụ qua URL
  const handleAddAdditionalImageUrl = () => {
    if (!newImageUrl.trim()) return;
    soundEngine.playClick();
    setAdditionalImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveAdditionalImage = (index: number) => {
    soundEngine.playClick();
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Chèn nhanh các đoạn mẫu vào Caption
  const appendToCaption = (text: string) => {
    soundEngine.playClick();
    setCaption((prev) => (prev ? `${prev}\n\n${text}` : text));
  };

  const insertEmoji = (emoji: string) => {
    soundEngine.playClick();
    setCaption((prev) => `${prev} ${emoji} `);
  };

  // Tất cả media gửi tới Facebook API
  const allMediaItems = useMemo(() => {
    const list: { type: "image" | "video"; url: string; label?: string }[] = [];
    if (coverUrl.trim().startsWith("http")) {
      list.push({ type: "image", url: coverUrl.trim(), label: "Ảnh Bìa" });
    }
    additionalImages.forEach((img, i) => {
      if (img.trim().startsWith("http")) {
        list.push({ type: "image", url: img.trim(), label: `Ảnh phụ ${i + 1}` });
      }
    });
    return list;
  }, [coverUrl, additionalImages]);

  // Xử lý Đăng bài
  const handlePublishToFacebook = async () => {
    if (!canPublishFB) {
      setErrorMessage("Tài khoản của bạn chưa được cấp quyền đăng bài Facebook.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập tiêu đề hoặc chủ đề bài viết.");
      return;
    }
    if (!caption.trim()) {
      setErrorMessage("Vui lòng nhập nội dung bài đăng Facebook.");
      return;
    }

    soundEngine.playClick();
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      let targetPost: BlogPost;

      // 1. Trường hợp chọn bài blog có sẵn
      if (creationMode === "from_blog" && selectedBlogId) {
        const found = availableBlogPosts.find((b) => b.id === selectedBlogId);
        if (!found) throw new Error("Không tìm thấy bài viết blog đã chọn.");
        targetPost = found;
      } else {
        // 2. Trường hợp soạn bài trực tiếp -> Tạo record
        targetPost = await blogsService.createPost(
          {
            title: title.trim(),
            category: category || "Tin Tức",
            excerpt: caption.slice(0, 150).replace(/\n/g, " "),
            coverUrl: coverUrl.trim() || PRESET_GAME_IMAGES[0].url,
            content: `<p>${caption.replace(/\n/g, "<br/>")}</p>`,
          },
          "Published"
        );
      }

      // 3. Gửi đăng bài lên Fanpage qua Meta Graph API
      const publishResult = await facebookSocialService.publishPost({
        postId: targetPost.id,
        title: title.trim(),
        excerpt: caption.slice(0, 150),
        coverUrl: coverUrl.trim() || undefined,
        customCaption: caption,
        mediaItems: allMediaItems,
      });

      // 4. Đồng bộ FacebookPostId vào bài viết
      await blogsService.linkFacebookPost(
        targetPost.id,
        publishResult.facebookPostId,
        publishResult.facebookPostUrl
      );

      // 5. Cập nhật cấu hình Auto-Reply Bot nếu được bật
      if (enableAutoReply) {
        await blogsService.updateFacebookAutoReply(
          targetPost.id,
          true,
          autoReplyMessage.trim() || DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE
        );
      }

      const finalPost: BlogPost = {
        ...targetPost,
        facebookPostId: publishResult.facebookPostId,
        facebookPostUrl: publishResult.facebookPostUrl,
        facebookPublishedAt: Date.now(),
        facebookAutoReplyEnabled: enableAutoReply,
        facebookAutoReplyMessage: autoReplyMessage,
      };

      soundEngine.playCelestialChime();
      onPublished(finalPost);
      onClose();
    } catch (err: any) {
      console.error("Lỗi đăng bài Facebook:", err);
      setErrorMessage(err?.message || "Không thể đăng bài lên Facebook. Vui lòng kiểm tra lại cấu hình kết nối.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#070919] border border-[#1877F2]/40 shadow-[0_0_80px_rgba(24,119,242,0.35)] overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={coverFileInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUploadCoverFile}
          className="hidden"
        />
        <input
          type="file"
          ref={additionalFileInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleUploadAdditionalFiles}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-[#0c1438] via-[#080d24] to-[#0c1438] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(24,119,242,0.5)] shrink-0">
              f
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-[family-name:var(--font-rajdhani)] text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                  ĐĂNG BÀI VIẾT LÊN FANPAGE FACEBOOK
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                  TRỰC TIẾP
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Valkyria of Veyra Official Fanpage · Kênh Truyền Thông Chính Thức
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-mono"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* CỘT TRÁI: FORM SOẠN THẢO (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Chọn Nguồn Nội Dung */}
            <div className="p-1 rounded-2xl bg-[#040612] border border-white/10 flex items-center gap-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setCreationMode("direct");
                }}
                className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  creationMode === "direct"
                    ? "bg-[#1877F2] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>✍️</span>
                <span>Soạn Bài Mới Trực Tiếp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setCreationMode("from_blog");
                }}
                className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  creationMode === "from_blog"
                    ? "bg-[#1877F2] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>📰</span>
                <span>Chọn Từ Bài Viết Blog ({availableBlogPosts.length})</span>
              </button>
            </div>

            {/* Chọn Blog Dropdown (Nếu chọn from_blog) */}
            {creationMode === "from_blog" && (
              <div className="p-3.5 rounded-2xl bg-[#090d26] border border-[#1877F2]/30 space-y-2">
                <label className="block text-xs font-bold text-[#3fe9d6] uppercase tracking-wider font-mono">
                  Chọn bài viết cần đăng lên Facebook:
                </label>
                <select
                  value={selectedBlogId}
                  onChange={(e) => handleSelectBlogPost(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#050716] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#1877F2] transition-colors"
                >
                  <option value="">-- Bấm để chọn bài viết Blog có sẵn --</option>
                  {availableBlogPosts.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.category || "Tin Tức"}] {b.title} {b.facebookPostId ? "(Đã lên FB)" : "(Chưa đăng)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 2. Tiêu Đề Bài Đăng */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Tiêu Đề / Chủ Đề Bài Đăng <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: [SỰ KIỆN] Khai mở máy chủ Veyra-01 và chuỗi quà tặng Closed Beta"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050716] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#1877F2] transition-colors"
              />
            </div>

            {/* 3. KHU VỰC HÌNH ẢNH ĐÍNH KÈM (MEDIA) */}
            <div className="p-4 rounded-2xl bg-[#050716] border border-white/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>🖼️</span>
                  <span>Hình Ảnh Đính Kèm ({allMediaItems.length} ảnh)</span>
                </label>
                <span className="text-[10px] text-[#3fe9d6] font-mono">
                  {allMediaItems.length > 1 ? "Đăng dạng Album ảnh" : "Đăng ảnh đơn"}
                </span>
              </div>

              {/* Box Upload & Xem trước ảnh bìa chính */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDropCoverFile}
                className={`relative rounded-2xl border-2 transition-all p-3 text-center ${
                  isDragging
                    ? "border-[#1877F2] bg-[#1877F2]/10"
                    : "border-dashed border-white/20 bg-[#07091e]/60 hover:border-[#1877F2]/50"
                }`}
              >
                {coverUrl ? (
                  <div className="space-y-2.5">
                    {/* Thumbnail Xem Trước Ảnh Chính */}
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/10 bg-black/50 shadow-inner">
                      <Image
                        src={coverUrl}
                        alt="Ảnh Bìa"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] text-emerald-300 font-mono border border-emerald-500/30">
                        ✓ Ảnh Bìa Chính
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoverUrl("")}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs transition-colors cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Nút hành động thay đổi ảnh */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isUploadingCover}
                        onClick={() => coverFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563eb] text-white text-xs font-mono font-bold hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <span>📁</span>
                        <span>{isUploadingCover ? `Đang tải ${coverProgress}%...` : "Thay Ảnh Từ Máy Tính"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors"
                      >
                        {showUrlInput ? "Ẩn Nhập Link" : "Dán Link Ảnh Khác"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Khung mời tải ảnh nếu chưa có */
                  <div className="py-6 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/30 flex items-center justify-center text-2xl text-[#1877F2]">
                      ☁️
                    </div>
                    <div>
                      <button
                        type="button"
                        disabled={isUploadingCover}
                        onClick={() => coverFileInputRef.current?.click()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563eb] hover:from-[#1d4ed8] hover:to-[#1877F2] text-white font-bold text-xs font-mono shadow-[0_0_20px_rgba(24,119,242,0.4)] transition-all inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span>📁</span>
                        <span>{isUploadingCover ? `Đang tải lên ${coverProgress}%...` : "Tải Ảnh Từ Máy Tính"}</span>
                      </button>
                      <p className="text-[11px] text-slate-400 font-mono mt-2">
                        hoặc kéo thả file ảnh vào đây (Hỗ trợ JPG, PNG, WebP)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-xs font-mono text-[#3fe9d6] hover:underline"
                    >
                      Hoặc dán URL link ảnh trực tiếp
                    </button>
                  </div>
                )}

                {/* Progress bar nếu đang upload */}
                {isUploadingCover && (
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-[#1877F2] to-[#3fe9d6] transition-all duration-200"
                      style={{ width: `${coverProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Ô dán URL trực tiếp (Nếu bấm hiện) */}
              {showUrlInput && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono text-slate-400">Dán trực tiếp URL ảnh:</span>
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-[#080d26] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
              )}

              {/* Ảnh mẫu có sẵn từ game */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono text-slate-400">Ảnh mẫu chất lượng cao từ game:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_GAME_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setCoverUrl(preset.url);
                      }}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden border transition-all text-left group cursor-pointer ${
                        coverUrl === preset.url
                          ? "border-[#1877F2] ring-2 ring-[#1877F2]/50 scale-[1.02]"
                          : "border-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={preset.url}
                        alt={preset.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-1 bg-black/85 text-[9px] text-white font-mono truncate">
                        {preset.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Khu vực thêm ảnh phụ vào Album */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-300 font-bold">
                    Thêm ảnh phụ vào Album ({additionalImages.length} ảnh):
                  </span>
                  <button
                    type="button"
                    disabled={isUploadingAdditional}
                    onClick={() => additionalFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>+</span>
                    <span>{isUploadingAdditional ? "Đang tải ảnh..." : "Tải Thêm Từ Máy"}</span>
                  </button>
                </div>

                {/* Nhập URL ảnh phụ */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Hoặc dán URL ảnh phụ cần thêm..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#080d26] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#1877F2]"
                  />
                  <button
                    type="button"
                    onClick={handleAddAdditionalImageUrl}
                    className="px-3 py-1.5 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] hover:text-white border border-[#1877F2]/30 text-xs font-mono font-bold"
                  >
                    + Thêm Link
                  </button>
                </div>

                {/* Grid xem trước các ảnh phụ */}
                {additionalImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {additionalImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-lg overflow-hidden border border-white/15 bg-black/40 group"
                      >
                        <Image
                          src={img}
                          alt={`Ảnh phụ ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/50 flex items-center justify-center text-[10px] hover:bg-rose-900 transition-colors"
                          title="Xóa ảnh này"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Nội Dung Bài Viết (Caption) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Nội Dung Caption Bài Viết <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {caption.length} ký tự
                </span>
              </div>

              {/* Quick Snippets & Emoji Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[#050716] border border-white/10 text-xs font-mono">
                <span className="text-slate-400 text-[10px] mr-1">Chèn nhanh:</span>
                <button
                  type="button"
                  onClick={() => appendToCaption("⚔️ VALKYRIA OF VEYRA - BẢN TIN CHÍNH THỨC")}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]"
                >
                  + Tiêu Đề Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => appendToCaption("👉 Theo dõi Fanpage & tham gia cộng đồng Chỉ Huy ngay hôm nay!")}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]"
                >
                  + CTA Kêu Gọi
                </button>
                <button
                  type="button"
                  onClick={() => appendToCaption(STANDARD_HASHTAGS)}
                  className="px-2 py-0.5 rounded bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] text-[11px] font-bold"
                >
                  + Bộ Hashtag
                </button>

                <div className="h-4 w-[1px] bg-white/15 mx-1" />

                {["✨", "⚔️", "🛡️", "💎", "🎁", "🚀", "🔥", "👑", "📢"].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => insertEmoji(em)}
                    className="p-1 hover:bg-white/10 rounded text-xs transition-colors"
                  >
                    {em}
                  </button>
                ))}
              </div>

              <textarea
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Nhập nội dung bài đăng Facebook..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#050716] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-[#1877F2] transition-colors resize-y custom-scrollbar"
              />
            </div>

            {/* 5. Cấu hình Bot Auto-Reply */}
            <div className="p-3.5 rounded-2xl bg-[#050716] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🤖</span>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Bot Tự Động Trả Lời Bình Luận
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAutoReply}
                    onChange={(e) => {
                      soundEngine.playClick();
                      setEnableAutoReply(e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {enableAutoReply && (
                <div className="space-y-1 pt-1">
                  <textarea
                    rows={2}
                    value={autoReplyMessage}
                    onChange={(e) => setAutoReplyMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d26] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    💡 Hỗ trợ cú pháp <code className="text-emerald-400">{"{name}"}</code> để tự động gọi tên tài khoản bình luận.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: MÔ PHỎNG LIVE PREVIEW TRÊN FACEBOOK (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Mô Phỏng Trực Tiếp Trên Facebook
              </label>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Preview
              </span>
            </div>

            {/* Khung mô phỏng bài viết Facebook */}
            <div className="rounded-2xl bg-[#090d24] border border-[#1877F2]/30 overflow-hidden shadow-2xl text-xs font-sans sticky top-2">
              {/* Header Fanpage */}
              <div className="p-3.5 flex items-center gap-3 border-b border-white/5 bg-[#060818]">
                <div className="w-10 h-10 rounded-full bg-[#0a0f2c] border border-[#f5c767]/40 p-1 flex items-center justify-center shadow-[0_0_10px_rgba(24,119,242,0.35)] shrink-0 overflow-hidden">
                  <GameLogo className="w-full h-full" sizes="40px" />
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Valkyria of Veyra</span>
                    <span className="text-[#1877F2] text-xs">●</span>
                    <span className="px-1 py-0.2 rounded bg-[#1877F2]/20 text-[#1877F2] text-[9px] font-bold">
                      Trang chính thức
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Vừa xong</span>
                    <span>·</span>
                    <span>🌐 Công khai</span>
                  </div>
                </div>
              </div>

              {/* Caption Preview */}
              <div className="p-3.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto custom-scrollbar font-mono bg-black/20">
                {caption}
              </div>

              {/* Media Preview */}
              {allMediaItems.length > 0 && (
                <div className="relative w-full aspect-[16/10] bg-black/60 border-t border-white/10">
                  <Image
                    src={allMediaItems[0].url}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  {allMediaItems.length > 1 && (
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] font-mono text-white border border-white/20 shadow">
                      +{allMediaItems.length - 1} ảnh khác (Album)
                    </div>
                  )}
                </div>
              )}

              {/* Interactive buttons bar mock */}
              <div className="p-3 border-t border-white/10 bg-[#060818] flex items-center justify-between text-slate-400 text-xs font-mono">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 hover:text-[#1877F2]">
                    👍 Thích
                  </span>
                  <span className="flex items-center gap-1 hover:text-[#1877F2]">
                    💬 Bình luận
                  </span>
                  <span className="flex items-center gap-1 hover:text-[#1877F2]">
                    ↗️ Chia sẻ
                  </span>
                </div>
              </div>

              {/* Channel Info */}
              <div className="p-2.5 bg-[#040612] border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Kênh: Valkyria of Veyra Official</span>
                <span className="text-[#3fe9d6]">Đã xác thực</span>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#060818] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono text-slate-400">
            {canPublishFB ? (
              <span className="text-emerald-400">✓ Đủ quyền xuất bản lên Facebook Fanpage</span>
            ) : (
              <span className="text-rose-400">⚠️ Bạn cần quyền content.facebook.publish để đăng bài</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              disabled={isPublishing}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handlePublishToFacebook}
              disabled={isPublishing || !canPublishFB}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1877F2] via-[#2563eb] to-[#0ea5e9] hover:opacity-95 text-white font-bold text-xs font-mono tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(24,119,242,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang Xuất Bản Lên Facebook...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">📘</span>
                  <span>Xuất Bản Lên Fanpage Facebook</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
