export type UserRole = "admin" | "manager" | "player";
export interface Player {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    role?: UserRole;
    createdAt: Date;
    isBanned: boolean;
}
