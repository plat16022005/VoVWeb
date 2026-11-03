"use client";

import { useState, useEffect } from "react";
import { soundEngine } from "@/services/audio.service";
import { ManagerServerMail } from "@/data/mockManagerData";

interface SendMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSuccess: (newMail: ManagerServerMail) => void;
  prefillPlayer?: { uid: string; name: string } | null;
}

export default function SendMailModal({
  isOpen,
  onClose,
  onSendSuccess,
  prefillPlayer,
}: SendMailModalProps) {
  const [targetType, setTargetType] = useState<"ALL_SERVERS" | "SPECIFIC_SERVER" | "SINGLE_PLAYER">("ALL_SERVERS");
  const [targetServer, setTargetServer] = useState("S1 - Veyra Khởi Nguyên");
  const [targetPlayerUid, setTargetPlayerUid] = useState("");
  const [targetPlayerName, setTargetPlayerName] = useState("");
  const [title, setTitle] = useState("");
  const [sender, setSender] = useState("Bộ Chỉ Huy Tối Cao Veyra");
  const [content, setContent] = useState("");
  const [expireDays, setExpireDays] = useState(14);

  // Rewards list
  const [rubyAmount, setRubyAmount] = useState(300);
  const [ticketAmount, setTicketAmount] = useState(3);
  const [goldAmount, setGoldAmount] = useState(50000);
  const [hasSpecialItem, setHasSpecialItem] = useState(false);
  const [specialItemName, setSpecialItemName] = useState("Rương Chọn Valkyria SSR");

  useEffect(() => {
    if (prefillPlayer) {
      setTargetType("SINGLE_PLAYER");
      setTargetPlayerUid(prefillPlayer.uid);
      setTargetPlayerName(prefillPlayer.name);
      setTitle(`Quà Hỗ Trợ Dành Riêng Cho Chỉ Huy ${prefillPlayer.name}`);
      setContent(`Bộ phận vận hành Veyra gửi tặng phần quà bồi hoàn/hỗ trợ đặc biệt đến ngài. Chúc ngài có những trải nghiệm tuyệt vời cùng các Valkyria!`);
    }
  }, [prefillPlayer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung thư!");
      return;
    }

    soundEngine.playCelestialChime();

    const rewards: ManagerServerMail["rewards"] = [];
    if (rubyAmount > 0) {
      rewards.push({
        name: "Ruby Tinh Thể",
        amount: Number(rubyAmount),
        icon: "💎",
        rarity: "LEGENDARY",
      });
    }
    if (ticketAmount > 0) {
      rewards.push({
        name: "Vé Triệu Hồi Vận Mệnh",
        amount: Number(ticketAmount),
        icon: "🎫",
        rarity: "EPIC",
      });
    }
    if (goldAmount > 0) {
      rewards.push({
        name: "Vàng Veyra",
        amount: Number(goldAmount),
        icon: "🪙",
        rarity: "COMMON",
      });
    }
    if (hasSpecialItem && specialItemName.trim()) {
      rewards.push({
        name: specialItemName.trim(),
        amount: 1,
        icon: "👑",
        rarity: "LEGENDARY",
      });
    }

    const now = new Date();
    const expireDate = new Date();
    expireDate.setDate(now.getDate() + expireDays);

    const newMail: ManagerServerMail = {
      id: "mail_" + Date.now(),
      title: title.trim(),
      sender: sender.trim() || "Bộ Chỉ Huy Veyra",
      targetType,
      targetServer: targetType === "SPECIFIC_SERVER" ? targetServer : undefined,
      targetPlayerUid: targetType === "SINGLE_PLAYER" ? targetPlayerUid : undefined,
      targetPlayerName: targetType === "SINGLE_PLAYER" ? targetPlayerName : undefined,
      content: content.trim(),
      rewards,
      sentAt: now.toISOString().replace("T", " ").substring(0, 19),
      expiresAt: expireDate.toISOString().replace("T", " ").substring(0, 19),
      status: "DELIVERED",
      receivedCount: targetType === "SINGLE_PLAYER" ? 1 : 15820,
    };

    onSendSuccess(newMail);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#090d24] border border-purple-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative">
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
          <span className="text-xl">📬</span>
          <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
            Soạn Thư Server & Phát Quà Đền Bù
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Thư và vật phẩm sẽ được đưa vào Hòm Thư của các Chỉ Huy ngay khi phát lệnh.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Type */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
              Phạm Vi Đối Tượng Nhận
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("ALL_SERVERS")}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  targetType === "ALL_SERVERS"
                    ? "bg-purple-600/30 border-purple-400 text-purple-200"
                    : "bg-[#060814] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Toàn Bộ Cụm Máy Chủ
              </button>
              <button
                type="button"
                onClick={() => setTargetType("SPECIFIC_SERVER")}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  targetType === "SPECIFIC_SERVER"
                    ? "bg-purple-600/30 border-purple-400 text-purple-200"
                    : "bg-[#060814] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Theo Máy Chủ Cụ Thể
              </button>
              <button
                type="button"
                onClick={() => setTargetType("SINGLE_PLAYER")}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  targetType === "SINGLE_PLAYER"
                    ? "bg-purple-600/30 border-purple-400 text-purple-200"
                    : "bg-[#060814] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Chỉ Định Cá Nhân
              </button>
            </div>
          </div>

          {/* Conditional target fields */}
          {targetType === "SPECIFIC_SERVER" && (
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Chọn Máy Chủ
              </label>
              <select
                value={targetServer}
                onChange={(e) => setTargetServer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
              >
                <option value="S1 - Veyra Khởi Nguyên">S1 - Veyra Khởi Nguyên</option>
                <option value="S2 - Băng Phong Lãnh Địa">S2 - Băng Phong Lãnh Địa</option>
                <option value="S3 - Thần Điện Astral">S3 - Thần Điện Astral</option>
              </select>
            </div>
          )}

          {targetType === "SINGLE_PLAYER" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  UID Người Nhận
                </label>
                <input
                  type="text"
                  value={targetPlayerUid}
                  onChange={(e) => setTargetPlayerUid(e.target.value)}
                  placeholder="usr_..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Tên Chỉ Huy
                </label>
                <input
                  type="text"
                  value={targetPlayerName}
                  onChange={(e) => setTargetPlayerName(e.target.value)}
                  placeholder="Tên nhân vật..."
                  className="w-full px-3 py-2 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          {/* Title & Sender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Tiêu Đề Thư *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Quà Đền Bù Sự Cố Bảo Trì..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Ký Tên Người Gửi
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
              Nội Dung Bức Thư *
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông điệp gửi tới Chỉ Huy..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400 leading-relaxed"
            />
          </div>

          {/* Rewards Fieldset */}
          <div className="p-4 rounded-xl bg-[#060814] border border-white/10 space-y-3">
            <div className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center justify-between">
              <span>Vật Phẩm Đính Kèm Trong Thư</span>
              <span className="text-[10px] text-slate-400">Tự động nhận khi mở thư</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  💎 Ruby Tinh Thể
                </label>
                <input
                  type="number"
                  min={0}
                  value={rubyAmount}
                  onChange={(e) => setRubyAmount(Number(e.target.value))}
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
                  value={ticketAmount}
                  onChange={(e) => setTicketAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090d24] border border-white/10 text-purple-300 font-mono text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  🪙 Vàng Veyra
                </label>
                <input
                  type="number"
                  min={0}
                  value={goldAmount}
                  onChange={(e) => setGoldAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#090d24] border border-white/10 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={hasSpecialItem}
                  onChange={(e) => setHasSpecialItem(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-0"
                />
                <span>Đính kèm Thần Khí / Rương Valkyria SSR Đặc Biệt</span>
              </label>

              {hasSpecialItem && (
                <input
                  type="text"
                  value={specialItemName}
                  onChange={(e) => setSpecialItemName(e.target.value)}
                  placeholder="VD: Cung Băng Tiết Cổ Đại (SSR)..."
                  className="mt-2 w-full px-3 py-1.5 rounded-lg bg-[#090d24] border border-white/10 text-[#f5c767] text-xs focus:outline-none focus:border-[#f5c767]"
                />
              )}
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs hover:brightness-110 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
            >
              Phát Lệnh Gửi Thư Ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

