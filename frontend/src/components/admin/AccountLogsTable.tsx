"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { adminService, AccountLogItem, AccountLogAction } from "@/services/admin.service";
import { soundEngine } from "@/services/audio.service";

interface AccountLogsTableProps {
  onRefresh?: () => void;
}

export default function AccountLogsTable({ onRefresh }: AccountLogsTableProps) {
  const [logs, setLogs] = useState<AccountLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Nạp dữ liệu nhật ký từ Firestore
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAccountLogs(150);
      setLogs(data);
    } catch (err) {
      console.error("Lỗi khi tải nhật ký tài khoản:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Copy UID trợ giúp
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Thống kê nhanh theo từng loại hành động
  const stats = useMemo(() => {
    const total = logs.length;
    const banCount = logs.filter((l) => l.action === "BAN").length;
    const unbanCount = logs.filter((l) => l.action === "UNBAN").length;
    const createCount = logs.filter((l) => l.action === "CREATE").length;
    const updateCount = logs.filter((l) => l.action === "UPDATE").length;
    const deleteCount = logs.filter((l) => l.action === "DELETE").length;
    const resetCount = logs.filter((l) => l.action === "RESET_PASSWORD").length;
    return { total, banCount, unbanCount, createCount, updateCount, deleteCount, resetCount };
  }, [logs]);

  // Bộ lọc dữ liệu
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      // Lọc theo Action
      if (selectedAction !== "ALL" && item.action !== selectedAction) {
        return false;
      }
      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = item.targetUsername?.toLowerCase().includes(q);
        const matchEmail = item.targetEmail?.toLowerCase().includes(q);
        const matchUid = item.targetUserId?.toLowerCase().includes(q);
        const matchDetails = item.details?.toLowerCase().includes(q);
        const matchPerformer = item.performedBy?.toLowerCase().includes(q);
        const matchAction = item.actionTitle?.toLowerCase().includes(q);
        return matchUser || matchEmail || matchUid || matchDetails || matchPerformer || matchAction;
      }
      return true;
    });
  }, [logs, selectedAction, searchQuery]);

  // Huy hiệu hiển thị loại hành động
  const renderActionBadge = (action: AccountLogAction, title: string) => {
    switch (action) {
      case "BAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/15 border border-rose-500/40 text-rose-400">
            <span>🔒</span>
            <span>Khóa Tài Khoản</span>
          </span>
        );
      case "UNBAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            <span>🔓</span>
            <span>Mở Khóa</span>
          </span>
        );
      case "CREATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
            <span>➕</span>
            <span>Tạo Mới</span>
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-500/15 border border-purple-500/40 text-purple-300">
            <span>✏️</span>
            <span>Cập Nhật</span>
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-red-600/20 border border-red-500/50 text-red-300">
            <span>🗑️</span>
            <span>Xóa Vĩnh Viễn</span>
          </span>
        );
      case "RESET_PASSWORD":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
            <span>🔑</span>
            <span>Đặt Lại MK</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-500/15 border border-slate-500/40 text-slate-300">
            <span>📝</span>
            <span>{title || action}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Thẻ Thống kê nhanh các hoạt động */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-slate-400">Tổng Ghi Nhận</span>
          <span className="text-xl font-bold font-mono text-white mt-1">{stats.total}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-rose-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-rose-300 flex items-center gap-1">
            <span>🔒</span> Khóa
          </span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1">{stats.banCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-emerald-300 flex items-center gap-1">
            <span>🔓</span> Mở Khóa
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1">{stats.unbanCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-cyan-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1">
            <span>➕</span> Tạo Mới
          </span>
          <span className="text-xl font-bold font-mono text-cyan-400 mt-1">{stats.createCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-purple-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-purple-300 flex items-center gap-1">
            <span>✏️</span> Cập Nhật
          </span>
          <span className="text-xl font-bold font-mono text-purple-400 mt-1">{stats.updateCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-amber-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
            <span>🔑</span> Đặt Lại MK
          </span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1">{stats.resetCount}</span>
        </div>
      </div>

      {/* Header Điều Khiển & Bộ Lọc */}
      <div className="p-5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h3 className="text-base font-bold font-mono text-[#3fe9d6] uppercase tracking-wider">
                Nhật Ký Quản Trị Tài Khoản
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30 text-xs font-mono">
                Firestore: Logs/AccountManagement/Activities
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Ghi lại chi tiết mọi hành vi khởi tạo, chỉnh sửa, khóa vi phạm điều khoản và xóa tài khoản của Quản Trị Viên.
            </p>
          </div>

          {/* Nút Làm Mới */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              fetchLogs();
              if (onRefresh) onRefresh();
            }}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>↺</span>
            <span>{loading ? "Đang đồng bộ..." : "Làm Mới"}</span>
          </button>
        </div>

        {/* Thanh tìm kiếm & Tabs lọc nhanh */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-lg">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên người dùng, email, người thực hiện hoặc nội dung..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0e122b] border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-[#3fe9d6] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tabs Filter theo Action */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "ALL", label: "Tất Cả", icon: "🌐" },
              { id: "BAN", label: "Khóa", icon: "🔒" },
              { id: "UNBAN", label: "Mở Khóa", icon: "🔓" },
              { id: "CREATE", label: "Tạo Mới", icon: "➕" },
              { id: "UPDATE", label: "Cập Nhật", icon: "✏️" },
              { id: "DELETE", label: "Xóa", icon: "🗑️" },
              { id: "RESET_PASSWORD", label: "Đặt Lại MK", icon: "🔑" },
            ].map((btn) => {
              const active = selectedAction === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedAction(btn.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-[#3fe9d6] text-black shadow-[0_0_15px_rgba(63,233,214,0.35)]"
                      : "bg-[#0e122b] text-slate-400 hover:text-slate-200 hover:bg-[#151a3b] border border-white/5"
                  }`}
                >
                  <span className="text-xs">{btn.icon}</span>
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Danh sách Nhật ký (Bảng Desktop & Thẻ Mobile) */}
      <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-9 h-9 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-400">Đang nạp dữ liệu nhật ký từ Firestore...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-dashed border-white/10 rounded-2xl p-8">
            <div className="text-4xl">📜</div>
            <div className="text-sm font-mono text-slate-300 font-bold">
              {searchQuery || selectedAction !== "ALL"
                ? "Không tìm thấy nhật ký phù hợp với bộ lọc."
                : "Chưa có hoạt động quản lý tài khoản nào được ghi nhận."}
            </div>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
              Khi bạn khởi tạo tài khoản, chỉnh sửa thông tin, khóa vi phạm điều khoản hoặc xóa tài khoản, hệ thống sẽ tự động lưu vết tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between pb-2 border-b border-white/5">
              <span>Hiển thị <strong>{filteredLogs.length}</strong> / <strong>{logs.length}</strong> nhật ký</span>
              <span>Thời gian lưu trữ: Mới nhất trước</span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-3">Thời Gian</th>
                    <th className="py-3 px-3">Hành Động</th>
                    <th className="py-3 px-3">Tài Khoản Đích</th>
                    <th className="py-3 px-3">Nội Dung Chi Tiết</th>
                    <th className="py-3 px-3">Người Thực Hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Thời gian */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">🕒</span>
                          <span>{item.createdAt}</span>
                        </div>
                      </td>

                      {/* Hành động */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {renderActionBadge(item.action, item.actionTitle)}
                      </td>

                      {/* Tài khoản đích */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{item.targetUsername}</span>
                          </div>
                          {item.targetEmail && (
                            <div className="text-[11px] text-slate-400">{item.targetEmail}</div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span>UID:</span>
                            <span className="truncate max-w-[100px]">{item.targetUserId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.id, item.targetUserId)}
                              className="text-slate-400 hover:text-white"
                              title="Sao chép UID"
                            >
                              {copiedId === item.id ? "✓" : "📋"}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Nội dung chi tiết */}
                      <td className="py-3.5 px-3">
                        <div className="p-2.5 rounded-lg bg-[#060814]/80 border border-white/5 text-slate-300 font-sans text-xs leading-relaxed max-w-xl">
                          {item.details || "(Không có thông tin chi tiết)"}
                        </div>
                      </td>

                      {/* Người thực hiện */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#3fe9d6]" />
                          <span className="font-semibold text-white">{item.performedBy}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredLogs.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#080b1d] border border-white/10 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    {renderActionBadge(item.action, item.actionTitle)}
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {item.createdAt}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-mono text-slate-400">Tài khoản đích:</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                      {item.targetUsername}
                    </div>
                    {item.targetEmail && (
                      <div className="text-xs text-slate-400 font-mono">{item.targetEmail}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-[#060814] border border-white/5 text-xs text-slate-200 font-sans leading-relaxed">
                    {item.details || "(Không có thông tin chi tiết)"}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                    <span>Thực hiện bởi:</span>
                    <strong className="text-white">{item.performedBy}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
