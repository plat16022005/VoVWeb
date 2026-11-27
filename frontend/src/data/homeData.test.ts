import { describe, expect, it } from "vitest";
import { WORLDS } from "./worlds";
import { NEWS_ITEMS } from "./news";
import { DEFAULT_LEADERBOARD } from "./leaderboard";
import {
  BANNER_TYPE_OPTIONS,
  HERO_RARITY_KEYS,
  RARITY_STYLE_META,
} from "./gacha";

const FORBIDDEN_KEYWORDS = [
  "Astral",
  "Nhà Khai Phá",
  "Unreal Engine",
  "đội tàu",
  "chuyến tàu",
];

describe("Dữ liệu Trang chủ & Thế giới Web cho Người Chơi (Player Web Data)", () => {
  it("WORLDS chứa danh sách các vùng đất đại lục Veyra với đầy đủ thông số hiển thị", () => {
    expect(WORLDS.length).toBeGreaterThanOrEqual(2);
    for (const w of WORLDS) {
      expect(w.id).toBeTruthy();
      expect(w.name).toBeTruthy();
      expect(w.desc).toContain("Veyra");
      expect(w.factions.length).toBeGreaterThan(0);
    }
  });

  it("NEWS_ITEMS và DEFAULT_LEADERBOARD cung cấp bản tin và bảng chiến tích Chỉ Huy hợp lệ", () => {
    expect(NEWS_ITEMS.length).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_LEADERBOARD).toHaveLength(5);
    expect(DEFAULT_LEADERBOARD[0].rank).toBe(1);
    expect(DEFAULT_LEADERBOARD[0].server).toContain("Veyra");
  });

  it("cấu hình Gacha trên Frontend có đủ 4 bậc phẩm cấp (UR, SSR, SR, R) và 3 loại Banner", () => {
    expect(HERO_RARITY_KEYS).toEqual(["UR", "SSR", "SR", "R"]);
    expect(BANNER_TYPE_OPTIONS.map((b) => b.value)).toEqual([
      "limited",
      "standard",
      "novice",
    ]);
    expect(RARITY_STYLE_META.SSR.color).toBe("#ef4444");
  });

  it("tuân thủ tuyệt đối quy chuẩn cốt truyện Veyra & Valkyria (không chứa từ khóa cấm)", () => {
    const combinedText = JSON.stringify({
      WORLDS,
      NEWS_ITEMS,
      DEFAULT_LEADERBOARD,
    }).toLowerCase();

    for (const word of FORBIDDEN_KEYWORDS) {
      expect(combinedText).not.toContain(word.toLowerCase());
    }
  });
});
