export type UserRole = "admin" | "manager" | "player";

// Định nghĩa shape của Player object dùng xuyên suốt app
export interface Player {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role?: UserRole;
  createdAt: Date;
  isBanned: boolean;
}

