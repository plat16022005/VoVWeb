"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/services/auth.service";
import StarCanvas from "@/components/common/StarCanvas";

interface RoleRouteGuardProps {
  requiredRole: "Admin" | "Manager";
  children: React.ReactNode;
}

export default function RoleRouteGuard({
  requiredRole,
  children,
}: RoleRouteGuardProps) {
  const router = useRouter();
  const currentUser = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  useEffect(() => {
    // Đợi 200ms để đảm bảo Firebase Auth và localStorage đồng bộ snapshot
    const timer = setTimeout(() => {
      setAuthChecked(true);

      // 1. Chưa đăng nhập -> Chuyển về trang đăng nhập
      if (!currentUser) {
        setRedirectNotice("Vui lòng đăng nhập tài khoản có thẩm quyền...");
        const redirectPath = requiredRole === "Admin" ? "/admin" : "/manager";
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      // 2. Tài khoản là Admin
      if (currentUser.role === "Admin") {
        if (requiredRole === "Admin") {
          setIsAuthorized(true);
        } else {
          // Admin cố vào trang của Manager -> Chuyển hướng về /admin
          setRedirectNotice("Trang này chỉ dành cho Manager. Đang chuyển hướng bạn về Tổng Hành Dinh Admin...");
          setTimeout(() => router.replace("/admin"), 1000);
        }
        return;
      }

      // 3. Tài khoản là Manager
      if (currentUser.role === "Manager") {
        if (requiredRole === "Manager") {
          setIsAuthorized(true);
        } else {
          // Manager cố vào trang của Admin -> Chuyển hướng về /manager
          setRedirectNotice("Trang này chỉ dành cho Admin. Đang chuyển hướng bạn về Cổng Vận Hành Manager...");
          setTimeout(() => router.replace("/manager"), 1000);
        }
        return;
      }

      // 4. Tài khoản là Player (Người chơi thường)
      setRedirectNotice("Tài khoản của bạn không có quyền truy cập khu vực này. Đang trở về Trang Chủ...");
      setTimeout(() => router.replace("/"), 1200);
    }, 250);

    return () => clearTimeout(timer);
  }, [currentUser, requiredRole, router]);

  // Đang kiểm tra hoặc chưa được cấp quyền
  if (!authChecked || !isAuthorized) {
    return (
      <div className="relative min-h-screen w-full bg-[#04050d] text-white flex items-center justify-center p-4">
        <StarCanvas />
        <div className="relative z-10 max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#090d24]/90 backdrop-blur-xl border border-white/10 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-[#3fe9d6]/30 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#3fe9d6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6] animate-pulse" />
            <span>{requiredRole === "Admin" ? "Xác Thực Quản Trị" : "Xác Thực Vận Hành"}</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider text-white">
              {requiredRole === "Admin" ? "Khu Vực Quản Trị Admin" : "Cổng Điều Hành Manager"}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {redirectNotice || "Đang xác thực quyền hạn Chỉ Huy..."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="w-2 h-2 rounded-full bg-[#3fe9d6] animate-ping" />
            <div className="w-2 h-2 rounded-full bg-[#f5c767] animate-ping delay-150" />
            <div className="w-2 h-2 rounded-full bg-[#9b51e0] animate-ping delay-300" />
          </div>
        </div>
      </div>
    );
  }

  // Đã xác thực thành công vai trò chuẩn
  return <>{children}</>;
}

