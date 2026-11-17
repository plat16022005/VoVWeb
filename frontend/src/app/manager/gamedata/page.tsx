import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Quản Lý Dữ Liệu Game — Valkyria of Veyra",
  description:
    "Trung tâm quản lý dữ liệu game, thông số chiến binh Valkyria, kỹ năng và bản đồ đại lục Veyra.",
};

export default function ManagerGameDataPage() {
  return <ManagerPortalView initialTab="gamedata" />;
}

