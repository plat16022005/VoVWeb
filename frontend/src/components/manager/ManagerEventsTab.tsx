"use client";

import { useState } from "react";
import { ManagerEvent, MOCK_EVENTS } from "@/data/mockManagerData";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";

export default function ManagerEventsTab() {
  const [events, setEvents] = useState<ManagerEvent[]>(MOCK_EVENTS);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const filteredEvents = events.filter((e) => {
    if (filterCategory === "ALL") return true;
    return e.category === filterCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "ALL", label: "Tất Cả Sự Kiện" },
            { id: "GACHA_BANNER", label: "Banner Triệu Hồi (Gacha)" },
            { id: "LOGIN_REWARD", label: "Điểm Danh / Quà Tân Thủ" },
            { id: "LEADERBOARD_RACE", label: "Đua Top Chiến Tích" },
            { id: "WORLD_BOSS", label: "Boss Thế Giới" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundEngine.playClick();
                setFilterCategory(cat.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterCategory === cat.id
                  ? "bg-gradient-to-r from-[#f5c767] to-[#e67e22] text-[#060814] shadow-[0_0_12px_rgba(245,199,103,0.3)]"
                  : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-400">
          Tổng cộng: <strong className="text-white">{filteredEvents.length}</strong> chiến dịch
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="p-6 rounded-2xl bg-[#090d24]/90 border border-white/10 hover:border-[#f5c767]/40 transition-all duration-300 flex flex-col justify-between group shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#9b51e0]/10 via-[#3fe9d6]/5 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform" />

            <div className="relative z-10">
              {/* Header Badges */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/30">
                  {event.highlightTag}
                </span>

                <div className="flex items-center gap-2">
                  {event.status === "ONGOING" ? (
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ĐANG DIỄN RA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      SẮP MỞ
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Featured Valkyria */}
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide group-hover:text-[#f5c767] transition-colors mb-1">
                {event.name}
              </h3>

              {event.featuredValkyria && (
                <div className="text-xs font-semibold text-[#3fe9d6] flex items-center gap-1.5 mb-2">
                  <span>★</span>
                  <span>Nhân vật trọng tâm: {event.featuredValkyria}</span>
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {event.description}
              </p>
            </div>

            {/* Bottom Meta & Participant Count */}
            <div className="pt-4 border-t border-white/10 relative z-10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Thời gian:</span>
                <span className="text-slate-200">
                  {event.startDate} → {event.endDate}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Chỉ Huy tham gia:</span>
                <span className="text-[#3fe9d6] font-bold">
                  {formatNumber(event.participants)} người
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => soundEngine.playClick()}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-200 hover:text-white transition-all text-center"
                >
                  Điều Chỉnh Tỉ Lệ / Lịch
                </button>
                <button
                  onClick={() => soundEngine.playClick()}
                  className="px-3 py-2 rounded-xl bg-[#3fe9d6]/10 border border-[#3fe9d6]/30 text-xs font-medium text-[#3fe9d6] hover:bg-[#3fe9d6]/20 transition-all"
                  title="Đẩy thông báo ingame về sự kiện này"
                >
                  Gửi Thông Báo
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

