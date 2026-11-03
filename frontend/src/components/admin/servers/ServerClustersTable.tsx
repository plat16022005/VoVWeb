"use client";

import { useState } from "react";
import { GameServer, ServerStatus } from "@/data/servers";
import { soundEngine } from "@/services/audio.service";

interface ServerClustersTableProps {
  servers: GameServer[];
  isLoading?: boolean;
  onOpenMaintenanceModal: (server: GameServer) => void;
  onRestartServer: (server: GameServer) => void;
  onViewDetails: (server: GameServer) => void;
  onApplyRules: (server: GameServer) => void;
}

export default function ServerClustersTable({
  servers,
  isLoading = false,
  onOpenMaintenanceModal,
  onRestartServer,
  onViewDetails,
  onApplyRules,
}: ServerClustersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  // Filter servers
  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.ipAddress.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || server.status === statusFilter;
    const matchesRegion = regionFilter === "all" || server.region === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  const getStatusBadge = (status: ServerStatus) => {
    switch (status) {
      case "online":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Hoạt động
          </span>
        );
      case "busy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Tải cao (Busy)
          </span>
        );
      case "crowded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            Đầy (Crowded)
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#9b51e0]/15 text-[#9b51e0] border border-[#9b51e0]/40 shadow-[0_0_10px_rgba(155,81,224,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9b51e0] animate-pulse" />
            Đang bảo trì
          </span>
        );
      case "offline":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Ngoại tuyến
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-[#090c22]/80 backdrop-blur-md border border-[#3fe9d6]/20 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      {/* Header controls & Filters */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase flex items-center gap-2">
            DANH SÁCH CỤM MÁY CHỦ THẾ GIỚI VEYRA
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
              {filteredServers.length} Nodes
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát thời gian thực các server game chạy trên nền tảng Unity Dedicated Server.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mã, IP..."
              className="w-full bg-[#040614] border border-white/10 rounded-xl px-3 py-1.5 pl-8 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6]/50 transition-all"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#040614] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#3fe9d6]/50 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="online">Hoạt động</option>
            <option value="busy">Tải cao (Busy)</option>
            <option value="maintenance">Đang bảo trì</option>
            <option value="offline">Ngoại tuyến</option>
          </select>

          {/* Region filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-[#040614] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#3fe9d6]/50 cursor-pointer"
          >
            <option value="all">Mọi khu vực</option>
            <option value="Đông Nam Á">Đông Nam Á</option>
            <option value="Đông Bắc Á">Đông Bắc Á</option>
            <option value="Bắc Mỹ">Bắc Mỹ</option>
            <option value="Nội Bộ / Test">Nội Bộ / Test</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#060818]/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4 sm:px-6">Cụm Máy Chủ / Mã Node</th>
              <th className="py-3 px-4">Khu Vực & DC</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4">CCU / Sức Chứa</th>
              <th className="py-3 px-4">Tải Node (CPU / RAM)</th>
              <th className="py-3 px-4">Ping</th>
              <th className="py-3 px-4">Uptime</th>
              <th className="py-3 px-4 sm:px-6 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs font-mono">
            {isLoading && servers.length === 0 ? (
              // Skeleton rows
              [1, 2, 3].map((idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4 sm:px-6">
                    <div className="w-36 h-3.5 bg-white/10 rounded mb-1.5" />
                    <div className="w-24 h-2.5 bg-white/5 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-20 h-3 bg-white/10 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-16 h-5 bg-white/10 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-24 h-3 bg-white/10 rounded mb-1" />
                    <div className="w-full h-1 bg-white/5 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-16 h-3 bg-white/10 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-10 h-3 bg-white/10 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-14 h-3 bg-white/10 rounded" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="w-16 h-6 bg-white/10 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredServers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                    </svg>
                    <span>Chưa có cụm máy chủ nào được khởi tạo. Bấm <strong>TẠO MÁY CHỦ</strong> để bắt đầu.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredServers.map((server) => {
                const loadPercent = Math.round((server.ccu / server.maxCcu) * 100);

                return (
                  <tr
                    key={server.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Server Name & Code */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex flex-col">
                        <span className="font-sans font-bold text-slate-100 group-hover:text-[#3fe9d6] transition-colors">
                          {server.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="text-[#f5c767] font-semibold">[{server.code}]</span>
                          <span>•</span>
                          <span>
                            {server.ipAddress ? `${server.ipAddress}:${server.port}` : "Firestore Native Shard"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Region */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{server.region}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {server.location}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(server.status)}
                    </td>

                    {/* CCU / Capacity bar */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="font-bold text-white">
                          {server.ccu.toLocaleString("en-US")}{" "}
                          <span className="font-normal text-slate-400">/ {server.maxCcu.toLocaleString("en-US")}</span>
                        </span>
                        <span
                          className={`font-semibold ${
                            loadPercent > 85
                              ? "text-rose-400"
                              : loadPercent > 65
                              ? "text-amber-400"
                              : "text-[#3fe9d6]"
                          }`}
                        >
                          {loadPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            loadPercent > 85
                              ? "bg-rose-500"
                              : loadPercent > 65
                              ? "bg-amber-400"
                              : "bg-[#3fe9d6]"
                          }`}
                          style={{ width: `${loadPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* CPU & RAM */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 text-[11px]">
                        <div>
                          <span className="text-slate-500">CPU:</span>{" "}
                          <span className={server.cpuLoad && server.cpuLoad > 80 ? "text-rose-400 font-bold" : "text-slate-300"}>
                            {server.cpuLoad !== null ? `${server.cpuLoad}%` : "--"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">RAM:</span>{" "}
                          <span className={server.ramUsage && server.ramUsage > 80 ? "text-amber-400 font-bold" : "text-slate-300"}>
                            {server.ramUsage !== null ? `${server.ramUsage}%` : "--"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Ping */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          server.ping < 50
                            ? "text-emerald-400"
                            : server.ping < 100
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {server.ping}ms
                      </span>
                    </td>

                    {/* Uptime */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {server.uptime}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Maintenance Toggle button */}
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            onOpenMaintenanceModal(server);
                          }}
                          title={server.status === "maintenance" ? "Mở lại máy chủ" : "Chuyển sang bảo trì"}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                            server.status === "maintenance"
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-[#9b51e0]/10 hover:bg-[#9b51e0]/20 text-[#9b51e0] border border-[#9b51e0]/30"
                          }`}
                        >
                          {server.status === "maintenance" ? "Mở Lại" : "Bảo Trì"}
                        </button>

                        {/* Restart Button */}
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            onRestartServer(server);
                          }}
                          title="Khởi động lại node"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>

                        {/* Apply Rules Button */}
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            onApplyRules(server);
                          }}
                          title="Cập nhật Rules bảo mật (applyRulesToServer)"
                          className="p-1.5 rounded-lg bg-[#3fe9d6]/10 hover:bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/30 transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            onViewDetails(server);
                          }}
                          title="Xem chi tiết node"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#3fe9d6]/20 text-slate-300 hover:text-[#3fe9d6] border border-white/10 hover:border-[#3fe9d6]/30 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
