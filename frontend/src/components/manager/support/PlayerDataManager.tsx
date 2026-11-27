"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PlayerFullServerDetailResponse,
  PlayerServerInfo,
  PlayerShardSummaryItem,
  formatCompactCurrency,
  playerDataService,
} from "@/services/playerData.service";
import { soundEngine } from "@/services/audio.service";
import PlayerServerDetailModal from "./PlayerServerDetailModal";

interface PlayerDataManagerProps {
  canRevoke: boolean;
  onNotify: (message: string) => void;
}

export default function PlayerDataManager({
  canRevoke,
  onNotify,
}: PlayerDataManagerProps) {
  const [servers, setServers] = useState<PlayerServerInfo[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [players, setPlayers] = useState<PlayerShardSummaryItem[]>([]);
  const [loadingServers, setLoadingServers] = useState<boolean>(true);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [includeWithoutCharacter, setIncludeWithoutCharacter] =
    useState<boolean>(false);

  // Chi tiết 1 người chơi
  const [inspectingUid, setInspectingUid] = useState<string | null>(null);
  const [playerDetail, setPlayerDetail] =
    useState<PlayerFullServerDetailResponse | null>(null);

  const loadPlayersForServer = useCallback(
    async (serverId: string, includeAll: boolean) => {
      if (!serverId) return;
      setLoadingPlayers(true);
      setErrorMsg(null);
      try {
        const list = await playerDataService.listPlayersByServer(
          serverId,
          "",
          includeAll
        );
        setPlayers(list);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách người chơi trên cụm máy chủ này."
        );
      } finally {
        setLoadingPlayers(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    setLoadingServers(true);
    playerDataService
      .getServers()
      .then((srvList) => {
        if (!active) return;
        setServers(srvList);
        const firstServer = srvList[0]?.ServerId || "";
        setSelectedServerId(firstServer);
        if (firstServer) {
          void loadPlayersForServer(firstServer, false);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách cụm máy chủ."
        );
      })
      .finally(() => {
        if (active) setLoadingServers(false);
      });

    return () => {
      active = false;
    };
  }, [loadPlayersForServer]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.inGameName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.playerCode.toLowerCase().includes(q) ||
        p.uid.toLowerCase().includes(q)
    );
  }, [players, searchQuery]);

  const stats = useMemo(() => {
    const activeChars = players.filter((p) => p.hasCharacterInServer);
    const maxLevel = activeChars.reduce(
      (max, p) => (p.level > max ? p.level : max),
      0
    );
    const maxCp = activeChars.reduce(
      (max, p) => (p.totalCombatPower > max ? p.totalCombatPower : max),
      0
    );
    const totalGold = activeChars.reduce((sum, p) => sum + p.gold, 0);
    const totalGems = activeChars.reduce((sum, p) => sum + p.gems, 0);
    return {
      totalCharacters: activeChars.length,
      maxLevel,
      maxCp,
      totalGold,
      totalGems,
    };
  }, [players]);

  const handleSelectServer = (serverId: string) => {
    soundEngine.playClick();
    setSelectedServerId(serverId);
    void loadPlayersForServer(serverId, includeWithoutCharacter);
  };

  const handleToggleIncludeAll = (checked: boolean) => {
    soundEngine.playClick();
    setIncludeWithoutCharacter(checked);
    if (selectedServerId) {
      void loadPlayersForServer(selectedServerId, checked);
    }
  };

  const handleInspectPlayer = async (uid: string) => {
    if (!selectedServerId) return;
    soundEngine.playClick();
    setInspectingUid(uid);
    try {
      const detail = await playerDataService.getPlayerFullDetail(
        selectedServerId,
        uid
      );
      setPlayerDetail(detail);
    } catch (err: unknown) {
      onNotify(
        err instanceof Error
          ? err.message
          : "Không thể tải hồ sơ chi tiết của người chơi."
      );
    } finally {
      setInspectingUid(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Thanh chọn Cụm Máy Chủ (Server Shard Selector) */}
      <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide">
              Tra Cứu Dữ Liệu &amp; Túi Đồ Người Chơi Theo Cụm Máy Chủ
            </h2>
            <p className="text-xs text-slate-400">
              Chọn cụm máy chủ để kiểm tra hồ sơ nhân vật, cấp độ, lực chiến, số dư tiền tệ, kho tướng, trang bị, tiến trình vượt ải và thu hồi vật phẩm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {loadingServers ? (
              <span className="text-xs font-mono text-slate-400">
                Đang nạp danh sách máy chủ...
              </span>
            ) : (
              servers.map((srv) => {
                const active = selectedServerId === srv.ServerId;
                return (
                  <button
                    key={srv.ServerId}
                    type="button"
                    onClick={() => handleSelectServer(srv.ServerId)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                      active
                        ? "bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#050814] border-[#3fe9d6] shadow-[0_0_20px_rgba(63,233,214,0.3)]"
                        : "bg-[#060814] text-slate-300 border-white/10 hover:border-[#3fe9d6]/40 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        active ? "bg-[#050814]" : "bg-emerald-400"
                      }`}
                    />
                    <span>{srv.Name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        active
                          ? "bg-black/20 text-[#050814]"
                          : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {srv.ServerId.toUpperCase()}
                    </span>
                  </button>
                );
              })
            )}

            <button
              type="button"
              disabled={!selectedServerId || loadingPlayers}
              onClick={() => {
                soundEngine.playClick();
                void loadPlayersForServer(
                  selectedServerId,
                  includeWithoutCharacter
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 cursor-pointer disabled:opacity-50"
            >
              {loadingPlayers ? "Đang tải..." : "Làm Mới"}
            </button>
          </div>
        </div>

        {/* Thẻ KPI tóm tắt của cụm máy chủ đang chọn */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#060814] border border-white/10">
            <div className="text-[11px] font-mono text-slate-400">
              Nhân Vật Trên Máy Chủ
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {stats.totalCharacters}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060814] border border-[#f5c767]/30">
            <div className="text-[11px] font-mono text-slate-400">
              Lực Chiến Cao Nhất Cụm
            </div>
            <div className="text-xl font-bold font-mono text-[#f5c767] mt-1">
              {stats.maxCp.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-normal text-slate-400">
                (Lv.{stats.maxLevel || 1})
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060814] border border-amber-500/25">
            <div className="text-[11px] font-mono text-slate-400">
              Tổng Vàng Lưu Hành
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {formatCompactCurrency(stats.totalGold)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060814] border border-[#3fe9d6]/30">
            <div className="text-[11px] font-mono text-slate-400">
              Tổng Ngọc Lưu Hành
            </div>
            <div className="text-xl font-bold font-mono text-[#3fe9d6] mt-1">
              {formatCompactCurrency(stats.totalGems)}
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm & tùy chọn */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Tên nhân vật in-game, Tên tài khoản, Email, Mã người chơi hoặc UID..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#060814] border border-white/10 focus:border-[#3fe9d6] text-xs font-mono text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={includeWithoutCharacter}
              onChange={(e) => handleToggleIncludeAll(e.target.checked)}
              className="w-4 h-4 rounded accent-[#3fe9d6]"
            />
            <span>Hiển thị cả tài khoản chưa khởi tạo nhân vật ở cụm này</span>
          </label>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs font-mono text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* 2. Bảng danh sách người chơi trên cụm máy chủ */}
      {loadingPlayers ? (
        <div className="py-16 rounded-2xl bg-[#090d24]/80 border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Đang đồng bộ danh sách nhân vật trên cụm máy chủ{" "}
            {selectedServerId.toUpperCase()}...
          </span>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="py-16 px-6 rounded-2xl bg-[#090d24]/70 border border-dashed border-white/15 text-center space-y-2">
          <h4 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
            Không Tìm Thấy Nhân Vật Trên Cụm Máy Chủ Này
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Chưa có người chơi nào khởi tạo nhân vật trên cụm máy chủ{" "}
            <strong>{selectedServerId}</strong> khớp với điều kiện tìm kiếm. Bạn có thể tích chọn &ldquo;Hiển thị cả tài khoản chưa khởi tạo nhân vật&rdquo; để tra cứu toàn bộ tài khoản.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#060814] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nhân Vật In-Game</th>
                  <th className="py-3.5 px-4">Tài Khoản Định Danh</th>
                  <th className="py-3.5 px-4">Cấp Độ &amp; Lực Chiến</th>
                  <th className="py-3.5 px-4">Số Dư Tiền Tệ &amp; Thể Lực</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlayers.map((p) => (
                  <tr
                    key={p.uid}
                    className="hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3fe9d6]/30 to-[#f5c767]/30 border border-white/15 flex items-center justify-center font-bold text-sm text-[#f5c767] shrink-0">
                          {p.inGameName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{p.inGameName}</span>
                            {p.hasCharacterInServer ? (
                              <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                                Đã Tạo Nhân Vật
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-slate-500/15 text-slate-400 border border-white/10">
                                Chưa Vào Server
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Cụm: {p.serverId.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{p.username}</span>
                        {p.playerCode && (
                          <span className="text-[11px] font-mono text-[#3fe9d6]">
                            #{p.playerCode}
                          </span>
                        )}
                        {p.isBanned && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            ĐÃ KHÓA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {p.email || `Phương thức: ${p.provider}`}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        UID: {p.uid.slice(0, 16)}...
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#3fe9d6]">
                        Lv.{p.level}{" "}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({p.exp.toLocaleString("vi-VN")} EXP)
                        </span>
                      </div>
                      <div className="font-mono font-bold text-[#f5c767] mt-0.5">
                        CP: {p.totalCombatPower.toLocaleString("vi-VN")}{" "}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({formatCompactCurrency(p.totalCombatPower)})
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-[#f5c767]">
                        Vàng: <strong>{formatCompactCurrency(p.gold)}</strong>
                      </div>
                      <div className="text-[#3fe9d6]">
                        Ngọc: <strong>{formatCompactCurrency(p.gems)}</strong>
                      </div>
                      <div className="text-emerald-300">
                        Thể lực:{" "}
                        <strong>
                          {p.energy}/{p.maxEnergy}
                        </strong>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        disabled={inspectingUid === p.uid}
                        onClick={() => void handleInspectPlayer(p.uid)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6]/20 to-[#f5c767]/20 hover:from-[#3fe9d6]/30 hover:to-[#f5c767]/30 border border-[#3fe9d6]/45 text-white text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {inspectingUid === p.uid
                          ? "Đang mở..."
                          : "Kiểm Tra Hồ Sơ & Túi Đồ"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-white/10 bg-[#060814]/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Hiển thị{" "}
              <strong className="text-[#3fe9d6]">
                {filteredPlayers.length}
              </strong>{" "}
              / {players.length} người chơi trên cụm{" "}
              <strong className="text-white">
                {selectedServerId.toUpperCase()}
              </strong>
            </span>
            <span>
              {canRevoke
                ? "Quyền hạn: Tra cứu & Thu hồi vật phẩm"
                : "Quyền hạn: Chỉ tra cứu hồ sơ & túi đồ"}
            </span>
          </div>
        </div>
      )}

      {/* 3. Modal Hồ Sơ Chi Tiết & Túi Đồ Người Chơi */}
      {playerDetail && (
        <PlayerServerDetailModal
          detail={playerDetail}
          canRevoke={canRevoke}
          onClose={() => setPlayerDetail(null)}
          onUpdated={(nextDetail, toastMsg) => {
            setPlayerDetail(nextDetail);
            setPlayers((prev) =>
              prev.map((p) =>
                p.uid === nextDetail.uid
                  ? {
                      ...p,
                      inGameName: nextDetail.profile.InGameName,
                      level: nextDetail.profile.Level,
                      exp: nextDetail.profile.Exp,
                      totalCombatPower: nextDetail.profile.TotalCombatPower,
                      gold: nextDetail.wallet.Gold,
                      gems: nextDetail.wallet.Gems,
                      energy: nextDetail.wallet.Energy,
                      maxEnergy: nextDetail.wallet.MaxEnergy,
                    }
                  : p
              )
            );
            onNotify(toastMsg);
          }}
        />
      )}
    </div>
  );
}
