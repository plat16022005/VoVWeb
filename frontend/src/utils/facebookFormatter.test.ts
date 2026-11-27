import { describe, expect, it } from "vitest";
import { extractBlogMedia, toUnicodeBold } from "./facebookFormatter";

describe("toUnicodeBold", () => {
  it("chuyển chữ và số Latinh sang Unicode in đậm", () => {
    expect(toUnicodeBold("Abc 09")).toBe("𝗔𝗯𝗰 𝟬𝟵");
  });

  it("giữ nguyên ký tự có dấu và ký hiệu", () => {
    expect(toUnicodeBold("é!")).toBe("é!");
  });
});

describe("extractBlogMedia", () => {
  it("trả về mảng rỗng khi không có ảnh bìa và nội dung", () => {
    expect(extractBlogMedia("")).toEqual([]);
  });

  it("đặt ảnh bìa lên đầu danh sách", () => {
    const result = extractBlogMedia("", " https://cdn.test/cover.png ");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "image",
      url: "https://cdn.test/cover.png",
      isCover: true,
    });
  });

  it("bỏ qua ảnh bìa không phải URL http", () => {
    expect(extractBlogMedia("", "/local/cover.png")).toEqual([]);
  });

  it("lấy ảnh theo thứ tự xuất hiện trong HTML", () => {
    const html =
      '<p><img src="https://cdn.test/a.png"></p><img src="https://cdn.test/b.png">';
    const urls = extractBlogMedia(html).map((m) => m.url);
    expect(urls).toEqual(["https://cdn.test/a.png", "https://cdn.test/b.png"]);
  });

  it("bỏ qua URL không phải http", () => {
    const html = '<img src="/relative.png"><img src="https://cdn.test/ok.png">';
    const urls = extractBlogMedia(html).map((m) => m.url);
    expect(urls).toEqual(["https://cdn.test/ok.png"]);
  });

  it("không lặp lại URL trùng với ảnh bìa hoặc trùng nhau", () => {
    const html =
      '<img src="https://cdn.test/cover.png"><img src="https://cdn.test/x.png"><img src="https://cdn.test/x.png">';
    const urls = extractBlogMedia(html, "https://cdn.test/cover.png").map(
      (m) => m.url,
    );
    expect(urls).toEqual(["https://cdn.test/cover.png", "https://cdn.test/x.png"]);
  });

  it("nhận diện thẻ video", () => {
    const html = '<video src="https://cdn.test/v.mp4"></video>';
    const result = extractBlogMedia(html);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("video");
  });
});
