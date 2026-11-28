"use client";

import { useState, useMemo } from "react";
import {
  ALL_SUB_STAT_TYPES,
  CustomEquipmentStatRoll,
  CustomForgedEquipmentSpec,
  EQUIP_RARITY_TIERS,
  EQUIP_SLOT_LABELS,
  EQUIP_STAT_META,
  SLOT_MAIN_STAT_POOLS,
  buildPresetEquipmentSpec,
  computeForgedEquipmentCombatScore,
  computeMainStatValueAtLevel,
  formatEquipRollValue,
  formatEquipStatText,
  getMainStatBaseRange,
  getSubStatBaseRange,
} from "@/utils/equipmentForger";
import {
  MailReferenceItem,
  SystemMailRewardItem,
} from "@/services/mail.service";
import { soundEngine } from "@/services/audio.service";

interface ForgeEquipmentModalProps {
  isOpen: boolean;
  referenceItems: MailReferenceItem[];
  onClose: () => void;
  onConfirmForge: (forgedRewardItem: SystemMailRewardItem) => void;
}

const FALLBACK_EQUIP_TEMPLATES: MailReferenceItem[] = [
  {
    ItemId: "equip_weapon_01",
    ItemName: "Trường Kiếm Rực Lửa",
    Type: 2,
    Rarity: 0,
    Slot: 1,
  },
  {
    ItemId: "equip_weapon_02",
    ItemName: "Lưỡi Kiếm Ám Ảnh",
    Type: 2,
    Rarity: 0,
    Slot: 1,
  },
  {
    ItemId: "equip_helmet_01",
    ItemName: "Chiến Khôi Lửa",
    Type: 2,
    Rarity: 0,
    Slot: 2,
  },
  {
    ItemId: "equip_helmet_02",
    ItemName: "Mũ Trùm Bóng Đêm",
    Type: 2,
    Rarity: 0,
    Slot: 2,
  },
  {
    ItemId: "equip_armor_01",
    ItemName: "Chiến Giáp Hoàng Kim",
    Type: 2,
    Rarity: 0,
    Slot: 3,
  },
  {
    ItemId: "equip_armor_02",
    ItemName: "Áo Choàng Tinh Linh",
    Type: 2,
    Rarity: 0,
    Slot: 3,
  },
  {
    ItemId: "equip_boots_01",
    ItemName: "Chiến Hài Bạc",
    Type: 2,
    Rarity: 0,
    Slot: 4,
  },
  {
    ItemId: "equip_boots_02",
    ItemName: "Ủng Bóng Tối",
    Type: 2,
    Rarity: 0,
    Slot: 4,
  },
  {
    ItemId: "equip_accessory_01",
    ItemName: "Huy Hiệu Sư Tử",
    Type: 2,
    Rarity: 0,
    Slot: 5,
  },
  {
    ItemId: "equip_accessory_02",
    ItemName: "Dây Chuyền Tinh Tú",
    Type: 2,
    Rarity: 0,
    Slot: 5,
  },
  {
    ItemId: "equip_gloves_01",
    ItemName: "Thủ Giáp Thép",
    Type: 2,
    Rarity: 0,
    Slot: 6,
  },
  {
    ItemId: "equip_gloves_02",
    ItemName: "Nhẫn Ma Tinh",
    Type: 2,
    Rarity: 0,
    Slot: 6,
  },
];

function inferSlotFromTemplate(item: MailReferenceItem): number {
  if (item.Slot && item.Slot >= 1 && item.Slot <= 6) return item.Slot;
  const id = item.ItemId.toLowerCase();
  if (id.includes("weapon") || id.includes("sword")) return 1;
  if (id.includes("helmet") || id.includes("hat")) return 2;
  if (id.includes("armor") || id.includes("plate")) return 3;
  if (id.includes("boot") || id.includes("shoe")) return 4;
  if (id.includes("accessory") || id.includes("ring") || id.includes("neck"))
    return 5;
  if (id.includes("glove")) return 6;
  return 1;
}

export default function ForgeEquipmentModal({
  isOpen,
  referenceItems,
  onClose,
  onConfirmForge,
}: ForgeEquipmentModalProps) {
  const equipmentTemplates = useMemo(() => {
    const byId = new Map<string, MailReferenceItem & { resolvedSlot: number }>();
    for (const tpl of FALLBACK_EQUIP_TEMPLATES) {
      byId.set(tpl.ItemId, {
        ...tpl,
        resolvedSlot: inferSlotFromTemplate(tpl),
      });
    }
    for (const it of referenceItems) {
      if (it.Type === 2 || it.ItemId.startsWith("equip_")) {
        const slot = inferSlotFromTemplate(it);
        byId.set(it.ItemId, {
          ...it,
          Slot: slot,
          resolvedSlot: slot,
        });
      }
    }
    return Array.from(byId.values());
  }, [referenceItems]);

  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string>("equip_weapon_01");
  const [quantity, setQuantity] = useState<number>(1);

  const [spec, setSpec] = useState<CustomForgedEquipmentSpec>(() =>
    buildPresetEquipmentSpec("equip_weapon_01", 1, 3, 0, "mid")
  );

  if (!isOpen) return null;

  const templatesInSlot = equipmentTemplates.filter(
    (t) => t.resolvedSlot === selectedSlot
  );
  const currentTemplate =
    equipmentTemplates.find((t) => t.ItemId === selectedTemplateId) ||
    templatesInSlot[0] ||
    equipmentTemplates[0];

  const tier = EQUIP_RARITY_TIERS[spec.Rarity] || EQUIP_RARITY_TIERS[0];
  const allowedMainStats =
    SLOT_MAIN_STAT_POOLS[selectedSlot] || SLOT_MAIN_STAT_POOLS[1];
  const mainRange = getMainStatBaseRange(spec.MainStat.StatType, spec.Rarity);
  const mainMeta = EQUIP_STAT_META[spec.MainStat.StatType];

  const maxTotalUpgrades = Math.floor(spec.EnhanceLevel / 10);
  const currentTotalUpgrades = spec.SubStats.reduce(
    (sum, s) => sum + s.UpgradeCount,
    0
  );
  const combatScore = computeForgedEquipmentCombatScore(spec);

  const handleSelectSlot = (nextSlot: number) => {
    soundEngine.playClick();
    setSelectedSlot(nextSlot);
    const firstTpl =
      equipmentTemplates.find((t) => t.resolvedSlot === nextSlot) ||
      FALLBACK_EQUIP_TEMPLATES.find((t) => t.Slot === nextSlot)!;
    setSelectedTemplateId(firstTpl.ItemId);

    const nextMainPool =
      SLOT_MAIN_STAT_POOLS[nextSlot] || SLOT_MAIN_STAT_POOLS[1];
    const nextMainStatType = nextMainPool.includes(spec.MainStat.StatType)
      ? spec.MainStat.StatType
      : nextMainPool[0];
    const nextMainRange = getMainStatBaseRange(nextMainStatType, spec.Rarity);
    const nextMainBase = nextMainRange.mid;
    const nextMainVal = computeMainStatValueAtLevel(
      nextMainStatType,
      nextMainBase,
      spec.Rarity,
      spec.EnhanceLevel
    );

    // Nếu có dòng phụ trùng với chỉ số chính mới, tự động đổi sang chỉ số phụ khả dụng khác
    const usedSubTypes = new Set<number>([nextMainStatType]);
    const adjustedSubs = spec.SubStats.map((sub) => {
      if (!usedSubTypes.has(sub.StatType)) {
        usedSubTypes.add(sub.StatType);
        return sub;
      }
      const replacement =
        ALL_SUB_STAT_TYPES.find((st) => !usedSubTypes.has(st)) || 1;
      usedSubTypes.add(replacement);
      const r = getSubStatBaseRange(replacement, spec.Rarity);
      return {
        StatType: replacement,
        BaseValue: r.mid,
        Value: formatEquipRollValue(
          replacement,
          r.mid * (1 + sub.UpgradeCount)
        ),
        UpgradeCount: sub.UpgradeCount,
      };
    });

    setSpec({
      ...spec,
      TemplateId: firstTpl.ItemId,
      Slot: nextSlot,
      MainStat: {
        StatType: nextMainStatType,
        BaseValue: nextMainBase,
        Value: nextMainVal,
        UpgradeCount: 0,
      },
      SubStats: adjustedSubs,
    });
  };

  const handleSelectRarity = (nextRarity: number) => {
    soundEngine.playClick();
    const nextTier = EQUIP_RARITY_TIERS[nextRarity];
    const clampedLv = Math.min(spec.EnhanceLevel, nextTier.maxEnhance);
    const nextMaxUpgrades = Math.floor(clampedLv / 10);

    const nextMainRange = getMainStatBaseRange(
      spec.MainStat.StatType,
      nextRarity
    );
    const nextMainBase = nextMainRange.mid;
    const nextMainVal = computeMainStatValueAtLevel(
      spec.MainStat.StatType,
      nextMainBase,
      nextRarity,
      clampedLv
    );

    const usedTypes = new Set<number>([spec.MainStat.StatType]);
    const nextSubs: CustomEquipmentStatRoll[] = [];
    let remainingUpgrades = nextMaxUpgrades;

    for (let i = 0; i < nextTier.subStatCount; i++) {
      const existing = spec.SubStats[i];
      let st = existing?.StatType;
      if (!st || usedTypes.has(st)) {
        st = ALL_SUB_STAT_TYPES.find((cand) => !usedTypes.has(cand)) || 1;
      }
      usedTypes.add(st);

      const subRange = getSubStatBaseRange(st, nextRarity);
      const upg = Math.min(existing?.UpgradeCount || 0, remainingUpgrades);
      remainingUpgrades -= upg;
      const baseVal = subRange.mid;
      const totalVal =
        upg === 0
          ? baseVal
          : formatEquipRollValue(st, baseVal + upg * subRange.mid);

      nextSubs.push({
        StatType: st,
        BaseValue: baseVal,
        Value: totalVal,
        UpgradeCount: upg,
      });
    }

    setSpec({
      ...spec,
      Rarity: nextRarity,
      EnhanceLevel: clampedLv,
      MainStat: {
        StatType: spec.MainStat.StatType,
        BaseValue: nextMainBase,
        Value: nextMainVal,
        UpgradeCount: 0,
      },
      SubStats: nextSubs,
    });
  };

  const handleChangeEnhanceLevel = (nextLvRaw: number) => {
    const cleanLv = Math.max(
      0,
      Math.min(tier.maxEnhance, Math.trunc(nextLvRaw) || 0)
    );
    const nextMaxUpgrades = Math.floor(cleanLv / 10);
    const nextMainVal = computeMainStatValueAtLevel(
      spec.MainStat.StatType,
      spec.MainStat.BaseValue,
      spec.Rarity,
      cleanLv
    );

    let remUpgrades = nextMaxUpgrades;
    const nextSubs = spec.SubStats.map((sub) => {
      const upg = Math.min(sub.UpgradeCount, remUpgrades);
      remUpgrades -= upg;
      const subRange = getSubStatBaseRange(sub.StatType, spec.Rarity);
      const nextVal =
        upg === 0
          ? sub.BaseValue
          : formatEquipRollValue(
              sub.StatType,
              sub.BaseValue + upg * subRange.mid
            );
      return {
        ...sub,
        UpgradeCount: upg,
        Value: nextVal,
      };
    });

    setSpec({
      ...spec,
      EnhanceLevel: cleanLv,
      MainStat: {
        ...spec.MainStat,
        Value: nextMainVal,
      },
      SubStats: nextSubs,
    });
  };

  const handleChangeMainStatType = (nextStatType: number) => {
    soundEngine.playClick();
    const nextRange = getMainStatBaseRange(nextStatType, spec.Rarity);
    const nextBase = nextRange.mid;
    const nextVal = computeMainStatValueAtLevel(
      nextStatType,
      nextBase,
      spec.Rarity,
      spec.EnhanceLevel
    );

    // Nếu có dòng phụ đang giữ nextStatType, hoán đổi dòng phụ đó sang chỉ số khác
    const usedTypes = new Set<number>([nextStatType]);
    const nextSubs = spec.SubStats.map((sub) => {
      if (!usedTypes.has(sub.StatType)) {
        usedTypes.add(sub.StatType);
        return sub;
      }
      const fallbackType =
        ALL_SUB_STAT_TYPES.find(
          (st) =>
            !usedTypes.has(st) && !spec.SubStats.some((s) => s.StatType === st)
        ) || 1;
      usedTypes.add(fallbackType);
      const r = getSubStatBaseRange(fallbackType, spec.Rarity);
      return {
        StatType: fallbackType,
        BaseValue: r.mid,
        Value:
          sub.UpgradeCount === 0
            ? r.mid
            : formatEquipRollValue(
                fallbackType,
                r.mid * (1 + sub.UpgradeCount)
              ),
        UpgradeCount: sub.UpgradeCount,
      };
    });

    setSpec({
      ...spec,
      MainStat: {
        StatType: nextStatType,
        BaseValue: nextBase,
        Value: nextVal,
        UpgradeCount: 0,
      },
      SubStats: nextSubs,
    });
  };

  const handleChangeMainBaseValue = (rawBase: number) => {
    const clampedBase = formatEquipRollValue(
      spec.MainStat.StatType,
      Math.max(mainRange.min, Math.min(mainRange.max, rawBase))
    );
    const nextVal = computeMainStatValueAtLevel(
      spec.MainStat.StatType,
      clampedBase,
      spec.Rarity,
      spec.EnhanceLevel
    );
    setSpec({
      ...spec,
      MainStat: {
        ...spec.MainStat,
        BaseValue: clampedBase,
        Value: nextVal,
      },
    });
  };

  const handleUpdateSubStat = (
    index: number,
    patch: Partial<CustomEquipmentStatRoll>
  ) => {
    setSpec((prev) => {
      const nextSubs = [...prev.SubStats];
      const cur = nextSubs[index];
      if (!cur) return prev;

      const nextType = patch.StatType ?? cur.StatType;
      const range = getSubStatBaseRange(nextType, prev.Rarity);

      const otherUpgrades = nextSubs.reduce(
        (sum, s, idx) => (idx === index ? sum : sum + s.UpgradeCount),
        0
      );
      const maxAllowedForThis = Math.max(
        0,
        Math.floor(prev.EnhanceLevel / 10) - otherUpgrades
      );
      const nextUpgradeCount = Math.max(
        0,
        Math.min(
          maxAllowedForThis,
          patch.UpgradeCount !== undefined
            ? patch.UpgradeCount
            : cur.UpgradeCount
        )
      );

      const rawBase =
        patch.StatType !== undefined && patch.StatType !== cur.StatType
          ? range.mid
          : patch.BaseValue !== undefined
            ? patch.BaseValue
            : cur.BaseValue;
      const clampedBase = formatEquipRollValue(
        nextType,
        Math.max(range.min, Math.min(range.max, rawBase))
      );

      const minTotal = formatEquipRollValue(
        nextType,
        range.min * (1 + nextUpgradeCount)
      );
      const maxTotal = formatEquipRollValue(
        nextType,
        range.max * (1 + nextUpgradeCount)
      );
      const autoTotal =
        nextUpgradeCount === 0
          ? clampedBase
          : formatEquipRollValue(
              nextType,
              clampedBase * (1 + nextUpgradeCount)
            );
      const nextTotal =
        patch.Value !== undefined
          ? formatEquipRollValue(
              nextType,
              Math.max(minTotal, Math.min(maxTotal, patch.Value))
            )
          : Math.max(minTotal, Math.min(maxTotal, autoTotal));

      nextSubs[index] = {
        StatType: nextType,
        BaseValue: clampedBase,
        Value: nextTotal,
        UpgradeCount: nextUpgradeCount,
      };
      return { ...prev, SubStats: nextSubs };
    });
  };

  const handleApplyPresetMode = (mode: "mid" | "max" | "random") => {
    soundEngine.playClick();
    const next = buildPresetEquipmentSpec(
      currentTemplate.ItemId,
      selectedSlot,
      spec.Rarity,
      spec.EnhanceLevel,
      mode
    );
    setSpec({
      ...next,
      IsLocked: spec.IsLocked,
    });
  };

  const handleConfirm = () => {
    soundEngine.playCelestialChime();
    const displayName = `${currentTemplate.ItemName} [${tier.name}${
      spec.EnhanceLevel > 0 ? ` +${spec.EnhanceLevel}` : ""
    }]`;
    onConfirmForge({
      ItemId: currentTemplate.ItemId,
      ItemName: displayName,
      Quantity: Math.max(1, Math.min(20, Math.trunc(quantity) || 1)),
      Rarity: spec.Rarity,
      CustomEquipment: {
        ...spec,
        TemplateId: currentTemplate.ItemId,
        Slot: selectedSlot,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#080c22] border border-[#f5c767]/45 shadow-[0_0_65px_rgba(245,199,103,0.22)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#13193d] via-[#090d24] to-[#13193d] flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-[11px] font-mono text-[#f5c767] uppercase tracking-wider font-bold">
              Xưởng Chế Tác &amp; Cân Bằng Trang Bị Đền Bù (Procedural Equipment Forger)
            </div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wide">
              Tùy Chỉnh Chỉ Số Chính &amp; Dòng Phụ Trang Bị Gửi Qua Thư
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
          >
            Đóng
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Thanh preset nhanh & Thẻ xem trước trang bị */}
          <div className="p-4 rounded-2xl bg-[#060814] border border-[#f5c767]/35 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-16 h-16 rounded-2xl border-2 shrink-0 flex flex-col items-center justify-center bg-[#090d24] ${tier.borderClass}`}
              >
                {currentTemplate?.IconUrl ? (
                  <img
                    src={currentTemplate.IconUrl}
                    alt={currentTemplate.ItemName}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <>
                    <span className="text-[10px] font-mono font-bold text-[#f5c767]">
                      [{tier.tierCode}]
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">
                      {EQUIP_SLOT_LABELS[selectedSlot]}
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-white">
                    {currentTemplate?.ItemName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${tier.badgeClass}`}
                  >
                    [{tier.tierCode}] {tier.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#f5c767]/15 border border-[#f5c767]/40 text-xs font-mono font-bold text-[#f5c767]">
                    +{spec.EnhanceLevel} / {tier.maxEnhance}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#3fe9d6]/15 border border-[#3fe9d6]/35 text-xs font-mono font-bold text-[#3fe9d6]">
                    Điểm Lực Chiến: +{combatScore.toLocaleString("vi-VN")} CP
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-300">
                  Dòng chính:{" "}
                  <strong className="text-[#f5c767]">
                    {formatEquipStatText(
                      spec.MainStat.StatType,
                      spec.MainStat.Value
                    )}
                  </strong>{" "}
                  <span className="text-slate-500">
                    (Gốc +0:{" "}
                    {formatEquipStatText(
                      spec.MainStat.StatType,
                      spec.MainStat.BaseValue
                    )}
                    )
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {spec.SubStats.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-emerald-300"
                    >
                      {formatEquipStatText(s.StatType, s.Value)}
                      {s.UpgradeCount > 0 ? ` (+${s.UpgradeCount})` : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleApplyPresetMode("random")}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-slate-200 cursor-pointer"
              >
                🎲 Roll Ngẫu Nhiên
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetMode("mid")}
                className="px-3 py-1.5 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/40 text-xs font-mono font-bold text-[#3fe9d6] cursor-pointer"
              >
                ⚖️ Chỉ Số Chuẩn (Mid)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetMode("max")}
                className="px-3 py-1.5 rounded-xl bg-[#f5c767]/15 hover:bg-[#f5c767]/25 border border-[#f5c767]/40 text-xs font-mono font-bold text-[#f5c767] cursor-pointer"
              >
                ✨ Chỉ Số Tối Đa (Max Roll)
              </button>
            </div>
          </div>

          {/* Bước 1: Chọn Ô Trang Bị (1..6) & Mẫu Hình Ảnh/Tên */}
          <div className="p-4 rounded-2xl bg-[#090d24] border border-white/10 space-y-4">
            <div className="text-xs font-mono uppercase text-[#3fe9d6] font-bold">
              1. Chọn Vị Trí Ô Trang Bị (6 Ô) &amp; Mẫu Trang Bị
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((slotNum) => {
                const active = selectedSlot === slotNum;
                return (
                  <button
                    key={slotNum}
                    type="button"
                    onClick={() => handleSelectSlot(slotNum)}
                    className={`p-2.5 rounded-xl border text-center font-mono text-xs transition-all cursor-pointer ${
                      active
                        ? "bg-[#3fe9d6]/20 border-[#3fe9d6] text-[#3fe9d6] font-bold"
                        : "bg-[#060814] border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div>Ô #{slotNum}</div>
                    <div className="mt-0.5 text-[11px]">
                      {EQUIP_SLOT_LABELS[slotNum]}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Mẫu Trang Bị thuộc ô {EQUIP_SLOT_LABELS[selectedSlot]}:
                </label>
                <select
                  value={currentTemplate?.ItemId || ""}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedTemplateId(nextId);
                    setSpec((prev) => ({ ...prev, TemplateId: nextId }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#060814] border border-white/15 text-xs font-mono text-white outline-none focus:border-[#3fe9d6]"
                >
                  {templatesInSlot.map((tpl) => (
                    <option key={tpl.ItemId} value={tpl.ItemId}>
                      {tpl.ItemName} ({tpl.ItemId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Số lượng đền bù:
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Math.min(20, Number(e.target.value) || 1))
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#060814] border border-white/15 text-xs font-mono text-center text-[#f5c767] font-bold"
                />
              </div>

              <div className="sm:col-span-2 pt-4">
                <label className="inline-flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={spec.IsLocked}
                    onChange={(e) =>
                      setSpec((prev) => ({
                        ...prev,
                        IsLocked: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#f5c767]"
                  />
                  <span>Khóa bảo vệ sẵn</span>
                </label>
              </div>
            </div>
          </div>

          {/* Bước 2: Chọn Phẩm Chất (0..4) & Cấp Cường Hóa (+0..+100) */}
          <div className="p-4 rounded-2xl bg-[#090d24] border border-white/10 space-y-4">
            <div className="text-xs font-mono uppercase text-[#f5c767] font-bold">
              2. Phẩm Chất (Rarity) &amp; Cấp Độ Cường Hóa (+0 → +{tier.maxEnhance})
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.values(EQUIP_RARITY_TIERS).map((t) => {
                const active = spec.Rarity === t.rarity;
                return (
                  <button
                    key={t.rarity}
                    type="button"
                    onClick={() => handleSelectRarity(t.rarity)}
                    className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                      active
                        ? `${t.badgeClass} ring-1 ring-current`
                        : "bg-[#060814] border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold">
                      [{t.tierCode}] {t.name}
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Max +{t.maxEnhance} · {t.subStatCount} dòng phụ
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-[#060814] border border-white/10 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-slate-300">
                  Cấp độ cường hóa hiện tại:{" "}
                  <strong className="text-[#f5c767]">
                    +{spec.EnhanceLevel} / +{tier.maxEnhance}
                  </strong>{" "}
                  (Tăng trưởng dòng chính: +
                  {Math.round(spec.EnhanceLevel * tier.mainGrowth * 100)}%)
                </span>
                <div className="flex items-center gap-1.5">
                  {[0, 10, 20, 40, 60, 80, 100]
                    .filter((lv) => lv <= tier.maxEnhance)
                    .map((lv) => (
                      <button
                        key={lv}
                        type="button"
                        onClick={() => handleChangeEnhanceLevel(lv)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
                          spec.EnhanceLevel === lv
                            ? "bg-[#f5c767] text-[#050814] border-[#f5c767] font-bold"
                            : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
                        }`}
                      >
                        +{lv}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={tier.maxEnhance}
                  step={1}
                  value={spec.EnhanceLevel}
                  onChange={(e) =>
                    handleChangeEnhanceLevel(Number(e.target.value))
                  }
                  className="flex-1 accent-[#f5c767] cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={tier.maxEnhance}
                  value={spec.EnhanceLevel}
                  onChange={(e) =>
                    handleChangeEnhanceLevel(Number(e.target.value))
                  }
                  className="w-20 px-2.5 py-1 rounded-lg bg-[#090d24] border border-white/15 text-xs font-mono text-center text-[#f5c767] font-bold"
                />
              </div>
            </div>
          </div>

          {/* Bước 3: Tùy Chỉnh Chỉ Số Chính (MainStat) */}
          <div className="p-4 rounded-2xl bg-[#090d24] border border-[#f5c767]/30 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase text-[#f5c767] font-bold">
                3. Chỉ Số Chính (MainStat — Đặc Trưng Ô {EQUIP_SLOT_LABELS[selectedSlot]})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Ngưỡng gốc (+0) hợp lệ của bậc {tier.name}:{" "}
                <strong className="text-[#3fe9d6]">
                  {mainRange.min}
                  {mainMeta?.isPct ? "%" : ""} – {mainRange.max}
                  {mainMeta?.isPct ? "%" : ""}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Loại Chỉ Số Chính:
                </label>
                <select
                  value={spec.MainStat.StatType}
                  onChange={(e) =>
                    handleChangeMainStatType(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#060814] border border-white/15 text-xs font-mono text-white outline-none focus:border-[#f5c767]"
                >
                  {allowedMainStats.map((st) => {
                    const m = EQUIP_STAT_META[st];
                    return (
                      <option key={st} value={st}>
                        {m.label} ({m.isPct ? "Theo %" : "Chỉ số phẳng"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="md:col-span-5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>
                    Giá trị gốc ở +0 ({mainRange.min} – {mainRange.max}):
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleChangeMainBaseValue(mainRange.min)}
                      className="px-1.5 py-0.2 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 cursor-pointer"
                    >
                      Min
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeMainBaseValue(mainRange.mid)}
                      className="px-1.5 py-0.2 rounded bg-[#3fe9d6]/15 text-[10px] text-[#3fe9d6] cursor-pointer"
                    >
                      Chuẩn
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeMainBaseValue(mainRange.max)}
                      className="px-1.5 py-0.2 rounded bg-[#f5c767]/15 text-[10px] text-[#f5c767] cursor-pointer"
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={mainRange.min}
                    max={mainRange.max}
                    step={mainMeta?.isInt ? 1 : 0.01}
                    value={spec.MainStat.BaseValue}
                    onChange={(e) =>
                      handleChangeMainBaseValue(Number(e.target.value))
                    }
                    className="flex-1 accent-[#3fe9d6] cursor-pointer"
                  />
                  <input
                    type="number"
                    min={mainRange.min}
                    max={mainRange.max}
                    step={mainMeta?.isInt ? 1 : 0.01}
                    value={spec.MainStat.BaseValue}
                    onChange={(e) =>
                      handleChangeMainBaseValue(Number(e.target.value))
                    }
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-[#060814] border border-white/15 text-xs font-mono text-center text-white"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <div className="p-2.5 rounded-xl bg-[#060814] border border-[#f5c767]/40 text-center">
                  <div className="text-[10px] font-mono text-slate-400">
                    Thực Tế Tại +{spec.EnhanceLevel}
                  </div>
                  <div className="text-sm font-bold font-mono text-[#f5c767] mt-0.5">
                    {formatEquipStatText(
                      spec.MainStat.StatType,
                      spec.MainStat.Value
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bước 4: Tùy Chỉnh Các Dòng Chỉ Số Phụ (SubStats) */}
          <div className="p-4 rounded-2xl bg-[#090d24] border border-emerald-500/30 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase text-emerald-300 font-bold">
                4. Các Dòng Chỉ Số Phụ ({tier.subStatCount} Dòng · Không Trùng Lặp)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Lượt nhảy mốc +10 đã phân bổ:{" "}
                <strong className="text-[#f5c767]">
                  {currentTotalUpgrades} / {maxTotalUpgrades}
                </strong>{" "}
                lượt
              </span>
            </div>

            <div className="space-y-2.5">
              {spec.SubStats.map((sub, idx) => {
                const subMeta = EQUIP_STAT_META[sub.StatType];
                const subRange = getSubStatBaseRange(sub.StatType, spec.Rarity);
                const usedByOthers = new Set<number>([
                  spec.MainStat.StatType,
                  ...spec.SubStats.filter((_, i) => i !== idx).map(
                    (s) => s.StatType
                  ),
                ]);
                const otherUpgrades = spec.SubStats.reduce(
                  (sum, s, i) => (i === idx ? sum : sum + s.UpgradeCount),
                  0
                );
                const maxUpgForRow = Math.max(
                  0,
                  maxTotalUpgrades - otherUpgrades
                );

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#060814] border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                  >
                    <div className="md:col-span-3">
                      <div className="text-[10px] font-mono text-slate-400 mb-1">
                        Dòng Phụ #{idx + 1}:
                      </div>
                      <select
                        value={sub.StatType}
                        onChange={(e) =>
                          handleUpdateSubStat(idx, {
                            StatType: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#090d24] border border-white/15 text-xs font-mono text-white outline-none focus:border-emerald-400"
                      >
                        {ALL_SUB_STAT_TYPES.map((st) => {
                          const m = EQUIP_STAT_META[st];
                          const disabled = usedByOthers.has(st);
                          return (
                            <option key={st} value={st} disabled={disabled}>
                              {m.label}
                              {disabled ? " (Đã dùng)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>
                          Roll gốc ({subRange.min} – {subRange.max}
                          {subMeta?.isPct ? "%" : ""}):
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSubStat(idx, {
                                BaseValue: subRange.min,
                              })
                            }
                            className="px-1.5 py-0.2 rounded bg-white/5 text-[10px] text-slate-300 cursor-pointer"
                          >
                            Min
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSubStat(idx, {
                                BaseValue: subRange.mid,
                              })
                            }
                            className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-[10px] text-emerald-300 cursor-pointer"
                          >
                            Chuẩn
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSubStat(idx, {
                                BaseValue: subRange.max,
                              })
                            }
                            className="px-1.5 py-0.2 rounded bg-[#f5c767]/15 text-[10px] text-[#f5c767] cursor-pointer"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={subRange.min}
                          max={subRange.max}
                          step={subMeta?.isInt ? 1 : 0.01}
                          value={sub.BaseValue}
                          onChange={(e) =>
                            handleUpdateSubStat(idx, {
                              BaseValue: Number(e.target.value),
                            })
                          }
                          className="flex-1 accent-emerald-400 cursor-pointer"
                        />
                        <input
                          type="number"
                          min={subRange.min}
                          max={subRange.max}
                          step={subMeta?.isInt ? 1 : 0.01}
                          value={sub.BaseValue}
                          onChange={(e) =>
                            handleUpdateSubStat(idx, {
                              BaseValue: Number(e.target.value),
                            })
                          }
                          className="w-20 px-2 py-1 rounded-lg bg-[#090d24] border border-white/15 text-xs font-mono text-center text-white"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-[10px] font-mono text-slate-400 mb-1">
                        Mốc +10 (0–{maxUpgForRow}):
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={maxUpgForRow}
                        disabled={maxTotalUpgrades === 0}
                        value={sub.UpgradeCount}
                        onChange={(e) =>
                          handleUpdateSubStat(idx, {
                            UpgradeCount: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#090d24] border border-white/15 text-xs font-mono text-center text-[#f5c767] disabled:opacity-40"
                      />
                    </div>

                    <div className="md:col-span-2 text-right">
                      <div className="text-[10px] font-mono text-slate-400">
                        Tổng Dòng Phụ
                      </div>
                      <div className="text-xs font-bold font-mono text-emerald-300 mt-0.5">
                        {formatEquipStatText(sub.StatType, sub.Value)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#060814] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono text-slate-400">
            Khi người chơi bấm <strong className="text-white">Nhận Quà</strong>{" "}
            trong hòm thư, trang bị sẽ được khởi tạo trực tiếp vào{" "}
            <strong className="text-[#3fe9d6]">Kho Trang Bị</strong> với đúng bộ chỉ số này.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#050814] font-bold text-xs font-mono uppercase tracking-wider shadow-[0_0_20px_rgba(245,199,103,0.3)] hover:brightness-110 transition-all cursor-pointer"
            >
              ⚒️ Đính Kèm Trang Bị Vào Thư Đền Bù
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
