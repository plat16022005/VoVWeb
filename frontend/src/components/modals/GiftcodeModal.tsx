"use client";

import { useState } from "react";
import { soundEngine } from "@/services/audio.service";

interface GiftcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GiftcodeModal({ isOpen, onClose }: GiftcodeModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const copyPromoCode = () => {
    navigator.clipboard.writeText("VOVSTAR2026");
    setCopiedCode(true);
    soundEngine.playClick();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#090d24] border border-[#f5c767]/40 rounded-xl overflow-hidden shadow-2xl p-6 text-center">
        <div className="text-4xl mb-3">🎁</div>
        <h4 className="text-2xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)] mb-1">
          GÓI QUÀ KHỞI HÀNH 5.000.000
        </h4>
        <p className="text-xs text-slate-400 mb-6">
          Sao chép mã giftcode bên dưới và nhập vào mục Cài Đặt → Đổi Quà trong game.
        </p>

        <div className="p-4 rounded-lg bg-[#141b47] border border-[#f5c767]/40 mb-6 text-left">
          <div className="text-xs text-slate-400 mb-1">Mã Giftcode Tân Thủ Toàn Cầu:</div>
          <div className="text-xl font-mono font-black text-[#f5c767] flex items-center justify-between">
            <span>VOV2026</span>
            <button
              onClick={copyPromoCode}
              className="text-xs bg-[#f5c767] text-black font-bold px-3 py-1.5 rounded hover:bg-[#ffe394] transition-colors cursor-pointer"
            >
              {copiedCode ? "✓ Đã Chép" : "Sao Chép"}
            </button>
          </div>
        </div>

        <div className="text-left text-xs text-slate-300 space-y-1.5 mb-6 bg-black/40 p-3 rounded border border-white/5">
          <div>✦ <strong>50.000</strong> Vàng Lục Địa Veyra</div>
          <div>✦ <strong>10</strong> Vé Triệu Hồi Valkyria Cao Cấp</div>
          <div>✦ <strong>01</strong> Valkyria 4 Sao Aurelia</div>
          <div>✦ <strong>05</strong> Bình Tinh Thể Năng Lượng Veyra</div>
        </div>

        <button
          onClick={onClose}
          className="hsr-btn-glass py-2.5 px-8 text-xs font-bold w-full cursor-pointer"
        >
          <span>ĐÓNG</span>
        </button>
      </div>
    </div>
  );
}
