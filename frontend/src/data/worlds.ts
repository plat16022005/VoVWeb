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
    name: "Trạm Không Gian Aethel",
    englishName: "Aethel Space Station",
    category: "Cứ Điểm Nghiên Cứu Vũ Trụ",
    image: "/images/world_station.jpg",
    desc: "Trạm nghiên cứu vũ trụ khổng lồ nằm ở ranh giới dải Ngân Hà. Nơi hội tụ các nhà khoa học uyên bác nhất cùng kho tàng bảo vật Curio kỳ bí lưu giữ di sản cổ xưa của vũ trụ.",
    factions: ["Hội Nghiên Cứu Thiên Hà", "Đội Tuần Tra Trật Tự Aethel", "Viện Khảo Cổ Tinh Thần"],
    dangerLevel: "Cấp An Toàn II",
    temperature: "21°C (Môi trường điều hòa)",
    pioneersCount: "12,450 Nhà Nghiên Cứu"
  },
  {
    id: "skycity",
    name: "Hạm Đội Tiên Châu Luofu",
    englishName: "The Xianzhou Luofu",
    category: "Siêu Chiến Hạm Không Gian Thần Thoại",
    image: "/images/world_skycity.jpg",
    desc: "Chiếc hạm không gian hùng vĩ mang phong cách thần tiên cổ kính. Nơi cư ngụ của cư dân trường thọ và những chuyến tuần du không hồi kết giữa ngàn mây tinh vân và phi thuyền starskiff lướt gió.",
    factions: ["Vân Kỵ Quân", "Thập Vương Ty", "Sở Thiên Tượng", "Thương Hội Tinh Thần"],
    dangerLevel: "Cấp Cảnh Giác Cao",
    temperature: "Mát mẻ bốn mùa",
    pioneersCount: "15,800,000 Cư Dân"
  }
];
