"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { gachaService, GachaActivityLog, GachaLogAction } from "@/services/gacha.service";
import { soundEngine } from "@/services/audio.service";

type ActionFilter =
  | "ALL"
  | "SEASON_WRITE"
  | "SEASON_STATUS"
  | "BANNER_WRITE"
  | "BANNER_TOGGLE"
  | "DELETE";

const ACTION_BADGE_MAP: Record<
  GachaLogAction,
  { label: string; badgeClass: string; dotClass: string }
> = {
  CREATE_SEASON: {
    label: "Tạo Mùa Mới",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  CLONE_SEASON: {
    label: "Nhân Bản Mùa",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    dotClass: "bg-sky-400",
  },
  UPDATE_SEASON: {
    label: "Cập Nhật Mùa",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    dotClass: "bg-cyan-400",
  },
  ACTIVATE_SEASON: {
    label: "Kích Hoạt Mùa",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/35",
    dotClass: "bg-amber-400",
  },
  DEACTIVATE_SEASON: {
    label: "Tạm Đóng Mùa",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    dotClass: "bg-orange-400",
  },
  DELETE_SEASON: {
    label: "Xóa Mùa Nháp",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dotClass: "bg-rose-400",
  },
  CREATE_BANNER: {
    label: "Thêm Banner",
    badgeClass: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    dotClass: "bg-teal-400",
  },
  UPDATE_BANNER: {
    label: "Sửa Banner",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    dotClass: "bg-indigo-400",
  },
  TOGGLE_BANNER: {
    label: "Bật / Tắt Banner",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    dotClass: "bg-purple-400",
  },
  DELETE_BANNER: {
    label: "Xóa Banner",
    badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
    dotClass: "bg-red-400",
  },
};

function matchesFilter(action: GachaLogAction, filter: ActionFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "SEASON_WRITE") {
    return action === "CREATE_SEASON" || action === "CLONE_SEASON" || action === "UPDATE_SEASON";
  }
  if (filter === "SEASON_STATUS") {
    return action === "ACTIVATE_SEASON" || action === "DEACTIVATE_SEASON";
  }
  if (filter === "BANNER_WRITE") {
    return action === "CREATE_BANNER" || action === "UPDATE_BANNER";
  }
  if (filter === "BANNER_TOGGLE") {
    return action === "TOGGLE_BANNER";
  }
  if (filter === "DELETE") {
    return action === "DELETE_SEASON" || action === "DELETE_BANNER";
  }
  return true;
}

function formatLogTimestamp(log: GachaActivityLog): { date: string; time: string } {
  const ts = log.timestamp || (log.createdAt ? new Date(log.createdAt).getTime() : 0);
  if (!ts || Number.isNaN(ts)) {
    return { date: "—", time: "—" };
  }
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString("vi-VN"),
    time: d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

function escapeCsvCell(value: string | number | undefined): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function GachaLogsTable() {
  const [logs, setLogs] = useState<GachaActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gachaService.getGachaLogs(200);
      setLogs(data);
    } catch (err) {
      console.error("Không thể tải nhật ký Banner Gacha:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    gachaService
      .getGachaLogs(200)
      .then((data) => {
        if (active) setLogs(data);
      })
      .catch((err) => {
        console.error("Không thể tải nhật ký Banner Gacha:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    let seasonWrites = 0;
    let seasonStatuses = 0;
    let bannerWrites = 0;
    let bannerToggles = 0;
    let deletes = 0;

    logs.forEach((l) => {
      if (l.action === "CREATE_SEASON" || l.action === "CLONE_SEASON" || l.action === "UPDATE_SEASON") {
        seasonWrites += 1;
      } else if (l.action === "ACTIVATE_SEASON" || l.action === "DEACTIVATE_SEASON") {
        seasonStatuses += 1;
      } else if (l.action === "CREATE_BANNER" || l.action === "UPDATE_BANNER") {
        bannerWrites += 1;
      } else if (l.action === "TOGGLE_BANNER") {
        bannerToggles += 1;
      } else if (l.action === "DELETE_SEASON" || l.action === "DELETE_BANNER") {
        deletes += 1;
      }
    });

    return {
      total: logs.length,
      seasonWrites,
      seasonStatuses,
      bannerWrites,
      bannerToggles,
      deletes,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return logs.filter((l) => {
      if (!matchesFilter(l.action, actionFilter)) return false;
      if (!q) return true;
      return (
        l.actionTitle.toLowerCase().includes(q) ||
        l.seasonId.toLowerCase().includes(q) ||
        l.seasonName.toLowerCase().includes(q) ||
        (l.bannerId && l.bannerId.toLowerCase().includes(q)) ||
        (l.bannerTitle && l.bannerTitle.toLowerCase().includes(q)) ||
        l.details.toLowerCase().includes(q) ||
        l.performedBy.toLowerCase().includes(q)
      );
    });
  }, [logs, actionFilter, searchTerm]);

  const handleCopyCode = async (value: string) => {
    soundEngine.playClick();
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(value);
      setTimeout(() => setCopiedId((curr) => (curr === value ? null : curr)), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleExportCsv = () => {
    soundEngine.playClick();
    const headers = [
      "Thoi Gian",
      "Ma Hanh Dong",
      "Tieu De",
      "Ma Mua",
      "Ten Mua",
      "Ma Banner",
      "Ten Banner",
      "Loai Banner",
      "Phien Ban",
      "Chi Tiet",
      "Nguoi Thuc Hien",
      "Vai Tro",
    ];
    const rows = filteredLogs.map((l) => {
      const formatted = formatLogTimestamp(l);
      return [
        `${formatted.date} ${formatted.time}`,
        l.action,
        l.actionTitle,
        l.seasonId,
        l.seasonName,
        l.bannerId || "",
        l.bannerTitle || "",
        l.bannerType || "",
        l.version ?? "",
        l.details,
        l.performedBy,
        l.performedByRole || "",
      ]
        .map(escapeCsvCell)
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers.map(escapeCsvCell).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vov_gacha_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filterButtons: { id: ActionFilter; label: string }[] = [
    { id: "ALL", label: "Tất cả" },
    { id: "SEASON_WRITE", label: "Tạo / Sửa Mùa" },
    { id: "SEASON_STATUS", label: "Kích Hoạt / Đóng Mùa" },
    { id: "BANNER_WRITE", label: "Thêm / Sửa Banner" },
    { id: "BANNER_TOGGLE", label: "Bật / Tắt Banner" },
    { id: "DELETE", label: "Xóa Dữ Liệu" },
  ];

  return (
    <div className="space-y-5 font-[family-name:var(--font-inter)] animate-fade-in">
      {/* 1. HEADER & ACTION CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090d24]/80 border border-[#f5c767]/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5c767]" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
              Nhật Ký Kiểm Toán Hệ Thống Banner Gacha
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Theo dõi đầy đủ thao tác khởi tạo mùa phát hành, kích hoạt, chỉnh sửa tỷ lệ quay, Pity và pool tướng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              loadLogs();
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
          >
            Làm mới
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-[#f5c767]/15 hover:bg-[#f5c767]/25 text-[#f5c767] border border-[#f5c767]/35 disabled:opacity-40 text-xs font-mono font-bold transition-all cursor-pointer"
          >
            Xuất CSV ({filteredLogs.length})
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STATS CARDS (6 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#090d24]/80 border border-white/10">
          <div className="text-[11px] font-mono text-slate-400">Tổng Thao Tác</div>
          <div className="text-2xl font-black text-white mt-1 font-[family-name:var(--font-rajdhani)]">
            {stats.total}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090d24]/80 border border-emerald-500/20">
          <div className="text-[11px] font-mono text-emerald-300/80">Tạo / Sửa Mùa</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-[family-name:var(--font-rajdhani)]">
            {stats.seasonWrites}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090d24]/80 border border-amber-500/20">
          <div className="text-[11px] font-mono text-amber-300/80">Kích Hoạt / Đóng Mùa</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-[family-name:var(--font-rajdhani)]">
            {stats.seasonStatuses}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090d24]/80 border border-[#3fe9d6]/20">
          <div className="text-[11px] font-mono text-[#3fe9d6]/80">Thêm / Sửa Banner</div>
          <div className="text-2xl font-black text-[#3fe9d6] mt-1 font-[family-name:var(--font-rajdhani)]">
            {stats.bannerWrites}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090d24]/80 border border-purple-500/20">
          <div className="text-[11px] font-mono text-purple-300/80">Bật / Tắt Banner</div>
          <div className="text-2xl font-black text-purple-300 mt-1 font-[family-name:var(--font-rajdhani)]">
            {stats.bannerToggles}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090d24]/80 border border-rose-500/20">
          <div className="text-[11px] font-mono text-rose-300/80">Xóa Mùa / Banner</div>
          <div className="text-2xl font-black text-rose-300 mt-1 font-[family-name:var(--font-rajdhani)]">
            {stats.deletes}
          </div>
        </div>
      </div>

      {/* 3. SEARCH & ACTION FILTERS */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên mùa, mã banner, chi tiết, người thực hiện..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 focus:border-[#f5c767]/50 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filterButtons.map((btn) => {
            const active = actionFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActionFilter(btn.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                  active
                    ? "bg-[#f5c767]/20 text-[#f5c767] border-[#f5c767]/40"
                    : "bg-[#060814] text-slate-400 border-white/10 hover:text-white hover:border-white/20"
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. LOG TABLE */}
      <div className="rounded-2xl bg-[#090d24]/80 border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#060814]/80 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4 whitespace-nowrap">Thời Gian</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Hành Động</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Mùa & Banner</th>
                <th className="py-3.5 px-4 min-w-[260px]">Chi Tiết Thay Đổi</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Người Thực Hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-mono">
                    Đang nạp nhật ký hệ thống Banner Gacha...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div>Chưa có bản ghi nhật ký Banner Gacha nào phù hợp.</div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const meta = ACTION_BADGE_MAP[log.action] || {
                    label: log.action,
                    badgeClass: "bg-white/10 text-slate-300 border-white/20",
                    dotClass: "bg-slate-400",
                  };
                  const timeInfo = formatLogTimestamp(log);

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors align-top">
                      {/* Thời gian */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="text-slate-200 font-semibold">{timeInfo.time}</div>
                        <div className="text-[10px] text-slate-500">{timeInfo.date}</div>
                      </td>

                      {/* Hành động */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold ${meta.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                          <span>{meta.label}</span>
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 max-w-[200px] truncate" title={log.actionTitle}>
                          {log.actionTitle}
                        </div>
                      </td>

                      {/* Mùa & Banner */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {log.seasonName || "Không rõ mùa"}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(log.seasonId)}
                            title="Sao chép mã mùa"
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 cursor-pointer"
                          >
                            {copiedId === log.seasonId ? "Đã chép" : log.seasonId}
                          </button>

                          {typeof log.version === "number" && (
                            <span className="px-2 py-0.5 rounded bg-[#3fe9d6]/10 border border-[#3fe9d6]/25 text-[10px] font-mono text-[#3fe9d6]">
                              v{log.version}
                            </span>
                          )}
                        </div>

                        {log.bannerId && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-[#f5c767] font-semibold">
                              Banner: {log.bannerTitle || log.bannerId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(log.bannerId!)}
                              title="Sao chép mã banner"
                              className="px-1.5 py-0.5 rounded bg-[#f5c767]/10 hover:bg-[#f5c767]/20 border border-[#f5c767]/25 text-[10px] font-mono text-[#f5c767] cursor-pointer"
                            >
                              {copiedId === log.bannerId ? "Đã chép" : log.bannerId}
                            </button>
                            {log.bannerType && (
                              <span className="text-[10px] font-mono uppercase text-slate-400">
                                ({log.bannerType})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Chi tiết */}
                      <td className="py-3.5 px-4 text-slate-300 leading-relaxed max-w-md">
                        {log.details}
                      </td>

                      {/* Người thực hiện */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.performedBy}</div>
                        {log.performedByRole && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                            {log.performedByRole === "Admin" ? "Quản Trị Viên" : log.performedByRole}
                          </span>
                        )}
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
