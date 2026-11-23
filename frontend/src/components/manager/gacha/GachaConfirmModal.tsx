"use client";

import { soundEngine } from "@/services/audio.service";

interface GachaConfirmModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  description: string;
  variant?: "danger" | "warning" | "cyan";
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function GachaConfirmModal({
  isOpen,
  title,
  subtitle,
  description,
  variant = "warning",
  confirmLabel = "Xác Nhận",
  loading = false,
  onClose,
  onConfirm,
}: GachaConfirmModalProps) {
  if (!isOpen) return null;

  const styles =
    variant === "danger"
      ? {
          border: "border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.25)]",
          badge: "Cảnh Báo Thao Tác",
          badgeClass: "text-rose-400",
          box: "text-rose-200 bg-rose-500/10 border-rose-500/25",
          btn: "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]",
        }
      : variant === "cyan"
      ? {
          border: "border-[#3fe9d6]/40 shadow-[0_0_50px_rgba(63,233,214,0.2)]",
          badge: "Xác Nhận Phát Hành",
          badgeClass: "text-[#3fe9d6]",
          box: "text-cyan-100 bg-[#3fe9d6]/10 border-[#3fe9d6]/25",
          btn: "bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] hover:brightness-110 text-[#060814] shadow-[0_0_20px_rgba(63,233,214,0.4)]",
        }
      : {
          border: "border-[#f5c767]/40 shadow-[0_0_50px_rgba(245,199,103,0.2)]",
          badge: "Xác Nhận Thay Đổi",
          badgeClass: "text-[#f5c767]",
          box: "text-amber-100 bg-[#f5c767]/10 border-[#f5c767]/25",
          btn: "bg-gradient-to-r from-[#f5c767] to-[#e6b143] hover:brightness-110 text-[#060814] shadow-[0_0_20px_rgba(245,199,103,0.4)]",
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-[family-name:var(--font-inter)]">
      <div
        className={`relative w-full max-w-md rounded-3xl bg-[#090d24] border p-6 text-slate-100 space-y-5 ${styles.border}`}
      >
        <div className="space-y-1">
          <div className={`text-[11px] font-mono uppercase tracking-wider font-bold ${styles.badgeClass}`}>
            {styles.badge}
          </div>
          <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-mono text-slate-400">{subtitle}</p>
          )}
        </div>

        <p className={`text-xs p-3.5 rounded-xl border font-sans leading-relaxed ${styles.box}`}>
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onConfirm();
            }}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 ${styles.btn}`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Đang Xử Lý...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
