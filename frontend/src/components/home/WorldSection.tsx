"use client";

import { useState } from "react";
import Image from "next/image";
import { soundEngine } from "@/services/audio.service";
import { WORLDS, World } from "@/data/worlds";

export default function WorldSection() {
  const [selectedWorld, setSelectedWorld] = useState<World>(WORLDS[0]);

  return (
    <section
      id="worlds"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 flex justify-center border-t border-white/5"
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)]">
              <span className="hsr-diamond" /> BẢN ĐỒ VÙNG ĐẤT VEYRA
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)]">
              KHÁM PHÁ <span className="text-cyan-gradient">LỤC ĐỊA VEYRA</span>
            </h2>
          </div>

          {/* World Selector Tabs */}
          <div className="flex gap-3">
            {WORLDS.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  soundEngine.playCelestialChime();
                  setSelectedWorld(w);
                }}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider font-[family-name:var(--font-rajdhani)] border transition-all cursor-pointer ${
                  selectedWorld.id === w.id
                    ? "bg-[#3fe9d6]/20 border-[#3fe9d6] text-[#3fe9d6] shadow-[0_0_15px_rgba(63,233,214,0.3)]"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>

        {/* World Panorama Stage */}
        <div className="hsr-card overflow-hidden border-[#3fe9d6]/30">
          <div className="relative h-[340px] sm:h-[480px] w-full">
            <Image
              src={selectedWorld.image}
              alt={selectedWorld.name}
              fill
              className="object-cover"
              priority
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050716]/90 via-transparent to-transparent" />

            {/* World Info Overlay */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 max-w-2xl">
              <span className="px-3 py-1 rounded bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 text-xs font-bold uppercase font-[family-name:var(--font-rajdhani)] tracking-widest">
                {selectedWorld.category}
              </span>
              <h3 className="text-3xl sm:text-5xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)] mt-3 mb-1">
                {selectedWorld.name}
              </h3>
              <p className="text-sm text-slate-400 font-mono mb-4">{selectedWorld.englishName}</p>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                {selectedWorld.desc}
              </p>

              {/* Factions & World Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Mức Độ Nguy Hiểm</span>
                  <strong className="text-amber-400">{selectedWorld.dangerLevel}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Khí Hậu</span>
                  <strong className="text-white">{selectedWorld.temperature}</strong>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px] uppercase">Dân Số / Thám Hiểm</span>
                  <strong className="text-[#3fe9d6]">{selectedWorld.pioneersCount}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
