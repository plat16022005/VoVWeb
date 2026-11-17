export interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  path: string;
  progress: string;
  server: string;
}

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: "VeyraCommander_99", level: 70, path: "Xạ Thủ", progress: "100%", server: "Veyra-01" },
  { rank: 2, username: "Chihuy_Nguyen", level: 69, path: "Pháp Sư", progress: "98.5%", server: "Veyra-01" },
  { rank: 3, username: "Starlight_Fox", level: 68, path: "Hỗ Trợ", progress: "96.2%", server: "Veyra-02" },
  { rank: 4, username: "VoidBreaker_VN", level: 67, path: "Đấu Sĩ", progress: "94.0%", server: "Veyra-01" },
  { rank: 5, username: "ValkyrieKnight", level: 65, path: "Đỡ Đòn", progress: "91.8%", server: "Veyra-02" }
];
