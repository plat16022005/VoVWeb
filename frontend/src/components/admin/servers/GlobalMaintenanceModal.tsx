"use client";

import { useState, useEffect } from "react";
import { soundEngine } from "@/services/audio.service";

interface GlobalMaintenanceModalProps {
  isOpen: boolean;
  currentMaintenance: boolean;
  currentMessage: string;
  onClose: () => void;
  onSave: (maintenance: boolean, message: string) => Promise<void>;
}

export default function GlobalMaintenanceModal({
  isOpen,
  currentMaintenance,
  currentMessage,
  onClose,
  onSave,
}: GlobalMaintenanceModalProps) {
  const [maintenance, setMaintenance] = useState(currentMaintenance);
  const [message, setMessage] = useState(currentMessage);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMaintenance(currentMaintenance);
    setMessage(currentMessage || "Hệ thống hiện tại đang bảo trì. Vui lòng quay lại game sau.");
  }, [currentMaintenance, currentMessage, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setIsSaving(true);
    try {
      await onSave(maintenance, message.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090c22] border border-[#f5c767]/40 p-6 shadow-[0_0_50px_rgba(245,199,103,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintenance
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : "bg-[#f5c767]/10 text-[#f5c767] border border-[#f5c767]/30"
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wider">
                CHẾ ĐỘ BẢO TRÌ TOÀN GAME
              </h3>
              <p className="text-xs font-mono text-[#f5c767]">
                Cấu Hình Trực Tuyến Toàn Hệ Thống
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            disabled={isSaving}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Maintenance Switch */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#060818] border border-white/10">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2 flex-wrap">
                Trạng Thái Bảo Trì Toàn Hệ Thống
                {maintenance ? (
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    ĐANG BẢO TRÌ
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    HOẠT ĐỘNG
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Nếu bật, toàn bộ người chơi khi mở game Unity sẽ bị chặn đăng nhập và nhận được thông báo bên dưới.
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={maintenance}
              onClick={() => {
                soundEngine.playClick();
                setMaintenance(!maintenance);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${maintenance
                  ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                  : "bg-slate-700 hover:bg-slate-600"
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${maintenance ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </button>
          </div>

          {/* Maintenance Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono text-slate-300">
                Thông Báo Bảo Trì (Hiển thị hộp thoại khi mở game)
              </label>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMessage("Hệ thống hiện tại đang bảo trì. Vui lòng quay lại game sau.");
                }}
                className="text-[10px] font-mono text-[#3fe9d6] hover:underline cursor-pointer"
              >
                Đặt lại mặc định
              </button>
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-[#f5c767]/50"
              placeholder="Nhập thông báo gửi đến Chỉ Huy..."
              required
            />
          </div>

          {/* In-game Dialog Preview */}
          <div className="p-3.5 rounded-xl bg-[#060818] border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
              Mô phỏng hộp thoại trên màn hình Unity Client:
            </span>
            <div className="p-3 rounded-lg bg-black/80 border border-amber-400/30 text-center space-y-1.5 shadow-inner">
              <div className="text-xs font-bold font-[family-name:var(--font-rajdhani)] text-[#f5c767] uppercase tracking-wide">
                THÔNG BÁO BẢO TRÌ MÁY CHỦ
              </div>
              <p className="text-xs text-slate-200 font-sans px-2">
                {message || "Hệ thống hiện tại đang bảo trì. Vui lòng quay lại game sau."}
              </p>
              <div className="pt-1">
                <span className="inline-block px-4 py-1 rounded bg-white/10 text-[10px] font-mono text-slate-400 border border-white/10">
                  Xác Nhận (Thoát Game)
                </span>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2 rounded-xl font-bold text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center gap-2 ${maintenance
                  ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                  : "bg-gradient-to-r from-[#f5c767] to-[#e6a836] text-[#040614] shadow-[0_0_20px_rgba(245,199,103,0.4)]"
                }`}
            >
              {isSaving ? (
                <span>Đang lưu...</span>
              ) : (
                <span>{maintenance ? "BẬT BẢO TRÌ TOÀN GAME" : "LƯU CẤU HÌNH"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
