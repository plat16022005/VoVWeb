"use client";

import { useState } from "react";
import { ManagerGiftcode, MOCK_GIFTCODES } from "@/data/mockManagerData";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";

interface ManagerGiftcodesTabProps {
  onOpenCreateGiftcode: () => void;
}

export default function ManagerGiftcodesTab({
  onOpenCreateGiftcode,
}: ManagerGiftcodesTabProps) {
  const [giftcodes, setGiftcodes] = useState<ManagerGiftcode[]>(MOCK_GIFTCODES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = (id: string) => {
    soundEngine.playClick();
    setGiftcodes((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextStatus = g.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          return { ...g, status: nextStatus };
        }
        return g;
      })
    );
  };

  const filteredGiftcodes = giftcodes.filter((g) => {
    const matchSearch =
      g.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "ALL" || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã Giftcode hoặc tên sự kiện..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070919] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#f5c767] transition-colors"
          />
        </div>

        {/* Filters & Create Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              soundEngine.playClick();
              setStatusFilter(e.target.value);
            }}
            className="px-3 py-2.5 rounded-xl bg-[#070919] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-[#f5c767]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="PAUSED">Tạm dừng</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </select>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenCreateGiftcode();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#f5c767] to-[#e67e22] text-[#060814] hover:brightness-110 shadow-[0_0_15px_rgba(245,199,103,0.3)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tạo Giftcode Mới</span>
          </button>
        </div>
      </div>

      {/* Giftcode List Table */}
      <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#070919]/70 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Mã Giftcode</th>
                <th className="py-3.5 px-4">Chương Trình / Mục Đích</th>
                <th className="py-3.5 px-4">Phần Thưởng Đính Kèm</th>
                <th className="py-3.5 px-4">Đã Đổi / Giới Hạn</th>
                <th className="py-3.5 px-4">Máy Chủ</th>
                <th className="py-3.5 px-4">Thời Hạn</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredGiftcodes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy Giftcode phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredGiftcodes.map((gc) => {
                  const percent = Math.min(100, Math.round((gc.totalUses / gc.maxUses) * 100));
                  return (
                    <tr
                      key={gc.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Code Pill */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="flex items-center gap-2">
                          <span className="text-[#f5c767] tracking-wider bg-[#f5c767]/10 px-2.5 py-1 rounded-lg border border-[#f5c767]/30">
                            {gc.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(gc.code)}
                            title="Sao chép mã"
                            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            {copiedCode === gc.code ? (
                              <span className="text-[10px] text-emerald-400 font-sans">
                                ✓ Đã chép
                              </span>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Title & Desc */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-semibold text-white truncate">
                          {gc.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {gc.description}
                        </div>
                      </td>

                      {/* Rewards */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                          {gc.rewards.ruby > 0 && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
                              💎 {gc.rewards.ruby}
                            </span>
                          )}
                          {gc.rewards.destinyTicket > 0 && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[11px]">
                              🎫 {gc.rewards.destinyTicket}
                            </span>
                          )}
                          {gc.rewards.energy > 0 && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                              🧪 {gc.rewards.energy}
                            </span>
                          )}
                          {gc.rewards.specialItem && (
                            <span className="px-2 py-0.5 rounded bg-[#f5c767]/15 border border-[#f5c767]/30 text-[#f5c767] text-[11px] truncate max-w-[150px]">
                              ⭐ {gc.rewards.specialItem}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usage Progress */}
                      <td className="py-3.5 px-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
                            <span>{formatNumber(gc.totalUses)}</span>
                            <span className="text-slate-400">{formatNumber(gc.maxUses)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent > 90
                                  ? "bg-rose-500"
                                  : percent > 60
                                  ? "bg-[#f5c767]"
                                  : "bg-[#3fe9d6]"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-white/5 border border-white/10 text-slate-300">
                          {gc.serverTarget === "ALL" ? "Toàn Cụm" : gc.serverTarget}
                        </span>
                      </td>

                      {/* Expiration */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div>{gc.endDate}</div>
                        <div className="text-slate-500 text-[10px]">Từ: {gc.startDate}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {gc.status === "ACTIVE" ? (
                          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            HOẠT ĐỘNG
                          </span>
                        ) : gc.status === "PAUSED" ? (
                          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            TẠM DỪNG
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            HẾT HẠN
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(gc.id)}
                            title={gc.status === "ACTIVE" ? "Tạm dừng mã" : "Kích hoạt lại"}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                          >
                            {gc.status === "ACTIVE" ? (
                              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

