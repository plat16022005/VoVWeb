import { describe, expect, it } from "vitest";
import {
  HERO_QUALITY_META,
  PLAYER_ACTIVITY_ACTION_LABELS,
  PLAYER_ACTIVITY_CATEGORY_META,
  formatCompactCurrency,
  formatSignedDelta,
  getHeroQualityMeta,
  getPlayerActivityActionLabel,
  getPlayerActivityCategoryMeta,
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

  it("getPlayerActivityCategoryMeta và getPlayerActivityActionLabel ánh xạ đầy đủ 10 danh mục và các hành động trong game", () => {
    expect(Object.keys(PLAYER_ACTIVITY_CATEGORY_META)).toHaveLength(10);
    expect(getPlayerActivityCategoryMeta("gacha").label).toBe(
      "Triệu Hồi Gacha"
    );
    expect(getPlayerActivityCategoryMeta("BATTLE").shortLabel).toBe(
      "Chiến Dịch"
    );
    expect(getPlayerActivityCategoryMeta("UNKNOWN_CAT").label).toBe("Hệ Thống");

    expect(getPlayerActivityActionLabel("ROLL_HERO_GACHA")).toBe(
      "Triệu hồi Banner Gacha"
    );
    expect(getPlayerActivityActionLabel("CLAIM_STAGE_REWARD")).toBe(
      "Hoàn thành & nhận thưởng ải"
    );
    expect(getPlayerActivityActionLabel("ENHANCE_EQUIPMENT")).toBe(
      "Cường hóa cấp độ trang bị"
    );
    expect(getPlayerActivityActionLabel("REDEEM_GIFTCODE")).toBe(
      "Nhập mã quà tặng Giftcode"
    );
    expect(Object.keys(PLAYER_ACTIVITY_ACTION_LABELS).length).toBeGreaterThanOrEqual(
      20
    );
  });

  it("formatSignedDelta định dạng dấu cộng/trừ cho biến động tài nguyên", () => {
    expect(formatSignedDelta(1500)).toBe("+1.500");
    expect(formatSignedDelta(-2700)).toBe("-2.700");
    expect(formatSignedDelta(0)).toBe("0");
  });
});
