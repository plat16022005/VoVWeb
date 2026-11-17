"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  eventsService,
  EventActivityLog,
  EventLogAction,
} from "@/services/events.service";
import { soundEngine } from "@/services/audio.service";

const ACTION_BADGE_MAP: Record<
  EventLogAction,
  { label: string; badgeClass: string }
> = {
  CREATE_EVENT: {
    label: "Tạo Sự Kiện",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  UPDATE_EVENT: {
    label: "Cập Nhật Sự Kiện",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  UPLOAD_BUILD: {
    label: "Tải Bản Build (.zip)",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  UPLOAD_HTML: {
    label: "Cập Nhật Layout (.html)",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  ACTIVATE_EVENT: {
    label: "Mở Công Khai",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  },
  DEACTIVATE_EVENT: {
    label: "Tạm Đóng",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  DELETE_EVENT: {
    label: "Xóa Sự Kiện",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
};

export default function EventLogsTable() {
  const [logs, setLogs] = useState<EventActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventsService.getEventLogs(100);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.eventTitle.toLowerCase().includes(q) ||
        l.eventId.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.performedBy.toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[#090c21]/90 border border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên sự kiện, mã sự kiện hoặc người thực hiện..."
          className="flex-1 px-4 py-2 rounded-xl bg-[#060814] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#3fe9d6]"
        />
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            loadLogs();
          }}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
        >
          Làm mới nhật ký
        </button>
      </div>

      <div className="rounded-2xl bg-[#090c21]/90 border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#060814]/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Thao Tác</th>
                <th className="py-3.5 px-4">Sự Kiện &amp; Bản Build</th>
                <th className="py-3.5 px-4">Chi Tiết Kiểm Toán</th>
                <th className="py-3.5 px-4">Người Thực Hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Đang tải nhật ký Sự Kiện &amp; Minigame...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có nhật ký hoạt động nào trong phân hệ Quản Lý Sự Kiện.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = ACTION_BADGE_MAP[log.action] || {
                    label: log.actionTitle,
                    badgeClass: "bg-white/10 text-slate-300 border-white/10",
                  };
                  const dateObj = new Date(log.timestamp || log.createdAt);

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <div>{dateObj.toLocaleDateString("vi-VN")}</div>
                        <div className="text-[10px] text-slate-500">
                          {dateObj.toLocaleTimeString("vi-VN")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${badge.badgeClass}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{log.eventTitle}</div>
                        <div className="text-[10px] text-[#3fe9d6]">
                          {log.buildName ? `Build: ${log.buildName}` : "Cấu hình chung"}
                          {log.version ? ` · v${log.version}` : ""}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-md">
                        {log.details}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{log.performedBy}</div>
                        {log.performedByRole && (
                          <span className="text-[10px] text-[#f5c767]">
                            {log.performedByRole}
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
