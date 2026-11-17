"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import StarCanvas from "@/components/common/StarCanvas";
import {
  PlayerEventState,
  PlayerSpinRecord,
  WebEventDocument,
  eventsService,
} from "@/services/events.service";
import { useAuth } from "@/services/auth.service";
import { soundEngine } from "@/services/audio.service";

interface EventPlayerArenaViewProps {
  initialEventId?: string;
}

const RARITY_STYLES: Record<
  string,
  { tag: string; accent: string; label: string }
> = {
  UR: {
    tag: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    accent: "border-l-rose-400",
    label: "Tối Thượng",
  },
  SSR: {
    tag: "bg-[#f5c767]/15 text-[#f5c767] border-[#f5c767]/45",
    accent: "border-l-[#f5c767]",
    label: "Huyền Thoại",
  },
  SR: {
    tag: "bg-purple-500/15 text-purple-300 border-purple-400/40",
    accent: "border-l-purple-400",
    label: "Sử Thi",
  },
  R: {
    tag: "bg-sky-500/15 text-sky-300 border-sky-400/35",
    accent: "border-l-sky-400",
    label: "Cơ Bản",
  },
};

function formatShortDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function EventPlayerArenaView({
  initialEventId,
}: EventPlayerArenaViewProps) {
  const currentUser = useAuth();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);

  const [eventDoc, setEventDoc] = useState<WebEventDocument | null>(null);
  const [allEvents, setAllEvents] = useState<WebEventDocument[]>([]);
  const [playerState, setPlayerState] = useState<PlayerEventState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [folioTab, setFolioTab] = useState<"missions" | "rewards" | "inventory">(
    "missions"
  );
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [spinningFallback, setSpinningFallback] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wonPopup, setWonPopup] = useState<PlayerSpinRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  const syncAuthToIframe = useCallback(
    async (ev: WebEventDocument, state?: PlayerEventState | null) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      const token = await eventsService.getOptionalAuthToken();
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

      win.postMessage(
        {
          type: "VOV_AUTH_INIT",
          eventId: ev.EventId,
          token,
          apiUrl,
          uid: currentUser?.id || "",
          username: currentUser?.username || "Chỉ Huy",
        },
        "*"
      );

      if (state) {
        win.postMessage(
          {
            type: "VOV_TICKETS_UPDATED",
            eventId: ev.EventId,
            spinTickets: state.SpinTickets,
          },
          "*"
        );
      }
    },
    [currentUser?.id, currentUser?.username]
  );

  const loadPlayerStateOnly = useCallback(
    async (ev: WebEventDocument) => {
      if (!currentUser) {
        await Promise.resolve();
        setPlayerState(null);
        await syncAuthToIframe(ev, null);
        return;
      }
      try {
        const pState = await eventsService.getPlayerEventState(ev.EventId);
        setPlayerState(pState);
        await syncAuthToIframe(ev, pState);
      } catch {
        // Ignore if guest or token not ready
      }
    },
    [currentUser, syncAuthToIframe]
  );

  const loadEventData = useCallback(
    async (targetId?: string) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        let chosen: WebEventDocument | null = null;
        const activeList = await eventsService.getPublicActiveEvents();
        setAllEvents(activeList);

        const idToLoad = targetId || initialEventId;
        if (idToLoad) {
          chosen = await eventsService.getPublicEventById(idToLoad);
        } else if (activeList.length > 0) {
          chosen = activeList[0];
        }

        setEventDoc(chosen);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Hiện không tìm thấy sự kiện hoặc sự kiện đang tạm đóng."
        );
      } finally {
        setLoading(false);
      }
    },
    [initialEventId]
  );

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  useEffect(() => {
    if (!eventDoc) return;
    let cancelled = false;
    if (!currentUser) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setPlayerState(null);
        void syncAuthToIframe(eventDoc, null);
      });
      return () => {
        cancelled = true;
      };
    }
    eventsService
      .getPlayerEventState(eventDoc.EventId)
      .then((pState) => {
        if (cancelled) return;
        setPlayerState(pState);
        void syncAuthToIframe(eventDoc, pState);
      })
      .catch(() => {
        // Ignore if token not ready
      });
    return () => {
      cancelled = true;
    };
  }, [eventDoc, currentUser, syncAuthToIframe]);

  const currentEventId = eventDoc?.EventId;
  const currentSpinTickets = playerState?.SpinTickets;
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !currentEventId || currentSpinTickets === undefined) return;
    win.postMessage(
      {
        type: "VOV_TICKETS_UPDATED",
        eventId: currentEventId,
        spinTickets: currentSpinTickets,
      },
      "*"
    );
  }, [currentEventId, currentSpinTickets]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || data.source !== "VOV_EVENT_IFRAME") return;

      if ((data.type === "IFRAME_READY" || data.type === "UNITY_READY") && eventDoc) {
        syncAuthToIframe(eventDoc, playerState);
      } else if (data.type === "PLAYER_STATE_SYNCED" && data.payload) {
        setPlayerState(data.payload as PlayerEventState);
      } else if (data.type === "MISSION_CLAIMED" && data.payload?.playerState) {
        setPlayerState(data.payload.playerState as PlayerEventState);
        soundEngine.playCelestialChime();
        showToast(
          `Đã nhận +${data.payload.addedTickets || 1} lượt tham gia từ nhiệm vụ.`
        );
      } else if (data.type === "SPIN_COMPLETED" && data.payload) {
        const { reward, playerState: nextState } = data.payload as {
          reward: PlayerSpinRecord;
          playerState: PlayerEventState;
        };
        if (nextState) setPlayerState(nextState);
        if (reward) {
          soundEngine.playCelestialChime();
          setWonPopup(reward);
          showToast(
            `Nhận thưởng thành công: ${reward.ItemName} (x${reward.Quantity})`
          );
        }
      } else if (data.type === "SPIN_ERROR") {
        const msg =
          (data.payload as { message?: string } | undefined)?.message ||
          "Không thể ghi nhận lượt chơi. Vui lòng thử lại.";
        showToast(msg);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [eventDoc, playerState, syncAuthToIframe, showToast]);

  const handleClaimMission = async (missionId: string, actionUrl?: string) => {
    if (!eventDoc) return;
    if (!currentUser) {
      showToast("Vui lòng đăng nhập tài khoản Chỉ Huy để nhận lượt tham gia.");
      return;
    }

    if (actionUrl && !playerState?.ClaimedMissions[missionId]) {
      window.open(actionUrl, "_blank");
    }

    setClaimingMissionId(missionId);
    soundEngine.playClick();
    try {
      const res = await eventsService.claimMissionReward(
        eventDoc.EventId,
        missionId
      );
      setPlayerState(res.playerState);
      syncAuthToIframe(eventDoc, res.playerState);
      soundEngine.playCelestialChime();
      showToast(`Đã cộng +${res.addedTickets} lượt tham gia sự kiện.`);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Không thể nhận thưởng nhiệm vụ."
      );
    } finally {
      setClaimingMissionId(null);
    }
  };

  const handleFallbackSpin = async () => {
    if (!eventDoc) return;
    if (!currentUser) {
      showToast("Vui lòng đăng nhập tài khoản Chỉ Huy để tham gia.");
      return;
    }
    setSpinningFallback(true);
    soundEngine.playClick();
    try {
      const res = await eventsService.recordSpinAndSaveReward(eventDoc.EventId, {
        mode: "server_random",
      });
      setPlayerState(res.playerState);
      syncAuthToIframe(eventDoc, res.playerState);
      soundEngine.playCelestialChime();
      setWonPopup(res.reward);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Không thể thực hiện lượt quay.");
    } finally {
      setSpinningFallback(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      const fsActive = Boolean(document.fullscreenElement);
      setIsFullscreen(fsActive);
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "VOV_FULLSCREEN_STATE",
          isFullscreen: fsActive,
        },
        "*"
      );
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    soundEngine.playClick();
    if (!stageWrapperRef.current) return;
    if (!document.fullscreenElement) {
      stageWrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const inventoryItems = Object.values(playerState?.Inventory || {});
  const ticketDisplay = String(playerState?.SpinTickets ?? 0).padStart(2, "0");
  const latestReward = playerState?.RecentRewards?.[0];

  return (
    <div className="relative min-h-screen w-full bg-[#04050d] text-[#eef2ff] flex flex-col selection:bg-[#f5c767]/30 selection:text-white">
      {/* Starfield + Subtle Editorial Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-35">
        <StarCanvas />
      </div>
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(245,199,103,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,199,103,0.03) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-[#090d22]/95 border-l-2 border-[#f5c767] border-t border-r border-b border-white/15 text-xs text-slate-100 shadow-2xl">
          {toastMsg}
        </div>
      )}

      {/* Minimal Editorial Masthead */}
      <header className="sticky top-0 z-30 w-full h-16 bg-[#060814]/90 backdrop-blur-xl border-b border-[#f5c767]/20">
        <div className="max-w-[1320px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/"
              onClick={() => soundEngine.playClick()}
              className="text-xs font-semibold tracking-wider uppercase text-slate-400 hover:text-[#f5c767] transition-colors shrink-0 font-[family-name:var(--font-rajdhani)]"
            >
              ← Trang Chủ
            </Link>

            <span className="h-4 w-px bg-white/15 shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="hsr-diamond shrink-0" />
                <h1 className="text-base sm:text-lg font-bold font-[family-name:var(--font-chakra-petch)] uppercase tracking-wider text-white truncate">
                  {eventDoc?.Title || "Biên Niên Sự Kiện Veyra"}
                </h1>
                {eventDoc && (
                  <span className="hidden md:inline-block text-[11px] text-slate-400 border-l border-white/15 pl-2.5">
                    {formatShortDate(eventDoc.StartTime)} — {formatShortDate(eventDoc.EndTime)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Crisp Ticket Counter & Commander Auth */}
          <div className="flex items-center gap-4 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-2.5 px-3.5 py-1.5 bg-[#0c1026] border border-[#f5c767]/40">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-[family-name:var(--font-rajdhani)]">
                    Lượt Tham Gia
                  </span>
                  <strong className="text-lg font-bold text-[#f5c767] font-[family-name:var(--font-chakra-petch)] tabular-nums">
                    {ticketDisplay}
                  </strong>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 border-l border-white/15 pl-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
                  <span className="font-medium">{currentUser.username}</span>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hsr-btn-gold py-2 px-5 text-xs"
              >
                <span>Đăng Nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Centered Container */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-6 z-10">
        {loading ? (
          <div className="hsr-card max-w-3xl mx-auto p-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#f5c767] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs tracking-wider uppercase text-slate-400 font-[family-name:var(--font-rajdhani)]">
              Đang mở cổng sự kiện...
            </span>
          </div>
        ) : errorMsg || !eventDoc ? (
          <div className="hsr-card max-w-xl mx-auto p-10 my-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
              <span className="hsr-diamond" /> THÔNG BÁO SỰ KIỆN <span className="hsr-diamond" />
            </div>
            <h2 className="text-xl font-bold font-[family-name:var(--font-chakra-petch)] uppercase text-white">
              Chưa Có Chiến Dịch Sự Kiện Đang Mở
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {errorMsg ||
                "Hiện tại chưa có sự kiện nào được mở công khai. Vui lòng quay lại sau."}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/" className="hsr-btn-glass py-2 px-5 text-xs">
                <span>Về Trang Chủ</span>
              </Link>
              {(currentUser?.role === "Admin" || currentUser?.role === "Manager") && (
                <Link href="/manager/events" className="hsr-btn-gold py-2 px-5 text-xs">
                  <span>Quản Lý Sự Kiện</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Multi-event hairline switcher */}
            {allEvents.length > 1 && (
              <div className="flex flex-wrap items-center gap-6 border-b border-white/10 pb-2.5">
                {allEvents.map((ev) => {
                  const active = ev.EventId === eventDoc.EventId;
                  return (
                    <button
                      key={ev.EventId}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        loadEventData(ev.EventId);
                      }}
                      className={`text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] pb-1 border-b-2 transition-colors cursor-pointer ${
                        active
                          ? "text-[#f5c767] border-[#f5c767]"
                          : "text-slate-400 border-transparent hover:text-white"
                      }`}
                    >
                      {ev.Title}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Theater Stage (Exact 960x600) + Tactical Folio Sidebar */}
            <div className="flex flex-col xl:flex-row items-center xl:items-stretch justify-center gap-6">
              {/* LEFT: Exact 960x600 Unity Stage Frame */}
              <div className="w-full max-w-[962px] shrink-0 flex flex-col">
                <div className="hsr-card border-[#f5c767]/30 bg-[#060916] overflow-hidden flex flex-col">
                  {/* Embedded 960x600 Game Canvas Wrapper */}
                  <div
                    ref={stageWrapperRef}
                    className={
                      isFullscreen
                        ? "fixed inset-0 w-screen h-screen bg-[#040611] z-50"
                        : "relative w-full max-w-[960px] aspect-[960/600] lg:w-[960px] lg:h-[600px] bg-[#040611] mx-auto"
                    }
                  >
                    <iframe
                      ref={iframeRef}
                      title={eventDoc.Title}
                      src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/events/public/${encodeURIComponent(eventDoc.EventId)}/play-frame?v=${eventDoc.Version}`}
                      onLoad={() => syncAuthToIframe(eventDoc, playerState)}
                      className="w-full h-full border-0 block"
                      allow="autoplay; fullscreen; gamepad"
                    />
                    {isFullscreen && (
                      <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className="fixed top-4 right-4 z-50 px-3.5 py-1.5 bg-[#060814]/85 hover:bg-[#f5c767] border border-[#f5c767]/50 text-[#f5c767] hover:text-[#060814] text-xs font-semibold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] backdrop-blur-md transition-colors cursor-pointer"
                      >
                        Thoát Toàn Màn Hình
                      </button>
                    )}
                  </div>

                  {/* Whisper-Quiet 1-Line Control Strip */}
                  <div className="px-4 py-2.5 bg-[#080b1c] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-400 truncate">
                        {latestReward ? (
                          <>
                            Gần nhất:{" "}
                            <span className="text-[#f5c767] font-semibold">
                              [{latestReward.Rarity}] {latestReward.ItemName} x{latestReward.Quantity}
                            </span>
                          </>
                        ) : (
                          eventDoc.Subtitle
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!eventDoc.UnityBuild && (
                        <button
                          type="button"
                          onClick={handleFallbackSpin}
                          disabled={spinningFallback}
                          className="px-3.5 py-1.5 bg-[#f5c767] hover:bg-[#ffda85] text-[#060814] font-bold text-xs uppercase tracking-wider font-[family-name:var(--font-rajdhani)] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {spinningFallback ? "Đang Quay..." : "Quay Thưởng (-1 Lượt)"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          soundEngine.playClick();
                          await loadPlayerStateOnly(eventDoc);
                          showToast("Đã đồng bộ lại lượt tham gia và túi quà.");
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        Đồng Bộ
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className="px-3 py-1.5 bg-[#3fe9d6]/10 hover:bg-[#3fe9d6]/20 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Toàn Màn Hình
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Tactical Campaign Folio (Missions · Rewards · Inventory) */}
              <aside className="w-full max-w-[962px] xl:w-[316px] xl:shrink-0 hsr-card bg-[#080c1f]/95 border-[#f5c767]/25 flex flex-col justify-between">
                <div className="flex flex-col h-full">
                  {/* Editorial Underline Tabs */}
                  <div className="grid grid-cols-3 border-b border-white/10 bg-[#050816]">
                    {[
                      { id: "missions" as const, label: `Nhiệm Vụ (${eventDoc.Missions.length})` },
                      { id: "rewards" as const, label: `Phần Thưởng (${eventDoc.Rewards.length})` },
                      { id: "inventory" as const, label: `Túi Đồ (${inventoryItems.length})` },
                    ].map((tab) => {
                      const active = folioTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setFolioTab(tab.id);
                          }}
                          className={`py-3 px-2 text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] border-b-2 transition-colors cursor-pointer ${
                            active
                              ? "text-[#f5c767] border-[#f5c767] bg-white/[0.03]"
                              : "text-slate-400 border-transparent hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Folio Body */}
                  <div className="flex-1 overflow-y-auto max-h-[585px] divide-y divide-white/10 custom-scrollbar">
                    {folioTab === "missions" && (
                      <>
                        {eventDoc.Missions.map((m, idx) => {
                          const claimedIso =
                            playerState?.ClaimedMissions?.[m.MissionId];
                          const isClaimed =
                            m.MissionType === "once"
                              ? Boolean(claimedIso)
                              : Boolean(
                                  claimedIso && claimedIso.startsWith(todayKey)
                                );

                          return (
                            <div
                              key={m.MissionId}
                              className={`p-4 space-y-2.5 transition-colors ${
                                isClaimed ? "opacity-60" : "hover:bg-white/[0.02]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-baseline gap-2 min-w-0">
                                  <span className="text-[11px] font-bold text-[#f5c767] font-[family-name:var(--font-chakra-petch)] shrink-0">
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                  <span className="text-xs font-semibold text-white leading-snug">
                                    {m.Title}
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-[#3fe9d6] shrink-0">
                                  +{m.TicketReward} Lượt
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                                {m.Description}
                              </p>

                              <div className="flex items-center justify-between pl-5 pt-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                  {m.MissionType === "daily" ? "Làm mới mỗi ngày" : "Một lần"}
                                </span>

                                {isClaimed ? (
                                  <span className="text-[11px] font-semibold text-emerald-400">
                                    Đã Nhận
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={claimingMissionId === m.MissionId}
                                    onClick={() =>
                                      handleClaimMission(m.MissionId, m.ActionUrl)
                                    }
                                    className="px-3 py-1 bg-[#f5c767] hover:bg-[#ffdc8a] text-[#060814] font-bold text-[11px] uppercase tracking-wider font-[family-name:var(--font-rajdhani)] transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {claimingMissionId === m.MissionId
                                      ? "Đang nhận..."
                                      : "Nhận Lượt"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {folioTab === "rewards" && (
                      <>
                        {eventDoc.Rewards.map((item) => {
                          const style =
                            RARITY_STYLES[item.Rarity] || RARITY_STYLES.SR;
                          return (
                            <div
                              key={item.ItemId}
                              className={`p-3.5 border-l-2 ${style.accent} flex items-center justify-between gap-3 hover:bg-white/[0.02]`}
                            >
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-bold border ${style.tag}`}
                                  >
                                    {item.Rarity}
                                  </span>
                                  <span className="text-xs font-semibold text-white truncate">
                                    {item.ItemName}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Số lượng: x{item.Quantity}
                                </div>
                              </div>
                              <div className="text-xs font-semibold text-[#f5c767] tabular-nums shrink-0">
                                {item.Probability}%
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {folioTab === "inventory" && (
                      <div className="p-4 space-y-5">
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-[family-name:var(--font-rajdhani)]">
                            Vật Phẩm Đã Sở Hữu
                          </div>
                          {inventoryItems.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-white/10">
                              Chưa có vật phẩm nào trong túi đồ sự kiện.
                            </div>
                          ) : (
                            <div className="divide-y divide-white/10 border border-white/10 bg-[#050815]">
                              {inventoryItems.map((entry) => {
                                const style =
                                  RARITY_STYLES[entry.Rarity] || RARITY_STYLES.SR;
                                return (
                                  <div
                                    key={entry.ItemId}
                                    className="px-3 py-2.5 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className={`px-1.5 py-0.5 text-[10px] font-bold border ${style.tag}`}
                                      >
                                        {entry.Rarity}
                                      </span>
                                      <span className="text-xs font-medium text-white truncate">
                                        {entry.ItemName}
                                      </span>
                                    </div>
                                    <span className="text-xs font-bold text-[#f5c767] tabular-nums shrink-0">
                                      x{entry.Quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 font-[family-name:var(--font-rajdhani)]">
                            <span>Lịch Sử Gần Đây</span>
                            <span className="text-[#3fe9d6]">
                              {playerState?.TotalSpins ?? 0} lượt
                            </span>
                          </div>
                          {!playerState?.RecentRewards ||
                          playerState.RecentRewards.length === 0 ? (
                            <div className="text-xs text-slate-500">
                              Chưa ghi nhận lượt tham gia nào.
                            </div>
                          ) : (
                            <div className="divide-y divide-white/5">
                              {playerState.RecentRewards.map((rec) => (
                                <div
                                  key={rec.SpinId}
                                  className="py-2 flex items-center justify-between text-xs gap-2"
                                >
                                  <div className="truncate">
                                    <span className="text-[#f5c767] font-semibold">
                                      [{rec.Rarity}]
                                    </span>{" "}
                                    <span className="text-slate-200">
                                      {rec.ItemName}
                                    </span>{" "}
                                    <span className="text-slate-400">
                                      x{rec.Quantity}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                                    {new Date(rec.WonAt).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* Reward Celebration Overlay */}
      {wonPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="hsr-card w-full max-w-md bg-[#080c1f] border-[#f5c767]/60 p-7 text-center space-y-5 shadow-[0_0_60px_rgba(245,199,103,0.2)]">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#3fe9d6] uppercase font-[family-name:var(--font-rajdhani)]">
              <span className="hsr-diamond" /> ĐÃ ĐỒNG BỘ TÚI ĐỒ <span className="hsr-diamond" />
            </div>

            <h3 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-white uppercase tracking-wide">
              NHẬN THƯỞNG THÀNH CÔNG
            </h3>

            <div className="p-5 bg-[#050816] border border-[#f5c767]/35 space-y-2">
              <div className="text-[11px] font-bold tracking-widest uppercase text-[#f5c767]">
                Phẩm Chất {wonPopup.Rarity}
              </div>
              <div className="text-lg font-bold text-white">
                {wonPopup.ItemName}
              </div>
              <div className="text-xs text-slate-400">
                Số lượng: <strong className="text-[#3fe9d6]">x{wonPopup.Quantity}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setWonPopup(null);
              }}
              className="hsr-btn-gold w-full py-3 text-xs cursor-pointer"
            >
              <span>Xác Nhận</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
