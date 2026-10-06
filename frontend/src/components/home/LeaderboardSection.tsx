"use client";

import { soundEngine } from "@/services/audio.service";
import { LeaderboardEntry } from "@/data/leaderboard";

interface LeaderboardSectionProps {
  players: LeaderboardEntry[];
  onOpenPlayModal: () => void;
}

export default function LeaderboardSection({
  players,
  onOpenPlayModal,
}: LeaderboardSectionProps) {
  return (
    <section
      id="leaderboard"
      className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#04050d] via-[#080d24] to-[#04050d] border-t border-b border-[#f5c767]/15 flex justify-center"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)] mb-2">
            <span className="hsr-diamond" /> BẢNG CHIẾN TÍCH <span className="hsr-diamond" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)]">
            BẢNG XẾP HẠNG <span className="text-gold-gradient">CHỈ HUY VEYRA</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            Tôn vinh những Chỉ Huy dũng cảm nhất đã cùng các Valkyria vượt qua mọi thử thách trên khắp lục địa Veyra.
          </p>
        </div>

        {/* Leaderboard Table Card */}
        <div className="hsr-card overflow-hidden max-w-4xl mx-auto w-full bg-[#0a0d26]/90 border-[#f5c767]/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#12163b] text-xs uppercase font-[family-name:var(--font-rajdhani)] text-[#f5c767] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-4 px-6 text-center w-16">Hạng</th>
                  <th className="py-4 px-6">Chỉ Huy</th>
                  <th className="py-4 px-6">Cấp Độ</th>
                  <th className="py-4 px-6">Valkyria Tiên Phong</th>
                  <th className="py-4 px-6">Tiến Độ Veyra</th>
                  <th className="py-4 px-6 text-right">Khu Vực</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((player) => (
                  <tr
                    key={player.rank}
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => soundEngine.playClick()}
                  >
                    {/* Rank badge */}
                    <td className="py-4 px-6 text-center font-bold font-mono">
                      {player.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-black font-extrabold shadow-[0_0_10px_#fbbf24]">
                          1
                        </span>
                      ) : player.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black font-extrabold shadow-[0_0_10px_#cbd5e1]">
                          2
                        </span>
                      ) : player.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-extrabold shadow-[0_0_10px_#b45309]">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400">#{player.rank}</span>
                      )}
                    </td>

                    {/* Username */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#3fe9d6] flex items-center justify-center text-xs font-bold text-white shadow">
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-[#f5c767] transition-colors">
                            {player.username}
                          </div>
                          <div className="text-[10px] text-slate-500">Huy Hiệu Tinh Cầu Cấp 5</div>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="py-4 px-6 font-mono font-bold text-[#f5c767]">
                      Lv. {player.level}
                    </td>

                    {/* Path */}
                    <td className="py-4 px-6 text-slate-300 text-xs font-[family-name:var(--font-rajdhani)] uppercase">
                      {player.path}
                    </td>

                    {/* Progress bar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#12163b] rounded-full overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-[#f5c767] to-[#3fe9d6]"
                            style={{ width: player.progress }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-400">{player.progress}</span>
                      </div>
                    </td>

                    {/* Server */}
                    <td className="py-4 px-6 text-right font-mono text-xs text-slate-400">
                      {player.server}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Join CTA */}
          <div className="p-4 bg-[#0e1338] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Bạn muốn ghi tên mình lên Bảng Chiến Tích? Hãy bước vào vùng đất Veyra ngay hôm nay!
            </span>
            <button
              onClick={onOpenPlayModal}
              className="hsr-btn-gold py-1.5 px-4 text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              <span>THAM GIA TRANH HẠNG</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
