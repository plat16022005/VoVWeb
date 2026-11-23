"use client";

import { useState, useMemo } from "react";
import { AdminAccount } from "@/data/adminAccounts";
import { PERMISSION_GROUPS } from "@/data/permissions";
import { soundEngine } from "@/services/audio.service";

interface ManagerPermissionsTableProps {
  managers: AdminAccount[];
  onConfigurePermissions: (account: AdminAccount) => void;
}

export default function ManagerPermissionsTable({
  managers,
  onConfigurePermissions,
}: ManagerPermissionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy UID helper
  const handleCopy = (id: string, text: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered managers
  const filteredManagers = useMemo(() => {
    return managers.filter((m) => {
      // Search match
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        m.username.toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        m.id.toLowerCase().includes(term);

      if (!matchSearch) return false;

      // Group filter
      if (filterGroup === "ASSIGNED") {
        return m.permissionGroups && m.permissionGroups.length > 0;
      }
      if (filterGroup === "UNASSIGNED") {
        return !m.permissionGroups || m.permissionGroups.length === 0;
      }
      if (filterGroup === "CONTENT_OPS") {
        return m.permissionGroups && m.permissionGroups.includes("content_management");
      }
      if (filterGroup === "GAME_DATA_OPS") {
        return m.permissionGroups && m.permissionGroups.includes("game_data");
      }
      if (filterGroup === "EVENT_OPS") {
        return m.permissionGroups && m.permissionGroups.includes("event_management");
      }
      if (filterGroup === "BANNED") {
        return m.status === "banned";
      }

      return true;
    });
  }, [managers, searchTerm, filterGroup]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm Quản Lý theo tên, email hoặc UID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#3fe9d6] transition-colors font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Xóa từ khóa"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer text-base leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 hidden lg:inline mr-1">Bộ lọc:</span>
          {[
            { id: "ALL", label: "Tất Cả", count: managers.length },
            {
              id: "ASSIGNED",
              label: "Đã Cấp Quyền",
              count: managers.filter((m) => m.permissionGroups && m.permissionGroups.length > 0).length,
            },
            {
              id: "UNASSIGNED",
              label: "Chưa Phân Quyền",
              count: managers.filter((m) => !m.permissionGroups || m.permissionGroups.length === 0).length,
            },
            {
              id: "CONTENT_OPS",
              label: "Quản Lý Nội Dung",
              count: managers.filter((m) => m.permissionGroups && m.permissionGroups.includes("content_management")).length,
            },
            {
              id: "GAME_DATA_OPS",
              label: "Dữ Liệu Game",
              count: managers.filter((m) => m.permissionGroups && m.permissionGroups.includes("game_data")).length,
            },
            {
              id: "EVENT_OPS",
              label: "Quản Lý Sự Kiện",
              count: managers.filter((m) => m.permissionGroups && m.permissionGroups.includes("event_management")).length,
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                soundEngine.playClick();
                setFilterGroup(f.id);
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                filterGroup === f.id
                  ? "bg-[#3fe9d6] text-black border-[#3fe9d6] font-bold shadow-[0_0_12px_rgba(63,233,214,0.3)]"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterGroup === f.id ? "bg-black/20 text-black font-extrabold" : "bg-white/10 text-slate-400"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#060814]/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Tài Khoản Quản Lý (Manager)</th>
                <th className="py-3.5 px-3">Trạng Thái</th>
                <th className="py-3.5 px-3">Nhóm Quyền Lớn</th>
                <th className="py-3.5 px-4">Quyền Chức Năng Chi Tiết (Sub-permissions)</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-mono">
                    <span>Không tìm thấy tài khoản Quản Lý nào phù hợp điều kiện lọc.</span>
                  </td>
                </tr>
              ) : (
                filteredManagers.map((manager) => {
                  const userPerms = manager.permissions || [];
                  const userGroups = manager.permissionGroups || [];
                  const activeGroups = PERMISSION_GROUPS.filter((g) => userGroups.includes(g.id));

                  return (
                    <tr
                      key={manager.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Manager Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9b51e0] to-[#3fe9d6] p-[1px] shadow-sm shrink-0">
                            <div className="w-full h-full bg-[#060814] rounded-[11px] flex items-center justify-center font-[family-name:var(--font-rajdhani)] font-bold text-white uppercase text-base">
                              {manager.username.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-[#3fe9d6] transition-colors flex items-center gap-2">
                              <span>{manager.username}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Manager
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {manager.email || "Chưa thiết lập email"}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                              <span>UID: {manager.id.slice(0, 12)}...</span>
                              <button
                                onClick={() => handleCopy(manager.id, manager.id)}
                                title="Sao chép toàn bộ UID"
                                className="hover:text-[#3fe9d6] cursor-pointer"
                              >
                                {copiedId === manager.id ? (
                                  <span className="text-emerald-400">Đã chép!</span>
                                ) : (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        {manager.status === "banned" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Đã Khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                            Hoạt Động
                          </span>
                        )}
                      </td>

                      {/* Major Groups (Dynamic - Shows ALL assigned groups with their own sub-permission ratios) */}
                      <td className="py-4 px-3">
                        {activeGroups.length > 0 ? (
                          <div className="space-y-2">
                            {activeGroups.map((group) => {
                              const groupSubCount = group.subPermissions.filter((sp) =>
                                userPerms.includes(sp.id)
                              ).length;
                              const totalInGroup = group.subPermissions.length;
                              const isAllGranted = groupSubCount === totalInGroup;

                              return (
                                <div key={group.id} className="space-y-0.5">
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-semibold ${
                                      group.id === "game_data"
                                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                                        : group.id === "event_management"
                                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                        : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        group.id === "game_data"
                                          ? "bg-cyan-400"
                                          : group.id === "event_management"
                                          ? "bg-amber-400"
                                          : "bg-emerald-400"
                                      }`}
                                    />
                                    <span>{group.title}</span>
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 pl-1">
                                    Đã cấp{" "}
                                    <strong
                                      className={
                                        isAllGranted
                                          ? "text-emerald-400"
                                          : groupSubCount > 0
                                          ? "text-amber-400"
                                          : "text-slate-500"
                                      }
                                    >
                                      {groupSubCount}/{totalInGroup}
                                    </strong>{" "}
                                    quyền nhỏ
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Chưa Phân Quyền</span>
                          </div>
                        )}
                      </td>

                      {/* Sub-permissions Badges (Dynamic - Displays all branches per assigned group) */}
                      <td className="py-4 px-4">
                        {activeGroups.length > 0 ? (
                          <div className="space-y-3">
                            {activeGroups.map((group) => {
                              // Group subpermissions by categoryTitle
                              const categoryMap = new Map<string, typeof group.subPermissions>();
                              group.subPermissions.forEach((sp) => {
                                const list = categoryMap.get(sp.categoryTitle) || [];
                                list.push(sp);
                                categoryMap.set(sp.categoryTitle, list);
                              });

                              return (
                                <div key={group.id} className="space-y-1.5">
                                  {Array.from(categoryMap.entries()).map(([catTitle, subList]) => (
                                    <div key={catTitle} className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider w-24 shrink-0 truncate" title={catTitle}>
                                        {catTitle.split("(")[0].trim()}:
                                      </span>
                                      {subList.map((sp) => {
                                        const isGranted = userPerms.includes(sp.id);
                                        const shortName = sp.id.split(".").pop() || sp.id;
                                        return (
                                          <span
                                            key={sp.id}
                                            title={`${sp.title}: ${sp.description}`}
                                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                                              isGranted
                                                ? sp.category === "gacha"
                                                  ? "bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium"
                                                  : group.id === "game_data"
                                                  ? "bg-[#3fe9d6]/15 border border-[#3fe9d6]/40 text-[#3fe9d6] font-medium"
                                                  : sp.category === "facebook"
                                                  ? "bg-purple-500/15 border border-purple-500/40 text-purple-300 font-medium"
                                                  : "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-medium"
                                                : "bg-white/5 border border-white/5 text-slate-400 line-through opacity-60"
                                            }`}
                                          >
                                            {shortName}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-slate-400 italic">
                            Chưa có quyền chức năng nào được cấp
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            onConfigurePermissions(manager);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#9b51e0]/20 to-[#3fe9d6]/20 border border-[#3fe9d6]/40 text-[#3fe9d6] hover:text-white hover:border-[#3fe9d6] hover:bg-[#3fe9d6]/20 hover:shadow-[0_0_15px_rgba(63,233,214,0.3)] transition-all text-xs font-mono font-bold cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span>Phân Quyền</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
