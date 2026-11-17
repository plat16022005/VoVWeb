import type { Metadata } from "next";
import EventPlayerArenaView from "@/components/events/EventPlayerArenaView";

export const metadata: Metadata = {
  title: "Cổng Sự Kiện & Vòng Quay Veyra — Valkyria of Veyra",
  description:
    "Tham gia sự kiện Minigame Unity WebGL, hoàn thành nhiệm vụ nhận lượt quay và săn phần thưởng độc quyền Valkyria of Veyra.",
};

export default function EventsHubPage() {
  return <EventPlayerArenaView />;
}
