"use client";

import { useEffect, useState } from "react";
import { soundEngine } from "@/services/audio.service";
import { playersService } from "@/services/players.service";
import { DEFAULT_LEADERBOARD, LeaderboardEntry } from "@/data/leaderboard";

import StarCanvas from "@/components/common/StarCanvas";
import Navbar from "@/components/home/Navbar";
import HeroSection from "@/components/home/HeroSection";
import MilestoneSection from "@/components/home/MilestoneSection";
import NewsSection from "@/components/home/NewsSection";
import CharacterShowcase from "@/components/home/CharacterShowcase";
import WorldSection from "@/components/home/WorldSection";
import LeaderboardSection from "@/components/home/LeaderboardSection";
import MediaGallery from "@/components/home/MediaGallery";
import CommunitySection from "@/components/home/CommunitySection";
import Footer from "@/components/home/Footer";

import TrailerModal from "@/components/modals/TrailerModal";
import PlayModal from "@/components/modals/PlayModal";
import GiftcodeModal from "@/components/modals/GiftcodeModal";

export default function HonkaiStarRailHome() {
  // Global & Audio States
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [livePlayers, setLivePlayers] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);

  // Modals
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [playModalOpen, setPlayModalOpen] = useState(false);
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);

  // Fetch live players & server status on mount
  useEffect(() => {
    let isSubscribed = true;

    // Check backend health
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/health`)
      .then((res) => {
        if (isSubscribed) setServerOnline(res.ok);
      })
      .catch(() => {
        if (isSubscribed) setServerOnline(false);
      });

    // Fetch players for leaderboard
    playersService
      .getAll()
      .then((data) => {
        if (isSubscribed && Array.isArray(data) && data.length > 0) {
          const mapped: LeaderboardEntry[] = data.map((p, idx) => ({
            rank: idx + 1,
            username: p.username || `Commander_${idx + 1}`,
            level: p.level || 50 + idx * 2,
            path: idx % 2 === 0 ? "Xạ Thủ" : "Đấu Sĩ",
            progress: `${Math.min(100, 75 + idx * 5)}%`,
            server: "Veyra-01",
          }));
          setLivePlayers(mapped);
        }
      })
      .catch(() => {
        // Keep default pioneers smoothly if backend is offline
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Handle BGM Toggle
  const handleToggleBgm = () => {
    soundEngine.playClick();
    const playing = soundEngine.toggleBgm((state) => {
      setBgmPlaying(state);
    });
    setBgmPlaying(playing);
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center bg-[#04050d] text-[#e8eaf6] overflow-x-hidden selection:bg-[#f5c767] selection:text-[#04050d]">
      {/* Background Starry Particles */}
      <StarCanvas />

      {/* Top Navbar */}
      <Navbar
        bgmPlaying={bgmPlaying}
        onToggleBgm={handleToggleBgm}
        onOpenPlayModal={() => setPlayModalOpen(true)}
      />

      {/* Hero Cinematic Section */}
      <HeroSection
        serverOnline={serverOnline}
        onOpenPlayModal={() => setPlayModalOpen(true)}
        onOpenTrailerModal={() => setTrailerModalOpen(true)}
      />

      {/* Pre-registration Milestones */}
      <MilestoneSection
        onOpenRewardsModal={() => setRewardsModalOpen(true)}
      />

      {/* News & Events */}
      <NewsSection
        onOpenTrailerModal={() => setTrailerModalOpen(true)}
        onOpenPlayModal={() => setPlayModalOpen(true)}
      />

      {/* Interactive 2.5D Characters Showcase */}
      <CharacterShowcase
        onOpenPlayModal={() => setPlayModalOpen(true)}
      />

      {/* World Expedition */}
      <WorldSection />

      {/* Hall of Fame / Leaderboard */}
      <LeaderboardSection
        players={livePlayers}
        onOpenPlayModal={() => setPlayModalOpen(true)}
      />

      {/* Wallpapers & Media */}
      <MediaGallery />

      {/* Community & Socials */}
      <CommunitySection />

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <TrailerModal
        isOpen={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
        onOpenPlayModal={() => setPlayModalOpen(true)}
      />

      <PlayModal
        isOpen={playModalOpen}
        onClose={() => setPlayModalOpen(false)}
      />

      <GiftcodeModal
        isOpen={rewardsModalOpen}
        onClose={() => setRewardsModalOpen(false)}
      />
    </div>
  );
}
