"use client";

import { GameItemConfig } from "@/services/itemConfig.service";

interface ItemSelectorFieldProps {
  label?: string;
  value: string;
  items: GameItemConfig[];
  prioritizeTicketType4?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (itemId: string) => void;
}

export default function ItemSelectorField({
  label,
  value,
  items,
  prioritizeTicketType4 = false,
  allowEmpty = false,
  emptyLabel = "-- Chọn vật phẩm --",
  disabled = false,
  loading = false,
  onChange,
}: ItemSelectorFieldProps) {
  const ticketItems = prioritizeTicketType4
    ? items.filter((item) => item.type === 4)
    : [];
  const otherItems = prioritizeTicketType4
    ? items.filter((item) => item.type !== 4)
    : items;

  const hasCurrentValue =
    Boolean(value) && items.some((item) => item.id === value);

  const selectedItem = items.find((item) => item.id === value);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-mono text-slate-300 font-semibold">
          {label}
        </label>
      )}
      <select
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-[#060814] border border-white/15 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none transition-colors disabled:opacity-50"
      >
        <option value="">
          {loading
            ? "Đang tải danh sách vật phẩm..."
            : allowEmpty
            ? emptyLabel
            : "-- Chọn vật phẩm từ hệ thống --"}
        </option>

        {!hasCurrentValue && value && (
          <option value={value}>
            {value} (Chưa tìm thấy trong danh mục hiện tại)
          </option>
        )}

        {prioritizeTicketType4 && ticketItems.length > 0 && (
          <optgroup label="Vé Triệu Hồi (Type 4)">
            {ticketItems.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.id}] {item.name}
                {item.rarity ? ` · ${item.rarity}` : ""}
              </option>
            ))}
          </optgroup>
        )}

        {otherItems.length > 0 && (
          <optgroup
            label={
              prioritizeTicketType4 ? "Vật Phẩm Khác" : "Danh Mục Vật Phẩm"
            }
          >
            {otherItems.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.id}] {item.name}
                {item.type ? ` (Type ${item.type})` : ""}
                {item.rarity ? ` · ${item.rarity}` : ""}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {selectedItem?.description && (
        <p className="text-[10px] text-slate-400 line-clamp-1 font-sans">
          {selectedItem.description}
        </p>
      )}
    </div>
  );
}
