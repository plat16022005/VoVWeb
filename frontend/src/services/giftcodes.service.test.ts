import { describe, expect, it } from "vitest";
import {
  GiftcodeDocument,
  computeGiftcodeStatus,
  generateClientRandomCode,
  getCampaignCategoryMeta,
} from "./giftcodes.service";

function makeGiftcode(
  overrides: Partial<GiftcodeDocument> = {}
): GiftcodeDocument {
  return {
    Code: "VOV2026",
    Title: "Quà Tân Thủ",
    Description: "",
    CodeType: "COMMON",
    CampaignCategory: "LAUNCH",
    CampaignName: "Open Beta",
    IsActive: true,
    IsPublicDisplay: true,
    MaxRedemptions: 100,
    CurrentRedemptions: 10,
    MaxPerUser: 1,
    AllowedServers: ["ALL"],
    StartsAt: "",
    ExpiresAt: "",
    Rewards: { Gold: 1000, Gems: 50, Energy: 0, Items: [] },
    CreatedAt: "2026-11-01T00:00:00Z",
    UpdatedAt: "2026-11-01T00:00:00Z",
    CreatedBy: "Admin",
    UpdatedBy: "Admin",
    ...overrides,
  };
}

describe("giftcodes.service helpers", () => {
  const nowMs = new Date("2026-11-27T12:00:00Z").getTime();

  it("computeGiftcodeStatus nhận diện đúng 5 trạng thái vòng đời của mã quà tặng", () => {
    expect(computeGiftcodeStatus(makeGiftcode(), nowMs)).toBe("ACTIVE");

    expect(
      computeGiftcodeStatus(makeGiftcode({ IsActive: false }), nowMs)
    ).toBe("DISABLED");

    expect(
      computeGiftcodeStatus(
        makeGiftcode({ ExpiresAt: "2026-11-20T00:00:00Z" }),
        nowMs
      )
    ).toBe("EXPIRED");

    expect(
      computeGiftcodeStatus(
        makeGiftcode({ MaxRedemptions: 50, CurrentRedemptions: 50 }),
        nowMs
      )
    ).toBe("DEPLETED");

    expect(
      computeGiftcodeStatus(
        makeGiftcode({ StartsAt: "2026-12-01T00:00:00Z" }),
        nowMs
      )
    ).toBe("SCHEDULED");
  });

  it("generateClientRandomCode sinh mã đúng độ dài và không chứa ký tự dễ nhầm (0, O, 1, I, L)", () => {
    const code = generateClientRandomCode(12);
    expect(code).toHaveLength(12);
    expect(code).not.toMatch(/[0O1IL]/);
  });

  it("getCampaignCategoryMeta trả về thông tin chiến dịch tương ứng", () => {
    expect(getCampaignCategoryMeta("COMPENSATION").shortLabel).toBe("Đền Bù");
    expect(getCampaignCategoryMeta("UNKNOWN").value).toBe("EVENT");
  });
});
