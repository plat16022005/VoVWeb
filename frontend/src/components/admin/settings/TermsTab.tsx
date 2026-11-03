"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TermItem,
  TermHistoryLog,
  DEFAULT_TERMS_LIST,
  settingsService,
} from "@/services/settings.service";
import { soundEngine } from "@/services/audio.service";
import { useAuth } from "@/services/auth.service";

interface TermsTabProps {
  termsList: TermItem[];
  isAdmin: boolean;
  onSave: (items: TermItem[], meta: { version: string; note: string }) => Promise<void>;
  saving: boolean;
  type?: "terms" | "policy";
  title?: string;
  documentPath?: string;
  idPrefix?: string;
  itemName?: string;
  onLoadHistory?: () => Promise<TermHistoryLog[]>;
}

export default function TermsTab({
  termsList,
  isAdmin,
  onSave,
  saving,
  type = "terms",
  title,
  documentPath,
  idPrefix = "term",
  itemName,
  onLoadHistory,
}: TermsTabProps) {
  const currentUser = useAuth();

  const [items, setItems] = useState<TermItem[]>([]);
  const [activeView, setActiveView] = useState<"edit" | "preview" | "history">("edit");
  const [searchQuery, setSearchQuery] = useState("");

  const tabTitle = title || (type === "policy" ? "Quản Lý Chính Sách & Quyền Riêng Tư" : "Quản Lý Điều Khoản & Dịch vụ");
  const docPath = documentPath || (type === "policy" ? "GameConfig/Policy" : "GameConfig/Terms");
  const nameLabel = itemName || (type === "policy" ? "Chính Sách" : "Điều Khoản");
  const prefix = idPrefix || (type === "policy" ? "policy" : "term");
  const tabIcon = type === "policy" ? "🛡️" : "📜";

  // History state
  const [historyList, setHistoryList] = useState<TermHistoryLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal Confirm & Version Note
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishVersion, setPublishVersion] = useState("v1.1");
  const [publishNote, setPublishNote] = useState("");

  // Đồng bộ props vào state
  useEffect(() => {
    if (termsList && termsList.length > 0) {
      setItems(termsList);
    } else {
      setItems(DEFAULT_TERMS_LIST);
    }
  }, [termsList]);

  // Tải lịch sử cập nhật
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const logs = onLoadHistory ? await onLoadHistory() : await settingsService.getTermsHistory();
      setHistoryList(logs);
      if (logs.length > 0 && logs[0].version) {
        const lastVer = logs[0].version;
        const match = lastVer.match(/v?(\d+)\.(\d+)/i);
        if (match) {
          const major = match[1];
          const minor = parseInt(match[2], 10) + 1;
          setPublishVersion(`v${major}.${minor}`);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải lịch sử cập nhật:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [onLoadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);


  // Sinh ID kế tiếp tự động
  const generateNextId = (currentItems: TermItem[]): string => {
    let maxNum = 0;
    const regex = new RegExp(`^${prefix}(\\d+)$`, "i");
    currentItems.forEach((item) => {
      const match = item.id.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = Math.max(maxNum + 1, currentItems.length + 1);
    return `${prefix}${String(nextNum).padStart(2, "0")}`;
  };

  // Thêm mới một mục
  const handleAddTerm = () => {
    if (!isAdmin) return;
    soundEngine.playClick();
    const newId = generateNextId(items);
    const newItem: TermItem = {
      id: newId,
      Title: "",
      Content: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Thay đổi thuộc tính của 1 mục
  const handleItemChange = (index: number, field: keyof TermItem, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Xóa một mục & Tự động đánh số lại mã
  const handleDeleteTerm = (index: number) => {
    if (!isAdmin) return;
    soundEngine.playClick();
    const target = items[index];
    const confirmName = target.Title ? `"${target.Title}" (${target.id})` : target.id;
    if (confirm(`Bạn có chắc chắn muốn xóa ${nameLabel.toLowerCase()} ${confirmName}?`)) {
      setItems((prev) => {
        const filtered = prev.filter((_, i) => i !== index);
        return filtered.map((it, idx) => ({
          ...it,
          id: `${prefix}${String(idx + 1).padStart(2, "0")}`,
        }));
      });
    }
  };

  // Di chuyển thứ tự (Lên / Xuống) & Tự Động Đánh Số Lại Mã Để Bảo Toàn Thứ Tự
  const handleMove = (index: number, direction: "up" | "down") => {
    if (!isAdmin) return;
    soundEngine.playClick();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated.map((it, idx) => ({
        ...it,
        id: `${prefix}${String(idx + 1).padStart(2, "0")}`,
      }));
    });
  };

  // Khôi phục mẫu mặc định chuẩn của Veyra
  const handleResetDefault = () => {
    if (!isAdmin) return;
    soundEngine.playClick();
    if (confirm(`Bạn có chắc chắn muốn đặt lại danh sách ${nameLabel.toLowerCase()} về bản mẫu chuẩn của Veyra?`)) {
      setItems([...DEFAULT_TERMS_LIST]);
    }
  };

  // Mở modal xác nhận xuất bản
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const emptyTitles = items.filter((it) => !it.Title.trim());
    if (emptyTitles.length > 0) {
      alert(`Có ${emptyTitles.length} mục chưa có tiêu đề (Title). Vui lòng điền đầy đủ tiêu đề trước khi xuất bản.`);
      return;
    }

    soundEngine.playClick();
    setIsPublishModalOpen(true);
  };

  // Thực hiện xuất bản & lưu lịch sử
  const handleConfirmPublish = async () => {
    soundEngine.playClick();
    await onSave(items, {
      version: publishVersion.trim() || "v1.0",
      note: publishNote.trim() || `Cập nhật ${nameLabel.toLowerCase()}`,
    });
    setIsPublishModalOpen(false);
    setPublishNote("");
    loadHistory();
  };

  // Lọc items nếu có tìm kiếm
  const filteredItems = items.filter(
    (item) =>
      item.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.Content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <form onSubmit={handlePreSubmit} className="space-y-6">
      {/* Banner lưu ý quyền hạn */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-3">
          <span className="text-base">🔒</span>
          <span>
            Chỉ tài khoản cấp <strong>Quản Trị Viên (Admin)</strong> mới có quyền thêm, sửa và xóa {nameLabel}. Bạn hiện đang ở chế độ <strong>Chỉ Xem</strong>.
          </span>
        </div>
      )}

      {/* Header điều khiển chính */}
      <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{tabIcon}</span>
              <h3 className="text-base font-bold font-mono text-[#3fe9d6] uppercase tracking-wider">
                {tabTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30 text-xs font-mono">
                Firestore: {docPath}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Mỗi mục được lưu dưới dạng trường riêng (<code className="text-[#3fe9d6]">{prefix}01</code>, <code className="text-[#3fe9d6]">{prefix}02</code>...) gồm <strong className="text-white">Title</strong> và <strong className="text-white">Content</strong>.
            </p>
          </div>

          {/* Sub-tabs & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Bộ điều hướng chế độ xem */}
            <div className="flex items-center gap-1 bg-[#0e122b] border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveView("edit");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${activeView === "edit"
                  ? "bg-[#3fe9d6]/20 text-[#3fe9d6] font-semibold border border-[#3fe9d6]/40"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                ✍️ Chỉnh Sửa ({items.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveView("preview");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${activeView === "preview"
                  ? "bg-[#3fe9d6]/20 text-[#3fe9d6] font-semibold border border-[#3fe9d6]/40"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                👁️ Xem Trước
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveView("history");
                  loadHistory();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${activeView === "history"
                  ? "bg-[#f5c767]/20 text-[#f5c767] font-semibold border border-[#f5c767]/40"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <span>🕒 Lịch Sử</span>
                {historyList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300">
                    {historyList.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm & lọc nhanh */}
        {activeView !== "history" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Tìm kiếm theo mã, tiêu đề, nội dung ${nameLabel.toLowerCase()}...`}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-[#3fe9d6]"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span>Tổng số: <strong className="text-[#3fe9d6]">{items.length}</strong> {nameLabel.toLowerCase()}</span>
              {searchQuery && (
                <span className="text-amber-400">(Tìm thấy {filteredItems.length})</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CHẾ ĐỘ 1: Danh Sách Chỉnh Sửa Từng Mục */}
      {activeView === "edit" && (
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#090c21]/90 border border-white/10 text-center space-y-4">
              <div className="text-3xl">📭</div>
              <div className="text-slate-300 font-mono text-sm">
                {searchQuery ? "Không tìm thấy nội dung nào khớp với từ khóa tìm kiếm." : `Chưa có ${nameLabel.toLowerCase()} nào.`}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="px-4 py-2 rounded-xl bg-[#3fe9d6]/20 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono hover:bg-[#3fe9d6]/30 transition-all cursor-pointer"
                >
                  + Thêm {nameLabel} Đầu Tiên
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const realIndex = items.findIndex((it) => it.id === item.id);
              return (
                <div
                  key={item.id + index}
                  className="p-5 sm:p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 hover:border-[#3fe9d6]/40 transition-all shadow-xl space-y-4 group"
                >
                  {/* Thanh công cụ của thẻ */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      {/* Badge Số thứ tự */}
                      <span className="w-7 h-7 rounded-lg bg-[#3fe9d6]/15 border border-[#3fe9d6]/30 text-[#3fe9d6] font-bold font-mono text-xs flex items-center justify-center">
                        {String(realIndex + 1).padStart(2, "0")}
                      </span>

                      {/* Mã trường trong Firestore */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-slate-400">Mã Firestore:</span>
                        <input
                          type="text"
                          value={item.id}
                          disabled={!isAdmin}
                          onChange={(e) => handleItemChange(realIndex, "id", e.target.value)}
                          placeholder={`${prefix}01`}
                          className="w-24 px-2.5 py-1 rounded-lg bg-[#0e122b] border border-white/10 text-[#3fe9d6] font-mono text-xs font-semibold focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Nút hành động: Lên / Xuống / Xóa */}
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          disabled={realIndex === 0}
                          onClick={() => handleMove(realIndex, "up")}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title="Di chuyển lên trên (Tự động đánh số lại mã)"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={realIndex === items.length - 1}
                          onClick={() => handleMove(realIndex, "down")}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title="Di chuyển xuống dưới (Tự động đánh số lại mã)"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTerm(realIndex)}
                          className="p-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                          title={`Xóa ${nameLabel.toLowerCase()} này`}
                        >
                          <span>🗑️</span>
                          <span className="hidden sm:inline">Xóa</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input Tiêu Đề (Title) */}
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Tiêu Đề {nameLabel} (<span className="text-[#3fe9d6] font-bold">Title</span>) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.Title}
                      disabled={!isAdmin}
                      onChange={(e) => handleItemChange(realIndex, "Title", e.target.value)}
                      placeholder={`Ví dụ: QUY ĐỊNH ${nameLabel.toUpperCase()}...`}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white font-mono text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60 placeholder:text-slate-500"
                    />
                  </div>

                  {/* Input Nội Dung (Content) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-mono text-slate-300">
                        Nội Dung Chi Tiết (<span className="text-[#3fe9d6] font-bold">Content</span>) <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {item.Content.length} ký tự
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={item.Content}
                      disabled={!isAdmin}
                      onChange={(e) => handleItemChange(realIndex, "Content", e.target.value)}
                      placeholder={`Nhập nội dung quy định chi tiết cho ${nameLabel.toLowerCase()} này...`}
                      className="w-full px-4 py-3 rounded-xl bg-[#080b1d] border border-white/10 text-slate-200 text-xs sm:text-sm leading-relaxed font-sans focus:outline-none focus:border-[#3fe9d6] disabled:opacity-60 resize-y placeholder:text-slate-600"
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Nút thêm ở cuối danh sách */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleAddTerm}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-[#3fe9d6]/30 hover:border-[#3fe9d6] bg-[#3fe9d6]/5 hover:bg-[#3fe9d6]/10 text-[#3fe9d6] font-bold font-mono text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="text-base font-black">+</span>
              <span>Thêm {nameLabel} Mới</span>
            </button>
          )}
        </div>
      )}

      {/* CHẾ ĐỘ 2: Xem Trước Chuẩn 1. Title */}
      {activeView === "preview" && (
        <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-6">
          <div className="p-4 rounded-xl bg-[#3fe9d6]/10 border border-[#3fe9d6]/30 text-[#3fe9d6] text-xs font-mono flex items-center justify-between">
            <span>👁️ Giao diện hiển thị thực tế khi người chơi bấm xem {nameLabel}</span>
            <span>Tổng cộng: {items.length} {nameLabel.toLowerCase()}</span>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#080b1d] border border-white/10 shadow-inner space-y-6">
            {items.map((item, idx) => (
              <div
                key={item.id + idx}
                className={`space-y-2.5 ${idx !== items.length - 1 ? "border-b border-white/10 pb-6" : ""
                  }`}
              >
                <h4 className="text-sm sm:text-base font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide flex items-baseline gap-2">
                  <span className="text-[#3fe9d6] font-mono font-bold text-base">{idx + 1}.</span>
                  <span>{item.Title || "Chưa đặt tiêu đề"}</span>
                </h4>
                <div className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap pl-5 font-light">
                  {item.Content || "(Chưa có nội dung)"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 3: Lịch Sử Cập Nhật (Audit Log) */}
      {activeView === "history" && (
        <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🕒</span>
                <h4 className="text-sm font-bold font-mono text-[#f5c767] uppercase tracking-wider">
                  Nhật Ký Cập Nhật {nameLabel}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/30 text-xs font-mono">
                  Firestore: Logs/Term&Policy/{type === "policy" ? "Policy" : "Term"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ghi nhận tự động vào subcollection Logs/Term&Policy/{type === "policy" ? "Policy" : "Term"} mỗi khi xuất bản {nameLabel.toLowerCase()}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                loadHistory();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>↺</span>
              <span>Làm Mới</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#f5c767] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-400">Đang nạp nhật ký lịch sử...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed border-white/10 rounded-2xl p-8">
              <div className="text-3xl">📜</div>
              <div className="text-sm font-mono text-slate-300">Chưa có nhật ký lưu phiên bản nào.</div>
              <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                Mỗi khi bạn bấm <strong>"Lưu Tất Cả {nameLabel}"</strong> và nhập số hiệu phiên bản kèm ghi chú, hệ thống sẽ tự động lưu lại vào collection Logs.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyList.map((log, idx) => (
                <div
                  key={log.id}
                  className={`p-5 rounded-xl border transition-all ${idx === 0
                    ? "bg-[#0b1329] border-[#3fe9d6]/40 shadow-[0_0_20px_rgba(63,233,214,0.15)]"
                    : "bg-[#080b1d] border-white/10"
                    }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/20 border border-[#3fe9d6]/40 text-[#3fe9d6] font-mono font-bold text-xs">
                        {log.version}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          ● Bản Hiện Hành
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400">
                        {log.updatedAt}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                      <span>Bởi: <strong className="text-white">{log.updatedBy}</strong></span>
                      <span>•</span>
                      <span>{log.termCount} {nameLabel.toLowerCase()}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#060814]/80 border border-white/5 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    💬 <strong className="text-slate-300">Ghi chú:</strong> {log.note || "(Không có ghi chú chi tiết)"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Thanh nút lưu dưới cùng */}
      <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {isAdmin && (
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-4 py-2.5 rounded-xl border border-white/15 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-mono transition-colors cursor-pointer"
          >
            ↺ Khôi Phục Mẫu Chuẩn
          </button>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <button
            type="submit"
            disabled={!isAdmin || saving}
            className={`px-7 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-lg ${isAdmin && !saving
              ? "bg-gradient-to-r from-[#3fe9d6] via-[#0ea5e9] to-[#3fe9d6] text-[#060814] hover:shadow-[0_0_25px_rgba(63,233,214,0.5)] cursor-pointer hover:scale-[1.02]"
              : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
              }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-[#060814] border-t-transparent rounded-full animate-spin" />
                <span>Đang Lưu Lên {docPath}...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Lưu Tất Cả {nameLabel} ({docPath})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Nhập Số Hiệu Phiên Bản & Ghi Chú Trước Khi Xuất Bản */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#090c21] border border-[#3fe9d6]/40 shadow-[0_0_50px_rgba(63,233,214,0.3)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                  Xuất Bản {nameLabel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Bạn đang chuẩn bị xuất bản <strong className="text-[#3fe9d6]">{items.length} {nameLabel.toLowerCase()}</strong> lên máy chủ Veyra (<code className="text-white">{docPath}</code>). Vui lòng nhập thông tin phiên bản để lưu vào <code className="text-[#f5c767]">Logs/Term&Policy/{type === "policy" ? "Policy" : "Term"}</code>:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Số Hiệu Phiên Bản <span className="text-[#3fe9d6]">*</span>
                </label>
                <input
                  type="text"
                  value={publishVersion}
                  onChange={(e) => setPublishVersion(e.target.value)}
                  placeholder="VD: v1.0, v1.1, v2.0..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-[#3fe9d6]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Tóm Tắt Ghi Chú Thay Đổi (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={publishNote}
                  onChange={(e) => setPublishNote(e.target.value)}
                  placeholder={`Ví dụ: Cập nhật điều chỉnh nội dung ${nameLabel.toLowerCase()}...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white font-sans text-xs sm:text-sm focus:outline-none focus:border-[#3fe9d6] resize-none placeholder:text-slate-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>Người xuất bản:</span>
                <span className="text-[#3fe9d6] font-bold">{currentUser?.email || "Admin"}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/15 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-mono transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmPublish}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#060814] font-bold font-mono text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(63,233,214,0.4)] transition-all flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#060814] border-t-transparent rounded-full animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Xác Nhận & Xuất Bản</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
