"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminAccount, BanDetails } from "@/data/adminAccounts";
import { settingsService, TermItem } from "@/services/settings.service";
import { soundEngine } from "@/services/audio.service";

interface BanAccountModalProps {
  isOpen: boolean;
  account: AdminAccount | null;
  onClose: () => void;
  onConfirm: (banDetails: BanDetails) => Promise<void>;
}

export default function BanAccountModal({
  isOpen,
  account,
  onClose,
  onConfirm,
}: BanAccountModalProps) {
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
  const [expandedTermIds, setExpandedTermIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");
  const [loadingTerms, setLoadingTerms] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Nạp danh sách điều khoản từ Firestore GameConfig/Terms khi modal mở
  useEffect(() => {
    if (isOpen) {
      setLoadingTerms(true);
      settingsService
        .getTermsList()
        .then((items) => {
          setTerms(items);
          if (items.length > 0) {
            // Mặc định chọn điều khoản đầu tiên
            setSelectedTermIds([items[0].id]);
          } else {
            setSelectedTermIds([]);
          }
        })
        .catch((err) => {
          console.error("Lỗi khi tải danh sách điều khoản:", err);
        })
        .finally(() => {
          setLoadingTerms(false);
        });
      setAdminNote("");
      setSearchQuery("");
      setExpandedTermIds([]);
    }
  }, [isOpen]);

  // Lọc theo từ khóa tìm kiếm
  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return terms;
    const q = searchQuery.toLowerCase();
    return terms.filter(
      (t) =>
        t.Title.toLowerCase().includes(q) ||
        (t.Content && t.Content.toLowerCase().includes(q))
    );
  }, [terms, searchQuery]);

  if (!isOpen || !account) return null;

  // Toggle chọn / bỏ chọn một điều khoản
  const handleToggleTerm = (termId: string) => {
    soundEngine.playClick();
    setSelectedTermIds((prev) =>
      prev.includes(termId)
        ? prev.filter((id) => id !== termId)
        : [...prev, termId]
    );
  };

  // Toggle xem trước nội dung chi tiết của điều khoản
  const handleToggleExpand = (e: React.MouseEvent, termId: string) => {
    e.stopPropagation();
    soundEngine.playClick();
    setExpandedTermIds((prev) =>
      prev.includes(termId)
        ? prev.filter((id) => id !== termId)
        : [...prev, termId]
    );
  };

  // Chọn tất cả các điều khoản đang hiển thị
  const handleSelectAll = () => {
    soundEngine.playClick();
    const visibleIds = filteredTerms.map((t) => t.id);
    const newSelected = Array.from(new Set([...selectedTermIds, ...visibleIds]));
    setSelectedTermIds(newSelected);
  };

  // Bỏ chọn tất cả
  const handleDeselectAll = () => {
    soundEngine.playClick();
    setSelectedTermIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (selectedTermIds.length === 0) {
      alert("Vui lòng chọn ít nhất một lý do / điều khoản vi phạm.");
      return;
    }

    const selectedTerms = terms.filter((t) => selectedTermIds.includes(t.id));

    setIsSubmitting(true);
    try {
      const banDetails: BanDetails = {
        termId: selectedTerms[0]?.id || "term01",
        termTitle: selectedTerms.map((t) => t.Title).join(" • "),
        termContent: selectedTerms
          .map((t, idx) => `[${idx + 1}] ${t.Title}:\n${t.Content || "(Chưa có nội dung)"}`)
          .join("\n\n"),
        termIds: selectedTermIds,
        termTitles: selectedTerms.map((t) => t.Title),
        terms: selectedTerms.map((t) => ({
          id: t.id,
          title: t.Title,
          content: t.Content || "",
        })),
        note: adminNote.trim() || "Vi phạm Điều khoản Dịch vụ",
        bannedAt: new Date().toLocaleString("vi-VN"),
      };
      await onConfirm(banDetails);
      onClose();
    } catch (err: any) {
      alert(err?.message || "Không thể thực hiện khóa tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isSubmitting) {
            soundEngine.playClick();
            onClose();
          }
        }}
        className="absolute inset-0 bg-[#040612]/80 backdrop-blur-md animate-fadeIn"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#090c21] border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.25)] overflow-hidden animate-scaleUp z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-rose-950/40 via-transparent to-transparent flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-[family-name:var(--font-rajdhani)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Khóa Quyền Truy Cập Tài Khoản</span>
            </h3>
            <p className="text-xs font-mono text-rose-400/80 mt-0.5">
              Chọn một hoặc nhiều lý do vi phạm và nhập ghi chú để khóa tài khoản
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            aria-label="Đóng"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-base leading-none transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto pr-4 text-xs sm:text-sm">
          {/* Thông tin tài khoản bị khóa */}
          <div className="p-3.5 rounded-xl bg-[#0e122b] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400">Tài khoản: </span>
              <strong className="text-white text-sm">{account.username}</strong>
            </div>
            <div>
              <span className="text-slate-400">Email: </span>
              <span className="text-[#3fe9d6]">{account.email || "(Khách)"}</span>
            </div>
            <div>
              <span className="text-slate-400">UID: </span>
              <span className="text-slate-300">{account.id.slice(0, 12)}...</span>
            </div>
          </div>

          {/* Chọn điều khoản dịch vụ vi phạm (Multi-select) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-mono font-semibold text-slate-200">
                1. Chọn Các Lý Do / Điều Khoản Vi Phạm <span className="text-rose-400">*</span>
              </label>

              {/* Badges & Action Buttons */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold transition-colors ${
                    selectedTermIds.length > 0
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  Đã chọn: {selectedTermIds.length} / {terms.length}
                </span>

                {terms.length > 1 && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-[#3fe9d6] transition-colors cursor-pointer"
                    >
                      Chọn hết
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                )}
              </div>
            </div>

            {loadingTerms ? (
              <div className="p-4 rounded-xl bg-[#080b1d] border border-white/10 text-xs font-mono text-slate-400 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                <span>Đang tải danh sách điều khoản dịch vụ...</span>
              </div>
            ) : terms.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#080b1d] border border-white/10 text-xs font-mono text-amber-300">
                Chưa có điều khoản nào trong hệ thống. Vui lòng thiết lập tại tab Điều Khoản Dịch Vụ.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Thanh tìm kiếm nhanh */}
                {terms.length > 4 && (
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm điều khoản vi phạm..."
                      className="w-full px-3 py-1.5 pr-8 rounded-lg bg-[#0e122b] border border-white/10 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        aria-label="Xóa từ khóa"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm leading-none cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}

                {/* Danh sách các điều khoản - Dạng Checklist Multi-select */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredTerms.length === 0 ? (
                    <div className="p-3 text-center text-xs font-mono text-slate-400">
                      Không tìm thấy điều khoản phù hợp với từ khóa "{searchQuery}".
                    </div>
                  ) : (
                    filteredTerms.map((term, index) => {
                      const isSelected = selectedTermIds.includes(term.id);
                      const isExpanded = expandedTermIds.includes(term.id);

                      return (
                        <div
                          key={term.id}
                          onClick={() => handleToggleTerm(term.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-rose-950/30 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                              : "bg-[#0b0e24]/70 border-white/10 hover:border-white/20 hover:bg-[#0e122b]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              {/* Custom Cyberpunk Checkbox */}
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all shrink-0 ${
                                  isSelected
                                    ? "bg-rose-500 border-rose-400 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                    : "border-slate-500/60 bg-black/30"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>

                              {/* Title */}
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-xs font-semibold block leading-snug ${
                                    isSelected ? "text-white" : "text-slate-300"
                                  }`}
                                >
                                  {index + 1}. {term.Title}
                                </span>
                              </div>
                            </div>

                            {/* Nút xem nội dung chi tiết */}
                            {term.Content && (
                              <button
                                type="button"
                                onClick={(e) => handleToggleExpand(e, term.id)}
                                className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors shrink-0 ${
                                  isExpanded
                                    ? "bg-rose-500/20 text-rose-300"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                                title="Xem nội dung chi tiết"
                              >
                                {isExpanded ? "Thu gọn" : "Chi tiết"}
                              </button>
                            )}
                          </div>

                          {/* Nội dung trích dẫn khi mở rộng */}
                          {isExpanded && term.Content && (
                            <div className="mt-2.5 pt-2 border-t border-white/10 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap pl-6 bg-black/20 p-2.5 rounded-lg max-h-32 overflow-y-auto">
                              {term.Content}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Tóm tắt các điều khoản đã chọn dạng chips */}
                {selectedTermIds.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] font-mono text-slate-400 mr-1">
                      Lý do áp dụng:
                    </span>
                    {terms
                      .filter((t) => selectedTermIds.includes(t.id))
                      .map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-mono"
                        >
                          <span className="truncate max-w-[200px]">{t.Title}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTerm(t.id);
                              }}
                              aria-label="Bỏ chọn"
                              className="hover:text-white font-bold ml-0.5 text-sm leading-none cursor-pointer"
                            >
                              ×
                            </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nhập ghi chú của Quản Trị Viên */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-semibold text-slate-200">
                2. Ghi Chú & Chi Tiết Vi Phạm <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Người dùng sẽ thấy nội dung này khi đăng nhập
              </span>
            </div>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Ví dụ: Vi phạm quy định về hành vi gian lận hoặc ngôn từ không phù hợp trong trò chơi..."
              className="w-full px-4 py-3 rounded-xl bg-[#080b1d] border border-white/10 text-white text-xs sm:text-sm font-sans placeholder:text-slate-500 focus:outline-none focus:border-rose-400 transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* Cảnh báo hậu quả */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
            <div className="space-y-1">
              <strong className="block text-rose-200">Lưu ý hiệu lực:</strong>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                Tài khoản sẽ bị khóa ngay lập tức. Khi người dùng đăng nhập lại, hệ thống sẽ chặn truy cập và hiển thị chính xác các lý do vi phạm ({selectedTermIds.length} lý do) kèm ghi chú này.
              </p>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-mono transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting || selectedTermIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang Khóa...</span>
                </>
              ) : (
                <span>
                  Xác Nhận Khóa Tài Khoản {selectedTermIds.length > 0 ? `(${selectedTermIds.length})` : ""}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
