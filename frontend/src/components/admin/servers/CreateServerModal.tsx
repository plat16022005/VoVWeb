"use client";

import { useState } from "react";
import { soundEngine } from "@/services/audio.service";
import {
  callCreateNewServer,
  CreateServerPayload,
  CreateServerResult,
} from "@/services/serverManagement.service";
import GameLogo from "@/components/common/GameLogo";

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerCreated: (result: CreateServerResult) => void;
}

export default function CreateServerModal({
  isOpen,
  onClose,
  onServerCreated,
}: CreateServerModalProps) {
  const [serverId, setServerId] = useState("");
  const [serverName, setServerName] = useState("");
  const [locationId, setLocationId] = useState("asia-southeast1");
  const [status, setStatus] = useState<"Normal" | "Maintenance">("Normal");

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation
  const validateServerId = (id: string): string | null => {
    const trimmed = id.trim().toLowerCase();
    if (!trimmed) return "Vui lòng nhập mã máy chủ (serverId).";
    if (trimmed === "default" || trimmed === "(default)") {
      return "Không thể đặt tên trùng với database hệ thống mặc định '(default)'.";
    }
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      return "Mã chỉ được chứa chữ thường (a-z), chữ số (0-9) và dấu gạch ngang (-).";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage(null);

    const valError = validateServerId(serverId);
    if (valError) {
      setErrorMessage(valError);
      return;
    }

    setIsLoading(true);
    setCurrentStep(1); // Bước 1: Tạo Database

    try {
      const stepTimer1 = setTimeout(() => setCurrentStep(2), 1200); // Bước 2: Rules
      const stepTimer2 = setTimeout(() => setCurrentStep(3), 2200); // Bước 3: GameConfig

      const payload: CreateServerPayload = {
        serverId: serverId.trim().toLowerCase(),
        serverName: serverName.trim() || `S - ${serverId.trim().toLowerCase()}`,
        locationId,
        status,
      };

      const result = await callCreateNewServer(payload);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setCurrentStep(3);

      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(0);
        onServerCreated(result);
        onClose();
        // Reset form
        setServerId("");
        setServerName("");
        setLocationId("asia-southeast1");
        setStatus("Normal");
      }, 600);
    } catch (err: any) {
      setIsLoading(false);
      setCurrentStep(0);
      setErrorMessage(err.message || "Đã xảy ra lỗi trong quá trình tạo máy chủ.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090c22] border border-[#3fe9d6]/40 p-6 shadow-[0_0_50px_rgba(63,233,214,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3fe9d6] to-[#0ea5e9] p-[1px] shadow-[0_0_15px_rgba(63,233,214,0.4)]">
              <div className="w-full h-full bg-[#090c22] rounded-[11px] flex items-center justify-center text-[#3fe9d6]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wider">
                KHỞI TẠO CỤM MÁY CHỦ GAME TỰ ĐỘNG
              </h3>
              <p className="text-xs font-mono text-[#3fe9d6]">
                Hệ thống khởi tạo cụm máy chủ tự động
              </p>
            </div>
          </div>

          {!isLoading && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading / Process Animation */}
        {isLoading ? (
          <div className="py-8 space-y-5">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 rounded-full border-2 border-[#3fe9d6] border-t-transparent animate-spin" />
                <GameLogo
                  className="w-11 h-8 drop-shadow-[0_0_8px_rgba(63,233,214,0.45)]"
                  sizes="44px"
                />
              </div>
              <h4 className="text-sm font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wider">
                ĐANG CẤP PHÁT CỤM MÁY CHỦ MỚI...
              </h4>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Quá trình này có thể mất từ 10 - 30 giây để hoàn tất.
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-2.5 max-w-sm mx-auto font-mono text-xs">
              <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
                currentStep >= 1 ? "bg-[#3fe9d6]/10 border-[#3fe9d6]/40 text-[#3fe9d6]" : "bg-white/5 border-white/10 text-slate-500"
              }`}>
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                <span>Khởi tạo không gian dữ liệu máy chủ độc lập...</span>
              </div>
              <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
                currentStep >= 2 ? "bg-[#3fe9d6]/10 border-[#3fe9d6]/40 text-[#3fe9d6]" : "bg-white/5 border-white/10 text-slate-500"
              }`}>
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                <span>Đồng bộ chính sách bảo mật hệ thống...</span>
              </div>
              <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
                currentStep >= 3 ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-white/5 border-white/10 text-slate-500"
              }`}>
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">3</span>
                <span>Đăng ký cụm máy chủ vào danh sách hệ thống...</span>
              </div>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Server ID */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Mã Định Danh Máy Chủ (Server ID) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={serverId}
                onChange={(e) => setServerId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="ví dụ: server-2, server-sea-02"
                className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#3fe9d6] focus:outline-none focus:border-[#3fe9d6]/50 placeholder-slate-600"
                required
              />
              <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                Chỉ cho phép chữ thường, số và gạch ngang. Cụm máy chủ mới sẽ được khởi tạo theo mã này.
              </span>
            </div>

            {/* Server Name */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Tên Hiển Thị Máy Chủ (Server Name)
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="ví dụ: Veyra 02 — Thung Lũng Tinh Tú"
                className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]/50 placeholder-slate-600"
              />
            </div>

            {/* Location & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Khu Vực Máy Chủ (Region)
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]/50 cursor-pointer"
                >
                  <option value="asia-southeast1">Singapore (asia-southeast1) — Khuyên dùng</option>
                  <option value="asia-northeast1">Tokyo (asia-northeast1)</option>
                  <option value="us-central1">Iowa (us-central1)</option>
                  <option value="europe-west1">Bỉ (europe-west1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Trạng Thái Khởi Đầu
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Normal" | "Maintenance")}
                  className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]/50 cursor-pointer"
                >
                  <option value="Normal">Normal (Hoạt động tốt)</option>
                  <option value="Maintenance">Maintenance (Bảo trì ban đầu)</option>
                </select>
              </div>
            </div>

            {/* Explanation box */}
            <div className="p-3 rounded-xl bg-[#060818] border border-white/10 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-white font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
                Quy trình khởi tạo máy chủ tự động:
              </div>
              <div>• Khởi tạo không gian dữ liệu độc lập cho cụm máy chủ mới.</div>
              <div>• Tự động đồng bộ cấu hình bảo mật tiêu chuẩn.</div>
              <div>• Cập nhật máy chủ mới vào danh sách chọn máy chủ trong game.</div>
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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#040614] font-bold text-xs font-mono tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(63,233,214,0.4)] cursor-pointer flex items-center gap-2"
              >
                <span>KHỞI TẠO MÁY CHỦ</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
