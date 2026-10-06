import type { Metadata } from "next";
import StarCanvas from "@/components/common/StarCanvas";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Cổng Chỉ Huy — Valkyria of Veyra",
  description: "Cổng đăng nhập tài khoản Chỉ Huy. Kết nối dữ liệu và tiếp tục hành trình sát cánh cùng các Valkyria trên vùng đất Veyra.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center py-12 px-4 overflow-hidden bg-[#04050d]">
      {/* Dynamic Starry Night Cosmic Canvas Background */}
      <StarCanvas />

      {/* Decorative cosmic nebula lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#f5c767]/10 via-[#3fe9d6]/10 to-[#9b51e0]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#3fe9d6]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#f5c767]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Modular Auth Container */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center relative z-10">
        <LoginForm />
      </div>
    </main>
  );
}
