export interface CharacterSkill {
  name: string;
  type: string;
  desc: string;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  element: string;
  elementColor: string;
  path: string;
  rarity: number;
  cv: string;
  image: string;
  quote: string;
  lore: string;
  skills: CharacterSkill[];
}

export const CHARACTERS: Character[] = [
  {
    id: "aurelia",
    name: "Aurelia",
    title: "Nguyệt Quang Tuyệt Kiếm",
    element: "Lôi (Lightning)",
    elementColor: "#c084fc",
    path: "Săn Bắn (The Hunt)",
    rarity: 3,
    cv: "Hayami Saori / Laura Post",
    image: "/images/portrait1_tower1.png",
    quote: "Lưỡi kiếm của ta không bao giờ chùn bước trước bóng tối của hư vô.",
    lore: "Trưởng chỉ huy Đội Hiệp Sĩ Ánh Sao, Aurelia sở hữu kiếm thuật sắc bén có thể chém rách không gian đa chiều. Nàng chu du khắp các dải ngân hà để thanh trừng tàn dư của Hư Vô Tinh Thần.",
    skills: [
      { name: "Thiểm Quang Nhất Kiếm", type: "Đòn Đánh Thường", desc: "Gây Sát Thương Lôi tương đương 110% Tấn Công của Aurelia lên 1 kẻ địch chỉ định." },
      { name: "Ngân Hà Đoạt Hồn", type: "Chiến Kỹ", desc: "Tăng 35% Tỉ Lệ Bạo Kích trong 2 hiệp, tung 3 nhát kiếm liên hoàn chém nát điểm yếu của kẻ địch." },
      { name: "Tinh Tọa Vạn Kiếm Trảm", type: "Tuyệt Kỹ", desc: "Triệu hồi hàng vạn thanh kiếm sao băng trút xuống trận địa, gây Sát Thương Lôi bộc phá cực đại và lập tức nhận thêm 1 hiệp hành động." },
      { name: "Nguyệt Hoa Hộ Thể", type: "Thiên Phú", desc: "Mỗi khi hạ gục một mục tiêu, hồi phục 25% Năng Lượng và nhận lá chắn bảo vệ tương đương 20% HP tối đa." }
    ]
  },
  {
    id: "solas",
    name: "Solas",
    title: "Hoa Tiêu Thời Không",
    element: "Số Ảo (Imaginary)",
    elementColor: "#facc15",
    path: "Tri Thức (Erudition)",
    rarity: 5,
    cv: "Sakurai Takahiro / Ray Chase",
    image: "/images/portrait1_tower7.png",
    quote: "Mọi vì sao đều có quỹ đạo của nó, và vận mệnh nằm trong sự tính toán chuẩn xác.",
    lore: "Học giả thiên tài đến từ Hội Nghiên Cứu Thiên Hà, Solas nắm giữ la bàn thời không cổ đại. Chàng có thể điều khiển dòng chảy thời gian và dự đoán trước mọi bước đi của đối thủ.",
    skills: [
      { name: "Tinh Luân Chỉ Điểm", type: "Đòn Đánh Thường", desc: "Gây Sát Thương Số Ảo tương đương 100% Tấn Công lên 1 mục tiêu." },
      { name: "Thời Gian Tĩnh Tọa", type: "Chiến Kỹ", desc: "Tạo vùng nhiễu loạn thời gian, làm chậm toàn bộ kẻ địch 30% và tăng sát thương phải chịu thêm 20%." },
      { name: "Vũ Trụ Kỳ Dị Điểm", type: "Tuyệt Kỹ", desc: "Kích hoạt cỗ máy thiên văn tạo hố đen nhân tạo, hút toàn bộ kẻ địch vào tâm chấn và phát nổ gây Sát Thương Số Ảo diện rộng." },
      { name: "Quỹ Đạo Toàn Tri", type: "Thiên Phú", desc: "Khi có từ 3 kẻ địch trở lên trên sân, toàn đội được tăng 25% Sát Thương Bạo Kích." }
    ]
  },
  {
    id: "lyra",
    name: "Lyra",
    title: "Tinh Linh Cửu Vĩ",
    element: "Lượng Tử (Quantum)",
    elementColor: "#3fe9d6",
    path: "Hòa Hợp (Harmony)",
    rarity: 5,
    cv: "Takahashi Rie / Suzie Yeung",
    image: "/images/char_lyra.jpg",
    quote: "Gió ngân hà sẽ mang theo lời chúc phúc của hoa sen vũ trụ đến bên bạn~",
    lore: "Sứ giả tộc Hồ Ly du hành giữa các vì sao, Lyra mang trái tim thuần khiết và khả năng thấu thị tâm linh. Mỗi chiếc đèn lồng của nàng là một ngọn đuốc hy vọng giữa màn đêm không gian vô tận.",
    skills: [
      { name: "Thanh Liên Hồn Chúc", type: "Đòn Đánh Thường", desc: "Gây Sát Thương Lượng Tử tương đương 100% Tấn Công lên 1 kẻ địch." },
      { name: "Đèn Lồng Dẫn Lối", type: "Chiến Kỹ", desc: "Chọn 1 đồng minh, tăng 45% Tấn Công và chuyển 100% sát thương đòn tiếp theo thành đòn tấn công xuyên thấu." },
      { name: "Cửu Vĩ Dạ Yến", type: "Tuyệt Kỹ", desc: "Triệu hồi sen thần vũ trụ, hồi phục 50 điểm Năng Lượng và tăng 50% Sát Thương Bạo Kích cho toàn thể đội hình trong 3 hiệp." },
      { name: "Hồ Quang Bảo Trợ", type: "Thiên Phú", desc: "Bắt đầu trận chiến, toàn đội nhận hiệu ứng Tăng Tốc 20 điểm trong vòng 1 hiệp đầu tiên." }
    ]
  },
  {
    id: "kaelen",
    name: "Kaelen",
    title: "Xích Diễm Thợ Săn",
    element: "Hỏa (Fire)",
    elementColor: "#f87171",
    path: "Hủy Diệt (Destruction)",
    rarity: 5,
    cv: "Nakamura Yuichi / Matthew Mercer",
    image: "/images/char_kaelen.jpg",
    quote: "Trong vũ trụ này, chỉ có hỏa lực tuyệt đối mới bảo vệ được người mình yêu quý.",
    lore: "Cựu đặc nhiệm vũ trụ nay trở thành thợ săn tiền thưởng tự do. Trang bị cặp súng thần công nhiệt hạch, Kaelen không ngần ngại lao vào tâm điểm các trận bão lửa để hoàn thành nhiệm vụ.",
    skills: [
      { name: "Tia Laze Thiêu Đốt", type: "Đòn Đánh Thường", desc: "Gây Sát Thương Hỏa tương đương 120% Tấn Công của Kaelen lên mục tiêu chỉ định." },
      { name: "Xung Kích Đạn Đúp", type: "Chiến Kỹ", desc: "Bắn loạt đạn chùm gây Sát Thương Hỏa lên mục tiêu và các kẻ địch lân cận, xác suất 100% gắn hiệu ứng Thiêu Đốt." },
      { name: "Pháo Đài Hủy Diệt", type: "Tuyệt Kỹ", desc: "Chuyển hóa súng thành khẩu thần công pháo kích hủy diệt, phá vỡ toàn bộ phòng ngự và thiêu rụi toàn bộ chiến trường." },
      { name: "Ý Chí Bất Bại", type: "Thiên Phú", desc: "Lượng HP càng giảm, Tấn Công của Kaelen càng tăng (tối đa tăng 75% Tấn Công khi HP dưới 30%)." }
    ]
  }
];
