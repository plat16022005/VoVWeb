"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/services/audio.service";
import { authService, useAuth, useIsMounted, BanViolationInfo, BannedAccountError } from "@/services/auth.service";
import TermsModal from "@/components/modals/TermsModal";
import BannedNotificationModal from "@/components/modals/BannedNotificationModal";

export default function LoginForm() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const currentUser = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [bannedViolation, setBannedViolation] = useState<BanViolationInfo | null>(null);
  const [isBannedModalOpen, setIsBannedModalOpen] = useState(false);

  // Popup Toast Notification (slide down from top, auto-closes)
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title?: string;
    text: string;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
    agreeTerms: true,
  });

  // Auto-dismiss popup toast after 3.2s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type: "success" | "error", text: string, title?: string) => {
    setToast({ type, text, title });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setToast(null);

    // Basic Validation
    if (tab === "login") {
      if (!formData.email.trim() || !formData.password.trim()) {
        showToast("error", "Vui lòng nhập đầy đủ Email và Mật khẩu.", "Thiếu Thông Tin");
        return;
      }
    } else {
      if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
        showToast("error", "Vui lòng điền đầy đủ các thông tin đăng ký.", "Thiếu Thông Tin");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast("error", "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.", "Lỗi Xác Nhận");
        return;
      }
      if (formData.password.length < 6) {
        showToast("error", "Mật khẩu phải có tối thiểu 6 ký tự (theo tiêu chuẩn Firebase).", "Mật Khẩu Ngắn");
        return;
      }
      if (!formData.agreeTerms) {
        showToast("error", "Bạn cần đồng ý với Điều khoản Dịch vụ để tạo tài khoản.", "Điều Khoản");
        return;
      }
    }

    setLoading(true);

    try {
      if (tab === "login") {
        const user = await authService.login({
          email: formData.email.trim(),
          password: formData.password,
        });

        soundEngine.playCelestialChime();
        showToast(
          "success",
          `Đăng nhập thành công! Chào mừng Chỉ Huy "${user.username}" trở lại Veyra.`,
          "Đăng Nhập Thành Công"
        );

        // Tự động phân quyền chuyển hướng: Admin -> /admin, Manager -> /manager, Player -> /
        const destination =
          user.role === "Admin" ? "/admin" : user.role === "Manager" ? "/manager" : "/";

        setTimeout(() => {
          router.push(destination);
        }, 1200);
      } else {
        const user = await authService.register({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        soundEngine.playCelestialChime();
        showToast(
          "success",
          `Tạo tài khoản thành công trên Firebase! Chào mừng Chỉ Huy "${user.username}" (${user.email}).`,
          "Đăng Ký Thành Công"
        );

        // Tự động chuyển hướng về Trang Chủ sau 1.5 giây
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err: unknown) {
      if (err instanceof BannedAccountError || (err as any)?.name === "BannedAccountError" || (err as any)?.violation) {
        const violation = (err as any).violation as BanViolationInfo;
        setBannedViolation(violation);
        setIsBannedModalOpen(true);
        soundEngine.playClick();
        return;
      }
      const error = err as Error;
      showToast(
        "error",
        error.message || "Không thể xác thực với Firebase.",
        "Lỗi Xác Thực"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    soundEngine.playClick();
    if (!formData.email.trim()) {
      showToast(
        "error",
        "Vui lòng nhập địa chỉ Email vào ô Email bên dưới trước khi bấm Quên mật khẩu.",
        "Yêu Cầu Email"
      );
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const message = await authService.forgotPassword(formData.email.trim());
      soundEngine.playCelestialChime();
      showToast("success", message, "Khôi Phục Mật Khẩu");
    } catch (err: unknown) {
      const error = err as Error;
      showToast(
        "error",
        error.message || "Không thể gửi email khôi phục mật khẩu.",
        "Lỗi Khôi Phục"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    soundEngine.playClick();
    setLoading(true);
    setToast(null);

    try {
      const user = await authService.loginWithGoogle();
      soundEngine.playCelestialChime();
      showToast(
        "success",
        `Đăng nhập Google thành công! Chào mừng Chỉ Huy "${user.username}".`,
        "Đăng Nhập Thành Công"
      );

      // Tự động phân quyền chuyển hướng: Admin -> /admin, Manager -> /manager, Player -> /
      const destination =
        user.role === "Admin" ? "/admin" : user.role === "Manager" ? "/manager" : "/";

      setTimeout(() => {
        router.push(destination);
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof BannedAccountError || (err as any)?.name === "BannedAccountError" || (err as any)?.violation) {
        const violation = (err as any).violation as BanViolationInfo;
        setBannedViolation(violation);
        setIsBannedModalOpen(true);
        soundEngine.playClick();
        return;
      }
      const error = err as Error;
      showToast(
        "error",
        error.message || "Đăng nhập Google thất bại.",
        "Lỗi Đăng Nhập"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    soundEngine.playClick();
    setLoading(true);
    setToast(null);

    try {
      const user = await authService.loginAsGuest();
      soundEngine.playCelestialChime();
      showToast(
        "success",
        `Chào mừng ${user.username} tham gia trải nghiệm Veyra dưới tư cách Khách!`,
        "Đăng Nhập Khách"
      );

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      showToast("error", err?.message || "Không thể đăng nhập dạng Khách.", "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    soundEngine.playClick();
    await authService.logout();
    showToast(
      "success",
      "Đã đăng xuất thành công khỏi Vùng đất Veyra.",
      "Đăng Xuất"
    );
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* Slide-Down Notification Popup */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md animate-slide-down-toast pointer-events-auto"
        >
          <div
            className={`relative overflow-hidden rounded-xl backdrop-blur-2xl bg-[#080a1c]/95 border shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-4 sm:p-4.5 ${toast.type === "success"
              ? "border-[#3fe9d6]/60 shadow-[0_10px_35px_rgba(63,233,214,0.25)]"
              : "border-red-500/60 shadow-[0_10px_35px_rgba(239,68,68,0.25)]"
              }`}
          >
            {/* Top ambient glow line */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] ${toast.type === "success"
                ? "bg-gradient-to-r from-transparent via-[#3fe9d6] to-transparent shadow-[0_0_12px_#3fe9d6]"
                : "bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444]"
                }`}
            />

            <div className="flex items-start gap-3.5">
              {/* Icon */}
              <div
                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-lg ${toast.type === "success"
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
                    className={`text-xs font-bold uppercase tracking-wider font-mono ${toast.type === "success" ? "text-[#3fe9d6]" : "text-red-400"
                      }`}
                  >
                    {toast.title || (toast.type === "success" ? "Thông Báo Veyra" : "Lỗi Xác Thực")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {toast.text}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => setToast(null)}
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
                className={`h-full animate-progress-shrink ${toast.type === "success" ? "bg-[#3fe9d6]" : "bg-red-500"
                  }`}
              />
            </div>
          </div>
        </aside>
      )}

      {/* Glow Ambient behind card */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-[#f5c767]/30 via-[#3fe9d6]/20 to-[#9b51e0]/30 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 -z-10" />

      {/* Main Glass Card */}
      <div className="hsr-card p-6 sm:p-8 rounded-xl backdrop-blur-2xl bg-[#090b1c]/90 border border-[#f5c767]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
        {/* Top Header with Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link
            href="/"
            onClick={() => soundEngine.playClick()}
            className="flex items-center gap-3 group mb-2"
          >
            <div className="relative w-40 h-40 group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(245,199,103,0.45)]">
              <Image
                src="/images/logo_vov.png"
                alt="VoV Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wider font-[family-name:var(--font-rajdhani)] uppercase">
            VALKYRIA o<span className="text-gold-gradient">f VEYRA</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">
            {currentUser
              ? "Trạng Thái Chỉ Huy"
              : tab === "login"
                ? "Cổng Chỉ Huy Veyra"
                : "Gia Nhập Lục Địa Veyra"}
          </p>
        </div>

        {/* LOGGED IN VIEW */}
        {isMounted && currentUser ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-white/5 border border-[#f5c767]/30 text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#f5c767] to-[#3fe9d6] mx-auto flex items-center justify-center text-2xl font-bold text-[#060814] shadow-[0_0_15px_rgba(245,199,103,0.5)]">
                {currentUser.username ? currentUser.username[0].toUpperCase() : "★"}
              </div>
              <div>
                <p className="text-base font-bold text-white font-mono">
                  {currentUser.username}
                </p>
                <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-mono text-[#f5c767]">
                  <span>Cấp Chỉ Huy: {currentUser.level || 1}</span>
                </div>
              </div>
              <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded-full bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40">
                Đã Đăng Nhập · Veyra
              </span>
            </div>

            <p className="text-xs text-center text-slate-400 font-sans px-2">
              Chỉ Huy đang truy cập với tài khoản này. Bạn có thể quay về Trang Chủ để tiếp tục hoặc Đăng xuất để đổi tài khoản khác.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/"
                onClick={() => soundEngine.playClick()}
                className="w-full py-3 rounded font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] text-sm flex items-center justify-center gap-2 hsr-btn-gold"
              >
                <span>VÀO HÀNH TRÌNH (TRANG CHỦ)</span>
              </Link>
              <Link
                href="/profile"
                onClick={() => soundEngine.playClick()}
                className="w-full py-2.5 rounded font-semibold uppercase tracking-wider font-mono text-xs border border-white/15 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <span>XEM HỒ SƠ CHỈ HUY</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 rounded font-semibold uppercase tracking-wider font-mono text-xs border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                Đăng Xuất (Đổi Tài Khoản Khác)
              </button>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN VIEW */
          <>
            {/* Tab Switcher */}
            <div className="flex rounded-lg bg-[#04050d]/80 p-1 border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTab("login");
                  setToast(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded transition-all cursor-pointer ${tab === "login"
                  ? "bg-gradient-to-r from-[#ecd178]/20 to-[#d8a83a]/20 text-[#f5c767] border border-[#f5c767]/40 shadow-[0_0_10px_rgba(245,199,103,0.2)]"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTab("register");
                  setToast(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded transition-all cursor-pointer ${tab === "register"
                  ? "bg-gradient-to-r from-[#3fe9d6]/20 to-[#3b82f6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_10px_rgba(63,233,214,0.2)]"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                Đăng Ký
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                    Tên Chỉ Huy (Nickname)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Hitomi_Valkyrie"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6] focus:ring-1 focus:ring-[#3fe9d6] transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="commander@veyra.game"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f5c767] focus:ring-1 focus:ring-[#f5c767] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={tab === "login" ? "••••••••" : "Tối thiểu 6 ký tự"}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f5c767] focus:ring-1 focus:ring-[#f5c767] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password (Tab Login) */}
              {tab === "login" && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-[#050714] text-[#f5c767] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#f5c767]"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[#f5c767] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {/* Password confirmation (Tab Register) */}
              {tab === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                    Xác nhận Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6] focus:ring-1 focus:ring-[#3fe9d6] transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Agreement on register tab */}
              {tab === "register" && (
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-[#050714] text-[#3fe9d6] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#3fe9d6]"
                    />
                    <span>
                      Tôi đồng ý với{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          soundEngine.playClick();
                          setIsTermsModalOpen(true);
                        }}
                        className="text-[#3fe9d6] underline hover:text-[#5ef0e0] font-semibold cursor-pointer inline transition-colors"
                      >
                        Điều khoản dịch vụ
                      </button>{" "}
                      của Valkyria of Veyra.
                    </span>
                  </label>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 mt-2 rounded font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${tab === "login"
                  ? "hsr-btn-gold"
                  : "bg-gradient-to-r from-[#3fe9d6] to-[#3b82f6] text-[#060814] hover:shadow-[0_0_25px_rgba(63,233,214,0.6)]"
                  } ${loading ? "opacity-75 cursor-wait" : ""}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang kết nối đến Veyra...</span>
                  </>
                ) : (
                  <span>{tab === "login" ? "BƯỚC VÀO VEYRA (ĐĂNG NHẬP)" : "ĐĂNG KÝ CHỈ HUY"}</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-[#090b1c] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-widest relative z-10">
                  Hoặc
                </span>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập nhanh với Google</span>
              </button>

              {/* Guest Sign In */}
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={loading}
                className="w-full py-2.5 mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Trải nghiệm nhanh dưới dạng Khách (Chơi Ngay)</span>
              </button>
            </form>
          </>
        )}

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            onClick={() => soundEngine.playClick()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#f5c767] transition-colors py-1 px-3 rounded-full hover:bg-white/5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Trở về Trang Chủ</span>
          </Link>
        </div>
      </div>

      {/* Terms of Service Realtime Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Banned Violation Notification Modal */}
      <BannedNotificationModal
        isOpen={isBannedModalOpen}
        violation={bannedViolation}
        onClose={() => {
          setIsBannedModalOpen(false);
          setBannedViolation(null);
        }}
      />
    </div>
  );
}
