"use client";

import { useState } from "react";
import { GameInfoConfig } from "@/services/settings.service";
import { soundEngine } from "@/services/audio.service";

interface GameInfoTabProps {
  gameInfo: GameInfoConfig;
  isAdmin: boolean;
  onSave: (data: Partial<GameInfoConfig>) => Promise<void>;
  saving: boolean;
}

export default function GameInfoTab({ gameInfo, isAdmin, onSave, saving }: GameInfoTabProps) {
  const [formData, setFormData] = useState<GameInfoConfig>({ ...gameInfo });

  const handleChange = (field: keyof GameInfoConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    soundEngine.playClick();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Phiên bản Client */}
      <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-mono text-[#3fe9d6] uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
          <span>Phiên Bản Game Client & Bản Build</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Tên Trò Chơi
            </label>
            <input
              type="text"
              value={formData.gameTitle}
              onChange={(e) => handleChange("gameTitle", e.target.value)}
              disabled={!isAdmin}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Khẩu Hiệu / Slogan
            </label>
            <input
              type="text"
              value={formData.slogan}
              onChange={(e) => handleChange("slogan", e.target.value)}
              disabled={!isAdmin}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Phiên Bản Client Khả Dụng (Game Version)
            </label>
            <input
              type="text"
              value={formData.currentVersion}
              onChange={(e) => handleChange("currentVersion", e.target.value)}
              disabled={!isAdmin}
              placeholder="VD: v1.0.4"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Mã Bản Build (Build Version)
            </label>
            <input
              type="text"
              value={formData.unityBuild}
              onChange={(e) => handleChange("unityBuild", e.target.value)}
              disabled={!isAdmin}
              placeholder="VD: v1.0.4 - Build #142"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>
        </div>

        {/* Cờ Force Update */}
        <div className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.forceUpdate}
              onChange={(e) => handleChange("forceUpdate", e.target.checked)}
              disabled={!isAdmin}
              className="w-4 h-4 rounded border-slate-600 bg-black/40 text-[#3fe9d6] focus:ring-0 cursor-pointer accent-[#3fe9d6]"
            />
            <div>
              <span className="text-xs sm:text-sm font-medium text-white block">
                Bắt Buộc Cập Nhật Client (Force Client Update)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Khi bật, các bản game Client có phiên bản thấp hơn phiên bản trên sẽ hiển thị thông báo yêu cầu tải bản mới nhất trước khi vào game.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 2. Đường Dẫn Tải Game Chính Thức */}
      <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-mono text-[#3fe9d6] uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
          <span>Đường Dẫn Tải Game Trực Tiếp</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Link Tải Bản PC Windows (.exe)
            </label>
            <input
              type="url"
              value={formData.downloadPcUrl}
              onChange={(e) => handleChange("downloadPcUrl", e.target.value)}
              disabled={!isAdmin}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Link Tải Android (Google Play / APK)
            </label>
            <input
              type="url"
              value={formData.downloadAndroidUrl}
              onChange={(e) => handleChange("downloadAndroidUrl", e.target.value)}
              disabled={!isAdmin}
              placeholder="https://play.google.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Link Tải iOS (App Store / TestFlight)
            </label>
            <input
              type="url"
              value={formData.downloadIosUrl}
              onChange={(e) => handleChange("downloadIosUrl", e.target.value)}
              disabled={!isAdmin}
              placeholder="https://testflight.apple.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* 3. Kênh Cộng Đồng & Mạng Xã Hội */}
      <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-mono text-[#3fe9d6] uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
          <span>Kênh Truyền Thông & Mạng Xã Hội Chính Thức</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Máy Chủ Discord Chỉ Huy
            </label>
            <input
              type="url"
              value={formData.discordUrl}
              onChange={(e) => handleChange("discordUrl", e.target.value)}
              disabled={!isAdmin}
              placeholder="https://discord.gg/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Trang Facebook Fanpage
            </label>
            <input
              type="url"
              value={formData.facebookUrl}
              onChange={(e) => handleChange("facebookUrl", e.target.value)}
              disabled={!isAdmin}
              placeholder="https://facebook.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Kênh YouTube Chính Thức
            </label>
            <input
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) => handleChange("youtubeUrl", e.target.value)}
              disabled={!isAdmin}
              placeholder="https://youtube.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Nút lưu */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isAdmin || saving}
          className={`px-6 py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
            isAdmin && !saving
              ? "bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#060814] hover:shadow-[0_0_20px_rgba(63,233,214,0.5)] cursor-pointer"
              : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[#060814] border-t-transparent rounded-full animate-spin" />
              <span>Đang Lưu...</span>
            </>
          ) : (
            <span>Lưu Cấu Hình Game & Tải Về</span>
          )}
        </button>
      </div>
    </form>
  );
}
