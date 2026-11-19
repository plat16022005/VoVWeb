"use client";

import { useEffect, useState, useMemo } from "react";
import {
  itemConfigService,
  type ItemActivityLog,
  type ItemLogAction,
  getItemTypeMeta,
  getItemRarityMeta,
} from "@/services/itemConfig.service";
import { soundEngine } from "@/services/audio.service";

type ActionFilter = "ALL" | ItemLogAction;

const ACTION_CONFIG: Record<
  ItemLogAction,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  }
> = {
  CREATE_ITEM: {
    label: "KHỞI TẠO VẬT PHẨM",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/30",
    dotColor: "bg-emerald-400",
  },
  UPDATE_ITEM: {
    label: "CẬP NHẬT CẤU HÌNH",
    badgeBg: "bg-[#3fe9d6]/15",
    badgeText: "text-[#3fe9d6]",
    badgeBorder: "border-[#3fe9d6]/30",
    dotColor: "bg-[#3fe9d6]",
  },
  DELETE_ITEM: {
    label: "GỠ BỎ VẬT PHẨM",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/30",
    dotColor: "bg-rose-400",
  },
  SEED_SAMPLE_ITEMS: {
    label: "KHỞI TẠO BỘ VẬT PHẨM MẪU",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/30",
    dotColor: "bg-amber-400",
  },
};

export default function ItemLogsTable() {
  const [logs, setLogs] = useState<ItemActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");

  const reloadLogs = () => {
    setLoading(true);
    itemConfigService
      .getItemLogs(200)
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
    itemConfigService
      .getItemLogs(200)
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
      created: logs.filter((l) => l.action === "CREATE_ITEM").length,
      updated: logs.filter((l) => l.action === "UPDATE_ITEM").length,
      deleted: logs.filter((l) => l.action === "DELETE_ITEM").length,
      seeded: logs.filter((l) => l.action === "SEED_SAMPLE_ITEMS").length,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const matchAction = actionFilter === "ALL" || log.action === actionFilter;
      const matchSearch =
        !q ||
        log.itemId.toLowerCase().includes(q) ||
        log.itemName.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        (log.details || "").toLowerCase().includes(q);
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
      "Mã Vật Phẩm",
      "Tên Vật Phẩm",
      "Phân Loại",
      "Phẩm Chất",
      "Chi Tiết",
      "Người Thực Hiện",
      "Vai Trò",
    ];
    const rows = filteredLogs.map((log) => {
      const actionMeta = ACTION_CONFIG[log.action] || { label: log.action };
      const typeLabel =
        log.itemType !== undefined ? getItemTypeMeta(log.itemType).label : "Hệ thống";
      const rarityLabel =
        log.rarity !== undefined ? getItemRarityMeta(log.rarity).label : "-";
      return [
        formatTimestamp(log.createdAt || log.timestamp),
        actionMeta.label,
        log.itemId,
        `"${(log.itemName || "").replace(/"/g, '""')}"`,
        typeLabel,
        rarityLabel,
        `"${(log.details || "").replace(/"/g, '""')}"`,
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
      `vov_item_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#0b102b]/80 border border-white/10">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Tổng Bản Ghi
          </p>
          <p className="text-2xl font-bold text-white font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.total}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80">
            Khởi Tạo Vật Phẩm
          </p>
          <p className="text-2xl font-bold text-emerald-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.created}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#3fe9d6]/5 border border-[#3fe9d6]/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#3fe9d6]/80">
            Cập Nhật Chỉ Số
          </p>
          <p className="text-2xl font-bold text-[#3fe9d6] font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.updated}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80">
            Đồng Bộ Mẫu
          </p>
          <p className="text-2xl font-bold text-amber-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.seeded}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80">
            Gỡ Bỏ Vật Phẩm
          </p>
          <p className="text-2xl font-bold text-rose-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.deleted}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0b102b]/80 border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "ALL", label: "Tất Cả Thao Tác" },
              { id: "CREATE_ITEM", label: "Khởi Tạo" },
              { id: "UPDATE_ITEM", label: "Cập Nhật" },
              { id: "SEED_SAMPLE_ITEMS", label: "Đồng Bộ Mẫu" },
              { id: "DELETE_ITEM", label: "Gỡ Bỏ" },
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
            placeholder="Tìm theo mã vật phẩm, tên, người thực hiện..."
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-[#060919] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#3fe9d6]/50 font-sans"
          />
          <button
            type="button"
            onClick={reloadLogs}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-all cursor-pointer"
          >
            Làm Mới
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300 transition-all cursor-pointer disabled:opacity-40"
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
              Đang tải nhật ký kiểm toán vật phẩm...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
              Chưa Có Bản Ghi Nhật Ký Vật Phẩm
            </p>
            <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
              Mọi thao tác thêm mới, chỉnh sửa chỉ số trang bị, đồng bộ mẫu hoặc xóa vật phẩm sẽ được hệ thống ghi nhận tự động tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#060919]/90 border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Hành Động</th>
                  <th className="py-3.5 px-4">Vật Phẩm Tác Động</th>
                  <th className="py-3.5 px-4">Phân Loại & Phẩm Chất</th>
                  <th className="py-3.5 px-4">Chi Tiết Kiểm Toán</th>
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
                  const typeMeta =
                    log.itemType !== undefined ? getItemTypeMeta(log.itemType) : null;
                  const rarityMeta =
                    log.rarity !== undefined ? getItemRarityMeta(log.rarity) : null;

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
                        <div className="font-bold text-white font-sans">
                          {log.itemName}
                        </div>
                        <div className="text-[11px] font-mono text-[#3fe9d6]">
                          {log.itemId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {typeMeta && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono border bg-white/5 text-slate-200 border-white/15">
                              {typeMeta.shortLabel}
                            </span>
                          )}
                          {rarityMeta && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${rarityMeta.badgeClass}`}
                            >
                              {rarityMeta.tier} • {rarityMeta.label}
                            </span>
                          )}
                          {!typeMeta && !rarityMeta && (
                            <span className="text-slate-500 font-mono text-[11px]">
                              Đa vật phẩm
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-slate-300 font-sans leading-relaxed">
                          {log.details}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-white font-sans">
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
