"use client";

import { useState, useEffect } from "react";
import { AdminAccount } from "@/data/adminAccounts";
import {
  PERMISSION_GROUPS,
  getAllSubPermissionIds,
} from "@/data/permissions";
import { soundEngine } from "@/services/audio.service";
import { adminService } from "@/services/admin.service";

interface AccountPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AdminAccount | null;
  onSave: (permissionsData: {
    permissionGroups: string[];
    permissions: string[];
  }) => Promise<void>;
}

export default function AccountPermissionsModal({
  isOpen,
  onClose,
  account,
  onSave,
}: AccountPermissionsModalProps) {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize state when modal opens or account changes
  useEffect(() => {
    if (account && isOpen) {
      const groups = new Set<string>(account.permissionGroups || []);
      const perms = new Set<string>(account.permissions || []);
      setSelectedGroups(groups);
      setSelectedPermissions(perms);
      setErrorMessage(null);

      // Đồng bộ từ Subcollection Users/{id}/Permissions
      adminService
        .getUserPermissions(account.id)
        .then((res) => {
          setSelectedGroups(new Set(res.permissionGroups));
          setSelectedPermissions(new Set(res.permissions));
        })
        .catch(() => {});
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  // Toggle major permission group
  const handleToggleGroup = (groupId: string) => {
    soundEngine.playClick();
    setSelectedGroups((prevGroups) => {
      const nextGroups = new Set(prevGroups);
      const allSubIds = getAllSubPermissionIds(groupId);

      if (nextGroups.has(groupId)) {
        // Tắt nhóm lớn -> Thu hồi nhóm và thu hồi tất cả quyền nhỏ thuộc nhóm này
        nextGroups.delete(groupId);
        setSelectedPermissions((prevPerms) => {
          const nextPerms = new Set(prevPerms);
          allSubIds.forEach((id) => nextPerms.delete(id));
          return nextPerms;
        });
      } else {
        // Bật nhóm lớn -> Thêm nhóm và mặc định cấp toàn bộ quyền nhỏ trong nhóm
        nextGroups.add(groupId);
        setSelectedPermissions((prevPerms) => {
          const nextPerms = new Set(prevPerms);
          allSubIds.forEach((id) => nextPerms.add(id));
          return nextPerms;
        });
      }
      return nextGroups;
    });
  };

  // Toggle single sub-permission
  const handleTogglePermission = (groupId: string, permissionId: string) => {
    soundEngine.playClick();
    // Tự động kích hoạt nhóm lớn nếu chưa có
    setSelectedGroups((prevGroups) => {
      if (!prevGroups.has(groupId)) {
        const next = new Set(prevGroups);
        next.add(groupId);
        return next;
      }
      return prevGroups;
    });

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  // Quick grant all sub-permissions in group
  const handleGrantAllInGroup = (groupId: string) => {
    soundEngine.playClick();
    const allSubIds = getAllSubPermissionIds(groupId);
    setSelectedGroups((prevGroups) => {
      const next = new Set(prevGroups);
      next.add(groupId);
      return next;
    });
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      allSubIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Quick revoke all sub-permissions in group
  const handleRevokeAllInGroup = (groupId: string) => {
    soundEngine.playClick();
    const allSubIds = getAllSubPermissionIds(groupId);
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      allSubIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Chỉ lưu các quyền nhỏ thuộc những nhóm chức năng đang kích hoạt
      const finalGroups = Array.from(selectedGroups);
      const finalPerms = Array.from(selectedPermissions).filter((permId) => {
        const parentGroup = PERMISSION_GROUPS.find((g) =>
          g.subPermissions.some((sp) => sp.id === permId)
        );
        return parentGroup ? selectedGroups.has(parentGroup.id) : false;
      });

      await onSave({
        permissionGroups: finalGroups,
        permissions: finalPerms,
      });
      soundEngine.playCelestialChime();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Không thể cập nhật phân quyền tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090d24] border border-[#f5c767]/30 shadow-[0_0_60px_rgba(245,199,103,0.2)] overflow-hidden font-[family-name:var(--font-inter)] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#0d1435] via-[#090d24] to-[#0d1435] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f5c767]" />
              <span>Phân Quyền Quản Trị Viên (Manager RBAC)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Thêm tài khoản vào các Nhóm chức năng lớn và cấu hình chi tiết quyền hạn nhỏ.
            </p>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Target Manager Info Bar */}
        <div className="px-6 py-3.5 bg-[#060919] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3fe9d6] to-[#f5c767] p-0.5 shrink-0">
              <div className="w-full h-full bg-[#080b1a] rounded-[10px] flex items-center justify-center font-bold text-white text-xs">
                {account.username ? account.username[0].toUpperCase() : "M"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">{account.username}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {account.role}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {account.email || "(Tài khoản không có email)"}
              </span>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-400">
            <span>UID: </span>
            <span className="text-slate-200">{account.id.slice(0, 12)}...</span>
          </div>
        </div>

        {/* Scrollable Permissions Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Groups Iteration */}
          {PERMISSION_GROUPS.map((group) => {
            const isGroupActive = selectedGroups.has(group.id);
            const allSubIds = getAllSubPermissionIds(group.id);
            const activeSubCount = allSubIds.filter((id) => selectedPermissions.has(id)).length;
            const isAllGranted = activeSubCount === allSubIds.length;

            // Group sub-permissions by category
            const categories = Array.from(
              new Set(group.subPermissions.map((sp) => sp.categoryTitle))
            );

            return (
              <div
                key={group.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isGroupActive
                    ? "bg-[#0b102b] border-[#f5c767]/40 shadow-[0_4px_25px_rgba(245,199,103,0.12)]"
                    : "bg-[#070b1e]/70 border-white/10 opacity-80 hover:opacity-100"
                }`}
              >
                {/* Major Group Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 bg-white/[0.02]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isGroupActive ? "bg-[#f5c767]" : "bg-slate-600"
                        }`}
                      />
                      <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
                        {group.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f5c767]/10 text-[#f5c767] border border-[#f5c767]/30">
                        {group.code}
                      </span>
                      {isGroupActive && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            isAllGranted
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          Đã cấp {activeSubCount}/{allSubIds.length} quyền
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
                  </div>

                  {/* Master Toggle Switch */}
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <span
                      className={`text-xs font-semibold font-mono ${
                        isGroupActive ? "text-[#f5c767]" : "text-slate-400"
                      }`}
                    >
                      {isGroupActive ? "ĐÃ THÊM VÀO NHÓM" : "CHƯA THÊM VÀO NHÓM"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(group.id)}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isGroupActive ? "bg-gradient-to-r from-[#f5c767] to-[#e6b143]" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#060814] shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isGroupActive ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sub-Permissions Body (Shown when Group is Active) */}
                {isGroupActive ? (
                  <div className="p-5 space-y-6">
                    {/* Quick Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5 text-xs">
                      <div className="text-slate-300">
                        Chọn hoặc bỏ chọn các quyền nhỏ để tùy chỉnh hạn mức hoạt động:
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleGrantAllInGroup(group.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                        >
                          Cấp tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeAllInGroup(group.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                        >
                          Thu hồi hết
                        </button>
                      </div>
                    </div>

                    {/* Categorized Sub-Permissions */}
                    {categories.map((catTitle) => {
                      const subItems = group.subPermissions.filter(
                        (sp) => sp.categoryTitle === catTitle
                      );

                      return (
                        <div key={catTitle} className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-[family-name:var(--font-rajdhani)] tracking-wider uppercase">
                            <span className="w-1.5 h-3.5 rounded-full bg-[#3fe9d6]" />
                            <span>{catTitle}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subItems.map((sub) => {
                              const isChecked = selectedPermissions.has(sub.id);

                              return (
                                <div
                                  key={sub.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleTogglePermission(group.id, sub.id);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleTogglePermission(group.id, sub.id);
                                    }
                                  }}
                                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all ${
                                    isChecked
                                      ? "bg-[#0f173d] border-[#3fe9d6]/50 shadow-[0_0_15px_rgba(63,233,214,0.12)] ring-1 ring-[#3fe9d6]/30"
                                      : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04] opacity-70"
                                  }`}
                                >
                                  <div className="pt-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      className="w-4 h-4 rounded border-slate-600 bg-black/40 text-[#3fe9d6] focus:ring-0 pointer-events-none"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`text-xs font-semibold truncate ${
                                          isChecked ? "text-white font-bold" : "text-slate-300"
                                        }`}
                                      >
                                        {sub.title}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono shrink-0 ${
                                          isChecked
                                            ? "bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/30 font-bold"
                                            : "bg-slate-800 text-slate-500"
                                        }`}
                                      >
                                        {isChecked ? "Được phép" : "Bị chặn"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                      {sub.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-black/20 font-mono">
                    Manager chưa được cấp nhóm chức năng này. Gạt công tắc ở trên để thêm Manager vào nhóm.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/10 bg-[#060919] flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block font-mono">
            Đã kích hoạt:{" "}
            <strong className="text-[#f5c767]">{selectedGroups.size}</strong> nhóm lớn,{" "}
            <strong className="text-[#3fe9d6]">{selectedPermissions.size}</strong> quyền nhỏ.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814] font-bold text-xs shadow-[0_0_20px_rgba(245,199,103,0.35)] hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#060814] border-t-transparent animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu Phân Quyền</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
