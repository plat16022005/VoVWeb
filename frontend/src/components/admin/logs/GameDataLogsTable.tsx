"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  characterService,
  GameDataActivityLog,
  GameDataLogAction,
  getRarityColor,
  ROLE_OPTIONS,
} from "@/services/character.service";
import { soundEngine } from "@/services/audio.service";

interface GameDataLogsTableProps {
  onRefresh?: () => void;
}

export default function GameDataLogsTable({ onRefresh }: GameDataLogsTableProps) {
  const [logs, setLogs] = useState<GameDataActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Nạp dữ liệu nhật ký hoạt động Game Data
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await characterService.getGameDataLogs(200);
      setLogs(data);
    } catch (err) {
      console.error("Lỗi khi tải nhật ký dữ liệu Game:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Thống kê nhanh theo từng loại hành động
  const stats = useMemo(() => {
    const total = logs.length;
    const createCount = logs.filter((l) => l.action === "CREATE_CHARACTER").length;
    const updateCount = logs.filter((l) => l.action === "UPDATE_CHARACTER").length;
    const deleteCount = logs.filter((l) => l.action === "DELETE_CHARACTER").length;
    const seedCount = logs.filter((l) => l.action === "SEED_CHARACTERS").length;
    const resetCount = logs.filter((l) => l.action === "RESET_CHARACTERS").length;
    return { total, createCount, updateCount, deleteCount, seedCount, resetCount };
  }, [logs]);

  // Bộ lọc danh sách
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (selectedAction !== "ALL" && item.action !== selectedAction) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.characterName?.toLowerCase().includes(q);
        const matchId = item.characterId?.toLowerCase().includes(q);
        const matchDetails = item.details?.toLowerCase().includes(q);
        const matchPerformer = item.performedBy?.toLowerCase().includes(q);
        const matchRole = item.role?.toLowerCase().includes(q);
        const matchRarity = item.rarity?.toLowerCase().includes(q);
        const matchAction = item.actionTitle?.toLowerCase().includes(q);
        return (
          matchName ||
          matchId ||
          matchDetails ||
          matchPerformer ||
          matchRole ||
          matchRarity ||
          matchAction
        );
      }
      return true;
    });
  }, [logs, selectedAction, searchQuery]);

  // Xuất file CSV báo cáo kiểm toán
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      alert("Chưa có dữ liệu nhật ký Game Data để xuất CSV.");
      return;
    }

    const headers = [
      "Thời Gian",
      "Loại Hành Động",
      "Tiêu Đề Thao Tác",
      "Mã Nhân Vật",
      "Tên Valkyria",
      "Phẩm Cấp",
      "Vai Trò",
      "Chi Tiết Thay Đổi",
      "Người Thực Hiện",
      "Vai Trò Thực Hiện",
    ];

    const rows = filteredLogs.map((item) => [
      `"${item.createdAt}"`,
      `"${item.action}"`,
      `"${(item.actionTitle || "").replace(/"/g, '""')}"`,
      `"${item.characterId || ""}"`,
      `"${item.characterName || ""}"`,
      `"${item.rarity || ""}"`,
      `"${item.role || ""}"`,
      `"${(item.details || "").replace(/"/g, '""')}"`,
      `"${item.performedBy || ""}"`,
      `"${item.performedByRole || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `VOV_GameData_Logs_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Badge Hành Động
  const renderActionBadge = (action: GameDataLogAction, title: string) => {
    switch (action) {
      case "CREATE_CHARACTER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
            <span>➕</span>
            <span>Thêm Mới Valkyria</span>
          </span>
        );
      case "UPDATE_CHARACTER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
            <span>✏️</span>
            <span>Cập Nhật Thông Số</span>
          </span>
        );
      case "DELETE_CHARACTER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/20 border border-rose-500/50 text-rose-300">
            <span>🗑️</span>
            <span>Xóa Nhân Vật</span>
          </span>
        );
      case "SEED_CHARACTERS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-500/15 border border-purple-500/40 text-purple-300">
            <span>⚡</span>
            <span>Đồng Bộ Máy Chủ</span>
          </span>
        );
      case "RESET_CHARACTERS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
            <span>🔄</span>
            <span>Khôi Phục Mặc Định</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-500/15 border border-slate-500/40 text-slate-300">
            <span>⚔️</span>
            <span>{title || action}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Thẻ Thống Kê Nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-slate-400">Tổng Hoạt Động</span>
          <span className="text-xl font-bold font-mono text-white mt-1">{stats.total}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-emerald-300 flex items-center gap-1">
            <span>➕</span> Thêm Mới
          </span>
          <span className="text-xl font-bold font-mono text-emerald-300 mt-1">{stats.createCount}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-cyan-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1">
            <span>✏️</span> Cập Nhật
          </span>
          <span className="text-xl font-bold font-mono text-cyan-300 mt-1">{stats.updateCount}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-rose-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-rose-300 flex items-center gap-1">
            <span>🗑️</span> Xóa Bỏ
          </span>
          <span className="text-xl font-bold font-mono text-rose-300 mt-1">{stats.deleteCount}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-purple-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-purple-300 flex items-center gap-1">
            <span>⚡</span> Đồng Bộ
          </span>
          <span className="text-xl font-bold font-mono text-purple-300 mt-1">{stats.seedCount}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-amber-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
            <span>🔄</span> Khôi Phục
          </span>
          <span className="text-xl font-bold font-mono text-amber-300 mt-1">{stats.resetCount}</span>
        </div>
      </div>

      {/* 2. Thanh Điều Khiển & Bộ Lọc */}
      <div className="p-5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚔️</span>
              <h3 className="text-base font-bold font-mono text-[#3fe9d6] uppercase tracking-wider">
                Nhật Ký Dữ Liệu Game (Valkyria Audit)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
                Hệ Thống Dữ Liệu: Đã Kết Nối
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Ghi lại lịch sử khởi tạo, cập nhật chỉ số chiến đấu, hồ sơ web và xóa chiến binh Valkyria theo chuẩn phân cấp độc lập.
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
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              <span>📥</span>
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Thanh Tìm Kiếm & Lọc Hành Động */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên Valkyria, ID nhân vật, người thực hiện, chỉ số thay đổi..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#060814] border border-white/10 focus:border-[#3fe9d6]/50 focus:ring-1 focus:ring-[#3fe9d6]/50 text-xs font-mono text-white placeholder-slate-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {[
              { id: "ALL", label: "Tất Cả Thao Tác" },
              { id: "CREATE_CHARACTER", label: "Thêm Mới" },
              { id: "UPDATE_CHARACTER", label: "Cập Nhật" },
              { id: "DELETE_CHARACTER", label: "Xóa Bỏ" },
              { id: "SEED_CHARACTERS", label: "Đồng Bộ" },
              { id: "RESET_CHARACTERS", label: "Khôi Phục" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedAction(tab.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${selectedAction === tab.id
                    ? "bg-[#3fe9d6] text-black font-bold shadow-[0_0_12px_rgba(63,233,214,0.3)]"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Nhật Ký */}
      <div className="rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Thời Gian</th>
                <th className="py-3.5 px-4 font-semibold">Hành Động</th>
                <th className="py-3.5 px-4 font-semibold">Chiến Binh Valkyria</th>
                <th className="py-3.5 px-4 font-semibold">Chi Tiết Thay Đổi</th>
                <th className="py-3.5 px-4 font-semibold">Người Thực Hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
                      <span>Đang nạp nhật ký kiểm toán Dữ Liệu Game...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">⚔️</span>
                      <span className="text-slate-300 font-bold">Chưa có nhật ký hoạt động nào</span>
                      <span className="text-xs text-slate-500">
                        Mọi thao tác khởi tạo, chỉnh sửa chỉ số chiến đấu và xóa Valkyria sẽ tự động lưu vào đây.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const roleOption = ROLE_OPTIONS.find((r) => r.value === log.role);
                  const rarityColor = getRarityColor(log.rarity);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Cột 1: Thời gian */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">🕒</span>
                          <span>{log.createdAt}</span>
                        </div>
                      </td>

                      {/* Cột 2: Hành động */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderActionBadge(log.action, log.actionTitle)}
                      </td>

                      {/* Cột 3: Valkyria / Đối tượng */}
                      <td className="py-3.5 px-4">
                        {log.characterName || log.characterId ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm tracking-wide">
                                {log.characterName || "Chiến Binh"}
                              </span>
                              {log.rarity && (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border"
                                  style={{
                                    borderColor: `${rarityColor}50`,
                                    color: rarityColor,
                                    backgroundColor: `${rarityColor}15`,
                                  }}
                                >
                                  {log.rarity}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                              {log.characterId && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(log.id, log.characterId!)}
                                  className="text-slate-400 hover:text-[#3fe9d6] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Sao chép ID nhân vật"
                                >
                                  <span>#{log.characterId}</span>
                                  <span className="text-[10px]">
                                    {copiedId === log.id ? "✓" : "📋"}
                                  </span>
                                </button>
                              )}

                              {roleOption && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-300">
                                    {roleOption.icon} {roleOption.value}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono italic">
                            Toàn bộ danh mục
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Chi tiết thao tác */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="text-xs text-slate-200 leading-relaxed font-sans line-clamp-3">
                          {log.details || log.actionTitle}
                        </div>
                      </td>

                      {/* Cột 5: Người thực hiện */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#3fe9d6]/20 to-[#9b51e0]/20 border border-[#3fe9d6]/30 flex items-center justify-center font-bold text-xs text-[#3fe9d6]">
                            {(log.performedBy?.[0] || "A").toUpperCase()}
                          </div>
                          <div>
                            <div className="font-mono text-xs text-white font-semibold">
                              {log.performedBy}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {log.performedByRole || "Quản Trị Viên"}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Chân trang bảng */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div>
            Hiển thị <span className="text-[#3fe9d6] font-bold">{filteredLogs.length}</span> / {logs.length} bản ghi kiểm toán
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span>Phân hệ Độc Lập</span>
            <span>•</span>
            <span className="text-slate-300">Nhật Ký Dữ Liệu Game</span>
          </div>
        </div>
      </div>
    </div>
  );
}

