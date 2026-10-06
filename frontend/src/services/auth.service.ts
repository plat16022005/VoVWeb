import { useSyncExternalStore } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { playersService } from "./players.service";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  level: number;
}

const AUTH_CACHE_KEY = "vov_auth_commander";

// Store bộ nhớ đệm cho React useSyncExternalStore
let inMemoryUser: AuthUser | null = null;
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (raw) inMemoryUser = JSON.parse(raw);
  } catch {}
}

const authListeners = new Set<() => void>();
function notifyAuthListeners() {
  authListeners.forEach((fn) => fn());
}

let isGlobalAuthInit = false;
function ensureGlobalAuthInit() {
  if (isGlobalAuthInit || typeof window === "undefined" || !auth) return;
  isGlobalAuthInit = true;

  onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      inMemoryUser = {
        id: firebaseUser.uid,
        username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Chỉ Huy",
        email: firebaseUser.email || "",
        level: 1,
      };
      try {
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(inMemoryUser));
      } catch {}
    } else {
      inMemoryUser = null;
      try {
        localStorage.removeItem(AUTH_CACHE_KEY);
      } catch {}
    }
    notifyAuthListeners();
  });
}

export const authService = {
  // Lấy lỗi tiếng Việt thân thiện từ Firebase Auth
  getErrorMessage(errCode: string, defaultMsg: string): string {
    switch (errCode) {
      case "auth/operation-not-allowed":
        return "Phương thức Email/Password chưa được Bật trên Firebase Console! Vui lòng vào Firebase Console > Build > Authentication > Sign-in method và Bật (Enable) Email/Password.";
      case "auth/email-already-in-use":
        return "Email này đã được đăng ký tài khoản trên hệ thống Firebase.";
      case "auth/invalid-email":
        return "Địa chỉ email không đúng định dạng.";
      case "auth/weak-password":
        return "Mật khẩu quá ngắn (Firebase yêu cầu tối thiểu 6 ký tự).";
      case "auth/user-not-found":
        return "Không tìm thấy tài khoản với email này trên Firebase.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Email hoặc mật khẩu không chính xác.";
      case "auth/too-many-requests":
        return "Thao tác quá nhiều lần liên tiếp. Vui lòng chờ ít phút rồi thử lại.";
      case "auth/popup-closed-by-user":
        return "Cửa sổ đăng nhập Google đã bị đóng trước khi xác thực.";
      default:
        return defaultMsg || "Có lỗi xảy ra trong quá trình xác thực.";
    }
  },

  // 1. Đăng ký tài khoản THẬT trên Firebase + Đồng bộ Player sang NestJS
  async register(data: { username: string; email: string; password: string }): Promise<AuthUser> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Cấu hình Firebase chưa được khởi tạo. Vui lòng kiểm tra .env.local");
    }

    try {
      // Tạo User trên Firebase Authentication
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );

      // Cập nhật Tên hiển thị (DisplayName) trên Firebase
      if (data.username.trim()) {
        await updateProfile(credential.user, {
          displayName: data.username.trim(),
        });
      }

      // Đồng bộ sang NestJS Backend (/api/players) nếu Backend đang chạy
      try {
        await playersService.create({
          username: data.username.trim(),
          email: data.email.trim(),
        });
      } catch {
        // Nếu Backend chưa có DB thì vẫn tiếp tục, không chặn luồng đăng ký của Firebase
      }

      return {
        id: credential.user.uid,
        username: data.username.trim() || credential.user.email || "Chỉ Huy",
        email: credential.user.email || data.email,
        level: 1,
      };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng ký thất bại"));
    }
  },

  // 2. Đăng nhập tài khoản THẬT từ Firebase Authentication
  async login(data: { email: string; password: string }): Promise<AuthUser> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Cấu hình Firebase chưa được khởi tạo. Vui lòng kiểm tra .env.local");
    }

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );

      return {
        id: credential.user.uid,
        username: credential.user.displayName || credential.user.email?.split("@")[0] || "Chỉ Huy",
        email: credential.user.email || data.email,
        level: 1,
      };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng nhập thất bại"));
    }
  },

  // 3. Đăng nhập một chạm bằng Google
  async loginWithGoogle(): Promise<AuthUser> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Cấu hình Firebase chưa được khởi tạo.");
    }

    try {
      const credential = await signInWithPopup(auth, googleProvider);

      // Đồng bộ thông tin người chơi sang NestJS
      try {
        await playersService.create({
          username: credential.user.displayName || credential.user.email?.split("@")[0] || "Chỉ Huy",
          email: credential.user.email || "",
        });
      } catch {
        // Backend optional
      }

      return {
        id: credential.user.uid,
        username: credential.user.displayName || "Chỉ Huy",
        email: credential.user.email || "",
        level: 1,
      };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng nhập Google thất bại"));
    }
  },

  // 4. Quên mật khẩu THẬT - Firebase gửi email khôi phục mật khẩu trực tiếp đến Gmail
  async forgotPassword(email: string): Promise<string> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Cấu hình Firebase chưa được khởi tạo.");
    }

    if (!email.trim()) {
      throw new Error("Vui lòng nhập địa chỉ Email vào ô bên trên để nhận hướng dẫn khôi phục mật khẩu.");
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      return `Email khôi phục mật khẩu đã được gửi đến "${email.trim()}". Vui lòng kiểm tra hộp thư (kể cả mục Spam) để đặt lại mật khẩu!`;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      throw new Error(this.getErrorMessage(error.code || "", error.message || "Không thể gửi email khôi phục."));
    }
  },

  // Lấy tài khoản lưu nhanh trong cache (localStorage)
  getCachedUser(): AuthUser | null {
    return inMemoryUser;
  },

  setCachedUser(user: AuthUser | null): void {
    inMemoryUser = user;
    if (typeof window !== "undefined") {
      try {
        if (user) {
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(AUTH_CACHE_KEY);
        }
      } catch {}
    }
    notifyAuthListeners();
  },

  // Cho React useSyncExternalStore
  subscribe(callback: () => void): () => void {
    ensureGlobalAuthInit();
    authListeners.add(callback);
    return () => {
      authListeners.delete(callback);
    };
  },

  getSnapshot(): AuthUser | null {
    return inMemoryUser;
  },

  getServerSnapshot(): AuthUser | null {
    return null;
  },

  // 5. Đăng xuất Firebase
  async logout(): Promise<void> {
    this.setCachedUser(null);
    if (!auth) return;
    await signOut(auth);
  },

  // 6. Lắng nghe trạng thái đăng nhập Firebase trong thời gian thực
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    ensureGlobalAuthInit();
    const listener = () => callback(inMemoryUser);
    authListeners.add(listener);
    callback(inMemoryUser);
    return () => {
      authListeners.delete(listener);
    };
  },
};

const emptySubscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function useAuth(): AuthUser | null {
  return useSyncExternalStore(
    authService.subscribe,
    authService.getSnapshot,
    authService.getServerSnapshot
  );
}
