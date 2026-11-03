"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { settingsService, TermHistoryLog } from "@/services/settings.service";
import { soundEngine } from "@/services/audio.service";

interface TermsLogsTableProps {
  type: "terms" | "policy";
  onRefresh?: () => void;
}

export default function TermsLogsTable({ type, onRefresh }: TermsLogsTableProps) {
  const [logs, setLogs] = useState<TermHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const label = type === "terms" ? "Điều Khoản Dịch Vụ" : "Chính Sách Bảo Mật";
  const icon = type === "terms" ? "📜" : "🛡️";
  const path = type === "terms" ? "Logs/Term&Policy/Term" : "Logs/Term&Policy/Policy";

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        type === "terms"
          ? await settingsService.getTermsHistory()
          : await settingsService.getPolicyHistory();
      setLogs(data);
    } catch (err) {
      console.error(`Lỗi khi tải nhật ký ${label}:`, err);
    } finally {
      setLoading(false);
    }
  }, [type, label]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Bộ lọc tìm kiếm
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (item) =>
        item.version?.toLowerCase().includes(q) ||
        item.note?.toLowerCase().includes(q) ||
        item.updatedBy?.toLowerCase().includes(q) ||
        item.updatedAt?.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  // Xuất file CSV chuyên biệt cho Điều khoản / Chính sách
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      alert(`Chưa có dữ liệu nhật ký ${label} để xuất CSV.`);
      return;
    }

    const headers = ["Thời Gian", "Phiên Bản", "Số Lượng Mục", "Ghi Chú Bản Phát Hành", "Người Xuất Bản"];
    const rows = filteredLogs.map((item) => [
      `"${item.updatedAt}"`,
      `"${item.version}"`,
      item.termCount,
      `"${(item.note || "").replace(/"/g, '""')}"`,
      `"${item.updatedBy}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VOV_${type.toUpperCase()}_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Điều Khiển & Bộ Lọc */}
      <div className="p-5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <h3 className="text-base font-bold font-mono text-[#3fe9d6] uppercase tracking-wider">
                Nhật Ký Xuất Bản {label}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30 text-xs font-mono">
                Firestore: {path}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Ghi lại lịch sử từng đợt cập nhật phiên bản, số lượng mục quy định và ghi chú xuất bản của Quản Trị Viên.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Làm Mới */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                fetchLogs();
                if (onRefresh) onRefresh();
              }}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={loading ? "animate-spin" : ""}>↺</span>
              <span>{loading ? "Đang đồng bộ..." : "Làm Mới"}</span>
            </button>

            {/* Nút Xuất CSV */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                handleExportCsv();
              }}
              className="px-4 py-2 rounded-xl bg-[#0e122b] hover:bg-[#151a3b] border border-[#3fe9d6]/30 text-[#3fe9d6] hover:text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Tìm theo phiên bản, ghi chú hoặc người xuất bản...`}
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
      </div>

      {/* Danh sách Nhật ký (Bảng Desktop & Thẻ Mobile) */}
      <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-9 h-9 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-400">Đang nạp dữ liệu nhật ký phiên bản...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-dashed border-white/10 rounded-2xl p-8">
            <div className="text-4xl">{icon}</div>
            <div className="text-sm font-mono text-slate-300 font-bold">
              {searchQuery
                ? "Không tìm thấy nhật ký phù hợp với từ khóa."
                : `Chưa có nhật ký xuất bản ${label.toLowerCase()} nào.`}
            </div>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
              Mỗi khi Quản Trị Viên thực hiện lưu và xuất bản phiên bản mới tại trang Cấu Hình Hệ Thống, thông tin sẽ được tự động ghi nhận tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between pb-2 border-b border-white/5">
              <span>Hiển thị <strong>{filteredLogs.length}</strong> / <strong>{logs.length}</strong> phiên bản</span>
              <span>Sắp xếp: Mới nhất trước</span>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-3">Thời Gian</th>
                    <th className="py-3 px-3">Phiên Bản</th>
                    <th className="py-3 px-3">Quy Mô</th>
                    <th className="py-3 px-3">Ghi Chú Bản Phát Hành</th>
                    <th className="py-3 px-3">Người Xuất Bản</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        idx === 0 ? "bg-[#3fe9d6]/[0.02]" : ""
                      }`}
                    >
                      {/* Thời gian */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">🕒</span>
                          <span>{item.updatedAt}</span>
                        </div>
                      </td>

                      {/* Phiên bản */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/15 border border-[#3fe9d6]/40 text-[#3fe9d6] font-bold font-mono text-xs">
                            {item.version}
                          </span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              ● Hiện Hành
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quy mô / Số mục */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                        <span className="px-2.5 py-1 rounded-md bg-[#0e122b] border border-white/10 font-bold text-white">
                          {item.termCount} mục
                        </span>
                      </td>

                      {/* Ghi chú */}
                      <td className="py-3.5 px-3">
                        <div className="p-2.5 rounded-lg bg-[#060814]/80 border border-white/5 text-slate-200 font-sans text-xs leading-relaxed max-w-xl">
                          {item.note || "(Không có ghi chú chi tiết)"}
                        </div>
                      </td>

                      {/* Người thực hiện */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#3fe9d6]" />
                          <span className="font-semibold text-white">{item.updatedBy}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredLogs.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border space-y-3 ${
                    idx === 0
                      ? "bg-[#0b1329] border-[#3fe9d6]/40"
                      : "bg-[#080b1d] border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/20 border border-[#3fe9d6]/40 text-[#3fe9d6] font-mono font-bold text-xs">
                        {item.version}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          ● Hiện Hành
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.updatedAt}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    Quy mô: <strong className="text-white">{item.termCount} mục</strong>
                  </div>

                  <div className="p-3 rounded-lg bg-[#060814] border border-white/5 text-xs text-slate-200 font-sans leading-relaxed">
                    {item.note || "(Không có ghi chú chi tiết)"}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                    <span>Xuất bản bởi:</span>
                    <strong className="text-white">{item.updatedBy}</strong>
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
