import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Vật Phẩm & Trang Bị — Valkyria of Veyra",
  description:
    "Quản lý cấu hình vật phẩm, trang bị, nguyên liệu và phần thưởng trong game Valkyria of Veyra.",
};

export default function ManagerGameDataItemsPage() {
  return (
    <ManagerPortalView initialTab="gamedata" initialGameDataSubTab="items" />
  );
}
