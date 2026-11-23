import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Quản Lý Blog & Tin Tức — Valkyria of Veyra",
  description:
    "Soạn thảo, xuất bản và điều phối bài viết tin tức, sự kiện trên trang chủ Valkyria of Veyra.",
};

export default function ManagerContentsBlogPage() {
  return (
    <ManagerPortalView initialTab="content" initialContentSubTab="blog" />
  );
}
