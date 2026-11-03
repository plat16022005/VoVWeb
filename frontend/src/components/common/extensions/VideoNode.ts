import { Node, mergeAttributes } from "@tiptap/react";

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

/**
 * Danh sách domain được phép phát video (Cloudflare R2).
 * - `*.r2.dev` : Public Development URL của R2
 * - NEXT_PUBLIC_VIDEO_HOSTS : domain tùy chỉnh, cách nhau bằng dấu phẩy (vd: cdn.veyra.com)
 */
function getAllowedHosts(): string[] {
  const custom = (process.env.NEXT_PUBLIC_VIDEO_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  // Tự động whitelist host từ NEXT_PUBLIC_R2_PUBLIC_DOMAIN nếu có
  const r2Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
  if (r2Domain) {
    try {
      const parsed = new URL(r2Domain);
      custom.push(parsed.hostname.toLowerCase());
    } catch {
      // bỏ qua nếu r2Domain chưa chuẩn format url
    }
  }

  return ["r2.dev", ...custom];
}

/** Trả về URL hợp lệ hoặc null nếu bị từ chối. */
export function validateVideoUrl(raw: string): { url: string | null; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { url: null, error: "Đường dẫn không hợp lệ." };
  }
  if (parsed.protocol !== "https:") {
    return { url: null, error: "Chỉ chấp nhận đường dẫn https://." };
  }
  if (!VIDEO_EXT.test(parsed.pathname + parsed.search)) {
    return { url: null, error: "Chỉ hỗ trợ file .mp4, .webm, .mov (khuyên dùng .mp4 H.264)." };
  }
  const host = parsed.hostname.toLowerCase();
  const ok = getAllowedHosts().some((h) => host === h || host.endsWith("." + h));
  if (!ok) {
    return {
      url: null,
      error: `Domain "${host}" chưa được phép. Hãy thêm vào NEXT_PUBLIC_VIDEO_HOSTS.`,
    };
  }
  return { url: parsed.toString() };
}

export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video[src]",
        // Bỏ qua video có nguồn không hợp lệ khi dán HTML từ bên ngoài
        getAttrs: (el) => {
          const src = (el as HTMLElement).getAttribute("src") || "";
          return validateVideoUrl(src).url ? { src } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        preload: "metadata",
        playsinline: "true",
        class: "blog-video",
      }),
    ];
  },

  addCommands() {
    return {
      setVideo:
        ({ src }) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { src } }),
    };
  },
});

