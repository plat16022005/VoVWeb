"use client";

import { useState } from "react";
import { ManagerPlayerRecord, MOCK_PLAYERS_SUPPORT } from "@/data/mockManagerData";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";

interface ManagerPlayersTabProps {
  onDirectMailToPlayer: (player: ManagerPlayerRecord) => void;
}

export default function ManagerPlayersTab({
  onDirectMailToPlayer,
}: ManagerPlayersTabProps) {
  const [players, setPlayers] = useState<ManagerPlayerRecord[]>(MOCK_PLAYERS_SUPPORT);
  const [searchTerm, setSearchTerm] = useState("");
  const [serverFilter, setServerFilter] = useState("ALL");
  const [inspectingPlayer, setInspectingPlayer] = useState<ManagerPlayerRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUnstuck = (name: string) => {
    soundEngine.playClick();
    showToast(`Đã reset vị trí và giải kẹt ải thành công cho Chỉ Huy ${name}!`);
  };

  const handleWarn = (name: string) => {
    soundEngine.playClick();
    showToast(`Đã gửi thông điệp cảnh báo vi phạm chuẩn mực cộng đồng đến ${name}!`);
  };

  const filteredPlayers = players.filter((p) => {
    const matchSearch =
      p.commanderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.uid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchServer = serverFilter === "ALL" || p.server.includes(serverFilter);
    return matchSearch && matchServer;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-[0_10px_30px_rgba(16,185,129,0.4)] flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Server Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
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
            placeholder="Tra cứu theo UID (usr_...) hoặc Tên Chỉ Huy..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070919] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={serverFilter}
            onChange={(e) => {
              soundEngine.playClick();
              setServerFilter(e.target.value);
            }}
            className="px-3 py-2.5 rounded-xl bg-[#070919] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-emerald-400"
          >
            <option value="ALL">Tất cả máy chủ</option>
            <option value="S1">S1 - Veyra Khởi Nguyên</option>
            <option value="S2">S2 - Băng Phong Lãnh Địa</option>
          </select>
        </div>
      </div>

      {/* Players Table */}
      <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#070919]/70 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Chỉ Huy (Player)</th>
                <th className="py-3.5 px-4">Máy Chủ</th>
                <th className="py-3.5 px-4">Cấp & VIP</th>
                <th className="py-3.5 px-4">Lực Chiến</th>
                <th className="py-3.5 px-4">Số Dư Ruby</th>
                <th className="py-3.5 px-4">Tướng Đại Diện</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Can Thiệp Vận Hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy Chỉ Huy nào khớp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr
                    key={player.uid}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Name & UID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-base shadow-[0_0_8px_rgba(63,233,214,0.3)]">
                          {player.valkyriaAvatar}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {player.commanderName}
                            {player.vipTier >= 5 && (
                              <span className="text-[9px] font-mono px-1 rounded bg-[#f5c767]/20 text-[#f5c767] border border-[#f5c767]/40">
                                VIP{player.vipTier}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            UID: {player.uid} • {player.lastLogin}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Server */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {player.server}
                    </td>

                    {/* Level & VIP */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-white font-semibold">Lv.{player.level}</span>
                      <span className="text-slate-400 ml-1.5">(VIP {player.vipTier})</span>
                    </td>

                    {/* Combat Power */}
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      ⚔️ {formatNumber(player.combatPower)}
                    </td>

                    {/* Ruby */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#f5c767]">
                      💎 {formatNumber(player.rubyBalance)}
                    </td>

                    {/* Main Valkyria */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {player.mainValkyria}
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      {player.accountStatus === "NORMAL" ? (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          BÌNH THƯỜNG
                        </span>
                      ) : player.accountStatus === "WARNING" ? (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          CẢNH BÁO ({player.reportCount} report)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          HẠN CHẾ
                        </span>
                      )}
                    </td>

                    {/* Operations Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Send Mail to this player */}
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            onDirectMailToPlayer(player);
                          }}
                          title="Gửi thư đền bù / quà riêng cho Chỉ Huy này"
                          className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 text-[11px] font-semibold"
                        >
                          ✉️ Gửi Quà
                        </button>

                        {/* Unstuck */}
                        <button
                          onClick={() => handleUnstuck(player.commanderName)}
                          title="Giải phóng kẹt ải / Reset tọa độ về Thánh Địa"
                          className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 text-[11px]"
                        >
                          Giải Kẹt
                        </button>

                        {/* Warn */}
                        <button
                          onClick={() => handleWarn(player.commanderName)}
                          title="Gửi thông báo cảnh cáo vi phạm quy tắc"
                          className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 text-[11px]"
                        >
                          Cảnh Cáo
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

