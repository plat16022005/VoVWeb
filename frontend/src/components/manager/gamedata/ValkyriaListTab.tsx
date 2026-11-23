"use client";

import { useState, useMemo } from "react";
import { Character } from "@/data/characters";
import {
  ROLE_OPTIONS,
  RARITY_OPTIONS,
  getRarityColor,
  sortCharactersByRarity,
  DEFAULT_HERO_IMAGE,
} from "@/services/character.service";
import ValkyriaCard from "./ValkyriaCard";
import { soundEngine } from "@/services/audio.service";

interface ValkyriaListTabProps {
  characters: Character[];
  loading: boolean;
  onAddNew: () => void;
  onViewDetail: (char: Character) => void;
  onEdit: (char: Character) => void;
  onDelete: (char: Character) => void;
  onResetDefaults: () => void;
  onSyncToFirestore?: () => void;
  isSyncing?: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function ValkyriaListTab({
  characters,
  loading,
  onAddNew,
  onViewDetail,
  onEdit,
  onDelete,
  onResetDefaults,
  onSyncToFirestore,
  isSyncing = false,
  canEdit,
  canDelete,
}: ValkyriaListTabProps) {
  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterRarity, setFilterRarity] = useState<string>("ALL");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filtered List
  const filteredList = useMemo(() => {
    const filtered = characters.filter((c) => {
      // Search match
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query);

      if (!matchSearch) return false;

      // Rarity filter
      if (filterRarity !== "ALL") {
        const itemRarity = (c.rarityLabel || (c.rarity === 5 ? "SSR" : c.rarity === 4 ? "SR" : "R")).toUpperCase();
        if (itemRarity !== filterRarity.toUpperCase()) return false;
      }

      // Role filter
      if (filterRole !== "ALL") {
        const role = (c.role || "").toLowerCase();
        const target = filterRole.toLowerCase();
        if (!role.includes(target) && target !== role) return false;
      }

      return true;
    });

    return sortCharactersByRarity(filtered);
  }, [characters, search, filterRarity, filterRole]);

  // Statistics
  const totalCount = characters.length;
  const countSSR = characters.filter((c) => (c.rarityLabel === "SSR" || c.rarityLabel === "UR" || c.rarity >= 5)).length;
  const countSR_R = characters.filter((c) => (c.rarityLabel === "SR" || c.rarityLabel === "R" || c.rarity < 5)).length;

  return (
    <div className="space-y-6">
      {/* 1. OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-lg">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Tổng Valkyria
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-rajdhani)]">
              {totalCount}
            </span>
            <span className="text-[11px] font-mono text-slate-400">Chiến binh</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-[#ef4444]/30 shadow-lg">
          <div className="text-xs font-mono text-[#ef4444] uppercase tracking-wider">
            Độ Hiếm SSR (Đỏ)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#ef4444] font-[family-name:var(--font-rajdhani)]">
              {countSSR}
            </span>
            <span className="text-[11px] font-mono text-slate-400">Huyền Thoại</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-[#f5c767]/30 shadow-lg">
          <div className="text-xs font-mono text-[#f5c767] uppercase tracking-wider">
            Độ Hiếm SR & R
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#f5c767] font-[family-name:var(--font-rajdhani)]">
              {countSR_R}
            </span>
            <span className="text-[11px] font-mono text-slate-400">Vàng & Xanh</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-[#3fe9d6]/30 shadow-lg">
          <div className="text-xs font-mono text-[#3fe9d6] uppercase tracking-wider">
            Vai Trò Chiến Đấu
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#3fe9d6] font-[family-name:var(--font-rajdhani)]">
              {ROLE_OPTIONS.length}
            </span>
            <span className="text-[11px] font-mono text-slate-400">Vai trò (Role)</span>
          </div>
        </div>
      </div>

      {/* 2. FILTER & TOOLBAR CONTROLS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên Valkyria, danh hiệu hoặc ID..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans placeholder:text-slate-500 focus:outline-none focus:border-[#3fe9d6] transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="p-1 rounded-xl bg-[#060814] border border-white/10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${viewMode === "grid"
                    ? "bg-white/10 text-[#3fe9d6]"
                    : "text-slate-400 hover:text-white"
                  }`}
                title="Dạng Lưới Thẻ Bài"
              >
                Lưới
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${viewMode === "table"
                    ? "bg-white/10 text-[#3fe9d6]"
                    : "text-slate-400 hover:text-white"
                  }`}
                title="Dạng Bảng Danh Sách"
              >
                Bảng
              </button>
            </div>

            {/* Reset to Defaults */}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onResetDefaults();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-semibold transition-all cursor-pointer"
                title="Khôi phục 4 nhân vật mẫu gốc"
              >
                Khôi Phục Mẫu
              </button>
            )}

            {/* Sync directly to Server */}
            {canEdit && onSyncToFirestore && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onSyncToFirestore();
                }}
                disabled={isSyncing}
                className="px-3.5 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-mono font-semibold transition-all cursor-pointer disabled:opacity-50"
                title="Đồng bộ trực tiếp danh sách nhân vật lên hệ thống máy chủ"
              >
                {isSyncing ? "Đang Đồng Bộ..." : "Đồng Bộ Hệ Thống Live"}
              </button>
            )}

            {/* Add New Valkyria */}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onAddNew();
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#f5c767] hover:brightness-110 text-black text-xs font-mono font-bold shadow-[0_0_20px_rgba(63,233,214,0.4)] transition-all cursor-pointer"
              >
                + Thêm Valkyria
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5 text-xs font-mono">
          {/* Rarity */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">Độ hiếm:</span>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#060814] border border-white/10 text-white focus:outline-none focus:border-[#3fe9d6]"
            >
              <option value="ALL">Tất cả phẩm cấp</option>
              {RARITY_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">Vai trò:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#060814] border border-white/10 text-white focus:outline-none focus:border-[#3fe9d6]"
            >
              <option value="ALL">Tất cả vai trò</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. CHARACTERS CONTENT AREA */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#3fe9d6]/30 border-t-[#3fe9d6] rounded-full animate-spin" />
          <div className="text-xs font-mono text-slate-400">
            Đang tải dữ liệu Valkyria từ hệ thống...
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#090d24]/50 border border-dashed border-white/10 space-y-2">
          <h4 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)]">
            Không tìm thấy chiến binh Valkyria nào phù hợp
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
            Thử điều chỉnh từ khóa tìm kiếm hoặc làm mới bộ lọc độ hiếm và hệ nguyên tố.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredList.map((char) => (
            <ValkyriaCard
              key={char.id}
              character={char}
              onViewDetail={onViewDetail}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      ) : (
        /* TABLE MODE */
        <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060814] text-slate-400 font-mono uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Valkyria</th>
                  <th className="py-3.5 px-3">Phẩm Cấp</th>
                  <th className="py-3.5 px-3">Vai Trò (Role)</th>
                  <th className="py-3.5 px-3">Chỉ Số (HP/ATK/DEF/SPD)</th>
                  <th className="py-3.5 px-3">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredList.map((char) => (
                  <tr
                    key={char.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Avatar & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                          <img
                            src={char.image || DEFAULT_HERO_IMAGE}
                            alt={char.name}
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (!img.src.includes("default_hero")) {
                                img.src = DEFAULT_HERO_IMAGE;
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-[#3fe9d6] transition-colors font-[family-name:var(--font-rajdhani)] text-sm">
                            {char.name}
                          </div>
                          {char.title ? (
                            <div className="text-[11px] text-[#f5c767] truncate max-w-[180px]">
                              {char.title}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Rarity */}
                    <td className="py-3 px-3">
                      <span
                        className="px-2 py-0.5 rounded-md font-mono text-xs font-black border"
                        style={{
                          backgroundColor: `${getRarityColor(char.rarityLabel || char.rarity)}20`,
                          borderColor: `${getRarityColor(char.rarityLabel || char.rarity)}60`,
                          color: getRarityColor(char.rarityLabel || char.rarity),
                        }}
                      >
                        {char.rarityLabel || (char.rarity >= 5 ? "SSR" : "SR")}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3 font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30 font-bold text-[11px]">
                        {char.role || "Archer"}
                      </span>
                    </td>

                    {/* Stats */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      <span className="text-white">{char.baseHp || 1000}</span> /{" "}
                      <span className="text-rose-400">{char.baseAtk || 500}</span> /{" "}
                      <span className="text-sky-400">{char.baseDef || 400}</span> /{" "}
                      <span className="text-emerald-400">{char.baseSpd || 100}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 font-mono">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{char.status || "Active"}</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            onViewDetail(char);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                          title="Xem chi tiết hồ sơ"
                        >
                          Xem
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              onEdit(char);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#3fe9d6]/10 hover:bg-[#3fe9d6]/20 border border-[#3fe9d6]/30 text-[#3fe9d6] text-xs font-mono font-semibold transition-colors cursor-pointer"
                            title="Chỉnh sửa nhân vật"
                          >
                            Sửa
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              onDelete(char);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-xs font-mono font-semibold transition-colors cursor-pointer"
                            title="Xóa nhân vật"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
