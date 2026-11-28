import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Nhật Ký Hoạt Động Người Chơi — Valkyria of Veyra",
  description:
    "Tra cứu lịch sử hoạt động trong game và đối soát biến động tài sản của người chơi theo từng cụm máy chủ: triệu hồi Gacha, vượt ải, nâng cấp tướng, cường hóa trang bị, nhận thư và nhập Giftcode.",
};

export default function ManagerSupportActivityLogsPage() {
  return (
    <ManagerPortalView initialTab="support" initialSupportSubTab="activity" />
  );
}
