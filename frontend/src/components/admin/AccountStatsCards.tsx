"use client";

interface StatsProps {
  stats: {
    total: number;
    active: number;
    banned: number;
    admins: number;
    pending: number;
    todayPlayers?: number;
  };
}

export default function AccountStatsCards({ stats }: StatsProps) {
  const cards = [
    {
      title: "Tổng Số Tài Khoản",
      value: stats.total,
      subtext: `+${stats.todayPlayers ?? 0} người chơi mới hôm nay`,
      badge: "Toàn bộ",
      color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: "Chỉ Huy Hoạt Động",
      value: stats.active,
      subtext: `${Math.round((stats.active / (stats.total || 1)) * 100)}% tỷ lệ sẵn sàng`,
      badge: "Bình thường",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Ban Quản Trị & Quản Lý",
      value: stats.admins,
      subtext: "Quyền hạn bảo an & vận hành",
      badge: "Đặc quyền",
      color: "from-[#f5c767]/20 to-amber-500/10 border-[#f5c767]/30 text-[#f5c767]",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Tài Khoản Bị Khóa",
      value: stats.banned,
      subtext: "Vi phạm nội quy & gian lận",
      badge: "Cảnh báo",
      color: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`relative overflow-hidden rounded-2xl p-5 bg-[#090c21]/80 backdrop-blur-md border ${card.color} shadow-lg transition-transform hover:-translate-y-1`}
        >
          {/* Subtle Glow in background */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-current opacity-10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              {card.title}
            </span>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-current">
              {card.icon}
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold font-[family-name:var(--font-rajdhani)] text-white tracking-tight">
              {card.value}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
              {card.badge}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono truncate">
            {card.subtext}
          </p>
        </div>
      ))}
    </div>
  );
}
