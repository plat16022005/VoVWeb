"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import StarCanvas from "@/components/common/StarCanvas";
import AdminSidebar from "../AdminSidebar";
import AccountPermissionsModal from "../AccountPermissionsModal";
import PermissionsOverviewCards from "./PermissionsOverviewCards";
import ManagerPermissionsTable from "./ManagerPermissionsTable";
import PermissionsGroupsDirectory from "./PermissionsGroupsDirectory";
import PermissionsAuditLogTab from "./PermissionsAuditLogTab";
import { AdminAccount } from "@/data/adminAccounts";
import { PERMISSION_GROUPS } from "@/data/permissions";
import { adminService } from "@/services/admin.service";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";

export default function AdminPermissionsView() {
  const currentUser = useAuth();
  const [activeTab, setActiveTab] = useState<"managers" | "directory" | "logs">("managers");
  const [managers, setManagers] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal configure state
  const [selectedManager, setSelectedManager] = useState<AdminAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title?: string;
    message: string;
  } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string, title?: string) => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToast({ type, message, title });
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 4000);
    },
    []
  );

  // Load Managers data
  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);

      try {
        const accounts = await adminService.getAccounts();
        const managerList = accounts.filter((a) => a.role === "Manager");
        setManagers(managerList);

        if (isRefresh) {
          showToast("info", "Dữ liệu phân quyền Quản Lý đã được cập nhật.", "Đồng Bộ Hoàn Tất");
        }
      } catch (err: any) {
        showToast(
          "error",
          err?.message || "Không thể tải danh sách tài khoản Quản Lý từ hệ thống.",
          "Lỗi Tải Dữ Liệu"
        );
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal
  const handleOpenConfigure = (manager: AdminAccount) => {
    setSelectedManager(manager);
    setIsModalOpen(true);
  };

  // Save permissions
  const handleSavePermissions = async (data: {
    permissionGroups: string[];
    permissions: string[];
  }) => {
    if (!selectedManager) return;
    try {
      await adminService.updateAccountPermissions(selectedManager.id, data, {
        username: selectedManager.username,
        email: selectedManager.email,
      });

      // Update in memory
      setManagers((prev) =>
        prev.map((m) =>
          m.id === selectedManager.id
            ? { ...m, permissionGroups: data.permissionGroups, permissions: data.permissions }
            : m
        )
      );

      showToast(
        "success",
        `Đã cập nhật phân quyền quản trị cho ${selectedManager.username}. Phân quyền tài khoản bảo mật.`,
        "Phân Quyền Thành Công"
      );
    } catch (err: any) {
      showToast("error", err?.message || "Lỗi khi lưu phân quyền", "Thất Bại");
      throw err;
    }
  };

  // Compute stats
  const assignedCount = managers.filter(
    (m) => m.permissionGroups && m.permissionGroups.length > 0
  ).length;
  const unassignedCount = managers.length - assignedCount;
  const totalSubPerms = PERMISSION_GROUPS.reduce(
    (acc, g) => acc + g.subPermissions.length,
    0
  );

  return (
    <div className="relative min-h-screen bg-[#060814] text-white flex flex-col selection:bg-[#3fe9d6]/30 selection:text-white">
      {/* Dynamic Starfield Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <StarCanvas />
      </div>

      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 z-10 transition-all">
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full h-20 bg-[#070919]/80 backdrop-blur-xl border-b border-[#3fe9d6]/20 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
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
                <span className="text-[#3fe9d6]">HỆ THỐNG</span>
                <span>/</span>
                <span className="text-[#f5c767]">PHÂN QUYỀN QUẢN TRỊ</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase flex items-center gap-2.5">
                PHÂN QUYỀN TÀI KHOẢN (MANAGER RBAC)
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {managers.length} Quản Lý
                </span>
              </h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick link to Accounts */}
            <Link
              href="/admin/accounts"
              onClick={() => soundEngine.playClick()}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all text-xs font-mono"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Quản Lý Tài Khoản</span>
            </Link>

            {/* Refresh Button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                loadData(true);
              }}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-mono flex items-center gap-2 cursor-pointer"
              title="Làm mới danh sách phân quyền"
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
          </div>
        </header>

        {/* Toast Notification Banner */}
        {toast && (
          <div className="fixed top-24 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
            <div
              className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3 ${
                toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                  : toast.type === "error"
                  ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
                  : "bg-[#090c21]/95 border-[#3fe9d6]/40 text-[#3fe9d6]"
              }`}
            >
              <span className="text-xl">
                {toast.type === "success" ? "✓" : toast.type === "error" ? "⚠️" : "ℹ"}
              </span>
              <div className="flex-1 text-xs font-mono">
                {toast.title && <div className="font-bold mb-0.5">{toast.title}</div>}
                <div>{toast.message}</div>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-white/60 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
          {/* Overview Statistics Cards */}
          <PermissionsOverviewCards
            totalManagers={managers.length}
            assignedManagers={assignedCount}
            unassignedManagers={unassignedCount}
            totalGroups={PERMISSION_GROUPS.length}
            totalSubPermissions={totalSubPerms}
          />

          {/* Sub-Tabs Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              {/* Tab 1: Managers & Permissions */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab("managers");
                }}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "managers"
                    ? "bg-[#3fe9d6] text-black shadow-[0_0_20px_rgba(63,233,214,0.4)]"
                    : "bg-[#090c21] text-slate-400 hover:text-white border border-white/10 hover:border-white/20"
                }`}
              >
                <span>🛡️</span>
                <span>Quản Lý & Phân Quyền</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                    activeTab === "managers"
                      ? "bg-black/20 text-black"
                      : "bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30"
                  }`}
                >
                  {managers.length}
                </span>
              </button>

              {/* Tab 2: System Groups Directory */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab("directory");
                }}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "directory"
                    ? "bg-[#3fe9d6] text-black shadow-[0_0_20px_rgba(63,233,214,0.4)]"
                    : "bg-[#090c21] text-slate-400 hover:text-white border border-white/10 hover:border-white/20"
                }`}
              >
                <span>📑</span>
                <span>Danh Mục Nhóm & Quyền</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                    activeTab === "directory"
                      ? "bg-black/20 text-black"
                      : "bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30"
                  }`}
                >
                  {PERMISSION_GROUPS.length} Nhóm
                </span>
              </button>

              {/* Tab 3: Audit Logs */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab("logs");
                }}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "logs"
                    ? "bg-[#3fe9d6] text-black shadow-[0_0_20px_rgba(63,233,214,0.4)]"
                    : "bg-[#090c21] text-slate-400 hover:text-white border border-white/10 hover:border-white/20"
                }`}
              >
                <span>📜</span>
                <span>Nhật Ký Phân Quyền</span>
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400 hidden sm:block">
              {activeTab === "managers"
                ? "Thiết lập nhóm lớn & quyền con cho từng Quản Lý"
                : activeTab === "directory"
                ? "Cấu trúc phân quyền 2 cấp độ lưu trữ tại Subcollection"
                : "Lịch sử Admin cập nhật phân quyền hệ thống"}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "managers" ? (
            loading ? (
              <div className="p-12 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-slate-400">
                  Đang nạp danh sách Quản Lý từ hệ thống...
                </span>
              </div>
            ) : (
              <ManagerPermissionsTable
                managers={managers}
                onConfigurePermissions={handleOpenConfigure}
              />
            )
          ) : activeTab === "directory" ? (
            <PermissionsGroupsDirectory managers={managers} />
          ) : (
            <PermissionsAuditLogTab onRefresh={() => loadData(false)} />
          )}
        </main>

        {/* Footer */}
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>
            © 2026 Valkyria of Veyra · Trung Tâm Phân Quyền Quản Trị (RBAC Subsystem)
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Turn-Based RPG</span>
            <span>•</span>
            <span className="text-[#3fe9d6]">Bảo Mật Subcollection</span>
          </div>
        </footer>
      </div>

      {/* Permissions Configuration Modal */}
      <AccountPermissionsModal
        isOpen={isModalOpen}
        account={selectedManager}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedManager(null);
        }}
        onSave={handleSavePermissions}
      />
    </div>
  );
}

