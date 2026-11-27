import { describe, expect, it } from "vitest";
import {
  HERO_QUALITY_META,
  formatCompactCurrency,
  getHeroQualityMeta,
} from "./playerData.service";

describe("Player Profile, Hero Quality & Wallet Helpers (playerData.service)", () => {
  it("HERO_QUALITY_META và getHeroQualityMeta ánh xạ đúng 6 bậc phẩm chất tướng và giới hạn cấp độ", () => {
    expect(Object.keys(HERO_QUALITY_META)).toHaveLength(6);
    expect(getHeroQualityMeta(0)).toMatchObject({
      label: "Thường",
      maxLevel: 20,
    });
    expect(getHeroQualityMeta(3)).toMatchObject({
      label: "Tím",
      maxLevel: 80,
    });
    expect(getHeroQualityMeta(5)).toMatchObject({
      label: "Đỏ",
      maxLevel: 100,
    });
    // Giá trị ngoài khoảng tự động về bậc Thường (0)
    expect(getHeroQualityMeta(99).label).toBe("Thường");
  });

  it("formatCompactCurrency định dạng số dư tiền tệ và lực chiến giống Unity Client", () => {
    expect(formatCompactCurrency(0)).toBe("0");
    expect(formatCompactCurrency(1_500_000)).toBe("1.5M");
    expect(formatCompactCurrency(2_250_000_000)).toBe("2.25B");
    expect(formatCompactCurrency(-1_500_000)).toBe("-1.5M");
  });
});
