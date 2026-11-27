import { describe, expect, it } from "vitest";
import {
  RARITY_OPTIONS,
  ROLE_OPTIONS,
  getRarityColor,
  getRarityImage,
  getRarityWeight,
  sortCharactersByRarity,
} from "./character.service";
import { Character } from "@/data/characters";

describe("character.service helpers", () => {
  it("cung cấp đầy đủ danh sách vai trò và phẩm cấp chuẩn", () => {
    expect(ROLE_OPTIONS.map((r) => r.value)).toContain("Archer");
    expect(RARITY_OPTIONS.map((r) => r.value)).toEqual(["UR", "SSR", "SR", "R"]);
  });

  it("getRarityColor và getRarityImage trả về đúng mã màu và đường dẫn huy hiệu", () => {
    expect(getRarityColor("UR")).toBe("#ffffff");
    expect(getRarityColor("SSR")).toBe("#ef4444");
    expect(getRarityColor(5)).toBe("#ef4444");
    expect(getRarityColor("SR")).toBe("#f5c767");
    expect(getRarityColor("R")).toBe("#38bdf8");

    expect(getRarityImage("SSR")).toBe("/images/SSR.png");
    expect(getRarityImage("SR")).toBe("/images/SR.png");
    expect(getRarityImage("R")).toBe("/images/R.png");
    expect(getRarityImage("UR")).toBeNull();
  });

  it("getRarityWeight và sortCharactersByRarity sắp xếp nhân vật từ UR -> SSR -> SR -> R rồi theo tên A-Z", () => {
    expect(getRarityWeight("UR")).toBeGreaterThan(getRarityWeight("SSR"));
    expect(getRarityWeight("SSR")).toBeGreaterThan(getRarityWeight("SR"));
    expect(getRarityWeight("SR")).toBeGreaterThan(getRarityWeight("R"));

    const chars = [
      { id: "c1", name: "Zara", rarity: 3, rarityLabel: "R" },
      { id: "c2", name: "Hitomi", rarity: 5, rarityLabel: "SSR" },
      { id: "c3", name: "Aurelia", rarity: 5, rarityLabel: "SSR" },
      { id: "c4", name: "Lyra", rarity: 4, rarityLabel: "SR" },
    ] as Character[];

    const sorted = sortCharactersByRarity(chars);
    expect(sorted.map((c) => c.name)).toEqual([
      "Aurelia",
      "Hitomi",
      "Lyra",
      "Zara",
    ]);
  });
});
