"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/services/audio.service";
import { authService, useAuth, useIsMounted } from "@/services/auth.service";

export default function ProfileView() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const currentUser = useAuth();

  const [copiedUid, setCopiedUid] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Popup Toast Notification (slide down at top corner, auto slide up when ending)
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title?: string;
    text: string;
  } | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const closeToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setToast(null);
      setIsExiting(false);
    }, 380);
  }, []);

  const showToast = useCallback((type: "success" | "error", text: string, title?: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    setIsExiting(false);
    setToast({ type, text, title });

    toastTimerRef.current = setTimeout(() => {
      closeToast();
    }, 3500);
  }, [closeToast]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const handleCopyUid = () => {
    soundEngine.playClick();
    if (!currentUser?.id) return;
    navigator.clipboard.writeText(currentUser.id);
    setCopiedUid(true);
    showToast("success", "Đã sao chép mã UID Chỉ Huy vào bộ nhớ tạm!", "Sao Chép Thành Công");
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handlePasswordReset = async () => {
    soundEngine.playClick();
    if (!currentUser?.email) return;

    setResettingPassword(true);

    try {
      const msg = await authService.forgotPassword(currentUser.email);
      soundEngine.playCelestialChime();
      showToast("success", msg, "Khôi Phục Mật Khẩu");
    } catch (err: unknown) {
      const error = err as Error;
      showToast("error", error.message || "Không thể gửi thư đổi mật khẩu lúc này.", "Lỗi Khôi Phục");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSignOut = async () => {
    soundEngine.playClick();
    setIsLoggingOut(true);
    router.replace("/");
    await authService.logout();
  };

  if (!isMounted || isLoggingOut) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full border-2 border-[#3fe9d6]/30 animate-spin border-t-[#3fe9d6]" />
        <p className="mt-4 text-xs font-mono tracking-widest text-slate-400 uppercase">
          {isLoggingOut ? "Đang đăng xuất và trở về Trang Chủ..." : "Đang kết nối dữ liệu Chỉ Huy Veyra..."}
        </p>
      </div>
    );
  }

  // Not Logged In View
  if (!currentUser) {
    return (
      <div className="w-full max-w-lg mx-auto py-20 px-4 text-center">
        <div className="hsr-card p-8 sm:p-10 rounded-2xl backdrop-blur-2xl bg-[#090b1c]/90 border border-[#f5c767]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-3xl mb-4 text-slate-400">
            🔒
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wider">
            YÊU CẦU XÁC THỰC CHỈ HUY
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-sans leading-relaxed">
            Chỉ Huy chưa đăng nhập vào hệ thống Lục Địa Veyra. Vui lòng đăng nhập để xem thông tin hồ sơ và chiến tích.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              onClick={() => soundEngine.playClick()}
              className="hsr-btn-gold text-sm py-3 px-6 rounded"
            >
              <span>ĐĂNG NHẬP NGAY</span>
            </Link>
            <Link
              href="/"
              onClick={() => soundEngine.playClick()}
              className="py-3 px-6 rounded text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white border border-white/15 hover:bg-white/5 transition-all flex items-center justify-center"
            >
              <span>VỀ TRANG CHỦ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 relative z-10">
      {/* Top Breadcrumb & Return Button */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          onClick={() => soundEngine.playClick()}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-[#f5c767] transition-colors py-1.5 px-3 rounded-full hover:bg-white/5 border border-transparent hover:border-[#f5c767]/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Trở về Trang Chủ</span>
        </Link>

        <span className="text-[11px] font-mono tracking-widest text-[#3fe9d6] uppercase flex items-center gap-2 bg-[#3fe9d6]/10 px-3 py-1 rounded-full border border-[#3fe9d6]/30">
          <span className="w-2 h-2 rounded-full bg-[#3fe9d6] animate-pulse" />
          Máy Chủ Veyra · Hoạt Động
        </span>
      </div>

      {/* Slide-Down Corner Notification Popup */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-4 left-4 sm:left-auto sm:right-6 sm:w-[390px] z-[100] pointer-events-auto ${
            isExiting ? "animate-toast-out" : "animate-toast-in"
          }`}
        >
          <div
            className={`relative overflow-hidden rounded-xl backdrop-blur-2xl bg-[#080a1c]/95 border shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-4 sm:p-4.5 ${
              toast.type === "success"
                ? "border-[#3fe9d6]/60 shadow-[0_10px_35px_rgba(63,233,214,0.25)]"
                : "border-red-500/60 shadow-[0_10px_35px_rgba(239,68,68,0.25)]"
            }`}
          >
            {/* Top ambient glow line */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] ${
                toast.type === "success"
                  ? "bg-gradient-to-r from-transparent via-[#3fe9d6] to-transparent shadow-[0_0_12px_#3fe9d6]"
                  : "bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444]"
              }`}
            />

            <div className="flex items-start gap-3.5">
              {/* Icon */}
              <div
                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-lg ${
                  toast.type === "success"
                    ? "bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_12px_rgba(63,233,214,0.3)]"
                    : "bg-red-500/15 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                }`}
              >
                {toast.type === "success" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pr-2 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider font-mono ${
                      toast.type === "success" ? "text-[#3fe9d6]" : "text-red-400"
                    }`}
                  >
                    {toast.title || (toast.type === "success" ? "Thông Báo Veyra" : "Lỗi")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {toast.text}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={closeToast}
                aria-label="Đóng thông báo"
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-md p-1 transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Shrinking progress bar indicating auto-close */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
              <div
                className={`h-full animate-progress-shrink ${
                  toast.type === "success" ? "bg-[#3fe9d6]" : "bg-red-500"
                }`}
              />
            </div>
          </div>
        </aside>
      )}

      {/* Main Profile Dossier Card */}
      <div className="hsr-card p-6 sm:p-8 rounded-2xl backdrop-blur-2xl bg-[#090b1c]/90 border border-[#f5c767]/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative overflow-hidden mb-8">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f5c767] to-transparent shadow-[0_0_15px_#f5c767]" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Avatar Box with Glowing Ring */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#f5c767] via-[#9b51e0] to-[#3fe9d6] p-[2px] shadow-[0_0_25px_rgba(245,199,103,0.4)]">
              <div className="w-full h-full bg-[#070919] rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-[#f5c767] font-mono select-none">
                {currentUser.username ? currentUser.username[0].toUpperCase() : "★"}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-[#050714] border border-[#f5c767]/60 text-[10px] font-mono font-bold text-[#f5c767] shadow-[0_0_8px_rgba(245,199,103,0.5)]">
              LV.1
            </div>
          </div>

          {/* Commander Bio Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
                {currentUser.username}
              </h1>
              <span className="inline-block self-center md:self-auto px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider rounded-full bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/40">
                Chỉ Huy Trưởng Veyra
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              Email Xác Thực: <span className="text-slate-200">{currentUser.email}</span>
            </p>

            {/* UID Badge with Copy Button */}
            <div className="inline-flex items-center gap-2 pt-1">
              <span className="text-xs font-mono text-slate-400">UID:</span>
              <code className="text-xs font-mono text-[#3fe9d6] bg-[#050714] px-2.5 py-1 rounded border border-white/10 select-all">
                {currentUser.id}
              </code>
              <button
                type="button"
                onClick={handleCopyUid}
                className="text-[11px] font-mono uppercase px-2 py-1 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedUid ? "✓ Đã Chép" : "Sao Chép"}
              </button>
            </div>
          </div>

          {/* Quick Action Buttons on Desktop */}
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resettingPassword}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded border border-[#f5c767]/30 text-[#f5c767] hover:bg-[#f5c767]/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {resettingPassword ? "Đang Gửi Mail..." : "Đổi Mật Khẩu"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Đăng Xuất
            </button>
          </div>
        </div>
      </div>

      {/* RPG Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#3fe9d6]/40 transition-all">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Valkyria Đã Kêu Gọi
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-[#3fe9d6]">04</span>
            <span className="text-xs text-slate-500 font-mono">/ 12</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-sans">Chiến binh đồng hành</p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#f5c767]/40 transition-all">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Vùng Đất Khám Phá
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-[#f5c767]">03</span>
            <span className="text-xs text-slate-500 font-mono">/ 06</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-sans">Lục địa Veyra huyền bí</p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#9b51e0]/40 transition-all">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Chiến Tích Đấu Trường
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white">Vàng I</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-sans">Đấu chiến thuật theo lượt</p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/40 transition-all">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Năng Lượng Tinh Thể
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">120</span>
            <span className="text-xs text-slate-500 font-mono">/ 120</span>
          </div>
          <p className="mt-1 text-[10px] text-emerald-400/70 font-sans">Sẵn sàng xuất trận</p>
        </div>
      </div>

      {/* Featured Valkyria Squad (Preview) */}
      <div className="hsr-card p-6 sm:p-8 rounded-2xl backdrop-blur-2xl bg-[#090b1c]/80 border border-white/10 relative mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wider">
              ĐỘI HÌNH TIÊU BIỂU · LỤC ĐỊA VEYRA
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Các Valkyria sẵn sàng nhận mệnh lệnh từ Chỉ Huy trong các chiến trận Turn-based RPG
            </p>
          </div>
          <span className="text-xs font-mono text-[#f5c767] hidden sm:inline">
            Unity Engine · Turn-Based
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: "Lyra", title: "Thánh Nữ Tinh Cầu", element: "Băng Lam", color: "#3fe9d6", img: "/images/characters/chara_1.png" },
            { name: "Seraphina", title: "Kiếm Sư Hừng Đông", element: "Quang Năng", color: "#f5c767", img: "/images/characters/chara_2.png" },
            { name: "Nyx", title: "Bóng Ma U Ám", element: "Hắc Ám", color: "#9b51e0", img: "/images/characters/chara_3.png" },
            { name: "Kaelen", title: "Vệ Binh Rực Lửa", element: "Liệt Hỏa", color: "#ef4444", img: "/images/characters/chara_4.png" },
          ].map((valk, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#f5c767]/50 transition-all text-center group"
            >
              <div className="relative w-16 h-16 mx-auto mb-2 rounded-xl overflow-hidden bg-[#050714] border border-white/10 group-hover:scale-105 transition-transform">
                <Image
                  src={valk.img}
                  alt={valk.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <p className="text-sm font-bold text-white font-mono">{valk.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{valk.title}</p>
              <span
                className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
                style={{
                  backgroundColor: `${valk.color}15`,
                  color: valk.color,
                  border: `1px solid ${valk.color}35`,
                }}
              >
                {valk.element}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="text-center pt-2">
        <Link
          href="/"
          onClick={() => soundEngine.playClick()}
          className="hsr-btn-gold text-sm py-3 px-8 rounded uppercase font-bold tracking-wider inline-flex items-center gap-2"
        >
          <span>QUAY LẠI TRANG CHỦ VEYRA</span>
        </Link>
      </div>
    </div>
  );
}
