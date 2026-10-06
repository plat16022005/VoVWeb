"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { soundEngine } from "@/services/audio.service";
import { CHARACTERS, Character } from "@/data/characters";

interface CharacterShowcaseProps {
  onOpenPlayModal: () => void;
}

export default function CharacterShowcase({
  onOpenPlayModal,
}: CharacterShowcaseProps) {
  const [selectedChar, setSelectedChar] = useState<Character>(CHARACTERS[0]);
  const [charTab, setCharTab] = useState<"skills" | "lore">("skills");
  const [activeVoiceChime, setActiveVoiceChime] = useState(false);

  // 2.5D Interactive Parallax & Tilt State
  const cardStageRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, x: 0, y: 0, active: false });

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardStageRef.current) return;
    const rect = cardStageRef.current.getBoundingClientRect();
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    setTilt({
      rotateX: -normalizedY * 18,
      rotateY: normalizedX * 18,
      x: normalizedX,
      y: normalizedY,
      active: true,
    });
  };

  const handleStageMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, x: 0, y: 0, active: false });
  };

  // Switch Character with sound chime
  const handleSelectChar = (char: Character) => {
    soundEngine.playCelestialChime();
    setSelectedChar(char);
  };

  // Play Character Voice line
  const handlePlayVoice = () => {
    soundEngine.playCelestialChime();
    setActiveVoiceChime(true);
    setTimeout(() => setActiveVoiceChime(false), 2000);
  };

  return (
    <section
      id="characters"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#04050d] via-[#080b21] to-[#04050d] border-t border-[#f5c767]/20 flex justify-center"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)] mb-2">
            <span className="hsr-diamond" /> ĐỒNG HÀNH NGÂN HÀ <span className="hsr-diamond" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)]">
            VŨ TRỤ <span className="text-gold-gradient">NHÂN VẬT</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            Mỗi nhân vật đều sở hữu Vận Mệnh và Thuộc Tính nguyên tố riêng biệt. Hãy khám phá và chiêu mộ họ về đội hình của bạn!
          </p>
        </div>

        {/* Character Selector Bar (HoYoverse Avatar Tabs) */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-12 flex-wrap">
          {CHARACTERS.map((char) => {
            const active = selectedChar.id === char.id;
            return (
              <button
                key={char.id}
                onClick={() => handleSelectChar(char)}
                className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${active
                  ? "bg-[#161c40] border-[#f5c767] shadow-[0_0_20px_rgba(245,199,103,0.35)] scale-105"
                  : "bg-[#0b0e24]/80 border-white/10 hover:border-white/30 hover:bg-[#121636]"
                  }`}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#f5c767]/40">
                  <Image
                    src={char.image}
                    alt={char.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="text-left">
                  <div
                    className={`font-bold font-[family-name:var(--font-rajdhani)] text-sm tracking-wider uppercase ${active ? "text-[#f5c767]" : "text-white"
                      }`}
                  >
                    {char.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{char.path}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Character Showcase Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-6xl mx-auto">
          {/* Left: Giant Character Portrait Visual with 2.5D Living Parallax */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div
              ref={cardStageRef}
              onMouseMove={handleStageMouseMove}
              onMouseLeave={handleStageMouseLeave}
              className="relative w-full max-w-md aspect-[3/4] perspective-stage cursor-pointer group select-none"
              onClick={handlePlayVoice}
            >
              {/* 3D Tilted Card Body */}
              <div
                className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-[#f5c767]/40 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,199,103,0.2)] transition-transform duration-150 ease-out"
                style={{
                  transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.active ? 1.03 : 1}, ${tilt.active ? 1.03 : 1}, 1)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* ── LAYER 1: Deep Cosmic Magic Rune Circle (Back Parallax: -40px) ── */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none parallax-layer-back"
                  style={{
                    transform: `translate3d(${-tilt.x * 35}px, ${-tilt.y * 35}px, -40px)`,
                  }}
                >
                  {/* Outer rotating elemental halo */}
                  <div
                    className="w-[125%] h-[125%] rounded-full border border-dashed animate-rotate-slow opacity-30"
                    style={{ borderColor: selectedChar.elementColor }}
                  />
                  {/* Inner counter-rotating rune ring */}
                  <div
                    className="absolute w-[95%] h-[95%] rounded-full border-2 border-dotted animate-rotate-reverse opacity-40"
                    style={{ borderColor: selectedChar.elementColor }}
                  />
                  {/* Glowing elemental nebula core */}
                  <div
                    className="absolute w-72 h-72 rounded-full blur-3xl animate-aura-pulse"
                    style={{
                      backgroundColor: selectedChar.elementColor,
                      opacity: 0.28,
                    }}
                  />
                </div>

                {/* ── LAYER 2: The Living Character (Mid Parallax: 0px + Breathing) ── */}
                <div
                  className="relative w-full h-full animate-hsr-breathing parallax-layer-mid"
                  style={{
                    transform: `translate3d(${tilt.x * 12}px, ${tilt.y * 12}px, 0px)`,
                  }}
                >
                  <Image
                    src={selectedChar.image}
                    alt={selectedChar.name}
                    fill
                    className="object-cover object-top transition-transform duration-700"
                    priority
                  />

                  {/* Shimmering Starlight Light Sweep */}
                  <div className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-light-sweep pointer-events-none" />

                  {/* Atmospheric vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060817] via-[#060817]/25 to-transparent" />
                </div>

                {/* ── LAYER 3: Dynamic Floating Particles & Foreground Badges (Front Parallax: +45px) ── */}
                <div
                  className="absolute inset-0 pointer-events-none parallax-layer-front p-5 flex flex-col justify-between"
                  style={{
                    transform: `translate3d(${tilt.x * 28}px, ${tilt.y * 28}px, 45px)`,
                  }}
                >
                  {/* Top row: 5-Star Crest & Interactive 2.5D Tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#060817]/85 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 font-mono shadow-lg">
                      <span>★★★★★</span>
                      <span>5-STAR</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-[#f5c767]/40 text-[10px] font-bold text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)] shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>2.5D LIVE TILT</span>
                    </div>
                  </div>

                  {/* Floating elemental stardust sparks */}
                  <div className="relative w-full h-32 overflow-hidden">
                    <div className="absolute bottom-2 left-6 w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75" />
                    <div className="absolute bottom-8 right-10 w-2 h-2 rounded-full bg-[#f5c767] animate-pulse opacity-80" />
                    <div className="absolute bottom-16 left-1/3 w-1 h-1 rounded-full bg-[#3fe9d6] animate-bounce opacity-70" />
                  </div>

                  {/* Bottom Name Plate */}
                  <div className="bg-[#080c21]/90 backdrop-blur-md p-3.5 rounded-xl border border-[#f5c767]/30 shadow-2xl">
                    <div className="text-[11px] uppercase tracking-widest text-[#f5c767] font-[family-name:var(--font-rajdhani)] font-bold">
                      {selectedChar.title}
                    </div>
                    <h3 className="text-2xl font-black text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
                      {selectedChar.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Interactive Hint beneath card */}
              <div className="text-center mt-3 text-[11px] text-slate-400 font-[family-name:var(--font-rajdhani)] tracking-wider flex items-center justify-center gap-2">
                <span>✦</span>
                <span>RÊ CHUỘT LÊN NHÂN VẬT ĐỂ TƯƠNG TÁC 3D & HÀO QUANG</span>
                <span>✦</span>
              </div>
            </div>
          </div>

          {/* Right: Character Details, Skills & Audio Line */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Badges: Element & Path */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold font-[family-name:var(--font-rajdhani)] uppercase tracking-wider border"
                style={{
                  backgroundColor: `${selectedChar.elementColor}20`,
                  borderColor: `${selectedChar.elementColor}60`,
                  color: selectedChar.elementColor,
                }}
              >
                ⚡ THUỘC TÍNH: {selectedChar.element}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold font-[family-name:var(--font-rajdhani)] uppercase tracking-wider bg-[#f5c767]/15 border border-[#f5c767]/40 text-[#f5c767]">
                🗡 VẬN MỆNH: {selectedChar.path}
              </span>
            </div>

            {/* Title & Name */}
            <h3 className="text-4xl sm:text-5xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide mb-2">
              {selectedChar.name}
            </h3>
            <p className="text-sm font-semibold text-[#f5c767] font-[family-name:var(--font-rajdhani)] tracking-widest uppercase mb-4">
              {selectedChar.title}
            </p>

            {/* Voice Actor & Quote Bar */}
            <div className="hsr-card p-4 mb-6 bg-[#0c1029]/80 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">CV: {selectedChar.cv}</span>
                <button
                  onClick={handlePlayVoice}
                  className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${activeVoiceChime
                    ? "bg-[#f5c767] text-[#04050d]"
                    : "bg-white/10 text-[#f5c767] hover:bg-white/20"
                    }`}
                >
                  <span>🔊</span>
                  <span>{activeVoiceChime ? "Đang phát..." : "Nghe Giọng Thoại"}</span>
                </button>
              </div>
              <blockquote className="text-xs sm:text-sm text-slate-300 italic border-l-2 border-[#f5c767] pl-3">
                &ldquo;{selectedChar.quote}&rdquo;
              </blockquote>
            </div>

            {/* Tab Toggle: Skills vs Lore */}
            <div className="flex gap-4 mb-4 border-b border-white/10 pb-2">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setCharTab("skills");
                }}
                className={`text-sm font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] pb-2 transition-colors relative cursor-pointer ${charTab === "skills"
                  ? "text-[#f5c767] after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#f5c767]"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                Bộ Kỹ Năng Chiến Đấu
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setCharTab("lore");
                }}
                className={`text-sm font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] pb-2 transition-colors relative cursor-pointer ${charTab === "lore"
                  ? "text-[#f5c767] after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#f5c767]"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                Tiểu Sử & Cốt Truyện
              </button>
            </div>

            {/* Tab Content */}
            {charTab === "skills" ? (
              <div className="flex flex-col gap-3">
                {selectedChar.skills.map((skill, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#0d122e]/80 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-sm">{skill.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#f5c767] bg-[#f5c767]/10 px-2 py-0.5 rounded border border-[#f5c767]/20">
                        {skill.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{skill.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-lg bg-[#0d122e]/80 border border-white/5 text-slate-300 text-sm leading-relaxed">
                <p className="mb-4">{selectedChar.lore}</p>
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/10 pt-4">
                  <div>
                    <span className="text-slate-500">Phe phái:</span>{" "}
                    <strong className="text-white">Đoàn Tàu Astral</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Vũ khí:</span>{" "}
                    <strong className="text-white">Thánh Di Vật Tinh Thần</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Giới tính:</span>{" "}
                    <strong className="text-white">Độc Nhất</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Trạng thái:</span>{" "}
                    <strong className="text-emerald-400">Sẵn Sàng Xuất Kích</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Deploy Button */}
            <div className="mt-6">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenPlayModal();
                }}
                className="hsr-btn-gold py-2.5 px-6 text-xs sm:text-sm font-bold cursor-pointer"
              >
                <span>CHIÊU MỘ {selectedChar.name.toUpperCase()} VÀO ĐỘI HÌNH</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
