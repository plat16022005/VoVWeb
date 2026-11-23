"use client";

import { Character } from "@/data/characters";
import { soundEngine } from "@/services/audio.service";
import { getRarityColor, getRarityImage, DEFAULT_HERO_IMAGE } from "@/services/character.service";

interface ValkyriaCardProps {
  character: Character;
  onViewDetail: (char: Character) => void;
  onEdit: (char: Character) => void;
  onDelete: (char: Character) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export default function ValkyriaCard({
  character,
  onViewDetail,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: ValkyriaCardProps) {
  const rarityCode = character.rarityLabel || character.rarity || "R";
  const rarityColor = getRarityColor(rarityCode);

  return (
    <div
      className="group relative rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col overflow-hidden shadow-xl hover:-translate-y-1"
      style={{
        boxShadow: `0 0 25px ${rarityColor}15`,
      }}
    >
      {/* Top Banner / Image Container */}
      <div
        className="relative h-52 w-full overflow-hidden bg-[#060814] flex items-center justify-center"
        style={{
          background: `radial-gradient(ellipse at 50% 25%, ${rarityColor}25 0%, #060814 80%)`,
        }}
      >
        {/* Hiệu ứng hào quang nền (Nằm phía sau ảnh nhân vật) */}
        <div
          className="absolute top-0 w-52 h-52 rounded-full blur-3xl opacity-30 pointer-events-none z-0"
          style={{ backgroundColor: rarityColor }}
        />

        {/* Character Portrait (Ảnh nguyên bản, không áp filter đổi màu) */}
        <img
          src={character.image || DEFAULT_HERO_IMAGE}
          alt={character.name}
          className="relative z-10 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (!img.src.includes("default_hero")) {
              img.src = DEFAULT_HERO_IMAGE;
            }
          }}
        />

        {/* Fallback Graphic if Image fails */}
        <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
          <div className="w-16 h-16 rounded-full border border-white/20" />
        </div>

        {/* Gradient mờ viền chân ảnh */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#090d24] to-transparent z-10 pointer-events-none" />

        {/* Rarity Badge (Top-Left) */}
        <div
          className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-xl backdrop-blur-md border shadow-lg flex items-center justify-center bg-[#060814]/85"
          style={{
            borderColor: `${rarityColor}60`,
            boxShadow: `0 0 12px ${rarityColor}30`,
          }}
        >
          {getRarityImage(rarityCode) ? (
            <div className="relative h-5 w-11 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
              <img
                src={getRarityImage(rarityCode)!}
                alt={String(rarityCode)}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <span className="font-mono font-black text-xs" style={{ color: rarityColor }}>
              {rarityCode}
            </span>
          )}
        </div>

        {/* Status Pill (Bottom-Right of Image) */}
        <div className="absolute bottom-2.5 right-3 z-20 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{character.status || "Active"}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          {/* Role */}
          <div className="text-xs font-mono text-slate-300 flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#3fe9d6]/10 border border-[#3fe9d6]/30 text-[#3fe9d6] font-bold">
              Vai Trò: {character.role || "Archer"}
            </span>
            {character.releaseVersion && (
              <span className="text-slate-500 font-mono text-[10px]">{character.releaseVersion}</span>
            )}
          </div>

          {/* Name & Title */}
          <div className="mt-2">
            <h3 className="font-[family-name:var(--font-rajdhani)] text-lg sm:text-xl font-bold text-white group-hover:text-[#3fe9d6] transition-colors">
              {character.name}
            </h3>
            {character.title && (
              <p className="text-xs text-[#f5c767] font-sans font-medium line-clamp-1 mt-0.5">
                {character.title}
              </p>
            )}
          </div>

          {/* Quote Snippet */}
          <p className="mt-2 text-[11px] text-slate-400 italic line-clamp-2 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/5">
            "{character.quote}"
          </p>
        </div>

        {/* Combat Stats Overview Grid */}
        <div className="grid grid-cols-4 gap-1.5 py-2 px-2.5 rounded-xl bg-[#060814]/70 border border-white/5 text-[10px] font-mono text-center">
          <div>
            <div className="text-slate-500">HP</div>
            <div className="font-bold text-white">{character.baseHp || 1000}</div>
          </div>
          <div>
            <div className="text-slate-500">ATK</div>
            <div className="font-bold text-rose-400">{character.baseAtk || 500}</div>
          </div>
          <div>
            <div className="text-slate-500">DEF</div>
            <div className="font-bold text-sky-400">{character.baseDef || 400}</div>
          </div>
          <div>
            <div className="text-slate-500">SPD</div>
            <div className="font-bold text-emerald-400">{character.baseSpd || 100}</div>
          </div>
        </div>

        {/* Skills count & Voice Actor */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-white/5">
          <span>{character.skills?.length || 0} Kỹ Năng</span>
          <span className="text-slate-300 truncate max-w-[140px] text-right font-mono">
            CV: {character.cv.split("/")[0].trim()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {/* View Detail Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onViewDetail(character);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-mono font-semibold transition-all border border-white/10 cursor-pointer"
          >
            Xem
          </button>

          {/* Edit Button */}
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onEdit(character);
              }}
              className="py-2 px-3 rounded-xl bg-[#3fe9d6]/10 hover:bg-[#3fe9d6]/20 text-[#3fe9d6] hover:text-white text-xs font-mono font-semibold transition-all border border-[#3fe9d6]/30 cursor-pointer"
              title="Chỉnh sửa thông số Valkyria"
            >
              Sửa
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onDelete(character);
              }}
              className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 text-xs font-mono font-semibold transition-all border border-rose-500/30 cursor-pointer"
              title="Xóa Valkyria khỏi hệ thống"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
