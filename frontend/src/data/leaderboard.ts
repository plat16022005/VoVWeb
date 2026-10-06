export interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  path: string;
  progress: string;
  server: string;
}

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: "AstralPioneer_99", level: 70, path: "Săn Bắn", progress: "100%", server: "Astral-01" },
  { rank: 2, username: "Khaipha_Nguyen", level: 69, path: "Tri Thức", progress: "98.5%", server: "Astral-01" },
  { rank: 3, username: "Starlight_Fox", level: 68, path: "Hòa Hợp", progress: "96.2%", server: "Astral-02" },
  { rank: 4, username: "VoidBreaker_VN", level: 67, path: "Hủy Diệt", progress: "94.0%", server: "Astral-01" },
  { rank: 5, username: "NebulaKnight", level: 65, path: "Bảo Hộ", progress: "91.8%", server: "Astral-02" }
];
