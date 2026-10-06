"use client";

import { useState } from "react";
import Image from "next/image";
import { soundEngine } from "@/services/audio.service";
import { NEWS_ITEMS } from "@/data/news";

interface NewsSectionProps {
  onOpenTrailerModal: () => void;
  onOpenPlayModal: () => void;
}

const CATEGORIES = ["TẤT CẢ", "SỰ KIỆN", "THÔNG BÁO", "TIN GAME", "HOẠT ĐỘNG"] as const;

export default function NewsSection({
  onOpenTrailerModal,
  onOpenPlayModal,
}: NewsSectionProps) {
  const [newsFilter, setNewsFilter] = useState("TẤT CẢ");

  const filteredNews =
    newsFilter === "TẤT CẢ"
      ? NEWS_ITEMS
      : NEWS_ITEMS.filter((item) => item.tag === newsFilter);

  return (
    <section
      id="news"
      className="relative w-full py-20 px-4 sm:px-6 lg:px-8 flex justify-center border-t border-white/5"
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
              <span className="hsr-diamond" /> BẢN TIN VŨ TRỤ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white uppercase font-[family-name:var(--font-rajdhani)]">
              TIN TỨC & SỰ KIỆN NỔI BẬT
            </h2>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 text-xs font-bold font-[family-name:var(--font-rajdhani)]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundEngine.playClick();
                  setNewsFilter(cat);
                }}
                className={`px-4 py-1.5 rounded transition-all cursor-pointer ${
                  newsFilter === cat
                    ? "bg-[#f5c767] text-[#04050d] shadow-[0_0_12px_rgba(245,199,103,0.5)]"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Big Featured Event Banner */}
          <div className="lg:col-span-5">
            <div
              className="hsr-card overflow-hidden group cursor-pointer"
              onClick={onOpenTrailerModal}
            >
              <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                <Image
                  src="/images/world_skycity.jpg"
                  alt="Featured Event"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090c1f] via-transparent to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded bg-[#f5c767] text-[#04050d] font-bold text-xs uppercase font-[family-name:var(--font-rajdhani)]">
                  ★ SỰ KIỆN HOT
                </span>
              </div>
              <div className="p-6">
                <span className="text-xs text-slate-400 font-mono">CẬP NHẬT: 05/10/2026</span>
                <h3 className="text-xl font-bold text-white group-hover:text-[#f5c767] transition-colors mt-2 mb-3 leading-snug">
                  Đại Lễ Khởi Hành: Thám Hiểm Tiên Châu Luofu & Nhận Vé Tinh Cầu Đặc Biệt!
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Bước lên phi thuyền ngắm nhìn biển sao vô tận. Hoàn thành chuỗi nhiệm vụ Khai Phá cốt truyện để mở khóa trang bị Sử Thi và bảo vật Curio.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
                  <span>Xem Chi Tiết Sự Kiện</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: List of News Articles */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {filteredNews.map((news) => (
              <div
                key={news.id}
                onClick={() => soundEngine.playClick()}
                className="hsr-card p-5 hover:bg-[#131938] transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${news.tagColor} uppercase font-[family-name:var(--font-rajdhani)]`}
                    >
                      {news.tag}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{news.date}</span>
                  </div>
                  <h4 className="font-bold text-white group-hover:text-[#f5c767] transition-colors text-base leading-snug">
                    {news.title}
                  </h4>
                  <p className="text-slate-400 text-xs mt-1.5 line-clamp-1">
                    {news.summary}
                  </p>
                </div>
                <div className="text-slate-500 group-hover:text-[#f5c767] transition-colors text-xl font-bold">
                  →
                </div>
              </div>
            ))}

            {/* Newsletter Subscription Box */}
            <div className="mt-4 p-5 rounded-lg bg-gradient-to-r from-[#111636] to-[#0c1029] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
                  ĐĂNG KÝ BẢN TIN KHAI PHÁ
                </div>
                <p className="text-xs text-slate-400">
                  Nhận thông báo cập nhật, giftcode và sự kiện mới nhất qua Email.
                </p>
              </div>
              <button
                onClick={onOpenPlayModal}
                className="hsr-btn-glass py-2 px-5 text-xs whitespace-nowrap cursor-pointer"
              >
                <span>ĐĂNG KÝ NGAY</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
