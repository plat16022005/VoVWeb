export interface NewsItem {
  id: number;
  tag: string;
  tagColor: string;
  title: string;
  date: string;
  summary: string;
}

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    tag: "SỰ KIỆN",
    tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    title: "Sự Kiện Khởi Hành Tân Thủ: Nhận Ngay 80 Lượt Triệu Hồi & Valkyria 4 Sao Miễn Phí!",
    date: "05/10/2026",
    summary: "Chỉ Huy đăng nhập liên tục 7 ngày sẽ nhận trọn bộ vé triệu hồi đặc biệt cùng nguyên liệu nâng cấp cấp tốc."
  },
  {
    id: 2,
    tag: "THÔNG BÁO",
    tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    title: "Cập Nhật Phiên Bản 1.0: Bình Minh Veyra — Khai Mở Hành Trình Sát Cánh Cùng Các Valkyria",
    date: "03/10/2026",
    summary: "Hành trình chính thức mở cửa. Khám phá Thánh Địa Aethel, đẩy lùi Quân Đoàn Hắc Ám và kết giao cùng các nữ chiến binh Valkyria huyền thoại."
  },
  {
    id: 3,
    tag: "TIN GAME",
    tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    title: "Giới Thiệu Nhân Vật Mới: Aurelia — Nguyệt Quang Tuyệt Kiếm Xuất Hiện Tại Banner Triệu Hồi",
    date: "01/10/2026",
    summary: "Cơ hội sở hữu nữ tướng tiên phong hệ Lôi sắc bén với tỉ lệ UP 50% trong đợt triệu hồi giới hạn đầu tiên."
  },
  {
    id: 4,
    tag: "HOẠT ĐỘNG",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    title: "Cuộc Thi Sáng Tạo Cộng Đồng: Tác Phẩm Nghệ Thuật Valkyria of Veyra — Tổng Giải Thưởng 50.000.000 VNĐ",
    date: "28/09/2026",
    summary: "Tham gia gửi tranh vẽ, video hoặc cẩm nang phối hợp chiến thuật cùng các Valkyria để rinh quà lưu niệm độc quyền."
  }
];
