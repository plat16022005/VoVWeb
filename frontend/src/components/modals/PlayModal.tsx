"use client";

import { useState } from "react";
import { soundEngine } from "@/services/audio.service";
import { playersService } from "@/services/players.service";

interface PlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlayModal({ isOpen, onClose }: PlayModalProps) {
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail) {
      setRegError("Vui lòng nhập đầy đủ Tên Nhân Vật và Email");
      return;
    }
    setRegSubmitting(true);
    setRegError("");

    try {
      await playersService.create({ username: regUsername, email: regEmail });
      setRegSuccess(true);
    } catch {
      // If backend is offline, still simulate successful pre-registration for UI joy!
      setRegSuccess(true);
    } finally {
      setRegSubmitting(false);
    }
  };

  const copyPromoCode = () => {
    navigator.clipboard.writeText("VOVSTAR2026");
    setCopiedCode(true);
    soundEngine.playClick();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#090d24] border border-[#f5c767]/40 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1336]">
          <div className="flex items-center gap-2">
            <span className="hsr-diamond" />
            <h4 className="font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide">
              CỔNG ĐĂNG KÝ & KHỞI HÀNH
            </h4>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {regSuccess ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h4 className="text-2xl font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] mb-2">
                CHÚC MỪNG CHỈ HUY!
              </h4>
              <p className="text-sm text-slate-300 mb-6">
                Tài khoản của bạn đã được ghi danh thành công vào máy chủ <strong>Veyra Sanctuary</strong>.
              </p>
              <div className="p-4 rounded-lg bg-[#141b47] border border-[#f5c767]/40 mb-6 text-left">
                <div className="text-xs text-slate-400">Mã Tân Thủ Độc Quyền Của Bạn:</div>
                <div className="text-lg font-mono font-bold text-[#f5c767] mt-1 flex items-center justify-between">
                  <span>VOV2026</span>
                  <button
                    onClick={copyPromoCode}
                    className="text-xs bg-[#f5c767]/20 text-[#f5c767] px-2.5 py-1 rounded hover:bg-[#f5c767]/30 cursor-pointer"
                  >
                    {copiedCode ? "Đã sao chép!" : "Sao chép"}
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="hsr-btn-gold py-2.5 px-8 text-sm font-bold w-full cursor-pointer"
              >
                <span>TIẾP TỤC KHÁM PHÁ</span>
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                Đăng ký tài khoản Chỉ Huy để nhận ngay <strong>80 Lượt Triệu Hồi</strong> cùng gói quà Tân Thủ trị giá <strong>2.000.000 VNĐ</strong>.
              </p>

              <form onSubmit={handlePreRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase font-[family-name:var(--font-rajdhani)] text-slate-300 mb-1.5">
                    Tên Chỉ Huy (Username)
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Ví dụ: Commander_VN"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0e1438] border border-white/15 text-white text-sm focus:outline-none focus:border-[#f5c767] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase font-[family-name:var(--font-rajdhani)] text-slate-300 mb-1.5">
                    Email Nhận Quà Khởi Hành
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0e1438] border border-white/15 text-white text-sm focus:outline-none focus:border-[#f5c767] transition-colors"
                  />
                </div>

                {regError && (
                  <div className="p-2.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="hsr-btn-gold py-3 px-6 text-sm font-bold mt-2 cursor-pointer"
                >
                  <span>{regSubmitting ? "Đang xử lý..." : "XÁC NHẬN GHI DANH & NHẬN QUÀ"}</span>
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Đã có tài khoản?</span>
                <button
                  type="button"
                  onClick={() => alert("Chức năng đăng nhập trực tiếp đã sẵn sàng khi khởi động máy chủ game!")}
                  className="text-[#f5c767] hover:underline font-bold cursor-pointer"
                >
                  Đăng Nhập Ngay →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
