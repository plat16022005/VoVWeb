import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Quản Lý Fanpage Facebook — Valkyria of Veyra",
  description:
    "Điều phối bài đăng Fanpage Facebook, theo dõi chỉ số tương tác và cấu hình tự động trả lời bình luận.",
};

export default function ManagerContentsFacebookPage() {
  return (
    <ManagerPortalView initialTab="content" initialContentSubTab="facebook" />
  );
}
