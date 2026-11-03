"use client";

import { useState, useEffect } from "react";
import { soundEngine } from "@/services/audio.service";
import { settingsService, TermItem, DEFAULT_TERMS_LIST } from "@/services/settings.service";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const [items, setItems] = useState<TermItem[]>(DEFAULT_TERMS_LIST);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      settingsService
        .getTermsList()
        .then((data) => setItems(data))
        .catch(() => setItems(DEFAULT_TERMS_LIST))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (item) =>
      item.Title.toLowerCase().includes(search.toLowerCase()) ||
      item.Content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-[#090c21] border border-[#3fe9d6]/40 shadow-[0_0_50px_rgba(63,233,214,0.3)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0e1330] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3fe9d6] animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wider">
                ĐIỀU KHOẢN DỊCH VỤ & HIỆP ƯỚC CHỈ HUY
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-0.5">
              <span>Đại Lục Veyra</span>
              <span>•</span>
              <span>
                Tổng cộng: <strong className="text-[#3fe9d6]">{items.length}</strong> điều khoản
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
            title="Đóng điều khoản"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thanh tìm kiếm nhanh */}
        {items.length > 3 && (
          <div className="px-6 py-2.5 bg-[#0a0d24] border-b border-white/5 shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Tra cứu nội dung điều khoản..."
              className="w-full px-3.5 py-1.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#3fe9d6] placeholder:text-slate-500"
            />
          </div>
        )}

        {/* Modal Body - Danh sách các điều khoản */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs sm:text-sm text-slate-200 leading-relaxed">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-400">Đang tải điều khoản từ máy chủ Veyra...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              Không tìm thấy điều khoản nào khớp với từ khóa.
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[#0b0f29]/90 border border-white/10 space-y-6">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id + idx}
                  className={`space-y-2.5 ${
                    idx !== filteredItems.length - 1 ? "border-b border-white/10 pb-6" : ""
                  }`}
                >
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide flex items-baseline gap-2">
                    <span className="text-[#3fe9d6] font-mono font-bold text-base">{idx + 1}.</span>
                    <span>{item.Title}</span>
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap pl-5 font-light">
                    {item.Content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#080b1d] flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-slate-400">
            © 2026 Valkyria of Veyra · Turn-Based RPG
          </span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#060814] font-bold font-mono text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(63,233,214,0.4)] transition-all cursor-pointer"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
