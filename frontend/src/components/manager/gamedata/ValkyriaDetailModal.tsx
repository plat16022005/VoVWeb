"use client";

import { Character } from "@/data/characters";
import { soundEngine } from "@/services/audio.service";
import { getRarityColor, getRarityImage, DEFAULT_HERO_IMAGE } from "@/services/character.service";

interface ValkyriaDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (char: Character) => void;
  canEdit?: boolean;
}

export default function ValkyriaDetailModal({
  character,
  isOpen,
  onClose,
  onEdit,
  canEdit,
}: ValkyriaDetailModalProps) {
  if (!isOpen || !character) return null;

  const rarityColor = getRarityColor(character.rarityLabel || character.rarity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#080c24] border border-[#3fe9d6]/30 shadow-[0_0_60px_rgba(63,233,214,0.2)] overflow-hidden text-slate-100 font-[family-name:var(--font-inter)]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#060814]/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-inner border font-[family-name:var(--font-rajdhani)]"
              style={{
                backgroundColor: `${rarityColor}20`,
                borderColor: `${rarityColor}50`,
                color: rarityColor,
              }}
            >
              {character.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
                  HỒ SƠ CHIẾN BINH VALKYRIA
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Thông số dữ liệu và bộ kỹ năng chiến đấu tại đại lục Veyra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onClose();
                  onEdit(character);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#3fe9d6]/10 hover:bg-[#3fe9d6]/20 text-[#3fe9d6] hover:text-white border border-[#3fe9d6]/30 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Chỉnh Sửa</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner Card */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0c1438] via-[#090d24] to-[#0c1438] border border-white/10 p-6 flex flex-col md:flex-row items-center gap-6">
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: rarityColor }}
            />

            {/* Left: Character Portrait (Ảnh nguyên bản) */}
            <div className="relative w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden shrink-0 border-2 shadow-2xl" style={{ borderColor: `${rarityColor}60` }}>
              <img
                src={character.image || DEFAULT_HERO_IMAGE}
                alt={character.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.src.includes("default_hero")) {
                    img.src = DEFAULT_HERO_IMAGE;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 inset-x-2 text-center text-xs font-mono font-bold text-white">
                {character.status || "Active"}
              </div>
            </div>

            {/* Right: Key Valkyria Profile */}
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                {/* Rarity Graphic Badge */}
                {getRarityImage(character.rarityLabel || character.rarity) ? (
                  <div
                    className="relative h-7 px-2.5 py-0.5 rounded-lg border shadow-lg flex items-center justify-center bg-[#060814]/90"
                    style={{ borderColor: `${rarityColor}60` }}
                  >
                    <div className="relative h-5 w-11 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
                      <img
                        src={getRarityImage(character.rarityLabel || character.rarity)!}
                        alt="Rarity"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-mono font-black border shadow-lg tracking-wider"
                    style={{
                      backgroundColor: `${rarityColor}20`,
                      borderColor: `${rarityColor}60`,
                      color: rarityColor,
                    }}
                  >
                    Độ Hiếm: {character.rarityLabel || character.rarity || "R"}
                  </span>
                )}

                {/* Role Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30 text-xs font-mono font-bold">
                  <span>Vai Trò: {character.role || "Archer"}</span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-rajdhani)] tracking-wide">
                  {character.name}
                </h1>
                {character.title && (
                  <p className="text-sm font-semibold text-[#f5c767] mt-0.5">
                    {character.title}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs italic text-slate-300">
                "{character.quote}"
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-slate-400">
                <span>Diễn viên lồng tiếng (CV): <strong className="text-slate-200">{character.cv}</strong></span>
                {character.releaseVersion && (
                  <>
                    <span>•</span>
                    <span>Phiên bản ra mắt: <strong className="text-[#3fe9d6]">{character.releaseVersion}</strong></span>
                  </>
                )}
              </div>

              {/* Personal Profile Info: Height, Weight, Birthday */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="px-3 py-2 rounded-xl bg-black/35 border border-white/10">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Chiều Cao</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {character.height?.trim() || "Chưa cập nhật"}
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-black/35 border border-white/10">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Cân Nặng</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {character.weight?.trim() || "Chưa cập nhật"}
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-black/35 border border-white/10">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Ngày Sinh</div>
                  <div className="text-xs font-bold text-[#f5c767] mt-0.5">
                    {character.birthday?.trim() || "Chưa cập nhật"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Combat Stats Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Chỉ Số Chiến Đấu Cơ Bản (Base Combat Stats)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-white/10 text-center">
                <div className="text-[11px] font-mono text-slate-400">Sinh Lực (HP)</div>
                <div className="text-lg font-bold text-white font-mono mt-1">{character.baseHp || 900}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-rose-500/20 text-center">
                <div className="text-[11px] font-mono text-rose-300">Tấn Công (ATK)</div>
                <div className="text-lg font-bold text-rose-400 font-mono mt-1">{character.baseAtk || 120}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-sky-500/20 text-center">
                <div className="text-[11px] font-mono text-sky-300">Phòng Ngự (DEF)</div>
                <div className="text-lg font-bold text-sky-400 font-mono mt-1">{character.baseDef || 50}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-emerald-500/20 text-center">
                <div className="text-[11px] font-mono text-emerald-300">Tốc Độ (Speed)</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1">{character.baseSpd || 100}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-amber-500/20 text-center">
                <div className="text-[11px] font-mono text-amber-300">Tỷ Lệ Bạo (CRIT)</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-1">{character.critRate || 5}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-purple-500/20 text-center">
                <div className="text-[11px] font-mono text-purple-300">Sát Thương Bạo</div>
                <div className="text-lg font-bold text-purple-400 font-mono mt-1">{character.critDmg || 150}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-teal-500/20 text-center">
                <div className="text-[11px] font-mono text-teal-300">Tỷ Lệ Né (Dodge)</div>
                <div className="text-lg font-bold text-teal-400 font-mono mt-1">{character.baseDodgeRate ?? 5}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-indigo-500/20 text-center">
                <div className="text-[11px] font-mono text-indigo-300">Tỷ Lệ Đỡ (Parry)</div>
                <div className="text-lg font-bold text-indigo-400 font-mono mt-1">{character.baseParryRate ?? 5}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060814]/80 border border-orange-500/20 text-center">
                <div className="text-[11px] font-mono text-orange-300">Nộ Khí Tối Đa (Rage)</div>
                <div className="text-lg font-bold text-orange-400 font-mono mt-1">{character.maxRage ?? 100}</div>
              </div>
            </div>
          </div>

          {/* Growth Per Level */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#f5c767]">
              Hệ Số Tăng Trưởng Mỗi Cấp Độ (Growth Per Level)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#060814]/80 border border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Tăng Trưởng Sinh Lực (HP)</span>
                <span className="text-sm font-bold font-mono text-white">+{character.hpGrowthPerLevel ?? 90}/cấp</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060814]/80 border border-rose-500/20 flex items-center justify-between">
                <span className="text-xs font-mono text-rose-300">Tăng Trưởng Tấn Công (ATK)</span>
                <span className="text-sm font-bold font-mono text-rose-400">+{character.atkGrowthPerLevel ?? 12}/cấp</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#060814]/80 border border-sky-500/20 flex items-center justify-between">
                <span className="text-xs font-mono text-sky-300">Tăng Trưởng Phòng Ngự (DEF)</span>
                <span className="text-sm font-bold font-mono text-sky-400">+{character.defGrowthPerLevel ?? 5}/cấp</span>
              </div>
            </div>
          </div>

          {/* 4 Combat Skills */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Bộ Kỹ Năng Chiến Đấu ({character.skills?.length || 0})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {character.skills?.map((skill, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-[#060814]/90 border border-white/10 hover:border-[#3fe9d6]/30 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#3fe9d6] px-2 py-0.5 rounded bg-[#3fe9d6]/10 border border-[#3fe9d6]/20">
                      {skill.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Kỹ năng #{index + 1}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)]">
                    {skill.name}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {skill.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Lore & Story Background */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Tiểu Sử & Cốt Truyện Đại Lục Veyra
            </h3>

            <div className="p-4 rounded-xl bg-[#060814]/80 border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {character.lore}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-[#060814]/90 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            Dữ liệu nhân vật đồng bộ an toàn
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
