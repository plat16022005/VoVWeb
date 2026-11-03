"use client";

import { useState, useEffect } from "react";
import { GameServer } from "@/data/servers";
import { soundEngine } from "@/services/audio.service";
import {
  fetchServerClusterConfig,
  ServerMaintenancePayload,
} from "@/services/serverManagement.service";

interface MaintenanceModalProps {
  isOpen: boolean;
  server: GameServer | null;
  onClose: () => void;
  onConfirm: (
    serverId: string,
    action: "enable" | "disable",
    data?: ServerMaintenancePayload
  ) => Promise<void>;
}

const DEFAULT_NOTICE =
  "Máy chủ đang trong quá trình bảo trì nâng cấp. Chỉ Huy vui lòng quay lại sau ít phút.";

export default function MaintenanceModal({
  isOpen,
  server,
  onClose,
  onConfirm,
}: MaintenanceModalProps) {
  const isCurrentlyMaintenance = server?.status === "maintenance";

  const [reason, setReason] = useState(
    "Nâng cấp hệ thống định kỳ & cập nhật cân bằng sức mạnh Valkyria"
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [noticeMessage, setNoticeMessage] = useState(DEFAULT_NOTICE);
  const [allowTesterWhitelist, setAllowTesterWhitelist] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Load existing ServerConfig/Config whenever modal opens for a server
  useEffect(() => {
    if (!isOpen || !server) return;

    // Set default timestamps
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    const nowTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setStartTime(`${todayStr} ${nowTimeStr}`);

    const future = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const futureTimeStr = `${pad(future.getHours())}:${pad(future.getMinutes())}`;
    setEndTime(`${todayStr} ${futureTimeStr}`);

    let isMounted = true;
    setIsLoadingConfig(true);

    fetchServerClusterConfig(server.id)
      .then((cfg) => {
        if (!isMounted) return;
        if (cfg.message) setNoticeMessage(cfg.message);
        if (cfg.reason) setReason(cfg.reason);
        if (cfg.startTime) setStartTime(cfg.startTime);
        if (cfg.endTime) setEndTime(cfg.endTime);
        if (typeof cfg.allowTesterWhitelist === "boolean") {
          setAllowTesterWhitelist(cfg.allowTesterWhitelist);
        }
      })
      .catch((err) => {
        console.warn("Không thể tải ServerConfig trước đó:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingConfig(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, server]);

  if (!isOpen || !server) return null;

  const handleAction = async () => {
    soundEngine.playClick();
    setIsSaving(true);
    try {
      if (isCurrentlyMaintenance) {
        // Mở lại máy chủ
        await onConfirm(server.id, "disable");
      } else {
        // Đưa máy chủ vào bảo trì
        await onConfirm(server.id, "enable", {
          reason: reason.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          noticeMessage: noticeMessage.trim(),
          allowTesterWhitelist,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090c22] border border-[#9b51e0]/40 p-6 shadow-[0_0_50px_rgba(155,81,224,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCurrentlyMaintenance
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                  : "bg-[#9b51e0]/10 text-[#9b51e0] border border-[#9b51e0]/30 shadow-[0_0_15px_rgba(155,81,224,0.3)]"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wider">
                {isCurrentlyMaintenance ? "MỞ LẠI CỤM MÁY CHỦ" : "THIẾT LẬP BẢO TRÌ CỤM MÁY CHỦ"}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#3fe9d6] font-bold">
                  {server.name} ({server.code})
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  • ServerConfig/Config
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            disabled={isSaving}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {isLoadingConfig ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#9b51e0] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-400">
              Đang tải cấu hình ServerConfig/Config...
            </span>
          </div>
        ) : isCurrentlyMaintenance ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300">
              Cụm máy chủ này hiện đang ở trạng thái <strong className="text-rose-400">BẢO TRÌ</strong>. Người chơi thông thường kết nối vào sẽ nhận được thông báo bảo trì.
            </div>

            <div className="p-3.5 rounded-xl bg-[#060818] border border-white/10 space-y-2">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Thông báo đang hiển thị:</span>
                <span className="text-amber-400 font-bold">{server.name}</span>
              </div>
              <p className="text-xs text-slate-200 font-sans italic bg-black/50 p-2.5 rounded-lg border border-white/5">
                "{noticeMessage}"
              </p>
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1">
                <span>Người chơi trực tuyến hiện tại:</span>
                <span className="text-emerald-400 font-bold">{server.ccu} CCU (Admin/Tester)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              Nhấn <strong>"XÁC NHẬN MỞ MÁY CHỦ"</strong> bên dưới để gỡ bỏ trạng thái bảo trì trên ServerConfig/Config và mở cửa cho toàn bộ Chỉ Huy tham gia.
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Lý Do Bảo Trì (Hiển thị Bảng tin nội bộ)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSaving}
                className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#9b51e0]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Bắt Đầu
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#9b51e0]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Dự Kiến Mở Lại
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#9b51e0]/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono text-slate-300">
                  Thông Điệp Người Chơi (Hiển thị khi chọn server này)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setNoticeMessage(DEFAULT_NOTICE);
                  }}
                  className="text-[10px] font-mono text-[#3fe9d6] hover:underline cursor-pointer"
                >
                  Đặt lại mặc định
                </button>
              </div>
              <textarea
                rows={2}
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                disabled={isSaving}
                className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#9b51e0]/50"
              />
            </div>

            {/* Whitelist switch */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#060818] border border-white/10">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-mono font-medium text-white">
                  Cho phép Tài khoản Tester / Quản Trị Viên truy cập
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Tài khoản có quyền Admin hoặc Manager vẫn có thể vào server để kiểm thử tính năng trong lúc bảo trì.
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={allowTesterWhitelist}
                disabled={isSaving}
                onClick={() => {
                  soundEngine.playClick();
                  setAllowTesterWhitelist(!allowTesterWhitelist);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
                  allowTesterWhitelist ? "bg-[#9b51e0]" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                    allowTesterWhitelist ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
          >
            HỦY BỎ
          </button>
          <button
            onClick={handleAction}
            disabled={isSaving || isLoadingConfig}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              isCurrentlyMaintenance
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:opacity-90"
                : "bg-gradient-to-r from-[#9b51e0] to-[#7928ca] text-white shadow-[0_0_15px_rgba(155,81,224,0.4)] hover:opacity-90"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{isCurrentlyMaintenance ? "XÁC NHẬN MỞ MÁY CHỦ" : "KÍCH HOẠT BẢO TRÌ"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
