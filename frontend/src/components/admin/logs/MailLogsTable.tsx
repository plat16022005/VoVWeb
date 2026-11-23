"use client";

import { useEffect, useState, useMemo } from "react";
import {
  MailActivityLog,
  MailLogAction,
  getMailCategoryMeta,
  mailService,
} from "@/services/mail.service";
import { soundEngine } from "@/services/audio.service";

type ActionFilter = "ALL" | MailLogAction;

const ACTION_CONFIG: Record<
  MailLogAction,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  }
> = {
  SEND_GLOBAL_MAIL: {
    label: "GỬI TOÀN SERVER",
    badgeBg: "bg-[#3fe9d6]/15",
    badgeText: "text-[#3fe9d6]",
    badgeBorder: "border-[#3fe9d6]/35",
    dotColor: "bg-[#3fe9d6]",
  },
  SEND_PERSONAL_MAIL: {
    label: "GỬI CÁ NHÂN",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/35",
    dotColor: "bg-emerald-400",
  },
  SEND_BULK_PERSONAL_MAIL: {
    label: "GỬI NHÓM CÁ NHÂN",
    badgeBg: "bg-[#f5c767]/15",
    badgeText: "text-[#f5c767]",
    badgeBorder: "border-[#f5c767]/35",
    dotColor: "bg-[#f5c767]",
  },
  REVOKE_MAIL: {
    label: "THU HỒI THƯ",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/35",
    dotColor: "bg-amber-400",
  },
  RESTORE_MAIL: {
    label: "KHÔI PHỤC THƯ",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-300",
    badgeBorder: "border-sky-500/35",
    dotColor: "bg-sky-400",
  },
  DELETE_MAIL: {
    label: "XÓA THƯ",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/35",
    dotColor: "bg-rose-400",
  },
};

export default function MailLogsTable() {
  const [logs, setLogs] = useState<MailActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");

  const reloadLogs = () => {
    setLoading(true);
    mailService
      .getMailLogs(200)
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
    mailService
      .getMailLogs(200)
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
      globalSent: logs.filter((l) => l.action === "SEND_GLOBAL_MAIL").length,
      personalSent: logs.filter(
        (l) =>
          l.action === "SEND_PERSONAL_MAIL" ||
          l.action === "SEND_BULK_PERSONAL_MAIL"
      ).length,
      withRewards: logs.filter((l) => l.hasRewards).length,
      revokedOrDeleted: logs.filter(
        (l) => l.action === "REVOKE_MAIL" || l.action === "DELETE_MAIL"
      ).length,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const matchAction = actionFilter === "ALL" || log.action === actionFilter;
      const matchSearch =
        !q ||
        log.mailId.toLowerCase().includes(q) ||
        log.title.toLowerCase().includes(q) ||
        log.targetSummary.toLowerCase().includes(q) ||
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
      "Mã Thư",
      "Tiêu Đề",
      "Phân Loại",
      "Đối Tượng Nhận",
      "Kèm Quà",
      "Chi Tiết Kiểm Toán",
      "Người Thực Hiện",
      "Vai Trò",
    ];
    const rows = filteredLogs.map((log) => {
      const actionMeta = ACTION_CONFIG[log.action] || { label: log.action };
      const catLabel = getMailCategoryMeta(log.category).label;
      return [
        formatTimestamp(log.createdAt || log.timestamp),
        actionMeta.label,
        log.mailId,
        `"${(log.title || "").replace(/"/g, '""')}"`,
        catLabel,
        `"${(log.targetSummary || "").replace(/"/g, '""')}"`,
        log.hasRewards ? "Có quà" : "Thông báo thuần",
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
      `vov_mailbox_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#0b102b]/80 border border-white/10">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Tổng Bản Ghi
          </p>
          <p className="text-2xl font-bold text-white font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.total}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#3fe9d6]/5 border border-[#3fe9d6]/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#3fe9d6]/80">
            Phát Toàn Server
          </p>
          <p className="text-2xl font-bold text-[#3fe9d6] font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.globalSent}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80">
            Gửi Cá Nhân / CSKH
          </p>
          <p className="text-2xl font-bold text-emerald-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.personalSent}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#f5c767]/5 border border-[#f5c767]/25">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#f5c767]/80">
            Có Đính Kèm Quà
          </p>
          <p className="text-2xl font-bold text-[#f5c767] font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.withRewards}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <p className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80">
            Thu Hồi / Xóa
          </p>
          <p className="text-2xl font-bold text-rose-300 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.revokedOrDeleted}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0b102b]/80 border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "ALL", label: "Tất Cả" },
              { id: "SEND_GLOBAL_MAIL", label: "Toàn Server" },
              { id: "SEND_PERSONAL_MAIL", label: "Cá Nhân" },
              { id: "SEND_BULK_PERSONAL_MAIL", label: "Nhóm Cá Nhân" },
              { id: "REVOKE_MAIL", label: "Thu Hồi" },
              { id: "DELETE_MAIL", label: "Xóa Thư" },
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
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
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
            placeholder="Tìm theo tiêu đề thư, người nhận, người gửi..."
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-[#060919] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 font-sans"
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
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300 cursor-pointer disabled:opacity-40"
          >
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Đang tải nhật ký kiểm toán hòm thư hệ thống...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
              Chưa Có Bản Ghi Nhật Ký Hòm Thư
            </p>
            <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
              Mọi thao tác gửi thư toàn server, gửi quà đền bù cá nhân, thu hồi hoặc xóa thư sẽ được ghi nhận tự động tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#060919]/90 border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Hành Động</th>
                  <th className="py-3.5 px-4">Thư &amp; Đối Tượng</th>
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
                  const catMeta = getMailCategoryMeta(log.category);
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
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${catMeta.badgeClass}`}
                          >
                            {catMeta.shortLabel}
                          </span>
                          {log.hasRewards && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/30">
                              Kèm Quà
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white font-sans">
                          {log.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {log.targetSummary}
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
