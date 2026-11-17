"use client";

interface PermissionsOverviewCardsProps {
  totalManagers: number;
  assignedManagers: number;
  unassignedManagers: number;
  totalGroups: number;
  totalSubPermissions: number;
}

export default function PermissionsOverviewCards({
  totalManagers,
  assignedManagers,
  unassignedManagers,
  totalGroups,
  totalSubPermissions,
}: PermissionsOverviewCardsProps) {
  const cards = [
    {
      title: "Tổng Số Quản Lý (Manager)",
      value: totalManagers,
      subtext: "Tài khoản cấp vận hành",
      icon: (
        <svg className="w-5 h-5 text-[#3fe9d6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      borderColor: "border-[#3fe9d6]/30",
      bgGlow: "from-[#3fe9d6]/10 to-transparent",
      badgeText: "Vận Hành",
      badgeColor: "text-[#3fe9d6] bg-[#3fe9d6]/10 border-[#3fe9d6]/30",
    },
    {
      title: "Đã Cấp Quản Lý Nội Dung",
      value: assignedManagers,
      subtext: "Được kích hoạt nhóm chức năng",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      borderColor: "border-emerald-500/30",
      bgGlow: "from-emerald-500/10 to-transparent",
      badgeText: "Hoạt Động",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      title: "Chưa Phân Quyền",
      value: unassignedManagers,
      subtext: "Cần Admin gán quyền hạn",
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      borderColor: "border-amber-500/30",
      bgGlow: "from-amber-500/10 to-transparent",
      badgeText: "Chờ Gán",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      title: "Cụm Quyền Hệ Thống (RBAC)",
      value: `${totalGroups} Nhóm`,
      subtext: `${totalSubPermissions} quyền chức năng chi tiết`,
      icon: (
        <svg className="w-5 h-5 text-[#9b51e0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      borderColor: "border-[#9b51e0]/30",
      bgGlow: "from-[#9b51e0]/10 to-transparent",
      badgeText: "2 Cấp Độ",
      badgeColor: "text-[#9b51e0] bg-[#9b51e0]/10 border-[#9b51e0]/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`relative overflow-hidden p-5 rounded-2xl bg-[#090c21]/90 backdrop-blur-md border ${c.borderColor} shadow-lg transition-transform hover:-translate-y-0.5 duration-200`}
        >
          <div
            className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${c.bgGlow} rounded-full blur-2xl pointer-events-none`}
          />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {c.title}
            </span>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              {c.icon}
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-[family-name:var(--font-rajdhani)] text-3xl font-bold text-white tracking-wide">
              {c.value}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${c.badgeColor} uppercase font-semibold`}
            >
              {c.badgeText}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-400">{c.subtext}</p>
        </div>
      ))}
    </div>
  );
}

