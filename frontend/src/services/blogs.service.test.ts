import { describe, expect, it } from "vitest";
import {
  BLOG_CATEGORIES,
  BLOG_MAX_CONTENT_LENGTH,
  DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE,
  slugify,
} from "./blogs.service";

describe("blogs.service helpers", () => {
  it("slugify chuyển tiêu đề tiếng Việt có dấu sang đường dẫn thân thiện", () => {
    expect(slugify("Hé Lộ Nữ Chiến Binh Đấu Sĩ Veyra!")).toBe(
      "he-lo-nu-chien-binh-dau-si-veyra"
    );
    expect(slugify("   ")).toBe("bai-viet");
    expect(slugify("A".repeat(120)).length).toBeLessThanOrEqual(80);
  });

  it("khai báo đúng danh mục bài viết và giới hạn dung lượng an toàn", () => {
    expect(BLOG_CATEGORIES).toContain("Tin Tức");
    expect(BLOG_CATEGORIES).toContain("Sự Kiện");
    expect(BLOG_MAX_CONTENT_LENGTH).toBe(900_000);
    expect(DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE).toContain("{name}");
  });
});
