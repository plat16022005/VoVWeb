import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Quản Lý Mã Quà Tặng (Giftcode) — Valkyria of Veyra",
  description:
    "Tạo, phân loại theo chiến dịch và vận hành mã quà tặng Giftcode trong game Valkyria of Veyra.",
};

export default function ManagerEventsGiftcodesPage() {
  return (
    <ManagerPortalView initialTab="events" initialEventSubTab="giftcodes" />
  );
}
