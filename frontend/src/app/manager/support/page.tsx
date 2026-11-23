import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Hỗ Trợ Người Chơi & Hòm Thư — Valkyria of Veyra",
  description:
    "Trung tâm Hỗ Trợ Người Chơi: soạn và gửi thư toàn server, thư cá nhân đính kèm quà, đền bù xử lý báo lỗi và thông báo hệ thống.",
};

export default function ManagerSupportPage() {
  return <ManagerPortalView initialTab="support" />;
}
