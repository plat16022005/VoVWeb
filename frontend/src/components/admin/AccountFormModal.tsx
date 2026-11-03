"use client";

import { useState, useEffect } from "react";
import { AdminAccount } from "@/data/adminAccounts";
import { soundEngine } from "@/services/audio.service";

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: {
    username: string;
    email: string;
    password?: string;
    role: "Admin" | "Manager" | "Player";
    status?: "active" | "banned" | "pending";
    provider?: "Email" | "Google" | "Guest";
  }) => void;
  editingAccount: AdminAccount | null;
  currentUserId?: string;
}

export default function AccountFormModal({
  isOpen,
  onClose,
  onSave,
  editingAccount,
  currentUserId,
}: AccountFormModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [provider, setProvider] = useState<"Email" | "Google" | "Guest">("Email");
  const [role, setRole] = useState<"Admin" | "Manager" | "Player">("Player");
  const [status, setStatus] = useState<"active" | "banned" | "pending">("active");
  const [error, setError] = useState<string | null>(null);

  const isSelf = !!(currentUserId && editingAccount?.id === currentUserId);

  useEffect(() => {
    if (editingAccount) {
      setUsername(editingAccount.username);
      setEmail(editingAccount.email);
      setPassword("");
      const isGuestAcc = !editingAccount.email || editingAccount.email.trim() === "" || editingAccount.email === "(Khách)";
      setProvider(editingAccount.provider || (isGuestAcc ? "Guest" : "Email"));
      // Giữ nguyên vai trò Admin nếu tài khoản đang sửa là Admin
      if (editingAccount.role === "Admin") {
        setRole("Admin");
      } else {
        setRole(editingAccount.role === "Manager" ? "Manager" : "Player");
      }
      setStatus(editingAccount.status);
    } else {
      setUsername("");
      setEmail("");
      setPassword("");
      setProvider("Email");
      setRole("Player");
      setStatus("active");
    }
    setError(null);
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Vui lòng nhập tên người dùng/tài khoản.");
      return;
    }

    if (provider === "Email") {
      if (!editingAccount) {
        if (!email.trim() || !email.includes("@")) {
          setError("Vui lòng nhập địa chỉ email hợp lệ.");
          return;
        }
        if (!password || password.trim().length < 6) {
          setError("Vui lòng nhập mật khẩu (tối thiểu 6 ký tự) để tài khoản có thể đăng nhập.");
          return;
        }
      } else {
        if (email.trim() && !email.includes("@")) {
          setError("Vui lòng nhập địa chỉ email hợp lệ.");
          return;
        }
      }
    } else if (provider === "Google") {
      if (!editingAccount && (!email.trim() || !email.includes("@"))) {
        setError("Vui lòng nhập địa chỉ Gmail hợp lệ của người chơi.");
        return;
      }
    }

    if (isSelf && status === "banned") {
      setError("Bạn không thể tự khóa tài khoản của chính mình.");
      return;
    }

    soundEngine.playClick();
    const finalEmail = provider === "Guest" ? "" : email.trim();
    onSave({
      username: username.trim(),
      email: finalEmail,
      ...(password.trim() && provider === "Email" ? { password: password.trim() } : {}),
      role,
      status,
      provider,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090c21] border border-[#3fe9d6]/30 shadow-[0_0_35px_rgba(63,233,214,0.25)] overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0e1330]">
          <div>
            <h2 className="text-lg font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3fe9d6]" />
              {editingAccount ? "Chỉnh Sửa Tài Khoản" : "Tạo Tài Khoản Mới"}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {editingAccount ? `Mã UID: ${editingAccount.id}` : "Khởi tạo tài khoản người chơi hoặc quản lý"}
            </p>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Hình Thức Đăng Ký / Phân Loại <span className="text-[#3fe9d6]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider("Email")}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  provider === "Email"
                    ? "bg-[#3fe9d6]/15 border-[#3fe9d6] text-[#3fe9d6] shadow-[0_0_12px_rgba(63,233,214,0.3)]"
                    : "bg-[#0e122b] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <span>✉️ Email</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider("Google")}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  provider === "Google"
                    ? "bg-rose-500/15 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                    : "bg-[#0e122b] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <span>🔴 Google</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider("Guest")}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  provider === "Guest"
                    ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "bg-[#0e122b] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <span>👤 Khách</span>
              </button>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Tên Tài Khoản / Tên Hiển Thị <span className="text-[#3fe9d6]">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="VD: Chỉ Huy Kuro"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-sm focus:outline-none focus:border-[#3fe9d6] font-mono"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Địa Chỉ Email{" "}
              {provider === "Guest" ? (
                <span className="text-amber-400 font-mono font-medium">(Tài khoản Khách - Không bắt buộc)</span>
              ) : (
                <span className="text-[#3fe9d6]">*</span>
              )}
            </label>
            <input
              type="text"
              value={provider === "Guest" ? "(Khách)" : email}
              disabled={Boolean(editingAccount) || provider === "Guest"}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={provider === "Google" ? "player@gmail.com" : "commander@example.com"}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-sm focus:outline-none focus:border-[#3fe9d6] font-mono ${
                editingAccount || provider === "Guest" ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
          </div>

          {/* Password (Chỉ hiển thị khi tạo mới tài khoản qua hình thức Email) */}
          {!editingAccount && provider === "Email" && (
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Mật Khẩu Ban Đầu <span className="text-[#3fe9d6]">* (tối thiểu 6 ký tự)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cho tài khoản..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-sm focus:outline-none focus:border-[#3fe9d6] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>
          )}

          {/* Role & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role: Nếu đang sửa Admin thì giữ nguyên hiển thị Admin, nếu không thì chọn Player hoặc Manager */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Vai Trò (Phân Quyền)
              </label>
              {editingAccount?.role === "Admin" ? (
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b]/70 border border-red-500/30 text-red-300 text-sm font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Admin (Quản Trị Viên)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Cố định</span>
                </div>
              ) : (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "Player" | "Manager")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-sm focus:outline-none focus:border-[#3fe9d6] font-mono cursor-pointer"
                >
                  <option value="Player" className="bg-[#0b0e24] text-[#3fe9d6]">Player (Người Chơi)</option>
                  <option value="Manager" className="bg-[#0b0e24] text-[#f5c767]">Manager (Quản Lý)</option>
                </select>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Trạng Thái {isSelf && <span className="text-[#3fe9d6] font-mono">(Tài khoản của bạn)</span>}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-sm focus:outline-none focus:border-[#3fe9d6] font-mono cursor-pointer"
              >
                <option value="active" className="bg-[#0b0e24] text-emerald-400">Hoạt Động</option>
                {!isSelf && <option value="banned" className="bg-[#0b0e24] text-rose-400">Bị Khóa</option>}
                <option value="pending" className="bg-[#0b0e24] text-amber-300">Chờ Kích Hoạt</option>
              </select>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300/90 flex items-start gap-2">
            <span className="text-sm leading-none">🔒</span>
            <span>
              Để đảm bảo bảo mật hệ thống, tài khoản cấp <strong>Quản Trị Viên (Admin)</strong> không thể tạo trực tiếp từ trang này.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-[family-name:var(--font-rajdhani)] uppercase tracking-wider text-black bg-gradient-to-r from-[#3fe9d6] to-[#f5c767] hover:brightness-110 shadow-[0_0_15px_rgba(63,233,214,0.4)] transition-all cursor-pointer"
            >
              {editingAccount ? "Lưu Thay Đổi" : "Khởi Tạo Tài Khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
