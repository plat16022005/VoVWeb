import type { Metadata } from "next";
import EventPlayerArenaView from "@/components/events/EventPlayerArenaView";

export const metadata: Metadata = {
  title: "Sự Kiện & Minigame Veyra — Valkyria of Veyra",
  description:
    "Trải nghiệm sự kiện Minigame Unity WebGL tích hợp trực tiếp và đồng bộ phần thưởng về tài khoản Chỉ Huy.",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventPlayerArenaView initialEventId={eventId} />;
}
