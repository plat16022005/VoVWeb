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
    path: "Tiên Phong (The Hunt)",
    rarity: 5,
    cv: "Hayami Saori / Laura Post",
    image: "/images/portrait1_tower1.png",
    quote: "Lưỡi kiếm của ta không bao giờ chùn bước trước bóng tối xâm lăng Veyra.",
    lore: "Đại tướng tiên phong của Vương Quốc Ánh Sáng, Aurelia là một trong những Valkyria sở hữu kiếm thuật sắc bén nhất lục địa Veyra. Nàng luôn dẫn đầu đoàn quân bảo vệ người dân khỏi các thế lực hắc ám xâm lăng.",
    skills: [
      { name: "Thiểm Quang Nhất Kiếm", type: "Đòn Đánh Thường", desc: "Gây Sát Thương Lôi tương đương 110% Tấn Công của Aurelia lên 1 kẻ địch chỉ định." },
      { name: "Bạch Nguyệt Đoạt Hồn", type: "Chiến Kỹ", desc: "Tăng 35% Tỉ Lệ Bạo Kích trong 2 hiệp, tung 3 nhát kiếm liên hoàn chém nát điểm yếu của kẻ địch." },
      { name: "Vạn Kiếm Trùng Khởi", type: "Tuyệt Kỹ", desc: "Triệu hồi hàng vạn thanh kiếm ánh sáng trút xuống trận địa, gây Sát Thương Lôi bộc phá cực đại và lập tức nhận thêm 1 hiệp hành động." },
      { name: "Nguyệt Hoa Hộ Thể", type: "Thiên Phú", desc: "Mỗi khi hạ gục một mục tiêu, hồi phục 25% Năng Lượng và nhận lá chắn bảo vệ tương đương 20% HP tối đa." }
    ]
  },
  {
    id: "solas",
    name: "Solas",
    title: "Nhà Chiêm Tinh Veyra",
    element: "Số Ảo (Imaginary)",
    elementColor: "#facc15",
    path: "Tri Thức (Erudition)",
    rarity: 5,
    cv: "Sakurai Takahiro / Ray Chase",
    image: "/images/portrait1_tower7.png",
    quote: "Mọi biến động trên lục địa Veyra đều có quy luật, và chiến thắng nằm trong sự tính toán chuẩn xác.",
    lore: "Nhà thông thái cổ xưa nắm giữ tri thức về các cổ vật ma pháp của lục địa Veyra. Với khả năng điều khiển ma trận không gian, Solas giúp các Valkyria luôn nắm thế chủ động trên chiến trường.",
    skills: [
      { name: "Thời Không Chỉ Điểm", type: "Đòn Đánh Thường", desc: "Gây Sát Thương Số Ảo tương đương 100% Tấn Công lên 1 mục tiêu." },
      { name: "Vực Sâu Tĩnh Tọa", type: "Chiến Kỹ", desc: "Tạo vùng nhiễu loạn ma pháp, làm chậm toàn bộ kẻ địch 30% và tăng sát thương phải chịu thêm 20%." },
      { name: "Ma Pháp Kỳ Dị Điểm", type: "Tuyệt Kỹ", desc: "Kích hoạt pháp trận cổ xưa tạo bão xoáy ma lực, hút toàn bộ kẻ địch vào tâm chấn và phát nổ gây Sát Thương Số Ảo diện rộng." },
      { name: "Quỹ Đạo Toàn Tri", type: "Thiên Phú", desc: "Khi có từ 3 kẻ địch trở lên trên sân, toàn đội được tăng 25% Sát Thương Bạo Kích." }
    ]
  },
  {
    id: "lyra",
    name: "Lyra",
    title: "Tinh Linh Cửu Vĩ",
    element: "Băng (Cryo / Mystic)",
    elementColor: "#3fe9d6",
    path: "Hòa Hợp (Harmony)",
    rarity: 5,
    cv: "Takahashi Rie / Suzie Yeung",
    image: "/images/char_lyra.jpg",
    quote: "Gió phương Đông sẽ mang theo lời chúc phúc của hoa sen đến bên bạn~",
    lore: "Valkyria mang linh hồn hồ ly cổ xưa từ rừng sâu Veyra. Lyra sở hữu trái tim thuần khiết và khả năng thấu thị tâm linh, mang nguồn sinh lực dồi dào che chở cho các chiến binh đồng hành.",
    skills: [
      { name: "Thanh Liên Hồn Chúc", type: "Đòn Đánh Thường", desc: "Gây Sát Thương Băng ma thuật tương đương 100% Tấn Công lên 1 kẻ địch." },
      { name: "Đèn Lồng Dẫn Lối", type: "Chiến Kỹ", desc: "Chọn 1 đồng minh, tăng 45% Tấn Công và chuyển 100% sát thương đòn tiếp theo thành đòn tấn công xuyên thấu." },
      { name: "Cửu Vĩ Dạ Yến", type: "Tuyệt Kỹ", desc: "Triệu hồi sen thần cổ đại, hồi phục 50 điểm Năng Lượng và tăng 50% Sát Thương Bạo Kích cho toàn thể đội hình trong 3 hiệp." },
      { name: "Hồ Quang Bảo Trợ", type: "Thiên Phú", desc: "Bắt đầu trận chiến, toàn đội nhận hiệu ứng Tăng Tốc 20 điểm trong vòng 1 hiệp đầu tiên." }
    ]
  },
  {
    id: "kaelen",
    name: "Kaelen",
    title: "Xích Diễm Valkyrie",
    element: "Hỏa (Fire)",
    elementColor: "#f87171",
    path: "Hủy Diệt (Destruction)",
    rarity: 5,
    cv: "Nakamura Yuichi / Matthew Mercer",
    image: "/images/char_kaelen.jpg",
    quote: "Trên chiến trường Veyra, chỉ có lòng quả cảm và hỏa lực tuyệt đối mới bảo vệ được vùng đất này.",
    lore: "Chiến binh tiên phong của vùng hoang mạc Veyra. Trang bị cặp súng thần công ma đạo nhiệt hỏa, Kaelen không ngần ngại lao vào tâm điểm các trận bão lửa để quét sạch quân thù.",
    skills: [
      { name: "Hỏa Tiễn Thiêu Đốt", type: "Đòn Đánh Thường", desc: "Gây Sát Thương Hỏa tương đương 120% Tấn Công của Kaelen lên mục tiêu chỉ định." },
      { name: "Xung Kích Đạn Đúp", type: "Chiến Kỹ", desc: "Bắn loạt đạn chùm gây Sát Thương Hỏa lên mục tiêu và các kẻ địch lân cận, xác suất 100% gắn hiệu ứng Thiêu Đốt." },
      { name: "Pháo Đài Hủy Diệt", type: "Tuyệt Kỹ", desc: "Chuyển hóa súng thành khẩu thần công pháo kích hủy diệt, phá vỡ toàn bộ phòng ngự và thiêu rụi toàn bộ chiến trường." },
      { name: "Ý Chí Bất Bại", type: "Thiên Phú", desc: "Lượng HP càng giảm, Tấn Công của Kaelen càng tăng (tối đa tăng 75% Tấn Công khi HP dưới 30%)." }
    ]
  }
];
