"use client";

import { useState } from "react";
import { ClientVersionInfo } from "@/data/servers";
import { soundEngine } from "@/services/audio.service";

interface ClientVersionCardProps {
  initialConfig: ClientVersionInfo;
  onSaveConfig: (updated: ClientVersionInfo) => void;
}

export default function ClientVersionCard({
  initialConfig,
  onSaveConfig,
}: ClientVersionCardProps) {
  const [config, setConfig] = useState<ClientVersionInfo>(initialConfig);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    onSaveConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="rounded-2xl bg-[#090c22]/80 backdrop-blur-md border border-[#f5c767]/20 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase flex items-center gap-2">
            KIỂM SOÁT PHIÊN BẢN UNITY CLIENT
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#f5c767]/10 text-[#f5c767] border border-[#f5c767]/30">
              v{config.currentVersion}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Quy định phiên bản tối thiểu đăng nhập và đường dẫn tải gói cập nhật tài nguyên.
          </p>
        </div>

        {isSaved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Đã lưu cấu hình</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Current Version */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Phiên Bản Phát Hành Mới Nhất
            </label>
            <input
              type="text"
              value={config.currentVersion}
              onChange={(e) => setConfig({ ...config, currentVersion: e.target.value })}
              className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#f5c767]/50"
              placeholder="ví dụ: 1.2.4"
              required
            />
          </div>

          {/* Min Supported Version */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Phiên Bản Tối Thiểu Bắt Buộc
            </label>
            <input
              type="text"
              value={config.minSupportedVersion}
              onChange={(e) => setConfig({ ...config, minSupportedVersion: e.target.value })}
              className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#f5c767]/50"
              placeholder="ví dụ: 1.2.0"
              required
            />
          </div>
        </div>

        {/* Patch CDN Bundle URL */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">
            Đường Dẫn CDN Gói Cập Nhật (Asset Bundle)
          </label>
          <input
            type="url"
            value={config.patchBundleUrl}
            onChange={(e) => setConfig({ ...config, patchBundleUrl: e.target.value })}
            className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#3fe9d6] focus:outline-none focus:border-[#3fe9d6]/50"
            placeholder="https://cdn.valkyriaofveyra.vn/..."
            required
          />
        </div>

        {/* Patch Size & Engine version */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Dung Lượng Gói Vá (MB)
            </label>
            <input
              type="number"
              step="0.1"
              value={config.patchSizeMb}
              onChange={(e) => setConfig({ ...config, patchSizeMb: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#f5c767]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Phiên Bản Nền Tảng Unity Engine
            </label>
            <input
              type="text"
              value={config.unityEngineVersion}
              disabled
              className="w-full bg-[#040614]/50 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Force Update Toggle */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#060818] border border-white/10">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-mono font-medium text-white flex items-center gap-2 flex-wrap">
              Bắt Buộc Cập Nhật (Force Update)
              {config.forceUpdate && (
                <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.2 rounded-full font-bold">
                  Bật
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Nếu bật, game thủ dùng phiên bản dưới {config.minSupportedVersion} sẽ bị chặn đăng nhập và buộc tải bản vá.
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={config.forceUpdate}
            onClick={() => {
              soundEngine.playClick();
              setConfig({ ...config, forceUpdate: !config.forceUpdate });
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
              config.forceUpdate ? "bg-rose-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                config.forceUpdate ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Changelog */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">
            Ghi Chú Bản Vá Hiển Thị Client (Changelog)
          </label>
          <textarea
            rows={2}
            value={config.changelogNotes}
            onChange={(e) => setConfig({ ...config, changelogNotes: e.target.value })}
            className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#f5c767]/50"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6a836] text-[#040614] font-bold text-xs font-mono tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(245,199,103,0.3)] cursor-pointer"
          >
            LƯU THIẾT LẬP CLIENT
          </button>
        </div>
      </form>
    </div>
  );
}
