"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getServerLogs, ServerAuditLog } from "@/services/serverManagement.service";
import { soundEngine } from "@/services/audio.service";

interface ServerLogsTableProps {
  onRefresh?: () => void;
}

export default function ServerLogsTable({ onRefresh }: ServerLogsTableProps) {
  const [logs, setLogs] = useState<ServerAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getServerLogs(200);
      setLogs(data);
    } catch (err) {
      console.error("Lỗi khi tải nhật ký Hạ tầng & Máy chủ:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getServerLogs(200)
      .then((data) => {
        if (active) {
          setLogs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải nhật ký Hạ tầng & Máy chủ:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRefreshClick = () => {
    soundEngine.playClick();
    fetchLogs();
    if (onRefresh) onRefresh();
  };

  // Bộ lọc tìm kiếm
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.serverId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.actionTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.performedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.createdAt?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAction =
        actionFilter === "ALL" ||
        item.action === actionFilter ||
        (actionFilter === "GLOBAL" &&
          (item.action === "ENABLE_GLOBAL_MAINTENANCE" || item.action === "DISABLE_GLOBAL_MAINTENANCE")) ||
        (actionFilter === "CLUSTER" &&
          (item.action === "ENABLE_SERVER_MAINTENANCE" || item.action === "DISABLE_SERVER_MAINTENANCE"));

      return matchSearch && matchAction;
    });
  }, [logs, searchQuery, actionFilter]);

  // Xuất file CSV chuyên biệt cho Quản lý Hạ Tầng & Máy Chủ
  const handleExportCsv = () => {
    soundEngine.playClick();
    if (filteredLogs.length === 0) {
      alert("Chưa có dữ liệu nhật ký máy chủ để xuất CSV.");
      return;
    }

    const headers = ["Thời Gian", "Hành Động", "Máy Chủ Mục Tiêu", "Lý Do / Chi Tiết", "Người Thực Hiện"];
    const rows = filteredLogs.map((item) => [
      `"${item.createdAt}"`,
      `"${item.actionTitle || item.action}"`,
      `"${(item.serverId ? `[${item.serverId}] ${item.serverName || ""}` : "Toàn Hệ Thống").replace(/"/g, '""')}"`,
      `"${(item.reason || item.message || "").replace(/"/g, '""')}"`,
      `"${item.performedBy}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VOV_SERVER_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "APPLY_RULES":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
      case "ENABLE_GLOBAL_MAINTENANCE":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse";
      case "DISABLE_GLOBAL_MAINTENANCE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "ENABLE_SERVER_MAINTENANCE":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,199,103,0.2)]";
      case "DISABLE_SERVER_MAINTENANCE":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controller Bar */}
      <div className="p-5 rounded-2xl bg-[#090d21]/90 backdrop-blur-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase flex items-center gap-2 flex-wrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
            <span>Nhật Ký Quản Lý Hạ Tầng & Máy Chủ</span>
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
              Server Audit
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Theo dõi lịch sử đồng bộ chính sách bảo mật, bật/tắt bảo trì toàn game và từng cụm máy chủ.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              soundEngine.playClick();
              setActionFilter(e.target.value);
            }}
            className="px-3 py-2 rounded-xl bg-[#060818] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-[#3fe9d6]"
          >
            <option value="ALL">Tất Cả Thao Tác</option>
            <option value="APPLY_RULES">Đồng Bộ Chính Sách (APPLY)</option>
            <option value="GLOBAL">Bảo Trì Toàn Game (GLOBAL)</option>
            <option value="CLUSTER">Bảo Trì Cụm Máy Chủ (CLUSTER)</option>
          </select>

          {/* Search Box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm server, người thực hiện, lý do..."
            className="px-3.5 py-2 rounded-xl bg-[#060818] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6] min-w-[200px]"
          />

          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-[#3fe9d6]/40 transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu nhật ký"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#3fe9d6]" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm Mới</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6]/20 to-[#0ea5e9]/20 border border-[#3fe9d6]/40 text-[#3fe9d6] hover:bg-[#3fe9d6]/30 transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            title="Xuất danh sách ra file CSV"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl bg-[#090d21]/70 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050714]/80 uppercase font-mono text-slate-400 border-b border-white/10 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Thời Gian</th>
                <th className="px-5 py-3.5">Hành Động</th>
                <th className="px-5 py-3.5">Cụm Máy Chủ Mục Tiêu</th>
                <th className="px-5 py-3.5">Chi Tiết / Lý Do</th>
                <th className="px-5 py-3.5">Người Thực Hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-[#3fe9d6] border-t-transparent animate-spin" />
                      <p className="text-slate-400">Đang nạp nhật ký kiểm toán hạ tầng...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <p className="text-slate-300 font-semibold">Chưa có nhật ký hạ tầng nào</p>
                      <p className="text-xs text-slate-500">Mọi hành động tạo máy chủ hoặc bảo trì sẽ được tự động ghi lại tại đây.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Timestamp */}
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono">
                      {item.createdAt}
                    </td>

                    {/* Action Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-mono tracking-wide ${getActionBadge(
                          item.action
                        )}`}
                      >
                        {item.actionTitle || item.action}
                      </span>
                    </td>

                    {/* Server Target */}
                    <td className="px-5 py-4">
                      {item.serverId ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#3fe9d6]/10 border border-[#3fe9d6]/30 text-[#3fe9d6] font-bold text-xs">
                            {item.serverId.toUpperCase()}
                          </span>
                          <span className="text-white font-semibold text-xs">
                            {item.serverName || `Cụm ${item.serverId}`}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                          Toàn Game (All Clusters)
                        </span>
                      )}
                    </td>

                    {/* Details / Reason */}
                    <td className="px-5 py-4 max-w-md">
                      <p className="text-slate-300 text-xs truncate" title={item.reason || item.message}>
                        {item.reason || item.message || "—"}
                      </p>
                      {item.locationId && (
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Region: {item.locationId}
                        </span>
                      )}
                    </td>

                    {/* Performed By */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
                        <span className="text-slate-300 text-xs font-mono">{item.performedBy}</span>
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
