"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlayerDataActivityLog,
  PlayerDataLogAction,
  playerDataService,
} from "@/services/playerData.service";
import { getItemRarityMeta } from "@/services/itemConfig.service";
import { soundEngine } from "@/services/audio.service";

type ActionFilter = "ALL" | PlayerDataLogAction;

const ACTION_CONFIG: Record<
  PlayerDataLogAction,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  }
> = {
  REVOKE_INVENTORY_ITEM: {
    label: "THU HỒI MỘT PHẦN",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/35",
    dotColor: "bg-amber-400",
  },
  CLEAR_INVENTORY_ITEM: {
    label: "XÓA HẾT VẬT PHẨM",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/35",
    dotColor: "bg-rose-400",
  },
  REVOKE_EQUIPMENT: {
    label: "THU HỒI TRANG BỊ",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/35",
    dotColor: "bg-purple-400",
  },
};

export default function PlayerDataLogsTable() {
  const [logs, setLogs] = useState<PlayerDataActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");

  const reloadLogs = () => {
    setLoading(true);
    playerDataService
      .getPlayerDataLogs(200)
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    playerDataService
      .getPlayerDataLogs(200)
      .then((data) => {
        if (active) {
          setLogs(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      partialRevoke: logs.filter((l) => l.action === "REVOKE_INVENTORY_ITEM")
        .length,
      fullClear: logs.filter((l) => l.action === "CLEAR_INVENTORY_ITEM").length,
      equipRevoke: logs.filter((l) => l.action === "REVOKE_EQUIPMENT").length,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const matchAction = actionFilter === "ALL" || log.action === actionFilter;
      const matchSearch =
        !q ||
        log.targetInGameName.toLowerCase().includes(q) ||
        log.targetUsername.toLowerCase().includes(q) ||
        log.targetUid.toLowerCase().includes(q) ||
        log.itemName.toLowerCase().includes(q) ||
        log.itemId.toLowerCase().includes(q) ||
        log.serverId.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q);
      return matchAction && matchSearch;
    });
  }, [logs, searchQuery, actionFilter]);

  const formatTimestamp = (tsOrIso: number | string) => {
    if (!tsOrIso) return "N/A";
    const d = new Date(tsOrIso);
    if (Number.isNaN(d.getTime())) return String(tsOrIso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleExportCSV = () => {
    soundEngine.playClick();
    if (filteredLogs.length === 0) return;

    const headers = [
      "Thời Gian",
      "Hành Động",
      "Máy Chủ",
      "Nhân Vật",
      "Tài Khoản",
      "Vật Phẩm / Trang Bị",
      "Số Lượng Thu Hồi",
      "Số Lượng Còn Lại",
      "Lý Do Thu Hồi",
      "Người Thực Hiện",
      "Vai Trò",
    ];
    const rows = filteredLogs.map((log) => {
      const actionMeta = ACTION_CONFIG[log.action] || { label: log.action };
      return [
        formatTimestamp(log.createdAt || log.timestamp),
        actionMeta.label,
        log.serverId,
        `"${(log.targetInGameName || "").replace(/"/g, '""')}"`,
        `"${(log.targetUsername || "").replace(/"/g, '""')}"`,
        `"${(log.itemName || log.itemId).replace(/"/g, '""')}"`,
        log.revokedQuantity,
        log.remainingQuantity,
        `"${(log.reason || "").replace(/"/g, '""')}"`,
        `"${(log.performedBy || "").replace(/"/g, '""')}"`,
        log.performedByRole || "Admin",
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `vov_player_inventory_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0b102b]/80 border border-white/10">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Tổng Lượt Thu Hồi
          </p>
          <p className="text-2xl font-bold text-white font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.total}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80">
            Thu Hồi Một Phần
          </p>
          <p className="text-2xl font-bold text-amber-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.partialRevoke}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80">
            Xóa Toàn Bộ Vật Phẩm
          </p>
          <p className="text-2xl font-bold text-rose-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.fullClear}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80">
            Thu Hồi Trang Bị Động
          </p>
          <p className="text-2xl font-bold text-purple-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.equipRevoke}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0b102b]/80 border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "ALL", label: "Tất Cả" },
              { id: "REVOKE_INVENTORY_ITEM", label: "Thu Hồi Một Phần" },
              { id: "CLEAR_INVENTORY_ITEM", label: "Xóa Toàn Bộ Vật Phẩm" },
              { id: "REVOKE_EQUIPMENT", label: "Thu Hồi Trang Bị" },
            ] as { id: ActionFilter; label: string }[]
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActionFilter(btn.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                actionFilter === btn.id
                  ? "bg-[#3fe9d6]/20 text-[#3fe9d6] border-[#3fe9d6]/40"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên nhân vật, vật phẩm, máy chủ, lý do..."
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-[#060919] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#3fe9d6] font-sans"
          />
          <button
            type="button"
            onClick={reloadLogs}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer"
          >
            Làm Mới
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/30 text-xs font-mono font-bold text-[#3fe9d6] cursor-pointer disabled:opacity-40"
          >
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Đang tải nhật ký kiểm toán dữ liệu &amp; túi đồ người chơi...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
              Chưa Có Bản Ghi Thu Hồi Vật Phẩm Người Chơi
            </p>
            <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
              Mọi thao tác xóa hoặc thu hồi vật phẩm, trang bị trong túi đồ người chơi trên các cụm máy chủ sẽ được ghi nhận tự động tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#060919]/90 border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Hành Động</th>
                  <th className="py-3.5 px-4">Nhân Vật &amp; Máy Chủ</th>
                  <th className="py-3.5 px-4">Vật Phẩm &amp; Biến Động</th>
                  <th className="py-3.5 px-4">Lý Do &amp; Chi Tiết</th>
                  <th className="py-3.5 px-4 text-right">Người Thực Hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredLogs.map((log) => {
                  const actionMeta = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    badgeBg: "bg-slate-500/15",
                    badgeText: "text-slate-300",
                    badgeBorder: "border-slate-500/30",
                    dotColor: "bg-slate-400",
                  };
                  const rarityMeta = getItemRarityMeta(log.rarity);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {formatTimestamp(log.createdAt || log.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${actionMeta.badgeBg} ${actionMeta.badgeText} ${actionMeta.badgeBorder}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${actionMeta.dotColor}`}
                          />
                          {actionMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {log.targetInGameName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {log.targetUsername} ·{" "}
                          <span className="text-[#3fe9d6]">
                            {log.serverId.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${rarityMeta.badgeClass}`}
                          >
                            {rarityMeta.tier}
                          </span>
                          <span className="font-bold text-white">
                            {log.itemName}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-rose-300 mt-0.5">
                          Thu hồi: -{log.revokedQuantity.toLocaleString("vi-VN")}{" "}
                          <span className="text-slate-400">
                            (Trước: {log.previousQuantity.toLocaleString("vi-VN")}{" "}
                            → Còn: {log.remainingQuantity.toLocaleString("vi-VN")})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-amber-300">
                          Lý do: {log.reason}
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                          {log.details}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-white">
                          {log.performedBy}
                        </div>
                        <div className="text-[10px] font-mono uppercase text-amber-300/80">
                          {log.performedByRole || "Admin"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
