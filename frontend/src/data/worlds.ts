export interface World {
  id: string;
  name: string;
  englishName: string;
  category: string;
  image: string;
  desc: string;
  factions: string[];
  dangerLevel: string;
  temperature: string;
  pioneersCount: string;
}

export const WORLDS: World[] = [
  {
    id: "station",
    name: "Thánh Địa Cổ Aethel",
    englishName: "Aethel Sanctuary",
    category: "Cứ Điểm Thánh Nữ Valkyria",
    image: "/images/world_station.jpg",
    desc: "Vùng đất thánh thiêng liêng nơi các Valkyria tiếp nhận phước lành từ Thần Điện Cổ Đại. Nơi hội tụ các Chỉ Huy xuất sắc cùng kho tàng bảo vật cổ xưa lưu giữ di sản của lục địa Veyra.",
    factions: ["Hiệp Sĩ Đoàn Ánh Sáng", "Hội Chiêm Tinh Aethel", "Viện Khảo Cổ Cổ Đại"],
    dangerLevel: "Cấp An Toàn II",
    temperature: "21°C (Mát mẻ quanh năm)",
    pioneersCount: "12,450 Chỉ Huy & Valkyria"
  },
  {
    id: "skycity",
    name: "Thành Trì Mây Tiên Châu",
    englishName: "Luofu Floating Citadel",
    category: "Kỳ Quan Thành Trì Lơ Lửng Veyra",
    image: "/images/world_skycity.jpg",
    desc: "Kỳ quan thành trì huyền bí lơ lửng giữa tầng mây bồng bềnh của lục địa Veyra. Nơi lưu giữ tinh hoa võ đạo và các kỳ bảo phong ấn ngàn năm của các nữ chiến binh Valkyria tiên tộc.",
    factions: ["Vân Kỵ Quân", "Thập Vương Ty", "Sở Thiên Tượng", "Thương Hội Veyra"],
    dangerLevel: "Cấp Cảnh Giác Cao",
    temperature: "Mát mẻ bốn mùa",
    pioneersCount: "15,800,000 Cư Dân"
  }
];
