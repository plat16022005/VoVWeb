export interface SubPermission {
  id: string;
  title: string;
  description: string;
  category: "blog" | "facebook" | "character" | "gacha" | "item" | "event" | "giftcode" | "general";
  categoryTitle: string;
}

export interface PermissionGroup {
  id: string;
  title: string;
  code: string;
  description: string;
  icon: string;
  subPermissions: SubPermission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "content_management",
    title: "Quản Lý Nội Dung",
    code: "CONTENT_OPS",
    description: "Điều phối bài viết blog, tin tức trang chủ và hệ thống Fanpage mạng xã hội Facebook.",
    icon: "📰",
    subPermissions: [
      // Nhánh 1: Blog & Tin Tức
      {
        id: "content.blog.view",
        title: "Xem Danh Sách & Bài Viết Blog",
        description: "Xem danh sách bài viết, xem trước nội dung và thống kê lượt đọc.",
        category: "blog",
        categoryTitle: "Quản Lý Blog & Tin Tức",
      },
      {
        id: "content.blog.edit",
        title: "Soạn Thảo & Chỉnh Sửa Bài Viết",
        description: "Tạo bài viết mới, biên tập nội dung, chỉnh sửa ảnh bìa và tóm tắt.",
        category: "blog",
        categoryTitle: "Quản Lý Blog & Tin Tức",
      },
      {
        id: "content.blog.publish",
        title: "Xuất Bản / Gỡ Trạng Thái Công Khai",
        description: "Chuyển trạng thái giữa Bản Nháp (Draft) và Công Khai (Published).",
        category: "blog",
        categoryTitle: "Quản Lý Blog & Tin Tức",
      },
      {
        id: "content.blog.delete",
        title: "Xóa Bài Viết Khỏi Cơ Sở Dữ Liệu",
        description: "Xóa vĩnh viễn bài viết khỏi hệ thống quản trị bài đăng.",
        category: "blog",
        categoryTitle: "Quản Lý Blog & Tin Tức",
      },

      // Nhánh 2: Mạng Xã Hội Fanpage Facebook
      {
        id: "content.facebook.view",
        title: "Xem Tương Tác & Bài Viết Fanpage",
        description: "Theo dõi danh sách bài đăng Fanpage, lượt Likes, Bình Luận và Chia sẻ.",
        category: "facebook",
        categoryTitle: "Mạng Xã Hội Facebook Fanpage",
      },
      {
        id: "content.facebook.publish",
        title: "Đăng Bài Trực Tiếp Lên Fanpage",
        description: "Đồng bộ bài viết từ web và đăng tải bài mới lên Fanpage Facebook.",
        category: "facebook",
        categoryTitle: "Mạng Xã Hội Facebook Fanpage",
      },
      {
        id: "content.facebook.bot",
        title: "Cấu Hình & Bật/Tắt Bot Auto-Reply",
        description: "Quản lý công tắc Bot tự động và soạn mẫu tin nhắn trả lời bình luận.",
        category: "facebook",
        categoryTitle: "Mạng Xã Hội Facebook Fanpage",
      },
    ],
  },
  {
    id: "game_data",
    title: "Dữ Liệu Game & Nhân Vật",
    code: "GAME_DATA_OPS",
    description: "Quản lý thông số nhân vật Valkyria, bộ kỹ năng, hệ thống Banner Gacha theo mùa và thế giới Veyra.",
    icon: "⚔️",
    subPermissions: [
      {
        id: "gamedata.character.view",
        title: "Xem Danh Sách & Hồ Sơ Valkyria",
        description: "Xem toàn bộ danh mục nhân vật Valkyria, bộ kỹ năng và chỉ số chiến đấu.",
        category: "character",
        categoryTitle: "Quản Lý Nhân Vật (Valkyria)",
      },
      {
        id: "gamedata.character.edit",
        title: "Thêm Mới & Chỉnh Sửa Valkyria",
        description: "Tạo nhân vật mới, cập nhật danh hiệu, vai trò chiến đấu và hình ảnh.",
        category: "character",
        categoryTitle: "Quản Lý Nhân Vật (Valkyria)",
      },
      {
        id: "gamedata.character.skills",
        title: "Cân Bằng Chỉ Số & Kỹ Năng",
        description: "Thiết lập thông số chiến đấu (HP, ATK, DEF, SPD) và chỉnh sửa mô tả kỹ năng.",
        category: "character",
        categoryTitle: "Quản Lý Nhân Vật (Valkyria)",
      },
      {
        id: "gamedata.character.delete",
        title: "Xóa Valkyria Khỏi Hệ Thống",
        description: "Xóa vĩnh viễn nhân vật khỏi cơ sở dữ liệu trò chơi.",
        category: "character",
        categoryTitle: "Quản Lý Nhân Vật (Valkyria)",
      },
      // Nhánh 2: Hệ Thống Banner Gacha
      {
        id: "gamedata.gacha.view",
        title: "Xem Mùa & Cấu Hình Banner Gacha",
        description: "Xem danh sách mùa phát hành, cấu hình banner, tỷ lệ rơi, pity và pool tướng.",
        category: "gacha",
        categoryTitle: "Quản Lý Banner Gacha",
      },
      {
        id: "gamedata.gacha.edit",
        title: "Tạo Mới, Nhân Bản & Sửa Banner Gacha",
        description: "Tạo hoặc nhân bản mùa mới, chỉnh sửa banner con, tải ảnh, cấu hình tỷ lệ & pool tướng.",
        category: "gacha",
        categoryTitle: "Quản Lý Banner Gacha",
      },
      {
        id: "gamedata.gacha.activate",
        title: "Kích Hoạt Mùa & Bật/Tắt Banner",
        description: "Chuyển đổi mùa phát hành đang mở cho Game Client và bật/tắt trạng thái từng banner.",
        category: "gacha",
        categoryTitle: "Quản Lý Banner Gacha",
      },
      {
        id: "gamedata.gacha.delete",
        title: "Xóa Mùa Nháp & Xóa Banner Con",
        description: "Xóa các mùa ở trạng thái bản nháp hoặc gỡ bỏ banner con kèm dọn dẹp ảnh lưu trữ.",
        category: "gacha",
        categoryTitle: "Quản Lý Banner Gacha",
      },
      // Nhánh 3: Kho Vật Phẩm, Nguyên Liệu & Trang Bị
      {
        id: "gamedata.item.view",
        title: "Xem Kho Vật Phẩm, Nguyên Liệu & Trang Bị",
        description: "Xem danh sách vật phẩm tiêu hao, nguyên liệu đột phá, vé chiêu mộ, mảnh tướng và chỉ số trang bị.",
        category: "item",
        categoryTitle: "Quản Lý Vật Phẩm & Trang Bị",
      },
      {
        id: "gamedata.item.edit",
        title: "Tạo Mới, Chỉnh Sửa & Đồng Bộ Vật Phẩm Mẫu",
        description: "Khởi tạo vật phẩm mới, cấu hình hiệu ứng tiêu hao, chỉ số trang bị, mảnh ghép tướng và đồng bộ bộ mẫu Unity.",
        category: "item",
        categoryTitle: "Quản Lý Vật Phẩm & Trang Bị",
      },
      {
        id: "gamedata.item.delete",
        title: "Xóa Vật Phẩm Khỏi Danh Mục Game",
        description: "Xóa vĩnh viễn cấu hình vật phẩm hoặc trang bị khỏi hệ thống dữ liệu trò chơi.",
        category: "item",
        categoryTitle: "Quản Lý Vật Phẩm & Trang Bị",
      },
    ],
  },
  {
    id: "event_management",
    title: "Quản Lý Sự Kiện",
    code: "EVENT_OPS",
    description: "Quản lý sự kiện Minigame Web (Unity WebGL) và phát hành Mã Quà Tặng (Giftcode) kèm phần thưởng trong game.",
    icon: "◆",
    subPermissions: [
      // Nhánh 1: Sự Kiện & Minigame Web (Unity WebGL)
      {
        id: "event.minigame.view",
        title: "Xem Danh Sách & Cấu Hình Sự Kiện Minigame",
        description: "Xem danh sách các chiến dịch sự kiện, phiên bản bản build Unity WebGL (.zip), giao diện (.html) và thông số phần thưởng.",
        category: "event",
        categoryTitle: "Sự Kiện & Minigame Web (Unity WebGL)",
      },
      {
        id: "event.minigame.edit",
        title: "Tạo Sự Kiện, Tải Bản Build (.html/.zip) & Cấu Hình",
        description: "Khởi tạo sự kiện mới, tải lên tệp .html layout và .zip bản build Unity WebGL để hợp nhất tự động, cấu hình nhiệm vụ nhận lượt & quà.",
        category: "event",
        categoryTitle: "Sự Kiện & Minigame Web (Unity WebGL)",
      },
      {
        id: "event.minigame.publish",
        title: "Kích Hoạt & Bật/Tắt Sự Kiện Công Khai",
        description: "Mở công khai sự kiện trên cổng Web cho Chỉ Huy tham gia hoặc tạm đóng bảo trì.",
        category: "event",
        categoryTitle: "Sự Kiện & Minigame Web (Unity WebGL)",
      },
      {
        id: "event.minigame.delete",
        title: "Xóa Sự Kiện Nháp & Dọn Dẹp Lưu Trữ",
        description: "Xóa sự kiện đang đóng/nháp và tự động gỡ bỏ các tệp .wasm, .data, .html trên lưu trữ đám mây.",
        category: "event",
        categoryTitle: "Sự Kiện & Minigame Web (Unity WebGL)",
      },
      // Nhánh 2: Quản Lý Mã Quà Tặng (Giftcode)
      {
        id: "event.giftcode.view",
        title: "Xem Danh Sách & Thống Kê Mã Quà Tặng",
        description: "Theo dõi toàn bộ mã Giftcode dùng chung, lô mã đơn lẻ, phần thưởng, hạn dùng và tiến độ lượt nhập.",
        category: "giftcode",
        categoryTitle: "Quản Lý Mã Quà Tặng (Giftcode)",
      },
      {
        id: "event.giftcode.edit",
        title: "Tạo Mới, Sinh Hàng Loạt & Chỉnh Sửa Giftcode",
        description: "Khởi tạo mã quà tặng mới, sinh lô mã dùng 1 lần, cấu hình Vàng/Ngọc/Thể Lực/Vật phẩm, phạm vi máy chủ và thời hạn.",
        category: "giftcode",
        categoryTitle: "Quản Lý Mã Quà Tặng (Giftcode)",
      },
      {
        id: "event.giftcode.toggle",
        title: "Bật/Tắt Kích Hoạt & Khóa Khẩn Cấp Mã",
        description: "Mở kích hoạt hoặc tạm khóa khẩn cấp mã quà tặng khi phát sinh sự cố vận hành.",
        category: "giftcode",
        categoryTitle: "Quản Lý Mã Quà Tặng (Giftcode)",
      },
      {
        id: "event.giftcode.delete",
        title: "Xóa Mã Quà Tặng Khỏi Hệ Thống",
        description: "Xóa vĩnh viễn mã quà tặng không còn sử dụng khỏi hệ thống quản trị sự kiện.",
        category: "giftcode",
        categoryTitle: "Quản Lý Mã Quà Tặng (Giftcode)",
      },
    ],
  },
];

// Lấy tất cả ID quyền con của một nhóm
export function getAllSubPermissionIds(groupId: string): string[] {
  const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
  return group ? group.subPermissions.map((sp) => sp.id) : [];
}

// Kiểm tra user có thuộc nhóm chức năng lớn hay không
export function hasPermissionGroup(
  user: { role?: string; permissionGroups?: string[] } | null | undefined,
  groupId: string
): boolean {
  if (!user) return false;
  // Admin luôn có toàn quyền
  if (user.role === "Admin") return true;
  // Chỉ tài khoản Manager mới được xét nhóm quyền
  if (user.role !== "Manager") return false;
  return Boolean(user.permissionGroups && user.permissionGroups.includes(groupId));
}

// Kiểm tra user có quyền thao tác nhỏ cụ thể hay không
export function hasPermission(
  user:
    | {
      role?: string;
      permissions?: string[];
      permissionGroups?: string[];
    }
    | null
    | undefined,
  permissionId: string
): boolean {
  if (!user) return false;
  // Admin luôn có toàn quyền
  if (user.role === "Admin") return true;
  // Chỉ Manager mới được xét
  if (user.role !== "Manager") return false;

  // Tìm nhóm lớn chứa quyền này
  const group = PERMISSION_GROUPS.find((g) =>
    g.subPermissions.some((sp) => sp.id === permissionId)
  );

  // Nếu không thuộc nhóm lớn -> Chặn ngay
  if (group && (!user.permissionGroups || !user.permissionGroups.includes(group.id))) {
    return false;
  }

  // Kiểm tra quyền nhỏ cụ thể
  return Boolean(user.permissions && user.permissions.includes(permissionId));
}

