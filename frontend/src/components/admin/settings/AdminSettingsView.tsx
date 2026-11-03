"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import StarCanvas from "@/components/common/StarCanvas";
import AdminSidebar from "../AdminSidebar";
import TermsTab from "./TermsTab";
import GameInfoTab from "./GameInfoTab";
import {
  settingsService,
  TermItem,
  GameInfoConfig,
  DEFAULT_TERMS_LIST,
  DEFAULT_POLICY_LIST,
  DEFAULT_GAME_INFO,
} from "@/services/settings.service";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";

type ActiveTab = "terms" | "policy" | "gameInfo";

export default function AdminSettingsView() {
  const currentUser = useAuth();
  const isAdmin = currentUser?.role === "Admin";
  const [activeTab, setActiveTab] = useState<ActiveTab>("terms");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [termsList, setTermsList] = useState<TermItem[]>(DEFAULT_TERMS_LIST);
  const [policyList, setPolicyList] = useState<TermItem[]>(DEFAULT_POLICY_LIST);
  const [gameInfo, setGameInfo] = useState<GameInfoConfig>(DEFAULT_GAME_INFO);

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

  // Tải cấu hình từ Firestore
  const loadAllSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [tData, pData, gData] = await Promise.all([
        settingsService.getTermsList(),
        settingsService.getPolicyList(),
        settingsService.getGameInfo(),
      ]);
      setTermsList(tData);
      setPolicyList(pData);
      setGameInfo(gData);
    } catch {
      showToast("error", "Không thể tải đầy đủ cấu hình từ Firebase Firestore.", "Lỗi Tải Dữ Liệu");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  // Handlers lưu từng phần
  const handleSaveTerms = async (
    items: TermItem[],
    meta: { version: string; note: string }
  ) => {
    setSaving(true);
    try {
      await settingsService.saveTermsList(items, {
        ...meta,
        updatedBy: currentUser?.email || "Admin",
      });
      setTermsList(items);
      showToast(
        "success",
        `Điều khoản phiên bản ${meta.version} (${items.length} mục) đã được lưu vào GameConfig/Terms và ghi nhật ký Logs.`,
        "Xuất Bản Thành Công"
      );
    } catch (err: any) {
      showToast("error", err?.message || "Lỗi khi lưu điều khoản dịch vụ.", "Lỗi Lưu Cấu Hình");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicy = async (
    items: TermItem[],
    meta: { version: string; note: string }
  ) => {
    setSaving(true);
    try {
      await settingsService.savePolicyList(items, {
        ...meta,
        updatedBy: currentUser?.email || "Admin",
      });
      setPolicyList(items);
      showToast(
        "success",
        `Chính sách phiên bản ${meta.version} (${items.length} mục) đã được lưu vào GameConfig/Policy và ghi nhật ký Logs.`,
        "Xuất Bản Thành Công"
      );
    } catch (err: any) {
      showToast("error", err?.message || "Lỗi khi lưu chính sách dịch vụ.", "Lỗi Lưu Cấu Hình");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGameInfo = async (data: Partial<GameInfoConfig>) => {
    setSaving(true);
    try {
      await settingsService.updateGameInfo(data);
      setGameInfo((prev) => ({ ...prev, ...data }));
      showToast(
        "success",
        "Thông tin game và link tải đã được lưu vào Firestore.",
        "Cập Nhật Thành Công"
      );
    } catch (err: any) {
      showToast("error", err?.message || "Lỗi khi lưu thông số game.", "Lỗi Lưu Cấu Hình");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "terms", title: "Điều Khoản Dịch Vụ", icon: "📜", badge: "Terms" },
    { id: "policy", title: "Chính Sách & Bảo Mật", icon: "🛡️", badge: "Policy" },
    { id: "gameInfo", title: "Thông Tin Game & Link Tải", icon: "⚔️", badge: "Game Info" },
  ] as const;

  return (
    <div className="relative min-h-screen bg-[#060714] text-slate-100 flex overflow-x-hidden selection:bg-[#3fe9d6]/30 selection:text-[#3fe9d6]">
      {/* Dynamic Starry Canvas Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <StarCanvas />
      </div>

      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (offset by sidebar width on lg screens) */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen z-10 w-full min-w-0">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 w-full h-20 bg-[#070919]/80 backdrop-blur-xl border-b border-[#3fe9d6]/20 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
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
                <span className="text-[#3fe9d6]">TỔNG HÀNH DINH</span>
                <span>/</span>
                <span className="text-[#f5c767]">CẤU HÌNH HỆ THỐNG</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-rajdhani)] text-white tracking-wide uppercase flex items-center gap-2.5">
                CẤU HÌNH HỆ THỐNG & ĐIỀU KHOẢN
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30">
                  Firebase Live
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEngine.playClick();
                loadAllSettings();
              }}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tải lại toàn bộ cấu hình từ Firestore"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Làm Mới</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as ActiveTab);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-mono whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id
                    ? "bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_15px_rgba(63,233,214,0.2)] font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.title}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-white/10 text-slate-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          {loading ? (
            <div className="p-16 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-400">
                Đang nạp cấu hình hệ thống từ Firebase Firestore...
              </span>
            </div>
          ) : (
            <div>
              {activeTab === "terms" && (
                <TermsTab
                  type="terms"
                  title="Quản Lý Điều Khoản & Dịch vụ"
                  documentPath="GameConfig/Terms"
                  idPrefix="term"
                  itemName="Điều Khoản"
                  termsList={termsList}
                  isAdmin={isAdmin}
                  onSave={handleSaveTerms}
                  saving={saving}
                  onLoadHistory={() => settingsService.getTermsHistory()}
                />
              )}
              {activeTab === "policy" && (
                <TermsTab
                  type="policy"
                  title="Quản Lý Chính Sách & Quyền Riêng Tư"
                  documentPath="GameConfig/Policy"
                  idPrefix="policy"
                  itemName="Chính Sách"
                  termsList={policyList}
                  isAdmin={isAdmin}
                  onSave={handleSavePolicy}
                  saving={saving}
                  onLoadHistory={() => settingsService.getPolicyHistory()}
                />
              )}
              {activeTab === "gameInfo" && (
                <GameInfoTab
                  gameInfo={gameInfo}
                  isAdmin={isAdmin}
                  onSave={handleSaveGameInfo}
                  saving={saving}
                />
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>
            © 2026 Valkyria of Veyra · Cấu Hình Hệ Thống Trung Tâm
          </div>
          <div className="flex items-center gap-4">
            <span>Turn-Based RPG</span>
            <span>•</span>
            <span className="text-[#3fe9d6]">Quyền Hạn: {currentUser?.role || "Khách"}</span>
          </div>
        </footer>
      </div>

      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-sans max-w-md ${toast.type === "success"
                ? "bg-[#0c1822]/95 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : toast.type === "error"
                  ? "bg-[#1f0e14]/95 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                  : "bg-[#0b1324]/95 border-sky-500/50 text-sky-200 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
              }`}
          >
            <div className="text-lg">
              {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
            </div>
            <div>
              {toast.title && <div className="font-bold font-mono text-xs mb-0.5">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
