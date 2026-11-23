"use client";

import { BanViolationInfo } from "@/services/auth.service";
import { soundEngine } from "@/services/audio.service";

interface BannedNotificationModalProps {
  isOpen: boolean;
  violation: BanViolationInfo | null;
  onClose: () => void;
}

export default function BannedNotificationModal({
  isOpen,
  violation,
  onClose,
}: BannedNotificationModalProps) {
  if (!isOpen || !violation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => {
          soundEngine.playClick();
          onClose();
        }}
        className="absolute inset-0 bg-[#040612]/85 backdrop-blur-md animate-fadeIn"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0a0818] border border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.3)] overflow-hidden animate-scaleUp z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-rose-500/20 bg-gradient-to-r from-rose-950/60 via-rose-900/20 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  THÔNG BÁO TÀI KHOẢN
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {violation.bannedAt || "Thời gian không xác định"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)] mt-1">
                Tài Khoản Của Bạn Đã Bị Khóa
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-lg leading-none transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Nội dung chi tiết vi phạm - Cuộn được nếu dài */}
        <div className="p-6 space-y-4 overflow-y-auto pr-4 text-xs sm:text-sm font-sans">
          {/* Thông tin tài khoản */}
          <div className="p-3.5 rounded-xl bg-[#060814] border border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div>
              <span className="text-slate-400">Tài khoản: </span>
              <strong className="text-white">{violation.username || "Người dùng"}</strong>
            </div>
            {violation.email && (
              <div>
                <span className="text-slate-400">Email: </span>
                <span className="text-[#3fe9d6]">{violation.email}</span>
              </div>
            )}
          </div>

          {/* Điều khoản vi phạm */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-semibold text-rose-300 flex items-center justify-between gap-1.5 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span>Lý Do / Điều Khoản Vi Phạm:</span>
              </div>
              {violation.terms && violation.terms.length > 1 && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {violation.terms.length} điều khoản
                </span>
              )}
            </div>

            {violation.terms && violation.terms.length > 1 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {violation.terms.map((term, index) => (
                  <div
                    key={term.id || index}
                    className="p-3.5 rounded-xl bg-[#120a1c] border border-rose-500/30 shadow-inner space-y-1.5"
                  >
                    <h4 className="text-xs sm:text-sm font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-mono flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span>{term.title}</span>
                    </h4>

                    {term.content ? (
                      <div className="p-2.5 rounded-lg bg-[#060814]/90 border border-white/5 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap max-h-28 overflow-y-auto pl-3">
                        {term.content}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic pl-7">
                        (Chi tiết được quy định trong Điều khoản Dịch vụ)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#120a1c] border border-rose-500/30 shadow-inner space-y-2">
                <h4 className="text-sm sm:text-base font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
                  {violation.termTitle || "Vi phạm Điều khoản Dịch vụ"}
                </h4>

                {violation.termContent ? (
                  <div className="p-3 rounded-lg bg-[#060814]/90 border border-white/5 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {violation.termContent}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    (Chi tiết được quy định trong Điều khoản Dịch vụ)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Ghi chú chi tiết từ Quản trị viên */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-semibold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <span>Ghi Chú Từ Quản Trị Viên:</span>
            </div>
            <div className="p-4 rounded-xl bg-[#131109] border border-amber-500/30 text-amber-100 text-xs sm:text-sm leading-relaxed font-sans">
              {violation.note || "Tài khoản bị khóa do vi phạm Điều khoản Dịch vụ."}
            </div>
          </div>

          {/* Hướng dẫn liên hệ hỗ trợ */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-[#3fe9d6] font-semibold">
              <span>Hỗ trợ & Thắc mắc:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ để được kiểm tra và xử lý lại.
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#060814] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer text-center"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
