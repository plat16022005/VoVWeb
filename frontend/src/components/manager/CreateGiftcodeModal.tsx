"use client";

import { useState } from "react";
import { soundEngine } from "@/services/audio.service";
import { ManagerGiftcode } from "@/data/mockManagerData";

interface CreateGiftcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (newCode: ManagerGiftcode) => void;
}

export default function CreateGiftcodeModal({
  isOpen,
  onClose,
  onCreateSuccess,
}: CreateGiftcodeModalProps) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState(10000);
  const [serverTarget, setServerTarget] = useState<"ALL" | "S1" | "S2" | "S3">("ALL");
  const [endDate, setEndDate] = useState("2026-11-30");

  // Rewards
  const [ruby, setRuby] = useState(500);
  const [destinyTicket, setDestinyTicket] = useState(5);
  const [energy, setEnergy] = useState(100);
  const [gold, setGold] = useState(50000);
  const [specialItem, setSpecialItem] = useState("");

  if (!isOpen) return null;

  const handleGenerateRandomCode = () => {
    soundEngine.playClick();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "VEYRA";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(rand);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      alert("Vui lòng điền mã Giftcode và tiêu đề chương trình!");
      return;
    }

    soundEngine.playCelestialChime();
    const newGiftcode: ManagerGiftcode = {
      id: "gc_" + Date.now(),
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || "Mã quà tặng vận hành đặc biệt.",
      rewards: {
        ruby: Number(ruby) || 0,
        destinyTicket: Number(destinyTicket) || 0,
        energy: Number(energy) || 0,
        gold: Number(gold) || 0,
        specialItem: specialItem.trim() || undefined,
      },
      totalUses: 0,
      maxUses: Number(maxUses) || 1000,
      serverTarget,
      startDate: new Date().toISOString().split("T")[0],
      endDate,
      status: "ACTIVE",
      createdBy: "Manager.LiveOps",
    };

    onCreateSuccess(newGiftcode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#090d24] border border-[#f5c767]/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative">
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
          <span className="text-xl">🎁</span>
          <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
            Tạo Mã Giftcode Mới
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Mã quà tặng sẽ lập tức có hiệu lực trên cụm máy chủ được chỉ định.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code input & Random button */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
              Mã Kích Hoạt (Code) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: FREYA2026, VEYRANEW..."
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white font-mono font-bold tracking-wider text-sm focus:outline-none focus:border-[#f5c767]"
              />
              <button
                type="button"
                onClick={handleGenerateRandomCode}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#f5c767] hover:bg-[#f5c767]/10 font-mono transition-colors"
              >
                Tạo Ngẫu Nhiên
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
              Tên Sự Kiện / Chương Trình *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Quà Đền Bù Sự Cố Máy Chủ S1..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-[#f5c767]"
            />
          </div>

          {/* Server & Max Uses & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Áp Dụng Máy Chủ
              </label>
              <select
                value={serverTarget}
                onChange={(e) => setServerTarget(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-[#f5c767]"
              >
                <option value="ALL">Toàn Cụm Server</option>
                <option value="S1">S1 - Veyra Khởi Nguyên</option>
                <option value="S2">S2 - Băng Phong Lãnh Địa</option>
                <option value="S3">S3 - Thần Điện Astral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Giới Hạn Lượt Đổi
              </label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-[#f5c767]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Hạn Dùng Đến Ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-[#f5c767]"
              />
            </div>
          </div>

          {/* Rewards Fieldset */}
          <div className="p-4 rounded-xl bg-[#060814] border border-white/10 space-y-3">
            <div className="text-xs font-mono font-bold text-[#f5c767] uppercase flex items-center justify-between">
              <span>Thiết Lập Phần Thưởng</span>
              <span className="text-[10px] text-slate-400">Tự động phát vào túi đồ</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  💎 Ruby Tinh Thể
                </label>
                <input
                  type="number"
                  min={0}
                  value={ruby}
                  onChange={(e) => setRuby(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090d24] border border-white/10 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  🎫 Vé Ước Nguyện
                </label>
                <input
                  type="number"
                  min={0}
                  value={destinyTicket}
                  onChange={(e) => setDestinyTicket(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090d24] border border-white/10 text-purple-300 font-mono text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  🧪 Thể Lực (AP)
                </label>
                <input
                  type="number"
                  min={0}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090d24] border border-white/10 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  🪙 Vàng Veyra
                </label>
                <input
                  type="number"
                  min={0}
                  value={gold}
                  onChange={(e) => setGold(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090d24] border border-white/10 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                ⭐ Vật Phẩm Đặc Biệt (Tùy chọn)
              </label>
              <input
                type="text"
                value={specialItem}
                onChange={(e) => setSpecialItem(e.target.value)}
                placeholder="VD: Rương Valkyria SSR Tự Chọn, Khung Avatar Huyền Thoại..."
                className="w-full px-3 py-1.5 rounded-lg bg-[#090d24] border border-white/10 text-white text-xs focus:outline-none focus:border-[#f5c767]"
              />
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
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e67e22] text-[#060814] font-bold text-xs hover:brightness-110 shadow-[0_0_15px_rgba(245,199,103,0.3)] transition-all"
            >
              Kích Hoạt Mã Ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

