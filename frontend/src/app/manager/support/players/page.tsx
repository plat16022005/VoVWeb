import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Dữ Liệu & Túi Đồ Người Chơi — Valkyria of Veyra",
  description:
    "Quản lý dữ liệu người chơi theo từng cụm máy chủ: tra cứu hồ sơ nhân vật, cấp độ, lực chiến, số dư tiền tệ, kho tướng, trang bị, tiến trình vượt ải, kiểm tra túi đồ và thu hồi vật phẩm.",
};

export default function ManagerSupportPlayersPage() {
  return (
    <ManagerPortalView initialTab="support" initialSupportSubTab="players" />
  );
}
