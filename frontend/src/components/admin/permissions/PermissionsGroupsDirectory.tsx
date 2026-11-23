"use client";

import { PERMISSION_GROUPS } from "@/data/permissions";
import { AdminAccount } from "@/data/adminAccounts";

interface PermissionsGroupsDirectoryProps {
  managers: AdminAccount[];
}

export default function PermissionsGroupsDirectory({
  managers,
}: PermissionsGroupsDirectoryProps) {
  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="p-6 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-[#3fe9d6]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3fe9d6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#3fe9d6] uppercase tracking-wider mb-1">
              <span>Kiến Trúc Phân Quyền 2 Cấp Độ (Hierarchical RBAC)</span>
            </div>
            <h3 className="text-lg font-bold font-[family-name:var(--font-rajdhani)] text-white">
              DANH MỤC NHÓM CHỨC NĂNG LỚN & QUYỀN HẠN CHI TIẾT
            </h3>
            <p className="mt-1 text-xs text-slate-400 font-mono max-w-3xl leading-relaxed">
              Mỗi Quản Lý (Manager) khi được thêm vào Nhóm Chức Năng Lớn sẽ có quyền truy cập vào phân hệ đó.
              Admin có thể tùy biến bật/tắt từng quyền con để giới hạn phạm vi tác vụ (ví dụ: chỉ cho phép xem hoặc viết bài, không cho phép xóa bài).
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono shrink-0">
            Phân quyền tài khoản bảo mật
          </div>
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-6">
        {PERMISSION_GROUPS.map((group) => {
          // Count managers holding this group
          const managersWithGroup = managers.filter(
            (m) => m.permissionGroups && m.permissionGroups.includes(group.id)
          );

          // Group subpermissions by category
          const categories = Array.from(
            new Set(group.subPermissions.map((sp) => sp.categoryTitle))
          );

          return (
            <div
              key={group.id}
              className="rounded-2xl bg-[#090c21]/90 backdrop-blur-md border border-white/10 overflow-hidden shadow-xl"
            >
              {/* Group Header */}
              <div className="p-5 border-b border-white/10 bg-[#060814]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-[#3fe9d6]" />
                    <h4 className="font-[family-name:var(--font-rajdhani)] text-xl font-bold text-white tracking-wide">
                      {group.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30 font-bold">
                      {group.code}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    {group.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span>{managersWithGroup.length} Quản Lý Đang Nắm Giữ</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                    {group.subPermissions.length} Quyền Con
                  </div>
                </div>
              </div>

              {/* Sub-permissions by Category */}
              <div className="p-5 space-y-6">
                {categories.map((catTitle) => {
                  const subPermsInCat = group.subPermissions.filter(
                    (sp) => sp.categoryTitle === catTitle
                  );

                  return (
                    <div key={catTitle} className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#f5c767] uppercase tracking-wider">
                        <span className="w-1.5 h-3.5 rounded-full bg-[#f5c767]" />
                        <span>{catTitle}</span>
                        <span className="text-slate-400 font-normal">
                          ({subPermsInCat.length} tác vụ)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subPermsInCat.map((sp) => {
                          // Count how many managers have this subpermission
                          const count = managers.filter(
                            (m) => m.permissions && m.permissions.includes(sp.id)
                          ).length;

                          return (
                            <div
                              key={sp.id}
                              className="p-3.5 rounded-xl bg-[#060814]/60 border border-white/5 hover:border-[#3fe9d6]/30 transition-all flex items-start justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {sp.title}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-[#3fe9d6]">
                                  {sp.id}
                                </div>
                                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                                  {sp.description}
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                    count > 0
                                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                                      : "bg-white/5 text-slate-400 border border-white/5"
                                  }`}
                                >
                                  {count} Manager
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
