"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { adminService, AccountLogItem } from "@/services/admin.service";
import { soundEngine } from "@/services/audio.service";

interface PermissionsAuditLogTabProps {
  onRefresh?: () => void;
}

export default function PermissionsAuditLogTab({ onRefresh }: PermissionsAuditLogTabProps) {
  const [logs, setLogs] = useState<AccountLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAccountLogs(150);
      // Filter only UPDATE_PERMISSIONS logs
      const permLogs = data.filter((l) => l.action === "UPDATE_PERMISSIONS");
      setLogs(permLogs);
    } catch (err) {
      console.error("Lỗi khi tải nhật ký phân quyền:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopy = (id: string, text: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        item.performedBy?.toLowerCase().includes(query) ||
        item.targetUsername?.toLowerCase().includes(query) ||
        item.targetEmail?.toLowerCase().includes(query) ||
        item.details?.toLowerCase().includes(query) ||
        item.targetUserId?.toLowerCase().includes(query)
      );
    });
  }, [logs, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header filter */}
      <div className="p-4 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Admin thao tác, Quản Lý đích hoặc nội dung cấp quyền..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#3fe9d6] transition-colors font-mono"
          />
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            fetchLogs();
            if (onRefresh) onRefresh();
          }}
          className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm Mới Log</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#060814]/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-3">Quản Trị Viên Thao Tác</th>
                <th className="py-3 px-4">Tài Khoản Được Phân Quyền</th>
                <th className="py-3 px-4">Chi Tiết Thay Đổi Quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
                      <span>Đang nạp nhật ký phân quyền...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-3xl">📜</span>
                      <span>Chưa có bản ghi nhật ký phân quyền nào được ghi nhận.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                      {item.createdAt}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3fe9d6] shadow-[0_0_6px_#3fe9d6]" />
                        <span className="font-semibold text-white font-mono">
                          {item.performedBy}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-[#f5c767] flex items-center gap-2">
                          <span>{item.targetUsername || "Quản Lý"}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                            Manager
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {item.targetEmail || item.targetUserId}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="p-2.5 rounded-xl bg-[#060814]/70 border border-white/5 text-[11px] font-mono text-slate-300">
                        {item.details}
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
