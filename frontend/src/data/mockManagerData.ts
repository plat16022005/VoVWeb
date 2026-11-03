// Mock Data dành riêng cho Phân hệ Quản Lý Vận Hành (Manager Portal - Live Operations)
// Cốt truyện & Thuật ngữ tuân thủ Valkyria of Veyra

export interface OperationStatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
  iconType: "users" | "ccu" | "gem" | "server" | "ticket";
}

export interface ManagerGiftcode {
  id: string;
  code: string;
  title: string;
  description: string;
  rewards: {
    ruby: number;
    destinyTicket: number;
    gold: number;
    energy: number;
    specialItem?: string;
  };
  totalUses: number;
  maxUses: number;
  serverTarget: "ALL" | "S1" | "S2" | "S3";
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "PAUSED" | "EXPIRED";
  createdBy: string;
}

export interface ManagerServerMail {
  id: string;
  title: string;
  sender: string;
  targetType: "ALL_SERVERS" | "SPECIFIC_SERVER" | "SINGLE_PLAYER";
  targetServer?: string;
  targetPlayerUid?: string;
  targetPlayerName?: string;
  content: string;
  rewards: {
    name: string;
    amount: number;
    icon: string;
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  }[];
  sentAt: string;
  expiresAt: string;
  status: "DELIVERED" | "SCHEDULED" | "REVOKED";
  receivedCount: number;
}

export interface ManagerEvent {
  id: string;
  name: string;
  category: "GACHA_BANNER" | "LOGIN_REWARD" | "LEADERBOARD_RACE" | "WORLD_BOSS";
  bannerImage: string;
  featuredValkyria?: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "ONGOING" | "UPCOMING" | "ENDED";
  participants: number;
  highlightTag: string;
}

export interface ManagerPlayerRecord {
  uid: string;
  commanderName: string;
  server: string;
  level: number;
  combatPower: number;
  vipTier: number;
  rubyBalance: number;
  mainValkyria: string;
  valkyriaAvatar: string;
  lastLogin: string;
  accountStatus: "NORMAL" | "WARNING" | "RESTRICTED";
  totalSpentVND: string;
  reportCount: number;
}

export interface BroadcastAnnouncement {
  id: string;
  message: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  targetServer: string;
  activeUntil: string;
  isActive: boolean;
  repeatIntervalMinutes: number;
}

// 1. Thống kê KPI vận hành tổng quan
export const MOCK_OPERATION_STATS: OperationStatCard[] = [
  {
    title: "Chỉ Huy Online (CCU)",
    value: "14,820",
    change: "+12.4%",
    isPositive: true,
    subtext: "Đỉnh điểm 18,950 lúc 20:30 tối qua",
    iconType: "ccu",
  },
  {
    title: "Tổng Chỉ Huy Hoạt Động (DAU)",
    value: "86,450",
    change: "+8.1%",
    isPositive: true,
    subtext: "Tăng trưởng liên tục tuần này",
    iconType: "users",
  },
  {
    title: "Ruby Tiêu Thụ Trong Ngày",
    value: "4,850,200",
    change: "+24.5%",
    isPositive: true,
    subtext: "Giao dịch gacha Banner Freya tăng vọt",
    iconType: "gem",
  },
  {
    title: "Giftcode Đã Kích Hoạt",
    value: "38,912",
    change: "+15.3%",
    isPositive: true,
    subtext: "Mã TIECTIEPVIEN888 đạt 92% dung lượng",
    iconType: "ticket",
  },
];

// 2. Danh sách Giftcode vận hành
export const MOCK_GIFTCODES: ManagerGiftcode[] = [
  {
    id: "gc_001",
    code: "VEYRAOPEN2026",
    title: "Quà Khai Mở Tân Thế Giới Veyra",
    description: "Bộ quà mừng tân thủ gia nhập vùng đất Veyra huyền bí.",
    rewards: {
      ruby: 800,
      destinyTicket: 10,
      gold: 50000,
      energy: 120,
      specialItem: "Hộp Quà Valkyria SR Tự Chọn",
    },
    totalUses: 18450,
    maxUses: 20000,
    serverTarget: "ALL",
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    status: "ACTIVE",
    createdBy: "Manager.Elysia",
  },
  {
    id: "gc_002",
    code: "VALKYRIAFREYA",
    title: "Chúc Mừng Ra Mắt Valkyria Băng Giá - Freya",
    description: "Giftcode mừng nhân vật SSR Freya xuất hiện trong banner ước nguyện.",
    rewards: {
      ruby: 500,
      destinyTicket: 5,
      gold: 30000,
      energy: 60,
    },
    totalUses: 9230,
    maxUses: 15000,
    serverTarget: "ALL",
    startDate: "2026-10-25",
    endDate: "2026-11-15",
    status: "ACTIVE",
    createdBy: "Manager.Elysia",
  },
  {
    id: "gc_003",
    code: "COMPENSATE1028",
    title: "Đền Bù Trục Trặc Đấu Trường Cụm S1",
    description: "Đền bù vé khiêu chiến và Ruby do bảo trì đột xuất ngày 28/10.",
    rewards: {
      ruby: 300,
      destinyTicket: 3,
      gold: 20000,
      energy: 100,
    },
    totalUses: 4890,
    maxUses: 5000,
    serverTarget: "S1",
    startDate: "2026-10-28",
    endDate: "2026-11-05",
    status: "ACTIVE",
    createdBy: "Manager.Lucian",
  },
  {
    id: "gc_004",
    code: "HALLOWEENVEYRA",
    title: "Dạ Hội Bóng Đêm Thành Astral",
    description: "Sự kiện lễ hội hóa trang mùa thu tại Veyra.",
    rewards: {
      ruby: 666,
      destinyTicket: 6,
      gold: 66666,
      energy: 66,
      specialItem: "Khung Avatar Bóng Ma Huyền Bí",
    },
    totalUses: 12000,
    maxUses: 12000,
    serverTarget: "ALL",
    startDate: "2026-10-29",
    endDate: "2026-11-02",
    status: "EXPIRED",
    createdBy: "Manager.Elysia",
  },
  {
    id: "gc_005",
    code: "TESTCODEVIP999",
    title: "Mã Thử Nghiệm Nội Bộ Hệ Thống",
    description: "Tạm dừng để kiểm tra logic phát thưởng.",
    rewards: {
      ruby: 9999,
      destinyTicket: 50,
      gold: 999999,
      energy: 500,
    },
    totalUses: 15,
    maxUses: 100,
    serverTarget: "S3",
    startDate: "2026-11-01",
    endDate: "2026-11-20",
    status: "PAUSED",
    createdBy: "Manager.Kael",
  },
];

// 3. Danh sách Hòm thư server đã phát
export const MOCK_SERVER_MAILS: ManagerServerMail[] = [
  {
    id: "mail_001",
    title: "Thông Báo Cập Nhật Bản Vá 1.2.5 & Quà Tri Ân",
    sender: "Bộ Chỉ Huy Tối Cao Veyra",
    targetType: "ALL_SERVERS",
    content: "Kính gửi toàn thể các Chỉ Huy. Bản cập nhật 1.2.5 đã hoàn tất với việc tối ưu hóa hiệu năng chiến đấu theo lượt và sửa lỗi giao diện Thần Điện. Xin gửi chút quà tri ân đến quý vị.",
    rewards: [
      { name: "Ruby Tinh Thể", amount: 600, icon: "💎", rarity: "LEGENDARY" },
      { name: "Vé Triệu Hồi Vận Mệnh", amount: 5, icon: "🎫", rarity: "EPIC" },
      { name: "Bình Thể Lực Cực Đại", amount: 3, icon: "🧪", rarity: "RARE" },
    ],
    sentAt: "2026-11-02 08:00:00",
    expiresAt: "2026-11-16 23:59:59",
    status: "DELIVERED",
    receivedCount: 42150,
  },
  {
    id: "mail_002",
    title: "Đền Bù Trễ Nhận Thưởng Boss Thế Giới 'Băng Long Nidhogg'",
    sender: "Hội Đồng Điều Hành Vận Hành",
    targetType: "SPECIFIC_SERVER",
    targetServer: "S1 - Veyra Khởi Nguyên",
    content: "Hệ thống ghi nhận sự cố gián đoạn phát thưởng Top Boss ngày 01/11 tại máy chủ S1. Toàn bộ phần thưởng xếp hạng bổ sung đã được gửi kèm thư này.",
    rewards: [
      { name: "Ruby Tinh Thể", amount: 300, icon: "💎", rarity: "LEGENDARY" },
      { name: "Rương Trang Bị Sử Thi", amount: 2, icon: "📦", rarity: "EPIC" },
      { name: "Vàng Veyra", amount: 100000, icon: "🪙", rarity: "COMMON" },
    ],
    sentAt: "2026-11-01 19:45:00",
    expiresAt: "2026-11-08 23:59:59",
    status: "DELIVERED",
    receivedCount: 11200,
  },
  {
    id: "mail_003",
    title: "Quà Chúc Mừng Thăng Cấp VIP 7 Đặc Quyền",
    sender: "Trợ Lý Vận Hành Veyra",
    targetType: "SINGLE_PLAYER",
    targetPlayerUid: "usr_992147",
    targetPlayerName: "VeyraKing_99",
    content: "Chúc mừng Chỉ Huy VeyraKing_99 đã vinh thăng bậc VIP 7. Xin gửi tặng ngài danh hiệu 'Bảo Hộ Vương Quốc' và quà mừng độc quyền.",
    rewards: [
      { name: "Vé Triệu Hồi Vận Mệnh", amount: 20, icon: "🎫", rarity: "LEGENDARY" },
      { name: "Khung Danh Dự VIP 7", amount: 1, icon: "👑", rarity: "LEGENDARY" },
      { name: "Đá Tinh Luyện Thần Khí", amount: 50, icon: "✨", rarity: "EPIC" },
    ],
    sentAt: "2026-10-31 14:10:00",
    expiresAt: "2026-11-30 23:59:59",
    status: "DELIVERED",
    receivedCount: 1,
  },
];

// 4. Danh sách Sự kiện & Banner ước nguyện
export const MOCK_EVENTS: ManagerEvent[] = [
  {
    id: "evt_001",
    name: "Ước Nguyện Vận Mệnh: Khúc Hát Băng Giá",
    category: "GACHA_BANNER",
    featuredValkyria: "Freya - Nữ Thần Băng Phong (SSR)",
    bannerImage: "/images/characters/freya.png",
    description: "Tăng 50% tỉ lệ triệu hồi Valkyria nguyên tố Băng SSR Freya và Thần Khí Trấn Phái Băng Tiết Cung.",
    startDate: "2026-10-25 00:00",
    endDate: "2026-11-15 23:59",
    status: "ONGOING",
    participants: 34120,
    highlightTag: "Rate-up x2",
  },
  {
    id: "evt_002",
    name: "Hành Trình Thám Hiểm: Rừng Cổ Thụ Yggdrasil",
    category: "LEADERBOARD_RACE",
    bannerImage: "/images/worlds/yggdrasil.png",
    description: "Đua ải vượt tháp đoạt danh hiệu độc quyền và Rương Chọn Valkyria SSR Hoàng Gia.",
    startDate: "2026-11-01 10:00",
    endDate: "2026-11-10 22:00",
    status: "ONGOING",
    participants: 19800,
    highlightTag: "Đua Top Ải",
  },
  {
    id: "evt_003",
    name: "Đăng Nhập 7 Ngày Nhận Valkyria SSR Ignis",
    category: "LOGIN_REWARD",
    featuredValkyria: "Ignis - Hỏa Vũ Cuồng Phong (SSR)",
    bannerImage: "/images/characters/ignis.png",
    description: "Chỉ cần đăng nhập tích lũy 7 ngày nhận ngay Valkyria hệ Hỏa cực mạnh cùng 20 Vé Quay.",
    startDate: "2026-11-01 00:00",
    endDate: "2026-11-30 23:59",
    status: "ONGOING",
    participants: 78900,
    highlightTag: "Miễn Phí SSR",
  },
  {
    id: "evt_004",
    name: "Đại Chiến Boss Liên Server: Rồng Lửa Hủy Diệt",
    category: "WORLD_BOSS",
    bannerImage: "/images/worlds/volcano.png",
    description: "Toàn bộ Chỉ Huy thuộc cụm máy chủ liên minh hợp lực đánh bại Boss Thế Giới nhận Kim Cương.",
    startDate: "2026-11-08 20:00",
    endDate: "2026-11-08 21:30",
    status: "UPCOMING",
    participants: 0,
    highlightTag: "Sắp Diễn Ra",
  },
];

// 5. Danh sách Tra cứu & Hỗ trợ người chơi
export const MOCK_PLAYERS_SUPPORT: ManagerPlayerRecord[] = [
  {
    uid: "usr_992147",
    commanderName: "VeyraKing_99",
    server: "S1 - Veyra Khởi Nguyên",
    level: 78,
    combatPower: 1245600,
    vipTier: 7,
    rubyBalance: 34500,
    mainValkyria: "Freya (SSR Lv.80)",
    valkyriaAvatar: "❄️",
    lastLogin: "5 phút trước",
    accountStatus: "NORMAL",
    totalSpentVND: "12,500,000 đ",
    reportCount: 0,
  },
  {
    uid: "usr_881023",
    commanderName: "ShadowBlade_VN",
    server: "S1 - Veyra Khởi Nguyên",
    level: 74,
    combatPower: 980400,
    vipTier: 5,
    rubyBalance: 8200,
    mainValkyria: "Ignis (SSR Lv.75)",
    valkyriaAvatar: "🔥",
    lastLogin: "22 phút trước",
    accountStatus: "NORMAL",
    totalSpentVND: "4,200,000 đ",
    reportCount: 1,
  },
  {
    uid: "usr_773912",
    commanderName: "SpeedRunner_99",
    server: "S2 - Băng Phong Lãnh Địa",
    level: 42,
    combatPower: 650000,
    vipTier: 1,
    rubyBalance: 1200,
    mainValkyria: "Astrid (SR Lv.50)",
    valkyriaAvatar: "⚡",
    lastLogin: "1 giờ trước",
    accountStatus: "WARNING",
    totalSpentVND: "100,000 đ",
    reportCount: 4,
  },
  {
    uid: "usr_665411",
    commanderName: "ThầnChiếnBinh_VoV",
    server: "S2 - Băng Phong Lãnh Địa",
    level: 69,
    combatPower: 890000,
    vipTier: 4,
    rubyBalance: 15400,
    mainValkyria: "Selena (SSR Lv.70)",
    valkyriaAvatar: "🌙",
    lastLogin: "Hôm qua 23:14",
    accountStatus: "NORMAL",
    totalSpentVND: "2,800,000 đ",
    reportCount: 0,
  },
  {
    uid: "usr_551982",
    commanderName: "KẻHủyDiệt_Bot01",
    server: "S1 - Veyra Khởi Nguyên",
    level: 15,
    combatPower: 45000,
    vipTier: 0,
    rubyBalance: 200,
    mainValkyria: "Thủ Vệ Tập Sự",
    valkyriaAvatar: "🛡️",
    lastLogin: "3 ngày trước",
    accountStatus: "RESTRICTED",
    totalSpentVND: "0 đ",
    reportCount: 12,
  },
];

// 6. Thông báo phát sóng khẩn cấp (Marquee)
export const MOCK_BROADCASTS: BroadcastAnnouncement[] = [
  {
    id: "bc_01",
    message: "[Hệ Thống Veyra]: Máy chủ S1 chuẩn bị cập nhật bản vá nóng lúc 12:00. Các Chỉ Huy vui lòng không tham gia ải vượt thời gian để tránh gián đoạn.",
    priority: "HIGH",
    targetServer: "Toàn Server S1",
    activeUntil: "2026-11-03 12:30",
    isActive: true,
    repeatIntervalMinutes: 5,
  },
  {
    id: "bc_02",
    message: "[Chúc Mừng]: Chỉ Huy VeyraKing_99 đã chiêu mộ thành công Valkyria SSR Freya bậc 5 Sao!",
    priority: "NORMAL",
    targetServer: "Toàn Cụm Máy Chủ",
    activeUntil: "2026-11-03 18:00",
    isActive: true,
    repeatIntervalMinutes: 15,
  },
];

