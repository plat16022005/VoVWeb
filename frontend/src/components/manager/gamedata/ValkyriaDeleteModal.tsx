"use client";

import { Character } from "@/data/characters";
import { soundEngine } from "@/services/audio.service";
import { DEFAULT_HERO_IMAGE } from "@/services/character.service";

interface ValkyriaDeleteModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (char: Character) => Promise<void>;
  isDeleting: boolean;
}

export default function ValkyriaDeleteModal({
  character,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: ValkyriaDeleteModalProps) {
  if (!isOpen || !character) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-[family-name:var(--font-inter)]">
      <div className="relative w-full max-w-md rounded-3xl bg-[#090d24] border border-rose-500/40 p-6 shadow-[0_0_50px_rgba(244,63,94,0.25)] text-slate-100 space-y-5">
        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl shrink-0">
            ⚠️
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
              XÁC NHẬN XÓA VALKYRIA
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Hành động này sẽ gỡ bỏ dữ liệu khỏi hệ thống trò chơi.
            </p>
          </div>
        </div>

        {/* Target Character Card Mini */}
        <div className="p-3.5 rounded-xl bg-[#060814] border border-white/10 flex items-center gap-3">
          <div className="w-12 h-14 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
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
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] truncate">
              {character.name}
            </div>
            {character.title && (
              <div className="text-xs text-[#f5c767] truncate font-sans">
                {character.title}
              </div>
            )}
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              ID: <span className="text-[#3fe9d6]">#{character.id}</span> • Vai trò: <span className="text-[#3fe9d6]">{character.role || "Archer"}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-sans leading-relaxed">
          Bạn có chắc chắn muốn xóa vĩnh viễn Valkyria <strong>{character.name}</strong> không? Các người chơi đang sở hữu nhân vật này trong game có thể bị ảnh hưởng.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={() => onConfirm(character)}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang Xóa...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>Xác Nhận Xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

