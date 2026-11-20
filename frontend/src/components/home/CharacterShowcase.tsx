"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { soundEngine } from "@/services/audio.service";
import { Character } from "@/data/characters";
import {
  characterService,
  getRarityColor,
  getRarityImage,
  sortCharactersByRarity,
  DEFAULT_HERO_IMAGE,
} from "@/services/character.service";

interface CharacterShowcaseProps {
  onOpenPlayModal: () => void;
}

export default function CharacterShowcase({
  onOpenPlayModal,
}: CharacterShowcaseProps) {
  const [characterList, setCharacterList] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [charTab, setCharTab] = useState<"skills" | "lore">("skills");
  const [activeVoiceChime, setActiveVoiceChime] = useState(false);
  const [filterRarity, setFilterRarity] = useState<"ALL" | "SSR" | "SR" | "R">("ALL");

  // Load real characters from Firestore & local client cache
  useEffect(() => {
    let isMounted = true;

    // 1. Kiểm tra cache client: nếu đã có dữ liệu thật từ phiên trước, nạp tức thì
    try {
      const cached = characterService.getLocalCache();
      if (cached && cached.length > 0) {
        const visible = sortCharactersByRarity(cached.filter((c) => c.status !== "Hidden"));
        if (visible.length > 0 && isMounted) {
          setCharacterList(visible);
          setSelectedChar((prev) => (prev ? visible.find((c) => c.id === prev.id) || visible[0] : visible[0]));
          setIsLoading(false);
        }
      }
    } catch {}

    // 2. Tải dữ liệu thật từ Firestore
    characterService
      .getCharacters()
      .then((chars) => {
        if (isMounted && chars && chars.length > 0) {
          const visible = sortCharactersByRarity(chars.filter((c) => c.status !== "Hidden"));
          if (visible.length > 0) {
            setCharacterList(visible);
            setSelectedChar((prev) => (prev ? visible.find((c) => c.id === prev.id) || visible[0] : visible[0]));
          }
        }
      })
      .catch((err) => {
        console.warn("Không thể tải danh sách Valkyria từ hệ thống:", err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered characters list for the avatar bar
  const displayedCharacters = useMemo(() => {
    if (filterRarity === "ALL") return characterList;
    return characterList.filter((c) => {
      const r = (c.rarityLabel || (c.rarity >= 5 ? "SSR" : c.rarity === 4 ? "SR" : "R")).toUpperCase();
      return r === filterRarity;
    });
  }, [characterList, filterRarity]);

  // Statistics for rarity filter badges
  const countSSR = useMemo(
    () =>
      characterList.filter(
        (c) =>
          (c.rarityLabel || (c.rarity >= 5 ? "SSR" : c.rarity === 4 ? "SR" : "R")).toUpperCase() === "SSR"
      ).length,
    [characterList]
  );
  const countSR = useMemo(
    () =>
      characterList.filter(
        (c) =>
          (c.rarityLabel || (c.rarity >= 5 ? "SSR" : c.rarity === 4 ? "SR" : "R")).toUpperCase() === "SR"
      ).length,
    [characterList]
  );
  const countR = useMemo(
    () =>
      characterList.filter(
        (c) =>
          (c.rarityLabel || (c.rarity >= 5 ? "SSR" : c.rarity === 4 ? "SR" : "R")).toUpperCase() === "R"
      ).length,
    [characterList]
  );

  const handleFilterChange = (rarity: "ALL" | "SSR" | "SR" | "R") => {
    soundEngine.playClick();
    setFilterRarity(rarity);
    const nextList =
      rarity === "ALL"
        ? characterList
        : characterList.filter((c) => {
            const r = (c.rarityLabel || (c.rarity >= 5 ? "SSR" : c.rarity === 4 ? "SR" : "R")).toUpperCase();
            return r === rarity;
          });
    if (nextList.length > 0 && (!selectedChar || !nextList.some((c) => c.id === selectedChar.id))) {
      setSelectedChar(nextList[0]);
    }
  };

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

  const charRarity = selectedChar
    ? selectedChar.rarityLabel || (selectedChar.rarity >= 5 ? "SSR" : selectedChar.rarity === 4 ? "SR" : "R")
    : "SSR";
  const rarityColor = getRarityColor(charRarity);
  const rarityImage = getRarityImage(charRarity);

  return (
    <section
      id="characters"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#04050d] via-[#080b21] to-[#04050d] border-t border-[#f5c767]/20 flex justify-center"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#f5c767] uppercase font-[family-name:var(--font-rajdhani)] mb-2">
            <span className="hsr-diamond" /> CÁC VALKYRIA VEYRA <span className="hsr-diamond" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)]">
            NỮ CHIẾN BINH <span className="text-gold-gradient">VALKYRIA</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            Mỗi Valkyria đều mang trong mình sức mạnh cổ xưa và kỹ năng chiến đấu độc nhất. Hãy chiêu mộ và sát cánh cùng họ trên vùng đất Veyra!
          </p>
        </div>

        {/* Rarity Filter Bar (SSR, SR, R) with Official Graphics */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-8 flex-wrap">
            <div className="w-24 h-9 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            <div className="w-24 h-9 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            <div className="w-24 h-9 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            <div className="w-24 h-9 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-8 flex-wrap">
            {/* Tất Cả */}
            <button
              onClick={() => handleFilterChange("ALL")}
              className={`group relative px-4 py-2 rounded-xl text-xs font-bold font-[family-name:var(--font-rajdhani)] tracking-wider uppercase transition-all duration-300 border flex items-center gap-2.5 cursor-pointer ${
                filterRarity === "ALL"
                  ? "bg-[#3fe9d6]/20 border-[#3fe9d6] text-[#3fe9d6] shadow-[0_0_20px_rgba(63,233,214,0.35)] scale-105"
                  : "bg-[#0b0e24]/80 border-white/10 text-slate-400 hover:text-white hover:border-white/30 hover:bg-[#121636]"
              }`}
            >
              <span className="w-2 h-2 rotate-45 bg-[#3fe9d6]" />
              <span>TẤT CẢ</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  filterRarity === "ALL" ? "bg-[#3fe9d6] text-slate-900" : "bg-white/10 text-slate-400"
                }`}
              >
                {characterList.length}
              </span>
            </button>

            {/* Phẩm SSR */}
            <button
              onClick={() => handleFilterChange("SSR")}
              className={`group relative px-4 py-1.5 rounded-xl transition-all duration-300 border flex items-center gap-2.5 cursor-pointer ${
                filterRarity === "SSR"
                  ? "bg-[#ef4444]/20 border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105"
                  : "bg-[#0b0e24]/80 border-white/10 hover:border-[#ef4444]/50 hover:bg-[#180e1b]"
              }`}
            >
              <div className="relative h-6 w-12 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]">
                <Image src="/images/SSR.png" alt="SSR" fill className="object-contain" priority />
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  filterRarity === "SSR" ? "bg-[#ef4444] text-white" : "bg-[#ef4444]/20 text-[#ef4444]"
                }`}
              >
                {countSSR}
              </span>
            </button>

            {/* Phẩm SR */}
            <button
              onClick={() => handleFilterChange("SR")}
              className={`group relative px-4 py-1.5 rounded-xl transition-all duration-300 border flex items-center gap-2.5 cursor-pointer ${
                filterRarity === "SR"
                  ? "bg-[#f5c767]/20 border-[#f5c767] shadow-[0_0_20px_rgba(245,199,103,0.4)] scale-105"
                  : "bg-[#0b0e24]/80 border-white/10 hover:border-[#f5c767]/50 hover:bg-[#1a1610]"
              }`}
            >
              <div className="relative h-6 w-11 drop-shadow-[0_0_6px_rgba(245,199,103,0.5)]">
                <Image src="/images/SR.png" alt="SR" fill className="object-contain" priority />
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  filterRarity === "SR" ? "bg-[#f5c767] text-slate-900" : "bg-[#f5c767]/20 text-[#f5c767]"
                }`}
              >
                {countSR}
              </span>
            </button>

            {/* Phẩm R */}
            <button
              onClick={() => handleFilterChange("R")}
              className={`group relative px-4 py-1.5 rounded-xl transition-all duration-300 border flex items-center gap-2.5 cursor-pointer ${
                filterRarity === "R"
                  ? "bg-[#38bdf8]/20 border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.4)] scale-105"
                  : "bg-[#0b0e24]/80 border-white/10 hover:border-[#38bdf8]/50 hover:bg-[#0c1626]"
              }`}
            >
              <div className="relative h-6 w-9 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]">
                <Image src="/images/R.png" alt="R" fill className="object-contain" priority />
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  filterRarity === "R" ? "bg-[#38bdf8] text-slate-900" : "bg-[#38bdf8]/20 text-[#38bdf8]"
                }`}
              >
                {countR}
              </span>
            </button>
          </div>
        )}

        {/* Character Selector Bar (HoYoverse Avatar Tabs) */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 sm:gap-6 mb-12 flex-wrap">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/5 bg-[#0b0e24]/60 animate-pulse w-36 sm:w-44 h-14"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-white/10 rounded w-16" />
                  <div className="h-2.5 bg-white/5 rounded w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 sm:gap-6 mb-12 flex-wrap">
            {displayedCharacters.length === 0 ? (
              <div className="text-slate-400 text-xs py-4 px-6 rounded-lg border border-white/10 bg-[#0b0e24]/60">
                Chưa có Valkyria thuộc phẩm cấp này.
              </div>
            ) : (
              displayedCharacters.map((char) => {
                const active = selectedChar?.id === char.id;
                const cRarity = char.rarityLabel || (char.rarity >= 5 ? "SSR" : char.rarity === 4 ? "SR" : "R");
                const cRarityColor = getRarityColor(cRarity);
                const cRarityImg = getRarityImage(cRarity);
                return (
                  <button
                    key={char.id}
                    onClick={() => handleSelectChar(char)}
                    className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                      active
                        ? "bg-[#161c40] border-[#f5c767] shadow-[0_0_20px_rgba(245,199,103,0.35)] scale-105"
                        : "bg-[#0b0e24]/80 border-white/10 hover:border-white/30 hover:bg-[#121636]"
                    }`}
                  >
                    <div
                      className="relative w-10 h-10 rounded-full overflow-hidden border bg-black/60"
                      style={{ borderColor: `${cRarityColor}80` }}
                    >
                      <Image
                        src={char.image || DEFAULT_HERO_IMAGE}
                        alt={char.name}
                        fill
                        unoptimized={!char.image || char.image.startsWith("http") || char.image.includes("default_hero")}
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="text-left">
                      <div
                        className={`font-bold font-[family-name:var(--font-rajdhani)] text-sm tracking-wider uppercase ${
                          active ? "text-[#f5c767]" : "text-white"
                        }`}
                      >
                        {char.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        {cRarityImg ? (
                          <div className="relative h-3.5 w-7">
                            <Image src={cRarityImg} alt={cRarity} fill className="object-contain" />
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-[10px]" style={{ color: cRarityColor }}>
                            {cRarity}
                          </span>
                        )}
                        <span className="text-white/20">/</span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-300">
                          {char.role || "Archer"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Active Character Showcase Stage */}
        {isLoading || !selectedChar ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-6xl mx-auto w-full animate-pulse">
            {/* Left Skeleton Card */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl bg-[#090d24]/90 border border-white/10 p-5 flex flex-col justify-between shadow-2xl">
                <div className="flex justify-between items-center">
                  <div className="w-16 h-8 rounded-xl bg-white/10" />
                </div>
                <div className="flex flex-col items-center justify-center my-auto">
                  <div className="w-28 h-28 rounded-full bg-white/5" />
                </div>
                <div className="p-4 rounded-xl bg-[#080c21]/90 border border-white/10 space-y-2">
                  <div className="w-32 h-6 bg-white/10 rounded" />
                  <div className="w-20 h-4 bg-white/5 rounded" />
                </div>
              </div>
            </div>

            {/* Right Skeleton Details */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
              <div className="flex gap-3">
                <div className="w-24 h-10 rounded-xl bg-white/10" />
                <div className="w-32 h-10 rounded-xl bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="w-64 h-10 bg-white/10 rounded-lg" />
                <div className="w-40 h-4 bg-white/5 rounded" />
              </div>
              <div className="p-4 rounded-xl bg-[#0c1029]/80 border border-white/10 space-y-2">
                <div className="w-28 h-4 bg-white/10 rounded" />
                <div className="w-full h-8 bg-white/5 rounded" />
              </div>
              <div className="flex gap-4 border-b border-white/10 pb-2">
                <div className="w-36 h-6 bg-white/10 rounded" />
                <div className="w-36 h-6 bg-white/5 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-16 rounded-lg bg-[#0d122e]/80 border border-white/5" />
                <div className="h-16 rounded-lg bg-[#0d122e]/80 border border-white/5" />
                <div className="h-16 rounded-lg bg-[#0d122e]/80 border border-white/5" />
              </div>
              <div className="w-56 h-11 rounded-xl bg-[#f5c767]/20 border border-[#f5c767]/30" />
            </div>
          </div>
        ) : (
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
                  {/* Glowing rarity nebula core */}
                  <div
                    className="absolute w-72 h-72 rounded-full blur-3xl animate-aura-pulse"
                    style={{
                      backgroundColor: rarityColor,
                      opacity: 0.35,
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
                    src={selectedChar.image || DEFAULT_HERO_IMAGE}
                    alt={selectedChar.name}
                    fill
                    unoptimized={!selectedChar.image || selectedChar.image.startsWith("http") || selectedChar.image.includes("default_hero")}
                    className="object-cover object-top transition-transform duration-700"
                    priority
                  />

                  {/* Atmospheric vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060817] via-[#060817]/25 to-transparent" />
                </div>

                {/* ── LAYER 3: Dynamic Foreground Badges (Front Parallax: +45px) ── */}
                <div
                  className="absolute inset-0 pointer-events-none parallax-layer-front p-5 flex flex-col justify-between"
                  style={{
                    transform: `translate3d(${tilt.x * 28}px, ${tilt.y * 28}px, 45px)`,
                  }}
                >
                  {/* Top row: Rarity Crest Image */}
                  <div className="flex items-center justify-between">
                    <div
                      className="relative h-8 px-2.5 py-1 rounded-xl bg-[#060817]/90 backdrop-blur-md border shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center"
                      style={{
                        borderColor: `${rarityColor}70`,
                        boxShadow: `0 0 15px ${rarityColor}30`,
                      }}
                    >
                      {rarityImage ? (
                        <div className="relative h-6 w-14 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                          <Image src={rarityImage} alt={charRarity} fill className="object-contain" priority />
                        </div>
                      ) : (
                        <span className="font-mono font-black text-xs" style={{ color: rarityColor }}>
                          {charRarity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Name Plate */}
                  <div className="bg-[#080c21]/90 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15 shadow-2xl relative">
                    <h3 className="text-2xl font-black text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase leading-tight">
                      {selectedChar.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#f5c767] tracking-wider uppercase mt-1">
                      Vai trò: <span className="text-white font-bold">{selectedChar.role || "Archer"}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Character Details, Skills & Audio Line */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Badges: Rarity & Role (Authentic RPG Design, No Emojis) */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {/* High-res Rarity Graphic Badge */}
              <div
                className="relative h-10 px-3.5 py-1 rounded-xl bg-gradient-to-r from-[#0c102a] to-[#141b3d] border shadow-lg flex items-center gap-2"
                style={{
                  borderColor: `${rarityColor}70`,
                  boxShadow: `0 0 15px ${rarityColor}20`,
                }}
              >
                {rarityImage ? (
                  <div className="relative h-7 w-16 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    <Image src={rarityImage} alt={charRarity} fill className="object-contain" priority />
                  </div>
                ) : (
                  <span className="font-mono font-black text-xs" style={{ color: rarityColor }}>
                    PHẨM CẤP: {charRarity}
                  </span>
                )}
              </div>

              {/* Role Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0a1329] border border-[#3fe9d6]/40 text-[#3fe9d6]">
                <span className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)]">
                  Vai Trò: {selectedChar.role || "Archer"}
                </span>
              </div>
            </div>

            {/* Title & Name */}
            <h3 className="text-4xl sm:text-5xl font-black text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide mb-2">
              {selectedChar.name}
            </h3>
            {selectedChar.title && (
              <p className="text-sm font-semibold text-[#f5c767] font-[family-name:var(--font-rajdhani)] tracking-widest uppercase mb-4">
                {selectedChar.title}
              </p>
            )}

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
              <div className="p-5 rounded-lg bg-[#0d122e]/80 border border-white/5 text-slate-300 text-sm leading-relaxed space-y-4">
                {(selectedChar.height?.trim() ||
                  selectedChar.weight?.trim() ||
                  selectedChar.birthday?.trim()) && (
                  <div className="grid grid-cols-3 gap-3 pb-4 border-b border-white/10">
                    <div className="p-2.5 rounded-lg bg-[#080c21]/80 border border-white/10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Chiều Cao
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-0.5 font-mono">
                        {selectedChar.height?.trim() || "—"}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#080c21]/80 border border-white/10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Cân Nặng
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-0.5 font-mono">
                        {selectedChar.weight?.trim() || "—"}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#080c21]/80 border border-white/10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Ngày Sinh
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-[#f5c767] mt-0.5 font-mono">
                        {selectedChar.birthday?.trim() || "—"}
                      </div>
                    </div>
                  </div>
                )}
                <p>{selectedChar.lore}</p>
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
      )}
      </div>
    </section>
  );
}
