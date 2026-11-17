import type { Metadata } from "next";
import ManagerPortalView from "@/components/manager/ManagerPortalView";

export const metadata: Metadata = {
  title: "Quản Lý Banner Gacha | Valkyria of Veyra",
  description:
    "Thiết lập mùa phát hành, tỷ lệ quay, Pity và pool tướng Banner Gacha cho Valkyria of Veyra.",
};

export default function ManagerGachaPage() {
  return <ManagerPortalView initialTab="gamedata" initialGameDataSubTab="gacha" />;
}

