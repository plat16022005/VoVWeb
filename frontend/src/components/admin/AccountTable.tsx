"use client";

import { useState, useMemo } from "react";
import { AdminAccount } from "@/data/adminAccounts";
import { soundEngine } from "@/services/audio.service";

interface AccountTableProps {
  accounts: AdminAccount[];
  currentUserId?: string;
  onEdit: (account: AdminAccount) => void;
  onToggleBan: (account: AdminAccount) => void;
  onDelete: (account: AdminAccount) => void;
  onResetPassword: (account: AdminAccount) => void;
}

type SortField = "username" | "role" | "status" | "createdAt" | "lastLogin";
type SortOrder = "asc" | "desc";

export default function AccountTable({
  accounts,
  currentUserId,
  onEdit,
  onToggleBan,
  onDelete,
  onResetPassword,
}: AccountTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy UID helper
  const handleCopy = (id: string, text: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Click handler to sort by column header
  const handleSort = (field: SortField) => {
    soundEngine.playClick();
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Mặc định ngày tạo & ngày đăng nhập thì mới nhất (desc), các cột khác thì từ A-Z hoặc quyền cao nhất (desc)
      setSortOrder(
        field === "createdAt" || field === "lastLogin" || field === "role" || field === "status"
          ? "desc"
          : "asc"
      );
    }
  };

  // Helper render mũi tên sắp xếp
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors ml-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg
        className={`w-3 h-3 text-[#3fe9d6] ml-1 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  // Filter & Sort Logic
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const isGuest = !acc.email || acc.email.trim() === "";
        const emailText = isGuest ? "(Khách)" : acc.email;
        const matchesSearch =
          acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emailText.toLowerCase().includes(searchTerm.toLowerCase()) ||
          acc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (isGuest && (searchTerm.toLowerCase().includes("khách") || searchTerm.toLowerCase().includes("guest")));

        const matchesRole = roleFilter === "ALL" || acc.role === roleFilter;
        const matchesStatus = statusFilter === "ALL" || acc.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === "username") {
          return a.username.localeCompare(b.username) * (sortOrder === "asc" ? 1 : -1);
        }
        if (sortField === "role") {
          const roleWeight: Record<string, number> = { Admin: 3, Manager: 2, Player: 1 };
          const weightA = roleWeight[a.role] || 0;
          const weightB = roleWeight[b.role] || 0;
          return (weightA - weightB) * (sortOrder === "asc" ? 1 : -1);
        }
        if (sortField === "status") {
          const statusWeight: Record<string, number> = { active: 3, pending: 2, banned: 1 };
          const weightA = statusWeight[a.status] || 0;
          const weightB = statusWeight[b.status] || 0;
          return (weightA - weightB) * (sortOrder === "asc" ? 1 : -1);
        }
        if (sortField === "createdAt") {
          const timeA = a.createdAtTimestamp || 0;
          const timeB = b.createdAtTimestamp || 0;
          return (timeA - timeB) * (sortOrder === "asc" ? 1 : -1);
        }
        if (sortField === "lastLogin") {
          const timeA = a.lastLoginTimestamp || 0;
          const timeB = b.lastLoginTimestamp || 0;
          // Xử lý các tài khoản chưa từng đăng nhập (timestamp = 0):
          // Khi desc (mới nhất): người chưa vào (0) xuống cuối
          // Khi asc (cũ nhất): người chưa vào (0) lên đầu
          if (timeA === 0 && timeB > 0) return sortOrder === "desc" ? 1 : -1;
          if (timeB === 0 && timeA > 0) return sortOrder === "desc" ? -1 : 1;
          return (timeA - timeB) * (sortOrder === "asc" ? 1 : -1);
        }
        return 0;
      });
  }, [accounts, searchTerm, roleFilter, statusFilter, sortField, sortOrder]);

  // Select all toggle
  const handleSelectAll = () => {
    soundEngine.playClick();
    if (selectedIds.size === filteredAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAccounts.map((a) => a.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    soundEngine.playClick();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Helper for role badge styling
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-red-500/15 text-red-300 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            ADMIN
          </span>
        );
      case "Manager":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/40 shadow-[0_0_8px_rgba(245,199,103,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5c767]" />
            MANAGER
          </span>
        );
      case "Player":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fe9d6]" />
            PLAYER
          </span>
        );
    }
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Hoạt Động
          </span>
        );
      case "banned":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Bị Khóa
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Chờ Kích Hoạt
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar Toolbar */}
      <div className="p-4 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tài khoản, email, UID, 'khách'..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6] transition-colors font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Xóa từ khóa"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm leading-none cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-[#0e122b] border border-white/10 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-400 font-mono">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                soundEngine.playClick();
                setRoleFilter(e.target.value);
              }}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0b0e24] text-white">Tất cả vai trò</option>
              <option value="Admin" className="bg-[#0b0e24] text-red-300">Admin</option>
              <option value="Manager" className="bg-[#0b0e24] text-[#f5c767]">Manager</option>
              <option value="Player" className="bg-[#0b0e24] text-[#3fe9d6]">Player</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#0e122b] border border-white/10 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-400 font-mono">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                soundEngine.playClick();
                setStatusFilter(e.target.value);
              }}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0b0e24] text-white">Tất cả trạng thái</option>
              <option value="active" className="bg-[#0b0e24] text-emerald-400">Hoạt Động</option>
              <option value="banned" className="bg-[#0b0e24] text-rose-400">Bị Khóa</option>
              <option value="pending" className="bg-[#0b0e24] text-amber-300">Chờ Kích Hoạt</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0e122b] border border-white/10 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-400 font-mono">Xếp nhanh:</span>
            <select
              value={`${sortField}_${sortOrder}`}
              onChange={(e) => {
                soundEngine.playClick();
                const [f, o] = e.target.value.split("_");
                setSortField(f as SortField);
                setSortOrder(o as SortOrder);
              }}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="createdAt_desc" className="bg-[#0b0e24] text-white">Ngày tạo: Mới nhất</option>
              <option value="createdAt_asc" className="bg-[#0b0e24] text-white">Ngày tạo: Cũ nhất</option>
              <option value="lastLogin_desc" className="bg-[#0b0e24] text-[#3fe9d6]">Đăng nhập: Gần đây nhất</option>
              <option value="lastLogin_asc" className="bg-[#0b0e24] text-white">Đăng nhập: Lâu nhất / Chưa vào</option>
              <option value="role_desc" className="bg-[#0b0e24] text-white">Vai trò: Cao → Thấp</option>
              <option value="status_desc" className="bg-[#0b0e24] text-white">Trạng thái: Hoạt động trước</option>
              <option value="username_asc" className="bg-[#0b0e24] text-white">Tên: A → Z</option>
            </select>
          </div>

          {/* Reset Filters button if active */}
          {(searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL" || sortField !== "createdAt" || sortOrder !== "desc") && (
            <button
              onClick={() => {
                soundEngine.playClick();
                setSearchTerm("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
                setSortField("createdAt");
                setSortOrder("desc");
              }}
              className="text-xs font-mono text-[#3fe9d6] hover:underline px-2 py-1 cursor-pointer"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Account Table Container */}
      <div className="overflow-hidden rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            {/* Table Head với Nút Sắp Xếp Trực Tiếp trên các Cột */}
            <thead className="bg-[#0e1330] text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-white/10 select-none">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredAccounts.length > 0 && selectedIds.size === filteredAccounts.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-black/40 text-[#3fe9d6] focus:ring-0 cursor-pointer"
                  />
                </th>

                {/* Cột: Tài Khoản (Sortable) */}
                <th className="py-4 px-3">
                  <button
                    onClick={() => handleSort("username")}
                    className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-[11px] text-slate-300 hover:text-[#3fe9d6] group cursor-pointer transition-colors"
                    title="Bấm để sắp xếp theo Tên tài khoản"
                  >
                    <span>Tài Khoản</span>
                    {renderSortIndicator("username")}
                  </button>
                </th>

                {/* Cột: Email & UID */}
                <th className="py-4 px-3">Email & UID</th>

                {/* Cột: Vai Trò (Sortable) */}
                <th className="py-4 px-3">
                  <button
                    onClick={() => handleSort("role")}
                    className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-[11px] text-slate-300 hover:text-[#3fe9d6] group cursor-pointer transition-colors"
                    title="Bấm để sắp xếp theo Vai trò (Admin / Manager / Player)"
                  >
                    <span>Vai Trò</span>
                    {renderSortIndicator("role")}
                  </button>
                </th>

                {/* Cột: Trạng Thái (Sortable) */}
                <th className="py-4 px-3">
                  <button
                    onClick={() => handleSort("status")}
                    className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-[11px] text-slate-300 hover:text-[#3fe9d6] group cursor-pointer transition-colors"
                    title="Bấm để sắp xếp theo Trạng thái (Hoạt động / Bị khóa)"
                  >
                    <span>Trạng Thái</span>
                    {renderSortIndicator("status")}
                  </button>
                </th>

                {/* Cột: Ngày Tạo / Đăng Nhập (Sortable cả Ngày Tạo & Đăng Nhập) */}
                <th className="py-4 px-3 hidden md:table-cell">
                  <div className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-[11px]">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className={`inline-flex items-center gap-1 group cursor-pointer transition-colors ${
                        sortField === "createdAt" ? "text-[#3fe9d6]" : "text-slate-300 hover:text-[#3fe9d6]"
                      }`}
                      title="Bấm để sắp xếp theo Ngày Tạo"
                    >
                      <span>Ngày Tạo</span>
                      {renderSortIndicator("createdAt")}
                    </button>
                    <span className="text-slate-600 font-sans mx-0.5">/</span>
                    <button
                      onClick={() => handleSort("lastLogin")}
                      className={`inline-flex items-center gap-1 group cursor-pointer transition-colors ${
                        sortField === "lastLogin" ? "text-[#3fe9d6]" : "text-slate-300 hover:text-[#3fe9d6]"
                      }`}
                      title="Bấm để sắp xếp theo Thời gian Đăng Nhập"
                    >
                      <span>Đăng Nhập</span>
                      {renderSortIndicator("lastLogin")}
                    </button>
                  </div>
                </th>

                {/* Cột: Thao Tác */}
                <th className="py-4 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-slate-300 font-medium text-sm">
                        Không tìm thấy tài khoản nào phù hợp trên hệ thống
                      </span>
                      <p className="text-slate-500 text-xs font-mono">
                        Nhấn nút &quot;+ Tạo Tài Khoản&quot; ở trên để thêm tài khoản mới.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const isSelected = selectedIds.has(account.id);
                  const isSelf = !!(currentUserId && account.id === currentUserId);

                  return (
                    <tr
                      key={account.id}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isSelected ? "bg-[#3fe9d6]/5" : ""
                      } ${account.status === "banned" ? "opacity-75" : ""} ${
                        isSelf ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(account.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-black/40 text-[#3fe9d6] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Username */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3fe9d6] to-[#f5c767] p-0.5 flex-shrink-0">
                            <div className="w-full h-full bg-[#080b1a] rounded-[10px] flex items-center justify-center font-bold text-white text-xs">
                              {account.username ? account.username[0].toUpperCase() : "U"}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-white hover:text-[#3fe9d6] transition-colors">
                                {account.username}
                              </span>
                              {isSelf && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_8px_rgba(63,233,214,0.3)]">
                                  BẠN
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Copyable UID */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-200 block truncate max-w-[200px]">
                              {account.email && account.email.trim() !== "" ? (
                                account.email
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-300 font-mono font-medium text-xs bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                  (Khách)
                                </span>
                              )}
                            </span>
                            {account.provider === "Google" && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">
                                Google
                              </span>
                            )}
                            {account.provider === "Guest" && account.email && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                Khách
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-slate-400">
                              {account.id}
                            </span>
                            <button
                              onClick={() => handleCopy(account.id, account.id)}
                              title="Sao chép UID"
                              className="text-slate-400 hover:text-[#3fe9d6] p-0.5 transition-colors cursor-pointer"
                            >
                              {copiedId === account.id ? (
                                <span className="text-[10px] text-emerald-400 font-mono">Đã chép!</span>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        {renderRoleBadge(account.role)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {renderStatusBadge(account.status)}
                          {account.status === "banned" && account.banDetails?.termTitle && (
                            <div
                              className="text-[10px] font-mono text-rose-300/90 max-w-[170px] truncate flex items-center gap-1 cursor-help"
                              title={`Vi phạm: ${
                                account.banDetails.termTitles && account.banDetails.termTitles.length > 0
                                  ? account.banDetails.termTitles.join("; ")
                                  : account.banDetails.termTitle
                              }\nGhi chú: ${account.banDetails.note || "Không có"}\nThời gian: ${account.banDetails.bannedAt || ""}`}
                            >
                              {account.banDetails.terms && account.banDetails.terms.length > 1 && (
                                <span className="px-1 py-0.2 rounded bg-rose-500/25 text-rose-300 text-[9px] font-bold shrink-0 border border-rose-500/40">
                                  {account.banDetails.terms.length}
                                </span>
                              )}
                              <span className="truncate">{account.banDetails.termTitle}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        <div className="text-[11px] font-mono space-y-0.5">
                          <div className={sortField === "createdAt" ? "text-[#3fe9d6] font-medium" : "text-slate-300"}>
                            Tạo: {account.createdAt}
                          </div>
                          <div className={sortField === "lastLogin" ? "text-[#3fe9d6] font-medium" : "text-slate-400"}>
                            Đăng nhập: {account.lastLogin}
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              soundEngine.playClick();
                              onEdit(account);
                            }}
                            title="Chỉnh sửa thông tin"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Reset Password (chỉ áp dụng cho tài khoản có email) */}
                          {account.email && account.email.trim() !== "" && (
                            <button
                              onClick={() => {
                                soundEngine.playClick();
                                onResetPassword(account);
                              }}
                              title="Gửi email đổi mật khẩu"
                              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                          )}

                          {/* Ban / Unban Toggle */}
                          <button
                            onClick={() => {
                              if (isSelf) return;
                              soundEngine.playClick();
                              onToggleBan(account);
                            }}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "Bạn không thể tự khóa tài khoản của chính mình"
                                : account.status === "banned"
                                ? "Mở khóa tài khoản"
                                : "Khóa tài khoản"
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf
                                ? "opacity-25 cursor-not-allowed text-slate-500"
                                : account.status === "banned"
                                ? "text-emerald-400 hover:bg-emerald-400/10 cursor-pointer"
                                : "text-rose-400 hover:bg-rose-400/10 cursor-pointer"
                            }`}
                          >
                            {account.status === "banned" ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => {
                              if (isSelf) return;
                              soundEngine.playClick();
                              onDelete(account);
                            }}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "Bạn không thể tự xóa tài khoản của chính bạn đang đăng nhập"
                                : "Xóa tài khoản khỏi hệ thống"
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf
                                ? "opacity-25 cursor-not-allowed text-slate-500"
                                : "text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

        {/* Table Footer with Summary */}
        <div className="p-4 bg-[#0e1330]/70 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>
            Tổng số: <span className="text-white font-bold">{filteredAccounts.length}</span> tài khoản trên hệ thống
            {selectedIds.size > 0 && (
              <span className="ml-2 text-[#3fe9d6]">({selectedIds.size} tài khoản đang được chọn)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Trang 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
