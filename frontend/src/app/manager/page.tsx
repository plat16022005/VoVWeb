import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Cổng Điều Hành Vận Hành (Manager Portal) — Valkyria of Veyra",
  description: "Trung tâm quản lý vận hành trực tiếp Valkyria of Veyra: Quản lý Giftcode, Hòm thư Server, Đền bù bảo trì, Sự kiện và Tra cứu người chơi.",
};

export default function ManagerPage() {
  return <ManagerPortalView />;
}

