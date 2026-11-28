"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PlayerFullServerDetailResponse,
  PlayerServerInfo,
  PlayerShardSummaryItem,
  playerDataService,
} from "@/services/playerData.service";
import { soundEngine } from "@/services/audio.service";
import PlayerActivityLogsPanel from "./PlayerActivityLogsPanel";
import PlayerServerDetailModal from "./PlayerServerDetailModal";

interface PlayerActivityLogsManagerProps {
  canViewPlayerDetail: boolean;
  canRevoke: boolean;
  onNotify: (message: string) => void;
}

export default function PlayerActivityLogsManager({
  canViewPlayerDetail,
  canRevoke,
  onNotify,
}: PlayerActivityLogsManagerProps) {
  const [servers, setServers] = useState<PlayerServerInfo[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [players, setPlayers] = useState<PlayerShardSummaryItem[]>([]);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string>("all");
  const [playerFilterText, setPlayerFilterText] = useState<string>("");

  const [loadingServers, setLoadingServers] = useState<boolean>(true);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(false);
  const [inspectingDetail, setInspectingDetail] =
    useState<PlayerFullServerDetailResponse | null>(null);
  const [openingDetail, setOpeningDetail] = useState<boolean>(false);

  const loadPlayersOnServer = useCallback(async (serverId: string) => {
    if (!serverId) return;
    setLoadingPlayers(true);
    try {
      const list = await playerDataService.listPlayersByServer(
        serverId,
        "",
        false
      );
      setPlayers(list);
    } catch {
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

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
          void loadPlayersOnServer(firstServer);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingServers(false);
      });
    return () => {
      active = false;
    };
  }, [loadPlayersOnServer]);

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerUid || selectedPlayerUid === "all") return null;
    return players.find((p) => p.uid === selectedPlayerUid) || null;
  }, [players, selectedPlayerUid]);

  const filteredPlayersForSelect = useMemo(() => {
    const q = playerFilterText.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.inGameName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.playerCode.toLowerCase().includes(q) ||
        p.uid.toLowerCase().includes(q)
    );
  }, [players, playerFilterText]);

  const handleSelectServer = (serverId: string) => {
    soundEngine.playClick();
    setSelectedServerId(serverId);
    setSelectedPlayerUid("all");
    void loadPlayersOnServer(serverId);
  };

  const handleOpenSelectedPlayerModal = async () => {
    if (
      !selectedServerId ||
      !selectedPlayerUid ||
      selectedPlayerUid === "all" ||
      !canViewPlayerDetail
    ) {
      return;
    }
    soundEngine.playClick();
    setOpeningDetail(true);
    try {
      const detail = await playerDataService.getPlayerFullDetail(
        selectedServerId,
        selectedPlayerUid
      );
      setInspectingDetail(detail);
    } catch (err: unknown) {
      onNotify(
        err instanceof Error
          ? err.message
          : "Không thể mở hồ sơ chi tiết của người chơi."
      );
    } finally {
      setOpeningDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Thanh chọn Cụm Máy Chủ & Chọn Người Chơi Cần Đối Soát */}
      <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide">
              Tra Cứu Nhật Ký Hoạt Động &amp; Biến Động Tài Sản Người Chơi
            </h2>
            <p className="text-xs text-slate-400">
              Đối soát lịch sử hành động trong game theo từng cụm máy chủ: triệu hồi Gacha, vượt ải chiến dịch, nâng cấp tướng, cường hóa/phân giải trang bị, dùng vật phẩm, nhận thư và nhập Giftcode.
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
          </div>
        </div>

        {/* Bộ chọn Nhân vật trên Cụm máy chủ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Lọc nhanh danh sách nhân vật trên cụm{" "}
              {selectedServerId.toUpperCase()}:
            </label>
            <input
              type="text"
              value={playerFilterText}
              onChange={(e) => setPlayerFilterText(e.target.value)}
              placeholder="Gõ tên nhân vật, tài khoản, #Mã ID hoặc UID để lọc danh sách chọn..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#060814] border border-white/10 focus:border-[#3fe9d6] text-xs font-mono text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="lg:col-span-5">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Phạm vi người chơi cần tra cứu nhật ký ({players.length} nhân vật):
            </label>
            <select
              value={selectedPlayerUid}
              disabled={loadingPlayers}
              onChange={(e) => {
                soundEngine.playClick();
                setSelectedPlayerUid(e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-[#060814] border border-white/10 focus:border-[#3fe9d6] text-xs font-mono text-white outline-none cursor-pointer"
            >
              <option value="all">
                🌐 Toàn Bộ Người Chơi Trên Cụm Máy Chủ (Dòng thời gian tổng hợp)
              </option>
              {filteredPlayersForSelect.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.inGameName} (Lv.{p.level}) — {p.username}
                  {p.playerCode ? ` #${p.playerCode}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end h-full pt-4 lg:pt-5">
            {selectedPlayerUid !== "all" ? (
              <div className="flex items-center gap-2 w-full">
                {canViewPlayerDetail && (
                  <button
                    type="button"
                    disabled={openingDetail}
                    onClick={() => void handleOpenSelectedPlayerModal()}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#f5c767]/15 hover:bg-[#f5c767]/25 border border-[#f5c767]/40 text-[#f5c767] text-xs font-mono font-bold cursor-pointer truncate"
                  >
                    {openingDetail ? "Đang mở..." : "Mở Túi Đồ"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedPlayerUid("all");
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer shrink-0"
                >
                  Xem Tất Cả
                </button>
              </div>
            ) : (
              <div className="w-full px-3 py-2 rounded-xl bg-[#060814] border border-white/10 text-[11px] font-mono text-slate-400 text-center">
                Đang xem toàn cụm
              </div>
            )}
          </div>
        </div>

        {/* Thẻ tóm tắt người chơi đang chọn (nếu đang lọc 1 người chơi cụ thể) */}
        {selectedPlayer && (
          <div className="p-3.5 rounded-xl bg-[#060814] border border-[#3fe9d6]/35 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/15 text-[#3fe9d6] font-bold">
                Đang lọc nhân vật: {selectedPlayer.inGameName} (Lv.
                {selectedPlayer.level})
              </span>
              <span className="text-slate-300">
                Tài khoản: <strong>{selectedPlayer.username}</strong>
                {selectedPlayer.playerCode
                  ? ` (#${selectedPlayer.playerCode})`
                  : ""}
              </span>
              <span className="text-[#f5c767]">
                Vàng: {selectedPlayer.gold.toLocaleString("vi-VN")}
              </span>
              <span className="text-[#3fe9d6]">
                Ngọc: {selectedPlayer.gems.toLocaleString("vi-VN")}
              </span>
              <span className="text-emerald-300">
                Thể lực: {selectedPlayer.energy}/{selectedPlayer.maxEnergy}
              </span>
            </div>
            <span className="text-slate-500">UID: {selectedPlayer.uid}</span>
          </div>
        )}
      </div>

      {/* 2. Bảng dòng thời gian Nhật Ký Hoạt Động */}
      {selectedServerId && (
        <PlayerActivityLogsPanel
          serverId={selectedServerId}
          targetUid={selectedPlayerUid}
          targetInGameName={selectedPlayer?.inGameName}
          showPlayerColumn={selectedPlayerUid === "all"}
          onSelectPlayerUid={(uid) => setSelectedPlayerUid(uid)}
        />
      )}

      {/* 3. Modal Hồ Sơ Chi Tiết & Túi Đồ (Khi bấm "Mở Túi Đồ") */}
      {inspectingDetail && (
        <PlayerServerDetailModal
          detail={inspectingDetail}
          canRevoke={canRevoke}
          onClose={() => setInspectingDetail(null)}
          onUpdated={(nextDetail, toastMsg) => {
            setInspectingDetail(nextDetail);
            onNotify(toastMsg);
          }}
        />
      )}
    </div>
  );
}
