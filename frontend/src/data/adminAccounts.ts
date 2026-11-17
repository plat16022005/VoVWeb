export interface BanTermDetail {
  id?: string;
  title: string;
  content?: string;
}

export interface BanDetails {
  termId?: string;       // Mã điều khoản chính
  termTitle?: string;    // Tiêu đề điều khoản hoặc các tiêu đề gộp
  termContent?: string;  // Toàn bộ nội dung trích lục của điều khoản vi phạm
  termIds?: string[];    // Danh sách các ID điều khoản đã chọn
  termTitles?: string[]; // Danh sách tiêu đề điều khoản đã chọn
  terms?: BanTermDetail[]; // Chi tiết danh sách các điều khoản đã chọn
  note?: string;         // Ghi chú chi tiết từ Ban Quản Trị
  bannedAt?: string;     // Ngày giờ thực hiện khóa
  bannedBy?: string;     // Người thực hiện khóa
}

export interface AdminAccount {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "Manager" | "Player";
  status: "active" | "banned" | "pending";
  provider?: "Email" | "Google" | "Guest";
  createdAt: string;
  createdAtTimestamp: number;
  lastLogin: string;
  lastLoginTimestamp: number;
  banDetails?: BanDetails;
  permissionGroups?: string[]; // Danh sách nhóm chức năng lớn được cấp (vd: ["content_management"])
  permissions?: string[];      // Danh sách các quyền nhỏ cụ thể (vd: ["content.blog.view", ...])
}
