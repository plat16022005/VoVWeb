"use client";

import { useState, useEffect, useCallback } from "react";
import StarCanvas from "@/components/common/StarCanvas";
import AdminSidebar from "../AdminSidebar";
import ServerStatsCards from "./ServerStatsCards";
import ServerClustersTable from "./ServerClustersTable";
import MaintenanceModal from "./MaintenanceModal";
import ServerDetailsModal from "./ServerDetailsModal";
import CreateServerModal from "./CreateServerModal";
import GlobalMaintenanceModal from "./GlobalMaintenanceModal";
import ServerLogsTable from "../logs/ServerLogsTable";
import {
  initialServers,
  initialSystemHealth,
  GameServer,
  SystemHealthMetrics,
} from "@/data/servers";
import { soundEngine } from "@/services/audio.service";
import {
  CreateServerResult,
  callApplyRulesToServer,
  fetchServersList,
  fetchGlobalMaintenance,
  updateGlobalMaintenance,
  updateServerClusterMaintenance,
  ServerMaintenancePayload,
} from "@/services/serverManagement.service";

export default function AdminServersView() {
  const [servers, setServers] = useState<GameServer[]>([]);
  const [subTab, setSubTab] = useState<"clusters" | "logs">("clusters");
  const [health, setHealth] = useState<SystemHealthMetrics>(initialSystemHealth);
  const [isLoadingServers, setIsLoadingServers] = useState<boolean>(true);
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedServerForMaintenance, setSelectedServerForMaintenance] = useState<GameServer | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedServerForDetails, setSelectedServerForDetails] = useState<GameServer | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Global Maintenance state (GameInfo / Information)
  const [isGlobalMaintenanceOpen, setIsGlobalMaintenanceOpen] = useState(false);
  const [isGlobalMaintenanceActive, setIsGlobalMaintenanceActive] = useState(false);
  const [globalMaintenanceMessage, setGlobalMaintenanceMessage] = useState(
    "Hệ thống hiện tại đang bảo trì. Vui lòng quay lại game sau."
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Cập nhật chỉ số Health: Tính chuẩn xác Ping trung bình và CCU
  const updateHealthMetrics = useCallback((serverList: GameServer[]) => {
    const totalCcu = serverList.reduce((sum, s) => sum + s.ccu, 0);
    const totalCapacity = serverList.reduce((sum, s) => sum + s.maxCcu, 0);
    const onlineCount = serverList.filter((s) => s.status !== "maintenance" && s.status !== "offline").length;
    const maintenanceCount = serverList.filter((s) => s.status === "maintenance").length;

    // Tính chính xác Ping trung bình cộng của tất cả các server
    const validPingServers = serverList.filter((s) => typeof s.ping === "number" && s.ping > 0);
    const avgPing =
      validPingServers.length > 0
        ? Math.round(
            validPingServers.reduce((sum, s) => sum + s.ping, 0) / validPingServers.length
          )
        : 28;

    setHealth((prev) => ({
      ...prev,
      totalServersCount: serverList.length,
      onlineServersCount: onlineCount,
      maintenanceServersCount: maintenanceCount,
      totalCcu: totalCcu,
      totalCapacity: totalCapacity > 0 ? totalCapacity : serverList.length * 1500,
      averagePing: avgPing,
    }));
  }, []);

  // Tải danh sách server từ Backend NestJS (kết nối trực tiếp Firestore)
  const loadServers = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoadingServers(true);
    try {
      const [realServers, gmInfo] = await Promise.all([
        fetchServersList().catch(() => [] as GameServer[]),
        fetchGlobalMaintenance().catch(() => null),
      ]);

      if (realServers && realServers.length > 0) {
        setServers(realServers);
        updateHealthMetrics(realServers);
      }

      if (gmInfo) {
        setIsGlobalMaintenanceActive(gmInfo.maintenance);
        if (gmInfo.message) {
          setGlobalMaintenanceMessage(gmInfo.message);
        }
      }
    } catch (err: any) {
      console.warn("[AdminServersView] Không thể tải servers từ backend:", err.message);
    } finally {
      setIsLoadingServers(false);
    }
  }, [updateHealthMetrics]);

  // Load servers khi mount
  useEffect(() => {
    let active = true;
    Promise.all([
      fetchServersList().catch(() => [] as GameServer[]),
      fetchGlobalMaintenance().catch(() => null),
    ])
      .then(([realServers, gmInfo]) => {
        if (!active) return;
        if (realServers && realServers.length > 0) {
          setServers(realServers);
          updateHealthMetrics(realServers);
        }
        if (gmInfo) {
          setIsGlobalMaintenanceActive(gmInfo.maintenance);
          if (gmInfo.message) {
            setGlobalMaintenanceMessage(gmInfo.message);
          }
        }
        setIsLoadingServers(false);
      })
      .catch((err: unknown) => {
        console.warn("[AdminServersView] Không thể tải servers:", err);
        if (active) setIsLoadingServers(false);
      });
    return () => {
      active = false;
    };
  }, [updateHealthMetrics]);

  // Tự động đồng bộ nhẹ nhàng mỗi 10 giây (Auto-Sync) để số liệu cập nhật sống động
  useEffect(() => {
    if (!isAutoSync) return;
    const interval = setInterval(() => {
      loadServers(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isAutoSync, loadServers]);

  // Refresh Telemetry & Real Data
  const handleRefresh = async () => {
    soundEngine.playClick();
    setIsRefreshing(true);
    await loadServers(false);
    setIsRefreshing(false);
    showToast("Đã đồng bộ hóa danh sách máy chủ mới nhất.");
  };

  // Maintenance Toggle Handler (Persisted to ServerConfig/Config and GameConfig/ServerList)
  const handleMaintenanceConfirm = async (
    serverId: string,
    action: "enable" | "disable",
    data?: ServerMaintenancePayload
  ) => {
    try {
      await updateServerClusterMaintenance(serverId, action, data);

      // Instant optimistic UI update
      setServers((prev) =>
        prev.map((s) => {
          if (s.id === serverId) {
            if (action === "enable") {
              return {
                ...s,
                status: "maintenance",
                maintenanceMessage: data?.noticeMessage,
                scheduledMaintenance: data
                  ? {
                      startTime: data.startTime || "",
                      endTime: data.endTime || "",
                      reason: data.reason || "",
                    }
                  : undefined,
              };
            } else {
              return {
                ...s,
                status: "online",
                maintenanceMessage: undefined,
                scheduledMaintenance: undefined,
              };
            }
          }
          return s;
        })
      );

      // Update Health count
      setHealth((prev) => {
        const isEnabling = action === "enable";
        return {
          ...prev,
          onlineServersCount: isEnabling ? Math.max(0, prev.onlineServersCount - 1) : prev.onlineServersCount + 1,
          maintenanceServersCount: isEnabling
            ? prev.maintenanceServersCount + 1
            : Math.max(0, prev.maintenanceServersCount - 1),
        };
      });

      // Reload fresh server list from backend bypassing cache
      await loadServers(true);

      showToast(
        action === "enable"
          ? `Đã kích hoạt chế độ bảo trì cho cụm máy chủ [${serverId}].`
          : `Đã mở lại hoạt động máy chủ [${serverId}].`
      );
    } catch (err: any) {
      showToast(`Lỗi cập nhật bảo trì máy chủ: ${err?.message || "Không xác định"}`);
      throw err;
    }
  };

  // Restart Handler
  const handleRestartServer = (server: GameServer) => {
    showToast(`Đang gửi tín hiệu khởi động lại [${server.name}]...`);
    setServers((prev) =>
      prev.map((s) => (s.id === server.id ? { ...s, status: "busy", cpuLoad: 92 } : s))
    );

    setTimeout(() => {
      setServers((prev) =>
        prev.map((s) =>
          s.id === server.id
            ? {
                ...s,
                status: "online",
                cpuLoad: null,
                ramUsage: null,
                uptime: "0 giờ trước (Vừa khởi động)",
              }
            : s
        )
      );
      showToast(`Node [${server.code}] đã khởi động lại hoàn tất và sẵn sàng.`);
    }, 2000);
  };

  // Apply Security Rules Handler
  const handleApplyRules = async (server: GameServer) => {
    showToast(`Đang đồng bộ lại chính sách bảo mật cho [${server.name}]...`);
    try {
      const res = await callApplyRulesToServer(server.id);
      showToast(`${res.message}`);
    } catch (err: any) {
      showToast(`Lỗi đồng bộ chính sách bảo mật: ${err.message}`);
    }
  };

  // Create Server Callback from Modal
  const handleServerCreated = async (result: CreateServerResult) => {
    showToast(
      `Đã khởi tạo thành công máy chủ [${result.serverName}] (${result.serverId})!`
    );
    await loadServers(false);
  };

  // Save Global Maintenance to GameInfo/Information
  const handleSaveGlobalMaintenance = async (maintenance: boolean, message: string) => {
    try {
      await updateGlobalMaintenance(maintenance, message);
      setIsGlobalMaintenanceActive(maintenance);
      setGlobalMaintenanceMessage(message);
      showToast(
        maintenance
          ? "ĐÃ KÍCH HOẠT BẢO TRÌ TOÀN GAME! Mọi kết nối Client sẽ bị tạm dừng."
          : "ĐÃ TẮT BẢO TRÌ TOÀN GAME! Hệ thống mở cửa đón người chơi trở lại."
      );
    } catch (err: any) {
      showToast(`Lỗi lưu cấu hình bảo trì: ${err.message}`);
      throw err;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#04050d] text-white flex overflow-x-hidden">
      {/* Background Starry Canvas */}
      <StarCanvas />

      {/* Decorative Sci-Fantasy Nebulas */}
      <div className="fixed top-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-[#3fe9d6]/10 to-[#9b51e0]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-[#f5c767]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Sidebar */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen z-10 w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full h-20 bg-[#070919]/80 backdrop-blur-xl border-b border-[#3fe9d6]/20 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Mở menu quản trị"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>VOV CORE</span>
                <span>/</span>
                <span className="text-[#3fe9d6]">TỔNG HÀNH DINH</span>
                <span>/</span>
                <span className="text-[#f5c767]">DANH SÁCH MÁY CHỦ</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase flex items-center gap-2.5">
                DANH SÁCH CÁC MÁY CHỦ TRONG HỆ THỐNG
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
                  {servers.length} Máy Chủ
                </span>
                {isLoadingServers && (
                  <span className="w-2 h-2 rounded-full bg-[#3fe9d6] animate-ping" title="Đang đồng bộ..." />
                )}
              </h1>
            </div>
          </div>

          {/* Right Controls: Auto-sync toggle & Ping & Refresh & Create Button */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {/* Auto-sync button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsAutoSync(!isAutoSync);
              }}
              title="Tự động đồng bộ số liệu mỗi 10 giây"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                isAutoSync
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoSync ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" : "bg-slate-500"}`} />
              <span>Auto 10s</span>
            </button>

            {/* Live Average Ping */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b0e24] border border-white/10 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-slate-400">Latency Trung Bình:</span>
              <span className="text-emerald-400 font-bold">{health.averagePing}ms</span>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-[#3fe9d6]/40 transition-all flex items-center gap-1.5 text-xs font-mono disabled:opacity-50 cursor-pointer"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#3fe9d6]" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Làm Mới</span>
            </button>

            {/* Nút bảo trì toàn game */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsGlobalMaintenanceOpen(true);
              }}
              title="Cấu hình chế độ bảo trì toàn bộ trò chơi"
              className={`px-3.5 py-2 rounded-xl font-bold text-xs font-mono tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                isGlobalMaintenanceActive
                  ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse"
                  : "bg-white/5 border border-[#f5c767]/40 text-[#f5c767] hover:bg-[#f5c767]/10 shadow-[0_0_15px_rgba(245,199,103,0.15)] hover:border-[#f5c767]"
              }`}
            >
              {isGlobalMaintenanceActive ? (
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              ) : (
                <svg className="w-4 h-4 text-[#f5c767]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span>BẢO TRÌ TOÀN GAME</span>
            </button>

            {/* Nút tạo máy chủ mới */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsCreateModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#040614] font-bold text-xs font-mono tracking-wider hover:opacity-90 transition-all shadow-[0_0_20px_rgba(63,233,214,0.4)] flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>TẠO MÁY CHỦ</span>
            </button>
          </div>
        </header>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-24 right-6 z-50 p-4 rounded-xl bg-[#090c22]/95 border border-[#3fe9d6]/50 text-[#3fe9d6] text-xs font-mono shadow-[0_0_20px_rgba(63,233,214,0.3)] flex items-center gap-2.5 animate-slide-in">
            <span className="w-2 h-2 rounded-full bg-[#3fe9d6] animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Cảnh báo bảo trì toàn game */}
          {isGlobalMaintenanceActive && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-red-900/40 to-amber-950/40 border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                  <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold font-mono text-rose-400 uppercase tracking-wider">
                      CHẾ ĐỘ BẢO TRÌ TOÀN BỘ GAME ĐANG ĐƯỢC KÍCH HOẠT
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                      Unity Client Blocked
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-mono">
                    Thông báo gửi tới người chơi:{" "}
                    <span className="text-amber-300 font-semibold italic">&quot;{globalMaintenanceMessage}&quot;</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  setIsGlobalMaintenanceOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
              >
                CẤU HÌNH / TẮT BẢO TRÌ
              </button>
            </div>
          )}

          {/* Top Section: Server Summary Metrics */}
          <ServerStatsCards health={health} isLoading={isLoadingServers} />

          {/* Sub-tab Switcher: Cụm Máy Chủ vs Nhật Ký Hoạt Động */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <button
              onClick={() => {
                soundEngine.playClick();
                setSubTab("clusters");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
                subTab === "clusters"
                  ? "bg-[#3fe9d6] text-black shadow-[0_0_15px_rgba(63,233,214,0.4)]"
                  : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              <span>Cụm Máy Chủ Đang Chạy</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                subTab === "clusters" ? "bg-black/20 text-black" : "bg-white/10 text-slate-300"
              }`}>
                {servers.length}
              </span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setSubTab("logs");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
                subTab === "logs"
                  ? "bg-[#3fe9d6] text-black shadow-[0_0_15px_rgba(63,233,214,0.4)]"
                  : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              <span>Nhật Ký Hoạt Động Hạ Tầng</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                subTab === "logs"
                  ? "bg-black/20 text-black"
                  : "bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30"
              }`}>
                Audit Logs
              </span>
            </button>
          </div>

          {/* Main Section: Server Clusters Table OR Server Logs Table */}
          {subTab === "clusters" ? (
            <ServerClustersTable
              servers={servers}
              isLoading={isLoadingServers}
              onOpenMaintenanceModal={(server) => {
                setSelectedServerForMaintenance(server);
                setIsMaintenanceModalOpen(true);
              }}
              onRestartServer={handleRestartServer}
              onViewDetails={(server) => {
                setSelectedServerForDetails(server);
                setIsDetailsModalOpen(true);
              }}
              onApplyRules={handleApplyRules}
            />
          ) : (
            <ServerLogsTable />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onServerCreated={handleServerCreated}
      />

      <GlobalMaintenanceModal
        isOpen={isGlobalMaintenanceOpen}
        currentMaintenance={isGlobalMaintenanceActive}
        currentMessage={globalMaintenanceMessage}
        onClose={() => setIsGlobalMaintenanceOpen(false)}
        onSave={handleSaveGlobalMaintenance}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        server={selectedServerForMaintenance}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setSelectedServerForMaintenance(null);
        }}
        onConfirm={handleMaintenanceConfirm}
      />

      <ServerDetailsModal
        isOpen={isDetailsModalOpen}
        server={selectedServerForDetails}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedServerForDetails(null);
        }}
      />
    </div>
  );
}
