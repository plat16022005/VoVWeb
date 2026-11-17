import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Quản Lý Sự Kiện & Minigame — Valkyria of Veyra",
  description:
    "Trung tâm quản lý sự kiện Minigame Web, hợp nhất bản build Unity WebGL (.zip) và giao diện (.html), cấu hình nhiệm vụ nhận lượt và phần thưởng.",
};

export default function ManagerEventsPage() {
  return <ManagerPortalView initialTab="events" />;
}
