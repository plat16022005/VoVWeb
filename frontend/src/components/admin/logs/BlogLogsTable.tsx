"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { blogsService, BlogActivityLog } from "@/services/blogs.service";
import { soundEngine } from "@/services/audio.service";

interface BlogLogsTableProps {
  onRefresh?: () => void;
}

export default function BlogLogsTable({ onRefresh }: BlogLogsTableProps) {
  const [logs, setLogs] = useState<BlogActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blogsService.getBlogLogs(200);
      setLogs(data);
    } catch (err) {
      console.error("Lỗi khi tải nhật ký Blog:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    blogsService
      .getBlogLogs(200)
      .then((data) => {
        if (active) {
          setLogs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải nhật ký Blog:", err);
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
        item.targetTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.actionTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.performedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.createdAt?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAction = actionFilter === "ALL" || item.action === actionFilter;

      return matchSearch && matchAction;
    });
  }, [logs, searchQuery, actionFilter]);

  // Xuất file CSV chuyên biệt cho Quản lý Blog
  const handleExportCsv = () => {
    soundEngine.playClick();
    if (filteredLogs.length === 0) {
      alert("Chưa có dữ liệu nhật ký Blog để xuất CSV.");
      return;
    }

    const headers = ["Thời Gian", "Hành Động", "Bài Viết Mục Tiêu", "Chi Tiết", "Người Thực Hiện"];
    const rows = filteredLogs.map((item) => [
      `"${item.createdAt}"`,
      `"${item.actionTitle || item.action}"`,
      `"${(item.targetTitle || "").replace(/"/g, '""')}"`,
      `"${(item.details || "").replace(/"/g, '""')}"`,
      `"${item.performedBy}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VOV_BLOG_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "PUBLISH":
        return "bg-[#f5c767]/20 text-[#f5c767] border-[#f5c767]/40 font-bold";
      case "UNPUBLISH":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
      case "DELETE":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controller Bar */}
      <div className="p-5 rounded-2xl bg-[#090d21]/90 backdrop-blur-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📰</span>
          <div>
            <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase flex items-center gap-2">
              Nhật Ký Quản Lý Blog & Tin Tức
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#f5c767]/10 text-[#f5c767] border border-[#f5c767]/30">
                Logs/BlogManagement/Activities
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Ghi nhận mọi thao tác soạn thảo, xuất bản, gỡ bài và xóa bài viết của Quản Trị Viên & Quản Lý.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              soundEngine.playClick();
              setActionFilter(e.target.value);
            }}
            className="px-3 py-2 rounded-xl bg-[#060818] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-[#f5c767]"
          >
            <option value="ALL">Tất Cả Thao Tác</option>
            <option value="CREATE">Tạo Mới (CREATE)</option>
            <option value="UPDATE">Chỉnh Sửa (UPDATE)</option>
            <option value="PUBLISH">Xuất Bản (PUBLISH)</option>
            <option value="UNPUBLISH">Gỡ Về Nháp (UNPUBLISH)</option>
            <option value="DELETE">Xóa Bài (DELETE)</option>
          </select>

          {/* Search Box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, người thao tác..."
            className="px-3.5 py-2 rounded-xl bg-[#060818] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5c767] min-w-[200px]"
          />

          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={loading}
            title="Làm mới dữ liệu nhật ký"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin text-[#f5c767]" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-[#f5c767]/15 border border-[#f5c767]/40 text-[#f5c767] hover:bg-[#f5c767]/25 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="rounded-2xl bg-[#090d21]/90 backdrop-blur-md border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#060818]/80 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Thời Gian</th>
                <th className="py-3.5 px-4 font-semibold">Thao Tác</th>
                <th className="py-3.5 px-4 font-semibold">Bài Viết Mục Tiêu</th>
                <th className="py-3.5 px-4 font-semibold">Chi Tiết Nghiệp Vụ</th>
                <th className="py-3.5 px-4 font-semibold">Người Thực Hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#f5c767] animate-ping" />
                      <span>Đang tải nhật ký kiểm toán Blog...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có nhật ký hoạt động nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Thời gian */}
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {log.createdAt}
                    </td>

                    {/* Thao tác Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getActionBadge(log.action)}`}>
                        {log.actionTitle || log.action}
                      </span>
                    </td>

                    {/* Tiêu đề bài viết */}
                    <td className="py-3.5 px-4 font-sans font-semibold text-white max-w-[280px] truncate">
                      {log.targetTitle}
                    </td>

                    {/* Chi tiết */}
                    <td className="py-3.5 px-4 text-slate-300 max-w-[240px] truncate">
                      {log.details || log.actionTitle}
                    </td>

                    {/* Người thực hiện */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[#3fe9d6]">
                        <span>👤</span>
                        <span>{log.performedBy}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="px-4 py-3 border-t border-white/10 bg-[#060818]/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div>
            Hiển thị <strong className="text-white">{filteredLogs.length}</strong> / {logs.length} bản ghi nhật ký
          </div>
          <div className="flex items-center gap-1.5 text-[#f5c767]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5c767] animate-pulse" />
            <span>Audit Trail Đồng Bộ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
