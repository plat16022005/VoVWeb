"use client";

import { useState } from "react";
import { soundEngine } from "@/services/audio.service";
import { BroadcastAnnouncement } from "@/data/mockManagerData";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSuccess: (newBc: BroadcastAnnouncement) => void;
}

export default function BroadcastModal({
  isOpen,
  onClose,
  onBroadcastSuccess,
}: BroadcastModalProps) {
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("HIGH");
  const [targetServer, setTargetServer] = useState("Toàn Cụm Máy Chủ");
  const [repeatInterval, setRepeatInterval] = useState(5);
  const [durationHours, setDurationHours] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert("Vui lòng nhập nội dung thông báo!");
      return;
    }

    soundEngine.playCelestialChime();

    const expire = new Date();
    expire.setHours(expire.getHours() + Number(durationHours));

    const newBc: BroadcastAnnouncement = {
      id: "bc_" + Date.now(),
      message: message.trim(),
      priority,
      targetServer,
      activeUntil: expire.toISOString().replace("T", " ").substring(0, 16),
      isActive: true,
      repeatIntervalMinutes: Number(repeatInterval),
    };

    onBroadcastSuccess(newBc);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#090d24] border border-rose-500/40 rounded-2xl w-full max-w-lg p-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative">
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📢</span>
          <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
            Phát Sóng Khẩn Cấp Toàn Server
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Dòng chữ sẽ lập tức xuất hiện và cuộn ngang trên đỉnh màn hình của toàn bộ Chỉ Huy trong game.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Priority */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
              Mức Độ Ưu Tiên
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority("NORMAL")}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  priority === "NORMAL"
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                    : "bg-[#060814] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Thông Thường
              </button>
              <button
                type="button"
                onClick={() => setPriority("HIGH")}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  priority === "HIGH"
                    ? "bg-amber-500/20 border-amber-400 text-amber-200"
                    : "bg-[#060814] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Quan Trọng (Vàng)
              </button>
              <button
                type="button"
                onClick={() => setPriority("URGENT")}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  priority === "URGENT"
                    ? "bg-rose-500/20 border-rose-400 text-rose-200"
                    : "bg-[#060814] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Khẩn Cấp (Đỏ)
              </button>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
              Nội Dung Dòng Chữ Chạy (Marquee) *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="VD: [BẢO TRÌ]: Server S1 sẽ tạm dừng 15 phút để bảo dưỡng kỹ thuật lúc 12:00..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-400 leading-relaxed font-sans"
            />
          </div>

          {/* Target & Interval */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Cụm Máy Chủ Mục Tiêu
              </label>
              <select
                value={targetServer}
                onChange={(e) => setTargetServer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-400"
              >
                <option value="Toàn Cụm Máy Chủ">Toàn Cụm Máy Chủ</option>
                <option value="S1 - Veyra Khởi Nguyên">S1 - Veyra Khởi Nguyên</option>
                <option value="S2 - Băng Phong Lãnh Địa">S2 - Băng Phong Lãnh Địa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Tần Suất Lặp Lại
              </label>
              <select
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-400"
              >
                <option value={3}>Mỗi 3 phút một lần</option>
                <option value={5}>Mỗi 5 phút một lần</option>
                <option value={15}>Mỗi 15 phút một lần</option>
                <option value={30}>Mỗi 30 phút một lần</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs hover:brightness-110 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"
            >
              Bắt Đầu Phát Sóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

