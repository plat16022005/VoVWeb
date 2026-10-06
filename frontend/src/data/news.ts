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
    title: "Sự Kiện Khởi Hành Tân Thủ: Nhận Ngay 80 Lượt Quay Tinh Cầu & Nhân Vật 4 Sao Miễn Phí!",
    date: "05/10/2026",
    summary: "Nhà Khai Phá đăng nhập liên tục 7 ngày sẽ nhận trọn bộ vé quay tinh cầu đặc biệt cùng nguyên liệu nâng cấp cấp tốc."
  },
  {
    id: 2,
    tag: "THÔNG BÁO",
    tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    title: "Cập Nhật Phiên Bản 1.0: Vạn Giới Khởi Hành — Khai Mở Tuyến Đường Astral Express",
    date: "03/10/2026",
    summary: "Hành trình chính thức mở cửa. Khám phá Trạm Không Gian Aethel, chạm trán Quân Đoàn Hư Vô và kết bạn cùng các hiệp sĩ ngân hà."
  },
  {
    id: 3,
    tag: "TIN GAME",
    tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    title: "Giới Thiệu Nhân Vật Mới: Aurelia — Kiếm Vương Ánh Sao Sắp Xuất Hiện Tại Bước Nhảy Định Mệnh",
    date: "01/10/2026",
    summary: "Cơ hội sở hữu hiệp sĩ Săn Bắn thuộc tính Lôi đầu tiên với tỉ lệ UP 50% trong banner giới hạn."
  },
  {
    id: 4,
    tag: "HOẠT ĐỘNG",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    title: "Cuộc Thi Sáng Tạo Cộng Đồng: Thiết Kế Khoang Tàu Ngân Hà — Tổng Giải Thưởng 50.000.000 VNĐ",
    date: "28/09/2026",
    summary: "Tham gia gửi tranh vẽ, video hoặc hướng dẫn chiến thuật trên kênh HoYoLAB để rinh quà lưu niệm độc quyền."
  }
];
