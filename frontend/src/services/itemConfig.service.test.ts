import { describe, expect, it } from "vitest";
import {
  GameConsumableEffectType,
  GameEquipSlot,
  GameItemRarity,
  GameItemType,
  getConsumableEffectMeta,
  getEquipSlotMeta,
  getItemRarityMeta,
  getItemTypeMeta,
} from "./itemConfig.service";

describe("itemConfig.service helpers", () => {
  it("getItemTypeMeta trả về đúng nhãn phân loại vật phẩm", () => {
    expect(getItemTypeMeta(GameItemType.Equipment).shortLabel).toBe("Trang Bị");
    expect(getItemTypeMeta(GameItemType.Ticket).shortLabel).toBe("Vé / Tiền Tệ");
  });

  it("getItemRarityMeta trả về đúng phẩm chất từ Phổ Thông (N) tới Thần Thoại (UR)", () => {
    expect(getItemRarityMeta(GameItemRarity.Common).tier).toBe("N");
    expect(getItemRarityMeta(GameItemRarity.Legendary).tier).toBe("SSR");
    expect(getItemRarityMeta(GameItemRarity.Mythic).tier).toBe("UR");
  });

  it("getEquipSlotMeta và getConsumableEffectMeta ánh xạ đúng vị trí trang bị và hiệu ứng tiêu hao", () => {
    expect(getEquipSlotMeta(GameEquipSlot.Weapon).label).toContain("Vũ Khí");
    expect(
      getConsumableEffectMeta(GameConsumableEffectType.AddExpToHero).unit
    ).toBe("EXP");
  });
});
