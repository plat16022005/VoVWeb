// Định nghĩa shape của Player object dùng xuyên suốt app
export interface Player {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  level: number;
  createdAt: Date;
  isBanned: boolean;
}
