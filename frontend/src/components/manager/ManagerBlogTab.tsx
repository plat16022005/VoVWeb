"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import RichTextEditor from "@/components/common/RichTextEditor";
import FacebookSocialHubModal from "./FacebookSocialHubModal";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";
import { uploadMediaToR2 } from "@/services/r2Upload.service";
import { hasPermission } from "@/data/permissions";
import {
  BLOG_CATEGORIES,
  BlogInput,
  BlogPost,
  blogsService,
} from "@/services/blogs.service";

const EMPTY_FORM: BlogInput = {
  title: "",
  category: BLOG_CATEGORIES[0],
  excerpt: "",
  coverUrl: "",
  content: "",
};

const NEW_ID = "__new__";

const formatDate = (ts: number | null) =>
  ts
    ? new Date(ts).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "—";

const toForm = (p: BlogPost): BlogInput => ({
  title: p.title,
  category: p.category,
  excerpt: p.excerpt,
  coverUrl: p.coverUrl,
  content: p.content,
});

export default function ManagerBlogTab() {
  const currentUser = useAuth();
  const canManage = currentUser?.role === "Admin" || currentUser?.role === "Manager";

  // Phân quyền chi tiết cho cụm Blog & Fanpage
  const canEdit = currentUser?.role === "Admin" || hasPermission(currentUser, "content.blog.edit");
  const canPublish = currentUser?.role === "Admin" || hasPermission(currentUser, "content.blog.publish");
  const canDelete = currentUser?.role === "Admin" || hasPermission(currentUser, "content.blog.delete");
  const canPublishFB = currentUser?.role === "Admin" || hasPermission(currentUser, "content.facebook.publish");
  const canViewFB = currentUser?.role === "Admin" || hasPermission(currentUser, "content.facebook.view");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogInput>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<BlogInput>(EMPTY_FORM);
  const [editorKey, setEditorKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);

  // Upload Cover State
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);

  const selected = useMemo(
    () => posts.find((p) => p.id === selectedId) || null,
    [posts, selectedId]
  );
  const isNew = selectedId === NEW_ID;
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsUploadingCover(true);
    setCoverProgress(0);
    soundEngine.playClick();

    try {
      const res = await uploadMediaToR2(file, (percent) => {
        setCoverProgress(percent);
      });
      patch({ coverUrl: res.publicUrl });
      soundEngine.playCelestialChime();
      showToast("ok", "Đã tải ảnh bìa lên Cloudflare R2 thành công!");
    } catch (err) {
      console.error("Lỗi upload ảnh bìa:", err);
      showToast("err", err instanceof Error ? err.message : "Tải ảnh bìa thất bại.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setPosts(await blogsService.getAllPosts());
    } catch (err) {
      console.error(err);
      setLoadError(
        "Không thể tải danh sách bài viết. Vui lòng thử lại sau hoặc liên hệ Quản Trị Viên."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    blogsService
      .getAllPosts()
      .then((data: BlogPost[]) => {
        if (active) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
        if (active) {
          setLoadError(
            "Không thể tải danh sách bài viết. Vui lòng thử lại sau hoặc liên hệ Quản Trị Viên."
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [canManage]);

  // Cảnh báo khi rời trang với nội dung chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const confirmDiscard = () =>
    !dirty || confirm("Bạn có thay đổi chưa lưu. Bỏ các thay đổi này?");

  const openPost = (post: BlogPost) => {
    if (post.id === selectedId || !confirmDiscard()) return;
    soundEngine.playClick();
    setSelectedId(post.id);
    setForm(toForm(post));
    setSavedForm(toForm(post));
    setEditorKey((k) => k + 1);
  };

  const startNew = () => {
    if (!confirmDiscard()) return;
    soundEngine.playClick();
    setSelectedId(NEW_ID);
    setForm(EMPTY_FORM);
    setSavedForm(EMPTY_FORM);
    setEditorKey((k) => k + 1);
  };

  const patch = (p: Partial<BlogInput>) => setForm((f) => ({ ...f, ...p }));

  const run = async (fn: () => Promise<void>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      soundEngine.playCelestialChime();
      showToast("ok", okMsg);
    } catch (err) {
      console.error(err);
      showToast("err", err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = () =>
    run(async () => {
      if (isNew) {
        const created = await blogsService.createPost(form, "Draft");
        setPosts((prev) => [created, ...prev]);
        setSelectedId(created.id);
      } else if (selected) {
        await blogsService.updatePost(selected.id, form);
        setPosts((prev) =>
          prev.map((p) => (p.id === selected.id ? { ...p, ...form, updatedAt: Date.now() } : p))
        );
      }
      setSavedForm(form);
    }, "Đã lưu bài viết!");

  const handlePublish = () =>
    run(async () => {
      if (isNew) {
        const created = await blogsService.createPost(form, "Published");
        setPosts((prev) => [created, ...prev]);
        setSelectedId(created.id);
      } else if (selected) {
        await blogsService.updatePost(selected.id, form);
        const publishedAt = await blogsService.setStatus(selected, "Published");
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selected.id
              ? { ...p, ...form, status: "Published", publishedAt, updatedAt: Date.now() }
              : p
          )
        );
      }
      setSavedForm(form);
    }, "Đã xuất bản bài viết!");

  const handleUnpublish = () => {
    if (!selected) return;
    run(async () => {
      await blogsService.setStatus(selected, "Draft");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selected.id ? { ...p, status: "Draft", updatedAt: Date.now() } : p
        )
      );
    }, "Đã gỡ bài viết về bản nháp.");
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`Xóa vĩnh viễn bài viết "${selected.title}"? Hành động này không thể hoàn tác.`)) return;
    run(async () => {
      await blogsService.deletePost(selected);
      setPosts((prev) => prev.filter((p) => p.id !== selected.id));
      setSelectedId(null);
      setForm(EMPTY_FORM);
      setSavedForm(EMPTY_FORM);
    }, "Đã xóa bài viết.");
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (!canManage) {
    return (
      <div className="p-12 rounded-2xl bg-[#090d24]/90 border border-white/10 text-center text-sm text-slate-400">
        Bạn cần đăng nhập bằng tài khoản Quản Trị Viên hoặc Quản Lý để quản lý bài viết.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
        {/* Danh sách bài viết */}
      <aside className="p-4 rounded-2xl bg-[#090d24]/90 border border-white/10 h-fit space-y-3 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {canEdit ? (
          <button
            onClick={startNew}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#f5c767] to-[#e67e22] text-[#060814] hover:brightness-110 transition-all cursor-pointer shadow-md"
          >
            + Viết Bài Mới
          </button>
        ) : (
          <div className="p-2 text-center rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] font-mono text-slate-400">
            Chế độ xem bài viết
          </div>
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề..."
          className="w-full px-3 py-2 rounded-xl bg-[#070919] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#f5c767]"
        />

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {isNew && (
            <div className="p-3 rounded-xl border bg-[#f5c767]/10 border-[#f5c767]/40 text-xs text-white">
              {form.title.trim() || "Bài viết mới (chưa lưu)"}
              <div className="text-[10px] font-mono text-[#f5c767] mt-1">CHƯA LƯU</div>
            </div>
          )}

          {loading && <div className="text-xs text-slate-400 text-center py-4">Đang tải...</div>}

          {loadError && (
            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 space-y-2">
              <div>{loadError}</div>
              <button onClick={loadPosts} className="underline">Thử lại</button>
            </div>
          )}

          {!loading && !loadError && filtered.length === 0 && !isNew && (
            <div className="text-xs text-slate-400 text-center py-4">
              {posts.length === 0 ? "Chưa có bài viết nào." : "Không tìm thấy bài viết."}
            </div>
          )}

          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => openPost(p)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${p.id === selectedId
                ? "bg-[#f5c767]/10 border-[#f5c767]/40"
                : "bg-[#0c1026] border-white/5 hover:border-white/20"
                }`}
            >
              <div className="text-xs font-semibold text-white line-clamp-2">{p.title}</div>
              <div className="text-[10px] text-slate-400 mt-1">{p.category}</div>
              <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded-full border ${p.status === "Published"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                  >
                    {p.status === "Published" ? "ĐÃ ĐĂNG" : "BẢN NHÁP"}
                  </span>
                  {p.facebookPostId && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/40 text-[9px] font-bold">
                      FB
                    </span>
                  )}
                </div>
                <span className="text-slate-400">{formatDate(p.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Khu soạn thảo */}
      <section className="space-y-4 min-w-0">
        {selectedId ? (
          <>
            <div className="p-4 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-3 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <input
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
                maxLength={200}
                placeholder="Tiêu đề bài viết..."
                className="w-full bg-transparent text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide placeholder-slate-500 focus:outline-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Danh Mục
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => patch({ category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070919] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-[#f5c767]"
                  >
                    {BLOG_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                    <span>Ảnh Bìa Bài Viết (Cover Image)</span>
                    {form.coverUrl && (
                      <button
                        type="button"
                        onClick={() => patch({ coverUrl: "" })}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Xóa ảnh bìa
                      </button>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleUploadCover}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                    />
                    <input
                      value={form.coverUrl}
                      onChange={(e) => patch({ coverUrl: e.target.value })}
                      placeholder="Dán link ảnh bìa hoặc bấm nút Tải Lên..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#070919] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5c767]"
                    />
                    <button
                      type="button"
                      disabled={isUploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f5c767]/20 to-[#3fe9d6]/20 border border-[#f5c767]/40 text-[#f5c767] hover:border-[#f5c767] hover:bg-[#f5c767]/30 text-xs font-bold transition-all whitespace-nowrap disabled:opacity-40 cursor-pointer"
                    >
                      {isUploadingCover ? `Đang tải ${coverProgress}%` : "Tải Ảnh Lên"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Thanh tiến trình tải ảnh bìa */}
              {isUploadingCover && (
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#f5c767] to-[#3fe9d6] transition-all duration-200"
                    style={{ width: `${coverProgress}%` }}
                  />
                </div>
              )}

              {/* Preview ảnh bìa nhỏ */}
              {form.coverUrl && (
                <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden border border-white/10 bg-[#060814] shadow-md group">
                  <Image
                    src={form.coverUrl}
                    alt="Preview ảnh bìa"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-[#f5c767] border border-white/10">
                    Ảnh bìa xem trước
                  </div>
                </div>
              )}

              <textarea
                value={form.excerpt}
                onChange={(e) => patch({ excerpt: e.target.value })}
                rows={2}
                maxLength={300}
                placeholder="Mô tả ngắn hiển thị ở danh sách bài viết (tối đa 300 ký tự)..."
                className="w-full px-3 py-2 rounded-xl bg-[#070919] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5c767]"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  {selected && (
                    <span
                      className={`px-2 py-0.5 rounded-full border ${selected.status === "Published"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                    >
                      {selected.status === "Published" ? "ĐÃ ĐĂNG" : "BẢN NHÁP"}
                    </span>
                  )}
                  {selected?.publishedAt && <span>Đăng lúc {formatDate(selected.publishedAt)}</span>}
                  {dirty && (
                    <span className="inline-flex items-center gap-1.5 text-[#f5c767]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f5c767]" />
                      Có thay đổi chưa lưu
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isNew && selected && ((selected.facebookPostId && canViewFB) || (!selected.facebookPostId && canPublishFB)) && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setIsFacebookModalOpen(true);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                        selected.facebookPostId
                          ? "bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/50 hover:bg-[#1877F2]/30 shadow-[0_0_12px_rgba(24,119,242,0.25)]"
                          : "bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-[0_0_15px_rgba(24,119,242,0.4)]"
                      }`}
                      title={
                        selected.facebookPostId
                          ? "Xem lượt like, bình luận và trả lời người chơi trên Facebook"
                          : "Đăng bài viết này lên Facebook Fanpage"
                      }
                    >
                      <span>f</span>
                      <span>{selected.facebookPostId ? "FB Tương Tác" : "Đăng Facebook"}</span>
                    </button>
                  )}

                  {!isNew && canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={busy}
                      className="px-3 py-2 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}

                  {selected?.status === "Published" && canPublish && (
                    <button
                      onClick={handleUnpublish}
                      disabled={busy}
                      className="px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                    >
                      Gỡ Về Nháp
                    </button>
                  )}

                  {canEdit && (
                    <button
                      onClick={handleSaveDraft}
                      disabled={busy || !dirty}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                    >
                      {busy ? "Đang lưu..." : selected?.status === "Published" ? "Lưu Thay Đổi" : "Lưu Nháp"}
                    </button>
                  )}

                  {selected?.status !== "Published" && canPublish && (
                    <button
                      onClick={handlePublish}
                      disabled={busy}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3fe9d6] to-[#9b51e0] text-[#060814] hover:brightness-110 disabled:opacity-40 cursor-pointer"
                    >
                      Xuất Bản
                    </button>
                  )}
                </div>
              </div>
            </div>

            <RichTextEditor
              key={`${selectedId}-${editorKey}`}
              value={form.content}
              onChange={(html) => patch({ content: html })}
            />
          </>
        ) : (
          <div className="p-12 rounded-2xl bg-[#090d24]/90 border border-white/10 text-center text-sm text-slate-400">
            Chọn một bài viết bên trái hoặc bấm “Viết Bài Mới” để bắt đầu.
          </div>
        )}
      </section>
    </div>

      {/* Facebook Community & Social Hub Modal */}
      {selected && (
        <FacebookSocialHubModal
          isOpen={isFacebookModalOpen}
          onClose={() => setIsFacebookModalOpen(false)}
          post={selected}
          onPostUpdated={(updatedPost) => {
            setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
          }}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-[#090d24] border text-white text-xs font-semibold ${toast.type === "ok" ? "border-[#f5c767]" : "border-rose-500"
            }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
