export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  level: number;
  createdAt: Date;
  isBanned: boolean;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}
