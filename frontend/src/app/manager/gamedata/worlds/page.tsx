import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Bản Đồ Thế Giới Veyra — Valkyria of Veyra",
  description:
    "Quản lý vùng đất, bản đồ và cấu hình phó bản đại lục Veyra.",
};

export default function ManagerGameDataWorldsPage() {
  return (
    <ManagerPortalView initialTab="gamedata" initialGameDataSubTab="worlds" />
  );
}
