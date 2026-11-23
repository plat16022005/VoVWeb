"use client";

import Image from "next/image";
import { soundEngine } from "@/services/audio.service";

const MEDIA_ITEMS = [
  { title: "Lục Địa Veyra Hùng Vĩ", img: "/images/hero_bg.jpg", desc: "4K Key Visual Wallpaper" },
  { title: "Thánh Điện Cổ Đại Aethel", img: "/images/world_station.jpg", desc: "Veyra Fantasy Sanctuary" },
  { title: "Thành Trì Mây Tiên Châu", img: "/images/world_skycity.jpg", desc: "Floating Oriental Sky City" },
];

export default function MediaGallery() {
  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 flex justify-center border-t border-white/5">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)] mb-2">
            <span className="hsr-diamond" /> ĐA PHƯƠNG TIỆN <span className="hsr-diamond" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)]">
            HÌNH NỀN & <span className="text-gold-gradient">NGHỆ THUẬT VEYRA 4K</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MEDIA_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="hsr-card overflow-hidden group cursor-pointer"
              onClick={() => soundEngine.playClick()}
            >
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <a
                  href={item.img}
                  download
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-3 right-3 px-3 py-1 rounded bg-[#f5c767] text-black font-bold text-xs uppercase font-[family-name:var(--font-rajdhani)] flex items-center gap-1.5 shadow-lg"
                >
                  <span>Tải 4K</span>
                </a>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-white text-base group-hover:text-[#f5c767] transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
