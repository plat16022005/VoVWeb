import { describe, expect, it } from "vitest";
import {
  MAIL_QUICK_TEMPLATES,
  SystemMailDocument,
  getMailCategoryMeta,
  isMailExpired,
} from "./mail.service";
import {
  EQUIP_RARITY_TIERS,
  SLOT_MAIN_STAT_POOLS,
  buildPresetEquipmentSpec,
  computeForgedEquipmentCombatScore,
  computeMainStatValueAtLevel,
  formatEquipStatText,
  getMainStatBaseRange,
} from "@/utils/equipmentForger";

describe("mail.service & equipmentForger helpers", () => {
  const nowMs = new Date("2026-11-27T12:00:00Z").getTime();

  it("isMailExpired kiểm tra chính xác thời hạn hiệu lực của thư hệ thống", () => {
    const expiredMail = {
      ExpiresAt: "2026-11-20T00:00:00Z",
    } as SystemMailDocument;
    const validMail = {
      ExpiresAt: "2026-12-20T00:00:00Z",
    } as SystemMailDocument;
    const noExpiryMail = { ExpiresAt: "" } as SystemMailDocument;

    expect(isMailExpired(expiredMail, nowMs)).toBe(true);
    expect(isMailExpired(validMail, nowMs)).toBe(false);
    expect(isMailExpired(noExpiryMail, nowMs)).toBe(false);
  });

  it("getMailCategoryMeta và MAIL_QUICK_TEMPLATES cung cấp mẫu thư vận hành chuẩn", () => {
    expect(getMailCategoryMeta("COMPENSATION").shortLabel).toBe("Đền Bù Lỗi");
    expect(MAIL_QUICK_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it("buildPresetEquipmentSpec tạo trang bị đền bù đúng số dòng phụ, chỉ số chính hợp lệ theo ô và tính đúng điểm Lực Chiến", () => {
    // Vũ khí (Slot 1), Thần Thoại (Rarity 4 -> 5 dòng phụ, maxEnhance 100)
    const spec = buildPresetEquipmentSpec(
      "equip_weapon_01",
      1,
      4,
      50,
      "max"
    );
    expect(spec.Slot).toBe(1);
    expect(spec.Rarity).toBe(4);
    expect(spec.EnhanceLevel).toBe(50);
    expect(SLOT_MAIN_STAT_POOLS[1]).toContain(spec.MainStat.StatType);
    expect(spec.SubStats).toHaveLength(EQUIP_RARITY_TIERS[4].subStatCount);

    // Không dòng phụ nào trùng với dòng chính và không trùng nhau
    const allStatTypes = [
      spec.MainStat.StatType,
      ...spec.SubStats.map((s) => s.StatType),
    ];
    expect(new Set(allStatTypes).size).toBe(allStatTypes.length);

    const maxBase = getMainStatBaseRange(spec.MainStat.StatType, 4).max;
    expect(spec.MainStat.BaseValue).toBe(maxBase);
    expect(spec.MainStat.Value).toBe(
      computeMainStatValueAtLevel(spec.MainStat.StatType, maxBase, 4, 50)
    );

    const cp = computeForgedEquipmentCombatScore(spec);
    expect(cp).toBeGreaterThan(0);
    expect(formatEquipStatText(5, 2.5)).toBe("Crit Rate +2.5%");
  });
});
