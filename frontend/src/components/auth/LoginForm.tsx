"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { soundEngine } from "@/services/audio.service";

export default function LoginForm() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
    agreeTerms: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setNotification(null);

    // Basic Validation
    if (tab === "login") {
      if (!formData.usernameOrEmail.trim() || !formData.password.trim()) {
        setNotification({
          type: "error",
          text: "Vui lòng nhập đầy đủ Email/Tên tài khoản và Mật khẩu.",
        });
        return;
      }
    } else {
      if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
        setNotification({
          type: "error",
          text: "Vui lòng điền đầy đủ các thông tin đăng ký.",
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setNotification({
          type: "error",
          text: "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.",
        });
        return;
      }
      if (!formData.agreeTerms) {
        setNotification({
          type: "error",
          text: "Bạn cần đồng ý với Điều khoản Dịch vụ để tạo tài khoản.",
        });
        return;
      }
    }

    setLoading(true);

    // Simulate authentication processing
    setTimeout(() => {
      setLoading(false);
      soundEngine.playCelestialChime();
      if (tab === "login") {
        setNotification({
          type: "success",
          text: `Đăng nhập thành công! Chào mừng Nhà Khai Phá "${formData.usernameOrEmail}" trở lại Chuyến Tàu Ngân Hà.`,
        });
      } else {
        setNotification({
          type: "success",
          text: `Tạo tài khoản thành công! Bạn có thể sử dụng thông tin này để khởi hành ngay.`,
        });
      }
    }, 700);
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
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
            {tab === "login" ? "Cổng Đăng Nhập" : "Gia Nhập Thế giới Veyra"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-[#04050d]/80 p-1 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setTab("login");
              setNotification(null);
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
              setNotification(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded transition-all cursor-pointer ${tab === "register"
              ? "bg-gradient-to-r from-[#3fe9d6]/20 to-[#3b82f6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_10px_rgba(63,233,214,0.2)]"
              : "text-slate-400 hover:text-white"
              }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`mb-5 p-3 rounded-lg border text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn ${notification.type === "success"
              ? "bg-[#3fe9d6]/10 border-[#3fe9d6]/40 text-[#3fe9d6]"
              : "bg-red-500/10 border-red-500/40 text-red-300"
              }`}
          >
            <span className="text-base leading-none">
              {notification.type === "success" ? "✨" : "⚠️"}
            </span>
            <div className="flex-1">{notification.text}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "login" ? (
            <>
              {/* Login: Username or Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Email hoặc Tên tài khoản
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="usernameOrEmail"
                    value={formData.usernameOrEmail}
                    onChange={handleInputChange}
                    placeholder="pioneer@astral.express"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f5c767] focus:ring-1 focus:ring-[#f5c767] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Login: Password */}
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
                    placeholder="••••••••"
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

              {/* Remember & Forgot Password */}
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
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    soundEngine.playClick();
                    alert("Tính năng khôi phục mật khẩu qua email đang được đồng bộ với hệ thống.");
                  }}
                  className="text-[#f5c767] hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>
            </>
          ) : (
            <>
              {/* Register: Nickname */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Tên Nhà Khai Phá (Nickname)
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

              {/* Register: Email */}
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
                    placeholder="pioneer@astral.express"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6] focus:ring-1 focus:ring-[#3fe9d6] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Register: Password */}
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
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6] focus:ring-1 focus:ring-[#3fe9d6] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Register: Confirm Password */}
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

              {/* Agreement checkbox */}
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
                    <span className="text-[#3fe9d6] underline">Điều khoản dịch vụ</span> &{" "}
                    <span className="text-[#3fe9d6] underline">Quy tắc Khai phá</span>.
                  </span>
                </label>
              </div>
            </>
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
                <span>Đang kết nối cổng lượng tử...</span>
              </>
            ) : (
              <span>{tab === "login" ? "KHỞI HÀNH (ĐĂNG NHẬP)" : "ĐĂNG KÝ KHAI PHÁ"}</span>
            )}
          </button>
        </form>

        {/* Quick Social Logins */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono mb-3">
            Hoặc liên kết nhanh
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                alert("Đăng nhập bằng Google đang được kết nối với API.");
              }}
              className="py-2 px-3 rounded bg-white/5 border border-white/10 hover:border-[#f5c767]/40 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              <span>🌐</span>
              <span className="font-mono">Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                alert("Đăng nhập bằng HoYoverse Pass đang được kết nối với API.");
              }}
              className="py-2 px-3 rounded bg-white/5 border border-white/10 hover:border-[#3fe9d6]/40 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              <span>🚀</span>
              <span className="font-mono">VoV Pass</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                alert("Đăng nhập bằng Discord đang được kết nối với API.");
              }}
              className="py-2 px-3 rounded bg-white/5 border border-white/10 hover:border-[#9b51e0]/40 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              <span>💬</span>
              <span className="font-mono">Discord</span>
            </button>
          </div>
        </div>

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
    </div>
  );
}
