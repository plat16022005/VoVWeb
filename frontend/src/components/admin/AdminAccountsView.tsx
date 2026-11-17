"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import StarCanvas from "@/components/common/StarCanvas";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AccountStatsCards from "./AccountStatsCards";
import AccountTable from "./AccountTable";
import AccountLogsTable from "./AccountLogsTable";
import AccountFormModal from "./AccountFormModal";
import ConfirmModal from "./ConfirmModal";
import BanAccountModal from "./BanAccountModal";
import { AdminAccount, BanDetails } from "@/data/adminAccounts";
import { adminService } from "@/services/admin.service";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";

export default function AdminAccountsView() {
  const currentUser = useAuth();
  const isManager = currentUser?.role === "Manager";
  const [activeTab, setActiveTab] = useState<"accounts" | "logs">("accounts");
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    admins: 0,
    pending: 0,
    todayPlayers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);

  // Ban Modal state
  const [banModalAccount, setBanModalAccount] = useState<AdminAccount | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    targetName?: string;
    confirmText?: string;
    isDestructive?: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
  });

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



  // Load Data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const [accList, statsData] = await Promise.all([
        adminService.getAccounts(),
        adminService.getStats(),
      ]);
      setAccounts(accList);
      setStats(statsData);
      if (isRefresh) {
        showToast("info", "Dữ liệu tài khoản đã được làm mới thành công.", "Đồng Bộ Hoàn Tất");
      }
    } catch (err: any) {
      showToast("error", err?.message || "Không thể tải danh sách tài khoản từ Firebase Firestore.", "Lỗi Tải Dữ Liệu");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (isManager) {
      showToast("error", "Tài khoản cấp Manager không có quyền tạo tài khoản người dùng.", "Không Có Quyền");
      return;
    }
    setEditingAccount(null);
    setFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (account: AdminAccount) => {
    if (isManager) {
      showToast("error", "Tài khoản cấp Manager không có quyền chỉnh sửa tài khoản người dùng.", "Không Có Quyền");
      return;
    }
    setEditingAccount(account);
    setFormModalOpen(true);
  };

  // Save Account (Create or Update)
  const handleSaveAccount = async (formData: {
    username: string;
    email: string;
    password?: string;
    role: "Admin" | "Manager" | "Player";
    status?: "active" | "banned" | "pending";
    provider?: "Email" | "Google" | "Guest";
  }) => {
    try {
      if (editingAccount) {
        if (editingAccount.id === currentUser?.id && formData.status === "banned") {
          showToast("error", "Bạn không thể tự khóa tài khoản của chính mình!", "Hành Động Bị Chặn");
          return;
        }
        await adminService.updateAccount(editingAccount.id, formData, {
          username: editingAccount.username,
          email: editingAccount.email,
        });
        showToast(
          "success",
          `Tài khoản "${formData.username || editingAccount.username}" đã được cập nhật.`,
          "Cập Nhật Thành Công"
        );
      } else {
        await adminService.createAccount(formData as any);
        showToast(
          "success",
          `Tài khoản "${formData.username}" đã được khởi tạo thành công trên Firebase.`,
          "Tạo Mới Thành Công"
        );
      }
      setFormModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Đã xảy ra lỗi khi lưu thông tin.", "Lỗi Lưu Tài Khoản");
    }
  };

  // Toggle Ban with specialized reason modal for banning, and confirm for unbanning
  const handleToggleBan = (account: AdminAccount) => {
    if (account.id === currentUser?.id) {
      showToast("error", "Bạn không thể tự khóa tài khoản của chính mình!", "Hành Động Bị Chặn");
      return;
    }
    if (isManager) {
      showToast("error", "Tài khoản cấp Manager không có quyền khóa hoặc mở khóa tài khoản.", "Không Có Quyền");
      return;
    }

    if (account.status === "banned") {
      // Mở khóa tài khoản
      setConfirmConfig({
        isOpen: true,
        title: "Mở Khóa Tài Khoản",
        message: `Bạn có muốn mở khóa tài khoản "${account.username}" (${account.email || "Khách"}) không?`,
        targetName: `${account.username} [${account.id}]`,
        confirmText: "Mở Khóa",
        isDestructive: false,
        action: async () => {
          await adminService.unbanAccount(account.id, {
            username: account.username,
            email: account.email,
          });
          showToast(
            "success",
            `Đã mở khóa tài khoản "${account.username}". Người dùng đã có thể đăng nhập bình thường.`,
            "Mở Khóa Thành Công"
          );
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          loadData();
        },
      });
    } else {
      // Khóa tài khoản: Mở modal chọn điều khoản & nhập ghi chú
      setBanModalAccount(account);
      setIsBanModalOpen(true);
    }
  };

  // Xác nhận khóa tài khoản từ BanAccountModal
  const handleConfirmBanAccount = async (banDetails: BanDetails) => {
    if (!banModalAccount) return;
    await adminService.banAccount(banModalAccount.id, banDetails, {
      username: banModalAccount.username,
      email: banModalAccount.email,
    });
    showToast(
      "error",
      `Đã khóa tài khoản "${banModalAccount.username}". Lý do: ${banDetails.termTitle}.`,
      "Khóa Tài Khoản"
    );
    loadData();
  };

  // Reset Password action
  const handleResetPassword = (account: AdminAccount) => {
    setConfirmConfig({
      isOpen: true,
      title: "Cấp Lại Mật Khẩu Tạm Thời",
      message: `Hệ thống sẽ gửi mã xác thực và đường dẫn thiết lập lại mật khẩu an toàn đến hòm thư: ${account.email}. Bạn có muốn tiếp tục?`,
      targetName: `${account.username} (${account.email})`,
      confirmText: "Gửi Yêu Cầu",
      isDestructive: false,
      action: async () => {
        await adminService.logResetPassword(account);
        showToast(
          "success",
          `Email hướng dẫn đặt lại mật khẩu đã được gửi đến ${account.email}.`,
          "Đặt Lại Mật Khẩu"
        );
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete Account with confirm
  const handleDeleteAccount = (account: AdminAccount) => {
    if (account.id === currentUser?.id) {
      showToast("error", "Bạn không thể tự xóa tài khoản của chính bạn đang đăng nhập!", "Hành Động Bị Chặn");
      return;
    }
    if (isManager) {
      showToast("error", "Tài khoản cấp Manager không có quyền xóa tài khoản người dùng.", "Không Có Quyền");
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: "Xóa Vĩnh Viễn Tài Khoản",
      message: `Hành động này KHÔNG THỂ HOÀN TÁC! Toàn bộ dữ liệu của tài khoản "${account.username}" (${account.id}) sẽ bị xóa vĩnh viễn khỏi hệ thống.`,
      targetName: `${account.username} [${account.id}]`,
      confirmText: "Xác Nhận Xóa",
      isDestructive: true,
      action: async () => {
        await adminService.deleteAccount(account.id, {
          username: account.username,
          email: account.email,
        });
        showToast(
          "info",
          `Đã xóa tài khoản "${account.username}" khỏi hệ thống.`,
          "Đã Xóa Dữ Liệu"
        );
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        loadData();
      },
    });
  };

  // Export CSV helper
  const handleExportCsv = () => {
    if (accounts.length === 0) {
      showToast("error", "Chưa có dữ liệu tài khoản để xuất tệp CSV.");
      return;
    }

    const headers = ["UID", "Username", "Email", "Role", "Status", "CreatedAt", "LastLogin"];
    const rows = accounts.map((a) => [
      a.id,
      `"${a.username}"`,
      a.email && a.email.trim() !== "" ? `"${a.email}"` : `"(Khách)"`,
      a.role,
      a.status,
      `"${a.createdAt}"`,
      `"${a.lastLogin}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VOV_Commanders_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "Đã xuất danh sách tài khoản ra tệp CSV thành công.", "Xuất Tệp");
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

      {/* Main Content Area (offset by sidebar width on lg screens) */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen z-10 w-full">
        {/* Top Header */}
        <AdminHeader
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCreateModal={handleOpenCreateModal}
          onRefresh={() => loadData(true)}
          onExportCsv={handleExportCsv}
          isRefreshing={isRefreshing}
          totalAccounts={accounts.length}
        />

        {/* Page Inner Content Container (Always Centered) */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* KPI Statistics Section */}
          <AccountStatsCards stats={stats} />

          {/* Navigation Sub-tabs: Danh Sách Tài Khoản vs Nhật Ký Quản Trị */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab("accounts");
                }}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "accounts"
                    ? "bg-[#3fe9d6] text-black shadow-[0_0_20px_rgba(63,233,214,0.4)]"
                    : "bg-[#090c21] text-slate-400 hover:text-white border border-white/10 hover:border-white/20"
                }`}
              >
                <span>👥</span>
                <span>Danh Sách Tài Khoản</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    activeTab === "accounts"
                      ? "bg-black/20 text-black font-extrabold"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {stats.total}
                </span>
              </button>

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
                <span>Nhật Ký Quản Trị</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                    activeTab === "logs"
                      ? "bg-black/20 text-black"
                      : "bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30"
                  }`}
                >
                  Logs
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-slate-400 hidden lg:block">
                {activeTab === "accounts"
                  ? "Quản lý thông tin & trạng thái tài khoản"
                  : "Theo dõi toàn bộ lịch sử thao tác của Quản Trị Viên"}
              </div>
              <Link
                href="/admin/permissions"
                onClick={() => soundEngine.playClick()}
                className="px-3 py-2 rounded-xl bg-[#090c21] border border-[#3fe9d6]/30 text-[#3fe9d6] hover:text-white hover:border-[#3fe9d6] hover:bg-[#3fe9d6]/10 transition-all text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Phân Quyền Quản Trị</span>
                <span className="px-1.5 py-0.2 rounded bg-[#3fe9d6]/20 text-[#3fe9d6] text-[10px]">RBAC</span>
              </Link>
            </div>
          </div>

          {/* Nội dung theo Tab đang chọn */}
          {activeTab === "accounts" ? (
            loading ? (
              <div className="p-12 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-slate-400">
                  Đang nạp dữ liệu người dùng từ máy chủ...
                </span>
              </div>
            ) : (
              <AccountTable
                accounts={accounts}
                currentUserId={currentUser?.id}
                onEdit={handleOpenEditModal}
                onToggleBan={handleToggleBan}
                onDelete={handleDeleteAccount}
                onResetPassword={handleResetPassword}
              />
            )
          ) : (
            <AccountLogsTable onRefresh={() => loadData(false)} />
          )}
        </main>

        {/* Admin Footer */}
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>
            © 2026 Valkyria of Veyra · Hệ Thống Quản Trị Trung Tâm (VOV Core)
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Turn-Based RPG</span>
            <span>•</span>
            <span className="text-[#3fe9d6]">Bảo Mật Cao Cấp</span>
          </div>
        </footer>
      </div>

      {/* Account Form Modal (Create / Edit) */}
      <AccountFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSaveAccount}
        editingAccount={editingAccount}
        currentUserId={currentUser?.id}
      />

      {/* Ban Account Modal with Terms selection & Admin note */}
      <BanAccountModal
        isOpen={isBanModalOpen}
        account={banModalAccount}
        onClose={() => {
          setIsBanModalOpen(false);
          setBanModalAccount(null);
        }}
        onConfirm={handleConfirmBanAccount}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        targetName={confirmConfig.targetName}
        confirmText={confirmConfig.confirmText}
        isDestructive={confirmConfig.isDestructive}
      />

      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-sans max-w-md ${
              toast.type === "success"
                ? "bg-[#0c1822]/95 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : toast.type === "error"
                ? "bg-[#1f0e14]/95 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                : "bg-[#0e1428]/95 border-[#3fe9d6]/50 text-[#3fe9d6] shadow-[0_0_20px_rgba(63,233,214,0.3)]"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-current animate-ping" />
            <div>
              {toast.title && <div className="font-bold font-mono uppercase text-[11px] mb-0.5">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
