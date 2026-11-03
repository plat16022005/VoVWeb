"use client";

import { useState } from "react";
import { GameServer } from "@/data/servers";
import { soundEngine } from "@/services/audio.service";

interface BroadcastModalProps {
  isOpen: boolean;
  servers: GameServer[];
  onClose: () => void;
  onSendBroadcast: (message: string, targetServerId: string, durationSeconds: number) => void;
}

export default function BroadcastModal({
  isOpen,
  servers,
  onClose,
  onSendBroadcast,
}: BroadcastModalProps) {
  const [targetServerId, setTargetServerId] = useState<string>("all");
  const [message, setMessage] = useState(
    "[THÔNG BÁO TỔNG HÀNH DINH] Toàn thể Chỉ Huy chú ý: Sự kiện 'Cực Quang Veyra' sẽ bắt đầu sau 30 phút!"
  );
  const [duration, setDuration] = useState<number>(15);
  const [priority, setPriority] = useState<"normal" | "urgent">("urgent");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    onSendBroadcast(message, targetServerId, duration);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090c22] border border-[#3fe9d6]/40 p-6 shadow-[0_0_50px_rgba(63,233,214,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wider">
                PHÁT THÔNG BÁO TOÀN CỤM
              </h3>
              <p className="text-xs font-mono text-slate-400">
                World Broadcast Announcement (In-Game Banner)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Phạm Vi Máy Chủ Nhận Tin
            </label>
            <select
              value={targetServerId}
              onChange={(e) => setTargetServerId(e.target.value)}
              className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]/50"
            >
              <option value="all">★ Tất Cả Cụm Máy Chủ (Toàn Cầu)</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Nội Dung Thông Điệp (Chạy chữ trên đầu màn hình Game)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-[#3fe9d6]/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Thời Gian Hiển Thị
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]/50"
              >
                <option value={10}>10 Giây</option>
                <option value={15}>15 Giây</option>
                <option value={30}>30 Giây</option>
                <option value={60}>60 Giây (Khẩn cấp)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Mức Độ Ưu Tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "normal" | "urgent")}
                className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]/50"
              >
                <option value="urgent">Màu Vàng / Đỏ (Khẩn cấp)</option>
                <option value="normal">Màu Xanh Cyan (Thông thường)</option>
              </select>
            </div>
          </div>

          {/* Preview box */}
          <div className="p-3 rounded-xl bg-[#060818] border border-white/10">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Xem trước màn hình game (Preview):
            </span>
            <div className="p-2 rounded bg-black/60 border border-amber-400/30 text-amber-300 text-xs font-sans tracking-wide text-center animate-pulse">
              📢 {message}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
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
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#040614] font-bold text-xs font-mono tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(63,233,214,0.4)] cursor-pointer"
            >
              PHÁT TIN NGAY
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
