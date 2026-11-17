"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WebEventDocument, eventsService } from "@/services/events.service";
import { useAuth } from "@/services/auth.service";
import { hasPermission } from "@/data/permissions";
import { soundEngine } from "@/services/audio.service";
import EventEditorModal from "./EventEditorModal";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ManagerEventsView() {
  const currentUser = useAuth();
  const canEdit = hasPermission(currentUser, "event.minigame.edit");
  const canPublish = hasPermission(currentUser, "event.minigame.publish");
  const canDelete = hasPermission(currentUser, "event.minigame.delete");

  const [events, setEvents] = useState<WebEventDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WebEventDocument | null>(null);
  const [showSdkGuide, setShowSdkGuide] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await eventsService.getAllEvents();
      setEvents(list);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách sự kiện Minigame từ máy chủ."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleOpenCreate = () => {
    soundEngine.playClick();
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: WebEventDocument) => {
    soundEngine.playClick();
    setEditingEvent(ev);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (ev: WebEventDocument) => {
    soundEngine.playClick();
    try {
      const updated = await eventsService.toggleEventActive(
        ev.EventId,
        !ev.IsActive
      );
      setEvents((prev) =>
        prev.map((item) => (item.EventId === ev.EventId ? updated : item))
      );
      showToast(
        updated.IsActive
          ? `Đã mở công khai sự kiện "${updated.Title}" trên cổng Web.`
          : `Đã tạm đóng sự kiện "${updated.Title}".`
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Không thể thay đổi trạng thái sự kiện."
      );
    }
  };

  const handleDeleteEvent = async (ev: WebEventDocument) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa sự kiện "${ev.Title}" và dọn dẹp toàn bộ tệp bản build trên lưu trữ đám mây?`
      )
    ) {
      return;
    }
    soundEngine.playClick();
    try {
      await eventsService.deleteEvent(ev.EventId);
      setEvents((prev) => prev.filter((item) => item.EventId !== ev.EventId));
      showToast(`Đã xóa sự kiện "${ev.Title}" và dọn dẹp lưu trữ đám mây.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Không thể xóa sự kiện.");
    }
  };

  const activeCount = events.filter((e) => e.IsActive).length;
  const withUnityBuildCount = events.filter((e) => Boolean(e.UnityBuild)).length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl bg-[#090d24] border-l-2 border-[#f5c767] border-t border-r border-b border-white/15 text-white text-xs font-mono font-semibold shadow-2xl">
          {toastMsg}
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#090d24]/95 border border-[#f5c767]/30 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-2">
          <div className="text-xs font-mono text-[#3fe9d6] uppercase tracking-wider">
            Trung Tâm Quản Lý Sự Kiện &amp; Minigame Web
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wide">
            HỢP NHẤT LAYOUT HTML &amp; BẢN BUILD UNITY WEBGL (.ZIP)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Truyền vào <strong>1 tệp giao diện .html</strong> và <strong>1 tệp .zip bản build Unity WebGL</strong>. Hệ thống tự động giải nén, đẩy lên Lưu Trữ Đám Mây và gắn cầu nối đồng bộ lượt chơi cùng phần thưởng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowSdkGuide(!showSdkGuide);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono font-bold transition-all cursor-pointer"
          >
            {showSdkGuide ? "Ẩn Tài Liệu SDK" : "Tài Liệu Cầu Nối"}
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814] font-bold text-xs font-mono hover:brightness-110 transition-all cursor-pointer"
            >
              + Tạo Sự Kiện Mới
            </button>
          )}
        </div>
      </div>

      {/* SDK Quick Integration Reference Guide */}
      {showSdkGuide && (
        <div className="p-6 rounded-2xl bg-[#070b1e] border border-[#3fe9d6]/35 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
                Hướng Dẫn Giao Tiếp Tự Động Giữa Game Unity WebGL (.zip) &amp; VoVWeb
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Đặt Prefab <code>VoVEventBridge.prefab</code> (trong <code>Assets/VoVEventSDK/</code>) vào bất kỳ dự án Unity mới nào, xuất WebGL <code>.zip</code> và tải lên là tự động chạy.
              </p>
            </div>
            <a
              href="/templates/vov-event-layout.html"
              download="vov-event-layout.html"
              className="px-3 py-1.5 rounded-lg bg-[#f5c767]/15 hover:bg-[#f5c767]/25 border border-[#f5c767]/40 text-[#f5c767] text-[11px] font-mono font-bold"
            >
              Tải Layout Mẫu (.html)
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#050714] border border-white/10 space-y-2">
              <div className="text-[#f5c767] font-bold">
                1. Dùng Prefab VoVEventBridge trong dự án Unity:
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {`using VoV.Events;

// Kiểm tra còn lượt & trừ tạm 1 lượt khi bắt đầu chơi:
if (!VoVEventBridge.Instance.TryConsumeLocalTurn()) return;

// Khi thắng/nhận quà, trả thưởng thẳng lên Web & Túi Đồ:
VoVEventBridge.Instance.SendReward("item_01", "Quà Sự Kiện", 1, "SSR");`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-[#050714] border border-white/10 space-y-2">
              <div className="text-[#3fe9d6] font-bold">
                2. Cầu nối tự động trên Web (window.VoVSDK):
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {`// Tự động gửi vào Prefab VoVEventBridge / GameObject đã đăng ký:
// SetSpinCount(int), SetAuthToken(string), SetApiUrl(string)

// Hoặc gọi thẳng từ JS:
window.onUnitySpinReward("item_05", "Lõi cộng hưởng cao cấp", 1, "UR");
const res = await window.VoVSDK.rollServerSpin();`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10">
          <div className="text-xs font-mono text-slate-400">Tổng Chiến Dịch Sự Kiện</div>
          <div className="text-2xl font-bold text-white font-[family-name:var(--font-rajdhani)] mt-1">
            {events.length} Sự Kiện
          </div>
          <div className="text-[11px] font-mono text-[#3fe9d6] mt-1">
            Quản lý tập trung
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10">
          <div className="text-xs font-mono text-slate-400">Đang Mở Công Khai</div>
          <div className="text-2xl font-bold text-emerald-400 font-[family-name:var(--font-rajdhani)] mt-1">
            {activeCount} Chiến Dịch
          </div>
          <div className="text-[11px] font-mono text-emerald-300 mt-1">
            Người chơi có thể tham gia ngay
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10">
          <div className="text-xs font-mono text-slate-400">Đã Tích Hợp Bản Build Unity</div>
          <div className="text-2xl font-bold text-[#f5c767] font-[family-name:var(--font-rajdhani)] mt-1">
            {withUnityBuildCount} / {events.length}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Giải nén tự động 4 tệp chuẩn WebGL
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10">
          <div className="text-xs font-mono text-slate-400">Lưu Trữ Đám Mây</div>
          <div className="text-2xl font-bold text-[#3fe9d6] font-[family-name:var(--font-rajdhani)] mt-1">
            Sẵn Sàng
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Tự động dọn dẹp khi cập nhật
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-[#090d24]/90 border border-white/10 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#f5c767] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Đang đồng bộ danh sách sự kiện Minigame...
          </span>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs font-mono">
          {errorMsg}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#090d24]/90 border border-white/10 text-center space-y-4">
          <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
            Chưa Có Sự Kiện Minigame Web Nào
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hãy bấm tạo sự kiện mới, chọn 1 tệp giao diện <code className="text-[#f5c767]">.html</code> và 1 tệp bản build Unity WebGL <code className="text-[#3fe9d6]">.zip</code> để hệ thống tự động hợp nhất và nhúng lên Web.
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814] font-bold text-xs font-mono cursor-pointer"
            >
              + Khởi Tạo Sự Kiện Đầu Tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.map((ev) => (
            <div
              key={ev.EventId}
              className={`p-6 rounded-2xl bg-[#090d24]/95 border transition-all shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${ev.IsActive
                ? "border-[#f5c767]/45"
                : "border-white/10"
                }`}
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${ev.IsActive
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/35"
                      : "bg-slate-700/30 text-slate-300 border border-white/10"
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${ev.IsActive ? "bg-emerald-400" : "bg-slate-400"
                        }`}
                    />
                    <span>{ev.IsActive ? "ĐANG MỞ CÔNG KHAI" : "BẢN NHÁP / TẠM ĐÓNG"}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-white/5 text-[#3fe9d6] border border-white/10">
                    Mã: {ev.EventId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-[#f5c767]/10 text-[#f5c767] border border-[#f5c767]/30">
                    v{ev.Version}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide">
                    {ev.Title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">{ev.Subtitle}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-mono">
                  <div className="px-3 py-1.5 rounded-lg bg-[#060814] border border-[#f5c767]/25 text-[#f5c767]">
                    Layout HTML:{" "}
                    <strong>
                      {ev.RawHtmlContent ? "Tùy biến (.html)" : "Chuẩn Veyra"}
                    </strong>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-lg bg-[#060814] border ${ev.UnityBuild
                      ? "border-emerald-500/30 text-emerald-300"
                      : "border-amber-500/30 text-amber-300"
                      }`}
                  >
                    Unity WebGL (.zip):{" "}
                    <strong>
                      {ev.UnityBuild
                        ? `${ev.UnityBuild.BuildName} (${formatBytes(ev.UnityBuild.TotalSizeBytes)})`
                        : "Chưa tải file .zip"}
                    </strong>
                  </div>

                  <div className="px-3 py-1.5 rounded-lg bg-[#060814] border border-white/10 text-slate-300">
                    <strong>{ev.Missions.length}</strong> Nhiệm vụ ·{" "}
                    <strong>{ev.Rewards.length}</strong> Phần thưởng
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  href={`/events/${ev.EventId}`}
                  onClick={() => soundEngine.playClick()}
                  className="px-4 py-2 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6] text-[#3fe9d6] hover:text-[#060814] border border-[#3fe9d6]/40 text-xs font-mono font-bold transition-all"
                >
                  Mở Trang Chơi Thử
                </Link>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(ev)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono font-semibold transition-all cursor-pointer"
                  >
                    Tải File &amp; Sửa
                  </button>
                )}

                {canPublish && (
                  <button
                    type="button"
                    onClick={() => handleToggleActive(ev)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${ev.IsActive
                      ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                      }`}
                  >
                    {ev.IsActive ? "Tạm Đóng" : "Mở Công Khai"}
                  </button>
                )}

                {canDelete && !ev.IsActive && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(ev)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono cursor-pointer"
                    title="Xóa sự kiện và dọn dẹp file lưu trữ"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventEditorModal
        isOpen={isModalOpen}
        editingEvent={editingEvent}
        onClose={() => setIsModalOpen(false)}
        onSaved={(saved, message) => {
          setEvents((prev) => {
            const exists = prev.some((item) => item.EventId === saved.EventId);
            if (exists) {
              return prev.map((item) =>
                item.EventId === saved.EventId ? saved : item
              );
            }
            return [saved, ...prev];
          });
          showToast(message);
        }}
      />
    </div>
  );
}
