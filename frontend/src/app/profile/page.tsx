import type { Metadata } from "next";
import StarCanvas from "@/components/common/StarCanvas";
import ProfileView from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Hồ Sơ Chỉ Huy — Valkyria of Veyra",
  description: "Trang thông tin, hồ sơ thám hiểm và chiến tích của Chỉ Huy trên đại lục Veyra cùng các Valkyria.",
};

export default function ProfilePage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col justify-center py-12 px-4 overflow-hidden bg-[#04050d]">
      {/* Background Starry Canvas */}
      <StarCanvas />

      {/* Decorative Cosmic Nebulas */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#f5c767]/10 via-[#3fe9d6]/10 to-[#9b51e0]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#3fe9d6]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#f5c767]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content Container */}
      <div className="w-full max-w-7xl mx-auto relative z-10 flex flex-col items-center justify-center">
        <ProfileView />
      </div>
    </main>
  );
}
