import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Quản Lý Nội Dung (Blogs & Fanpage) — Valkyria of Veyra",
  description:
    "Trung tâm quản lý nội dung bài viết blog và hệ thống trang mạng xã hội Fanpage của Valkyria of Veyra.",
};

export default function ManagerContentsPage() {
  return <ManagerPortalView initialTab="content" />;
}
