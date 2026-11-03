/**
 * Facebook Rich Text & Media Formatter for Valkyria of Veyra
 * Chuyển đổi nội dung HTML của bài viết sang văn bản Facebook tối ưu,
 * kết hợp ký tự Unicode nghệ thuật và quét danh sách toàn bộ Media (ảnh bìa, ảnh bài viết, video).
 */

export interface ExtractedMediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  label: string;
  isCover?: boolean;
}

/**
 * Bảng mã ký tự Unicode Sans-Serif Bold (A-Z, a-z, 0-9)
 * Dùng để in đậm chữ không dấu và số trên Facebook mà không bị lỗi font
 */
const UNICODE_BOLD_MAP: Record<string, string> = {
  A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝",
  K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧",
  U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭",
  a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷",
  k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁",
  u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
  0: "𝟬", 1: "𝟭", 2: "𝟮", 3: "𝟯", 4: "𝟰", 5: "𝟱", 6: "𝟲", 7: "𝟳", 8: "𝟴", 9: "𝟵",
};

/**
 * Chuyển đổi chuỗi Latinh không dấu thành chữ in đậm Unicode
 */
export function toUnicodeBold(text: string): string {
  // Nếu là chữ Latinh cơ bản hoặc số, chuyển sang Unicode bold
  return text
    .split("")
    .map((char) => UNICODE_BOLD_MAP[char] || char)
    .join("");
}

/**
 * Trích xuất toàn bộ Media (Ảnh bìa, Ảnh trong HTML, Video) theo đúng thứ tự xuất hiện
 */
export function extractBlogMedia(contentHtml: string, coverUrl?: string): ExtractedMediaItem[] {
  const mediaList: ExtractedMediaItem[] = [];
  const seenUrls = new Set<string>();

  // 1. Ảnh bìa (ưu tiên số 1)
  if (coverUrl && coverUrl.trim().startsWith("http")) {
    const cleanUrl = coverUrl.trim();
    seenUrls.add(cleanUrl);
    mediaList.push({
      id: "media_cover",
      type: "image",
      url: cleanUrl,
      label: "Ảnh Bìa Chính (Cover)",
      isCover: true,
    });
  }

  if (!contentHtml) return mediaList;

  // 2. Quét qua DOM hoặc Regex để lấy các thẻ img và video theo thứ tự
  // Dùng regex linh hoạt chạy được cả client và server
  const tagRegex = /<(img|video|source)[^>]+>/gi;
  let match;
  let imgIndex = 1;
  let videoIndex = 1;

  while ((match = tagRegex.exec(contentHtml)) !== null) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();

    // Lấy thuộc tính src
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch || !srcMatch[1]) continue;

    const url = srcMatch[1].trim();
    if (!url.startsWith("http")) continue;
    if (seenUrls.has(url)) continue; // Tránh trùng lặp

    seenUrls.add(url);

    // Lấy alt hoặc title nếu có
    const altMatch = tag.match(/alt=["']([^"']+)["']/i);
    const alt = altMatch ? altMatch[1].trim() : "";

    if (tagName === "img") {
      mediaList.push({
        id: `media_img_${imgIndex}`,
        type: "image",
        url,
        label: alt ? `Ảnh ${imgIndex}: ${alt}` : `Ảnh nội dung #${imgIndex}`,
      });
      imgIndex++;
    } else if (tagName === "video" || tagName === "source") {
      mediaList.push({
        id: `media_vid_${videoIndex}`,
        type: "video",
        url,
        label: `Video #${videoIndex}`,
      });
      videoIndex++;
    }
  }

  return mediaList;
}

/**
 * Làm sạch và chuyển đổi HTML của bài viết sang văn bản Facebook tối ưu
 */
export function convertBlogToFacebookText(options: {
  title: string;
  excerpt?: string;
  contentHtml: string;
  postUrl?: string;
}): string {
  const { title, excerpt, contentHtml, postUrl } = options;

  let text = "";

  // 1. BANNER TIÊU ĐỀ LỚN TRÊN CÙNG (Dùng ký tự viền to và icon nổi bật)
  text += `══════════════════════════════════════\n`;
  text += `⚔️  VALKYRIA OF VEYRA - BẢN TIN CHÍNH THỨC\n`;
  text += `🔷  【 ${title.toUpperCase()} 】\n`;
  text += `══════════════════════════════════════\n\n`;

  // 2. MÔ TẢ NGẮN (EXCERPT)
  if (excerpt && excerpt.trim()) {
    text += `📖  ${excerpt.trim()}\n`;
    text += `──────────────────────────────────────\n\n`;
  }

  // 3. XỬ LÝ NỘI DUNG HTML BÊN TRONG
  if (contentHtml && contentHtml.trim()) {
    let body = contentHtml;

    // A. Xử lý Headings
    // H1
    body = body.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, inner) => {
      const clean = stripHtml(inner).trim();
      return clean ? `\n\n════════════════════════════════\n🌟  【 ${clean.toUpperCase()} 】\n════════════════════════════════\n\n` : "";
    });

    // H2
    body = body.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, inner) => {
      const clean = stripHtml(inner).trim();
      return clean ? `\n\n▶️  ━━━ ${clean.toUpperCase()} ━━━\n\n` : "";
    });

    // H3
    body = body.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, inner) => {
      const clean = stripHtml(inner).trim();
      return clean ? `\n\n🔹  [ ${clean} ]\n\n` : "";
    });

    // H4, H5, H6
    body = body.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, (_, inner) => {
      const clean = stripHtml(inner).trim();
      return clean ? `\n\n▫️  ${clean}:\n` : "";
    });

    // B. Xử lý Blockquote
    body = body.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
      const clean = stripHtml(inner).trim();
      return clean ? `\n❝ ${clean} ❞\n` : "";
    });

    // C. Xử lý Code block
    body = body.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, inner) => {
      const clean = stripHtml(inner).trim();
      return clean ? `\n┌── [ LỆNH / THÔNG SỐ ] ────────────\n│ ${clean.replace(/\n/g, "\n│ ")}\n└───────────────────────────────────\n` : "";
    });

    // D. Xử lý Danh sách (Lists)
    // Ordered List (<ol><li>)
    body = body.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
      const items = inner.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
      const numIcons = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
      const formattedItems = items.map((li: string, index: number) => {
        const clean = stripHtml(li).trim();
        const prefix = numIcons[index] || `${index + 1}.`;
        return `${prefix} ${clean}`;
      });
      return `\n${formattedItems.join("\n")}\n\n`;
    });

    // Unordered List (<ul><li>)
    body = body.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
      const items = inner.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
      const formattedItems = items.map((li: string) => {
        const clean = stripHtml(li).trim();
        return `• ${clean}`;
      });
      return `\n${formattedItems.join("\n")}\n\n`;
    });

    // E. Xử lý Thẻ In Đậm (Bold: <strong>, <b>)
    // Giữ thẩm mỹ: Nếu chữ Latinh ngắn thì đổi sang Unicode Bold, còn tiếng Việt thì nhấn bằng 【 ... 】
    body = body.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, (_, __, inner) => {
      const clean = stripHtml(inner).trim();
      if (!clean) return "";
      // Nếu là chữ không dấu đơn giản (A-Z, a-z, 0-9 và khoảng trắng)
      if (/^[a-zA-Z0-9\s:.-]+$/.test(clean)) {
        return toUnicodeBold(clean);
      }
      return `【${clean}】`;
    });

    // F. Xử lý Thẻ In Nghiêng (Italic: <em>, <i>)
    body = body.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, (_, __, inner) => {
      const clean = stripHtml(inner).trim();
      return clean ? `_${clean}_` : "";
    });

    // G. Xử lý Đường kẻ ngang (<hr>)
    body = body.replace(/<hr[^>]*>/gi, "\n──────────────────────────────────────\n");

    // H. Xử lý Thẻ Liên Kết (<a>)
    body = body.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
      const clean = stripHtml(inner).trim();
      if (!clean) return href;
      return `${clean} (🔗 ${href})`;
    });

    // I. Xử lý Video Node hoặc Iframe
    body = body.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, "\n[🎬 Video Gameplay đính kèm bên dưới]\n");
    body = body.replace(/<iframe[^>]*src=["']([^"']+)["'][^>]*><\/iframe>/gi, (_, src) => {
      return `\n[🎬 Video: ${src}]\n`;
    });

    // J. Xử lý Đoạn văn (<p>) và Xuống dòng (<br>)
    body = body.replace(/<br\s*\/?>/gi, "\n");
    body = body.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => {
      const clean = stripHtml(inner).trim();
      return clean ? `${clean}\n\n` : "";
    });

    // K. Dọn sạch các thẻ HTML còn sót lại và giải mã ký tự đặc biệt
    const cleanBody = decodeHtmlEntities(stripHtml(body))
      .replace(/\n{3,}/g, "\n\n") // Giữ tối đa 2 lần xuống dòng
      .trim();

    text += cleanBody + "\n\n";
  }

  // 4. FOOTER & HASHTAGS GAME
  text += `──────────────────────────────────────\n`;
  if (postUrl && !postUrl.includes("localhost")) {
    text += `👉 Đọc toàn văn bài viết tại: ${postUrl}\n`;
  }
  text += `✨ Valkyria of Veyra - Game Nhập Vai Chiến Thuật (Turn-Based RPG)\n`;
  text += `#ValkyriaOfVeyra #VoVRPG #TurnBasedRPG #GamingNews #Veyra #Valkyria`;

  return text;
}

/**
 * Loại bỏ toàn bộ thẻ HTML
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Giải mã các thực thể HTML phổ biến (&nbsp;, &amp;, &lt;, &gt;, &quot;)
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&hellip;/g, "...");
}

