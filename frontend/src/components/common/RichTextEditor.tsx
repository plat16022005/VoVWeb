"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { soundEngine } from "@/services/audio.service";
import { Video, validateVideoUrl } from "./extensions/VideoNode";
import { uploadMediaToR2 } from "@/services/r2Upload.service";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        soundEngine.playClick();
        onClick();
      }}
      className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors disabled:opacity-30 ${
        active
          ? "bg-[#f5c767]/25 text-[#f5c767] border border-[#f5c767]/50"
          : "text-slate-300 hover:text-white hover:bg-white/10 border border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-6 bg-white/10 mx-1" />;
}

function Toolbar({
  editor,
  onPickImage,
  onPickVideo,
  isUploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  onPickVideo: () => void;
  isUploading: boolean;
}) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      highlight: e.isActive("highlight"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      table: e.isActive("table"),
      left: e.isActive({ textAlign: "left" }),
      center: e.isActive({ textAlign: "center" }),
      right: e.isActive({ textAlign: "right" }),
      justify: e.isActive({ textAlign: "justify" }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      block: e.isActive("heading", { level: 1 })
        ? "h1"
        : e.isActive("heading", { level: 2 })
        ? "h2"
        : e.isActive("heading", { level: 3 })
        ? "h3"
        : "p",
      color: (e.getAttributes("textStyle").color as string) || "#e2e8f0",
    }),
  });

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập đường dẫn liên kết (để trống để gỡ link):", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImageUrl = () => {
    const url = window.prompt("Nhập URL hình ảnh (https://...):", "https://");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addVideoUrl = () => {
    const raw = window.prompt(
      "Dán link video từ Cloudflare R2 (https://..., đuôi .mp4/.webm):",
      "https://"
    );
    if (!raw) return;
    const { url, error } = validateVideoUrl(raw);
    if (!url) {
      alert(error);
      return;
    }
    editor.chain().focus().setVideo({ src: url }).run();
  };

  const setBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "p") chain.setParagraph().run();
    else chain.setHeading({ level: Number(value.replace("h", "")) as 1 | 2 | 3 }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-[#0c1026] sticky top-20 z-20 rounded-t-2xl">
      <ToolbarButton title="Hoàn tác (Ctrl+Z)" disabled={!s.canUndo} onClick={() => editor.chain().focus().undo().run()}>↶</ToolbarButton>
      <ToolbarButton title="Làm lại (Ctrl+Y)" disabled={!s.canRedo} onClick={() => editor.chain().focus().redo().run()}>↷</ToolbarButton>
      <Divider />

      <select
        value={s.block}
        onChange={(e) => setBlock(e.target.value)}
        className="h-8 px-2 rounded-lg bg-[#070919] border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#f5c767]"
        title="Kiểu đoạn văn"
      >
        <option value="p">Đoạn văn</option>
        <option value="h1">Tiêu đề 1</option>
        <option value="h2">Tiêu đề 2</option>
        <option value="h3">Tiêu đề 3</option>
      </select>
      <Divider />

      <ToolbarButton title="In đậm (Ctrl+B)" active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolbarButton>
      <ToolbarButton title="In nghiêng (Ctrl+I)" active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolbarButton>
      <ToolbarButton title="Gạch chân (Ctrl+U)" active={s.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolbarButton>
      <ToolbarButton title="Gạch ngang" active={s.strike} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolbarButton>
      <ToolbarButton title="Tô sáng (Highlight)" active={s.highlight} onClick={() => editor.chain().focus().toggleHighlight().run()}>🖍</ToolbarButton>

      <label
        title="Màu chữ"
        className="relative min-w-8 h-8 px-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer border border-transparent"
      >
        <span style={{ color: s.color }}>A</span>
        <span className="w-3 h-1 rounded-full" style={{ background: s.color }} />
        <input
          type="color"
          value={s.color.startsWith("#") ? s.color : "#e2e8f0"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <Divider />

      <ToolbarButton title="Căn trái" active={s.left} onClick={() => editor.chain().focus().setTextAlign("left").run()}>⇤</ToolbarButton>
      <ToolbarButton title="Căn giữa" active={s.center} onClick={() => editor.chain().focus().setTextAlign("center").run()}>↔</ToolbarButton>
      <ToolbarButton title="Căn phải" active={s.right} onClick={() => editor.chain().focus().setTextAlign("right").run()}>⇥</ToolbarButton>
      <ToolbarButton title="Căn đều hai bên" active={s.justify} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>☰</ToolbarButton>
      <Divider />

      <ToolbarButton title="Danh sách chấm" active={s.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>• ≡</ToolbarButton>
      <ToolbarButton title="Danh sách số" active={s.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. ≡</ToolbarButton>
      <ToolbarButton title="Trích dẫn" active={s.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarButton>
      <ToolbarButton title="Khối mã" active={s.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{"</>"}</ToolbarButton>
      <ToolbarButton title="Đường kẻ ngang" onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</ToolbarButton>
      <Divider />

      {/* Nhóm Đa Phương Tiện (Ảnh) */}
      <button
        type="button"
        title="Tải ảnh trực tiếp từ máy tính lên Cloudflare R2"
        disabled={isUploading}
        onClick={onPickImage}
        className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center gap-1 disabled:opacity-40"
      >
        <span>🖼</span>
        <span className="font-mono text-[11px]">Tải Ảnh</span>
      </button>
      <ToolbarButton title="Chèn ảnh bằng link URL" onClick={addImageUrl}>
        <span className="font-mono text-[11px] text-slate-400">🖼 Link</span>
      </ToolbarButton>

      {/* Nhóm Đa Phương Tiện (Video) */}
      <button
        type="button"
        title="Tải video MP4/WebM trực tiếp từ máy lên Cloudflare R2"
        disabled={isUploading}
        onClick={onPickVideo}
        className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-[#f5c767] hover:border-[#f5c767] hover:bg-[#f5c767]/10 transition-all flex items-center gap-1 disabled:opacity-40"
      >
        <span>🎬</span>
        <span className="font-mono text-[11px]">Tải Video</span>
      </button>
      <ToolbarButton title="Chèn video bằng link URL Cloudflare R2" onClick={addVideoUrl}>
        <span className="font-mono text-[11px] text-slate-400">🎬 Link</span>
      </ToolbarButton>

      <Divider />
      <ToolbarButton title="Chèn liên kết" active={s.link} onClick={setLink}>🔗</ToolbarButton>

      <ToolbarButton
        title="Chèn bảng 3×3"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        ▦
      </ToolbarButton>

      {s.table && (
        <>
          <Divider />
          <ToolbarButton title="Thêm cột bên phải" onClick={() => editor.chain().focus().addColumnAfter().run()}>+Cột</ToolbarButton>
          <ToolbarButton title="Thêm hàng bên dưới" onClick={() => editor.chain().focus().addRowAfter().run()}>+Hàng</ToolbarButton>
          <ToolbarButton title="Xóa cột" onClick={() => editor.chain().focus().deleteColumn().run()}>−Cột</ToolbarButton>
          <ToolbarButton title="Xóa hàng" onClick={() => editor.chain().focus().deleteRow().run()}>−Hàng</ToolbarButton>
          <ToolbarButton title="Xóa bảng" onClick={() => editor.chain().focus().deleteTable().run()}>🗑</ToolbarButton>
        </>
      )}

      <Divider />
      <ToolbarButton title="Xóa định dạng" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Tx</ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết câu chuyện về Veyra tại đây...",
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: false }),
      Image.configure({ inline: false }),
      Video,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    editorProps: {
      attributes: { class: "blog-editor-content focus:outline-none" },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    // Reset input để có thể chọn lại cùng 1 file
    e.target.value = "";

    setIsUploading(true);
    setUploadPercent(0);
    setUploadFileName(file.name);
    setUploadError(null);

    try {
      soundEngine.playClick();
      const res = await uploadMediaToR2(file, (percent) => {
        setUploadPercent(percent);
      });

      // Tự động chèn thẻ tương ứng vào vị trí con trỏ của bài viết
      if (res.mediaType === "video") {
        editor.chain().focus().setVideo({ src: res.publicUrl }).run();
      } else {
        editor.chain().focus().setImage({ src: res.publicUrl }).run();
      }

      soundEngine.playCelestialChime();
    } catch (err) {
      console.error("Lỗi upload media lên Cloudflare R2:", err);
      const msg = err instanceof Error ? err.message : "Tải lên Cloudflare R2 thất bại.";
      setUploadError(msg);
      alert(msg);
    } finally {
      setIsUploading(false);
    }
  };

  if (!editor) {
    return (
      <div className="h-96 rounded-2xl bg-[#090d24]/90 border border-white/10 animate-pulse" />
    );
  }

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();

  return (
    <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Ẩn input file chọn ảnh */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFilePicked}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Ẩn input file chọn video */}
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleFilePicked}
        accept="video/mp4,video/webm"
        className="hidden"
      />

      {/* Toolbar */}
      <Toolbar
        editor={editor}
        onPickImage={() => imageInputRef.current?.click()}
        onPickVideo={() => videoInputRef.current?.click()}
        isUploading={isUploading}
      />

      {/* Upload Progress Bar Alert */}
      {isUploading && (
        <div className="px-6 py-3 bg-[#0d1438] border-b border-[#f5c767]/30 flex flex-col gap-1.5 animate-pulse">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#f5c767] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f5c767] animate-ping" />
              Đang tải lên Cloudflare R2: <strong>{uploadFileName}</strong>
            </span>
            <span className="text-[#3fe9d6] font-bold">{uploadPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#f5c767] to-[#3fe9d6] rounded-full transition-all duration-200"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
          <span>⚠️ {uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="text-rose-400 hover:text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Paper-like Editor Area */}
      <div className="p-4 sm:p-6 bg-[#060814]/60">
        <div className="max-w-3xl mx-auto min-h-[480px] bg-[#0b0f2a] border border-white/10 rounded-lg px-6 sm:px-10 py-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-[11px] font-mono text-slate-400 rounded-b-2xl">
        <span>{words.toLocaleString()} từ • {chars.toLocaleString()} ký tự</span>
        <span>Hỗ trợ tải trực tiếp ảnh & video MP4 lên Cloudflare R2</span>
      </div>
    </div>
  );
}
