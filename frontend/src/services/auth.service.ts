import { useSyncExternalStore } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  deleteUser,
  updateProfile,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteField, collection, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { playersService } from "./players.service";

export type UserRole = "Admin" | "Manager" | "Player";

export function normalizeRole(roleStr?: string | null): UserRole {
  if (!roleStr) return "Player";
  const trimmed = roleStr.trim().toLowerCase();
  if (trimmed === "admin") return "Admin";
  if (trimmed === "manager") return "Manager";
  return "Player";
}

export interface BanTermDetail {
  id?: string;
  title: string;
  content?: string;
}

export interface BanViolationInfo {
  termId?: string;
  termTitle?: string;
  termContent?: string;
  termIds?: string[];
  termTitles?: string[];
  terms?: BanTermDetail[];
  note?: string;
  bannedAt?: string;
  bannedBy?: string;
  username?: string;
  email?: string;
}

export function parseBanViolation(
  rawBan: any,
  userData: any,
  fallbackUsername: string,
  fallbackEmail: string
): BanViolationInfo {
  const terms: BanTermDetail[] =
    Array.isArray(rawBan?.terms) && rawBan.terms.length > 0
      ? rawBan.terms
      : rawBan?.termTitle || userData?.BanReason
      ? [
          {
            id: rawBan?.termId || userData?.BanTermId || "",
            title: rawBan?.termTitle || userData?.BanReason || "Vi phạm Điều khoản Dịch vụ",
            content: rawBan?.termContent || userData?.BanTermContent || "",
          },
        ]
      : [];

  const termTitles: string[] =
    Array.isArray(rawBan?.termTitles) && rawBan.termTitles.length > 0
      ? rawBan.termTitles
      : terms.map((t) => t.title);

  return {
    termId: rawBan?.termId || userData?.BanTermId || "term01",
    termTitle:
      rawBan?.termTitle ||
      userData?.BanReason ||
      (termTitles.length > 0 ? termTitles.join(" • ") : "Vi phạm Điều khoản Dịch vụ"),
    termContent: rawBan?.termContent || userData?.BanTermContent || "",
    termIds: Array.isArray(rawBan?.termIds)
      ? rawBan.termIds
      : rawBan?.termId
      ? [rawBan.termId]
      : [],
    termTitles,
    terms,
    note: rawBan?.note || userData?.BanNote || "Tài khoản bị khóa bởi Quản trị viên",
    bannedAt: rawBan?.bannedAt || userData?.BannedAt || "",
    bannedBy: rawBan?.bannedBy || userData?.BannedBy || "Quản trị viên",
    username: userData?.Username || fallbackUsername,
    email: fallbackEmail || userData?.Email || "",
  };
}

export class BannedAccountError extends Error {
  violation: BanViolationInfo;
  constructor(violation: BanViolationInfo) {
    super("Tài khoản của bạn đã bị khóa do vi phạm Điều khoản Dịch vụ.");
    this.name = "BannedAccountError";
    this.violation = violation;
  }
}

export interface FirestoreUserData {
  CreatedAt: string;
  Email: string;
  LastLogin: string;
  Role: UserRole | string;
  Status: "active" | "banned" | "pending";
  IsBanned: boolean;
  Provider?: "Email" | "Google" | "Guest";
  UserId: string;
  Username: string;
  BanDetails?: BanViolationInfo | any;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  level: number;
  role?: UserRole;
  status?: "active" | "banned" | "pending";
  isBanned?: boolean;
  createdAt?: string;
  lastLogin?: string;
  permissionGroups?: string[];
  permissions?: string[];
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

let managerPermissionsUnsubscribe: (() => void) | null = null;
let isGlobalAuthInit = false;
function ensureGlobalAuthInit() {
  if (isGlobalAuthInit || typeof window === "undefined" || !auth) return;
  isGlobalAuthInit = true;

  onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (managerPermissionsUnsubscribe) {
      managerPermissionsUnsubscribe();
      managerPermissionsUnsubscribe = null;
    }

    if (firebaseUser) {
      let username = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Chỉ Huy";
      let role: UserRole = "Player";
      let createdAt: string | undefined = undefined;
      let lastLogin: string | undefined = undefined;
      let isBanned = false;
      let status: "active" | "banned" | "pending" = "active";
      let permissionGroups: string[] = [];
      let permissions: string[] = [];

      // 1. Kiểm tra trạng thái trong Firestore TRƯỚC TIÊN
      if (db) {
        try {
          const snap = await getDoc(doc(db, "Users", firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            // Tự động dọn dẹp các trường phân quyền cũ còn sót trên document cha
            if (data.PermissionGroups !== undefined || data.Permissions !== undefined) {
              updateDoc(doc(db, "Users", firebaseUser.uid), {
                PermissionGroups: deleteField(),
                Permissions: deleteField(),
              }).catch(() => {});
            }
            isBanned = data.IsBanned === true || data.Status === "banned";
            if (data.Username) username = data.Username;
            if (data.Role) role = normalizeRole(data.Role);
            if (data.CreatedAt) createdAt = data.CreatedAt;
            if (data.LastLogin) lastLogin = data.LastLogin;

            // Đọc trực tiếp từ Subcollection Users/{uid}/Permissions nếu là Manager
            if (role === "Manager") {
              try {
                const subSnap = await getDocs(collection(db, "Users", firebaseUser.uid, "Permissions"));
                if (!subSnap.empty) {
                  const subGroups: string[] = [];
                  const subPerms: string[] = [];
                  subSnap.docs.forEach((d) => {
                    const sData = d.data();
                    if (sData.IsEnabled !== false) {
                      subGroups.push(d.id);
                      if (Array.isArray(sData.SubPermissions)) {
                        subPerms.push(...sData.SubPermissions);
                      }
                    }
                  });
                  permissionGroups = Array.from(new Set(subGroups));
                  permissions = Array.from(new Set(subPerms));
                }
              } catch {}
            }

            status = isBanned ? "banned" : data.Status === "pending" ? "pending" : "active";
          }
        } catch {
          // Bỏ qua lỗi mạng
        }
      }

      // 2. NẾU BỊ KHÓA: Chặn ngay lập tức, tuyệt đối KHÔNG cấp quyền hay phát tín hiệu đăng nhập
      if (isBanned) {
        if (auth) await signOut(auth);
        inMemoryUser = null;
        try {
          localStorage.removeItem(AUTH_CACHE_KEY);
        } catch {}
        notifyAuthListeners();
        return;
      }

      // 3. CHỈ KHI KHÔNG BỊ KHÓA: mới cấp quyền và phát tín hiệu cho UI
      inMemoryUser = {
        id: firebaseUser.uid,
        username,
        email: firebaseUser.email || "",
        level: 1,
        role,
        status,
        isBanned: false,
        createdAt,
        lastLogin,
        permissionGroups,
        permissions,
      };
      try {
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(inMemoryUser));
      } catch {}
      notifyAuthListeners();

      // 4. LẮNG NGHE REAL-TIME SUBCOLLECTION PERMISSIONS CHO MANAGER:
      // Giúp cập nhật phân quyền tức thời khi Admin thay đổi mà không cần đăng xuất/tải lại trang
      if (role === "Manager" && db) {
        try {
          managerPermissionsUnsubscribe = onSnapshot(
            collection(db, "Users", firebaseUser.uid, "Permissions"),
            (subSnap) => {
              const subGroups: string[] = [];
              const subPerms: string[] = [];
              subSnap.docs.forEach((d) => {
                const sData = d.data();
                if (sData.IsEnabled !== false) {
                  subGroups.push(d.id);
                  if (Array.isArray(sData.SubPermissions)) {
                    subPerms.push(...sData.SubPermissions);
                  }
                }
              });
              const newGroups = Array.from(new Set(subGroups));
              const newPerms = Array.from(new Set(subPerms));
              if (inMemoryUser && inMemoryUser.id === firebaseUser.uid) {
                inMemoryUser = {
                  ...inMemoryUser,
                  permissionGroups: newGroups,
                  permissions: newPerms,
                };
                try {
                  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(inMemoryUser));
                } catch {}
                notifyAuthListeners();
              }
            },
            (err) => {
              console.warn("Lỗi realtime sync Permissions:", err);
            }
          );
        } catch {}
      }
    } else {
      inMemoryUser = null;
      try {
        localStorage.removeItem(AUTH_CACHE_KEY);
      } catch {}
      notifyAuthListeners();
    }
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

  // Helper: Tạo hoặc Cập nhật document trong Firestore collection "Users" theo đúng motip chuẩn
  async saveUserToFirestore(userData: {
    uid: string;
    email: string;
    username: string;
    isNewUser?: boolean;
    provider?: "Email" | "Google" | "Guest";
    throwOnError?: boolean;
  }): Promise<FirestoreUserData | null> {
    if (!db) return null;
    try {
      const userDocRef = doc(db, "Users", userData.uid);
      const now = new Date().toISOString();
      const rawEmail = (userData.email || "").trim().toLowerCase();
      const isGuestEmail = !rawEmail || rawEmail === "(khách)" || rawEmail.includes("guest");

      const providerMethod: "Email" | "Google" | "Guest" =
        userData.provider || (isGuestEmail ? "Guest" : "Email");

      if (userData.isNewUser) {
        const docData: FirestoreUserData = {
          UserId: userData.uid,
          Username: userData.username,
          Email: userData.email,
          Role: "Player",
          Status: "active",
          IsBanned: false,
          Provider: providerMethod,
          CreatedAt: now,
          LastLogin: now,
        };
        await setDoc(userDocRef, docData);

        // Đếm tài khoản Người Chơi tạo mới hôm nay vào Counters/AccountStats
        try {
          await this.updateAccountStatsCounter(providerMethod);
        } catch (cErr) {
          console.warn("Lỗi cập nhật Counters từ auth:", cErr);
        }

        return docData;
      } else {
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          const docData: FirestoreUserData = {
            UserId: userData.uid,
            Username: userData.username,
            Email: userData.email,
            Role: "Player",
            Status: "active",
            IsBanned: false,
            Provider: providerMethod,
            CreatedAt: now,
            LastLogin: now,
          };
          await setDoc(userDocRef, docData);

          // Đếm tài khoản Người Chơi tạo mới hôm nay vào Counters/AccountStats (Google / Social / Guest)
          try {
            await this.updateAccountStatsCounter(providerMethod);
          } catch (cErr) {
            console.warn("Lỗi cập nhật Counters từ auth:", cErr);
          }

          return docData;
        } else {
          const existingData = userDocSnap.data() as Partial<FirestoreUserData>;
          const updates: Record<string, any> = {
            LastLogin: now,
          };
          if (!existingData.Status) {
            updates.Status = existingData.IsBanned ? "banned" : "active";
          }
          if (existingData.IsBanned === undefined) {
            updates.IsBanned = false;
          }
          // Bổ sung Provider cho tài khoản cũ chưa có
          if (!existingData.Provider && userData.provider) {
            updates.Provider = userData.provider;
          }
          // Tự động dọn dẹp các trường phân quyền cũ còn sót trên document cha
          if ((existingData as any).PermissionGroups !== undefined || (existingData as any).Permissions !== undefined) {
            updates.PermissionGroups = deleteField();
            updates.Permissions = deleteField();
          }
          await setDoc(userDocRef, updates, { merge: true });

          const isBanned = existingData.IsBanned === true || existingData.Status === "banned";
          const status = (existingData.Status as any) || (isBanned ? "banned" : "active");

          return {
            UserId: userData.uid,
            Username: existingData.Username || userData.username,
            Email: existingData.Email || userData.email,
            Role: normalizeRole(existingData.Role),
            Status: status,
            IsBanned: isBanned,
            Provider: existingData.Provider || userData.provider || (isGuestEmail ? "Guest" : "Email"),
            CreatedAt: existingData.CreatedAt || now,
            LastLogin: now,
            BanDetails: existingData.BanDetails || (existingData as any)?.banDetails,
          };
        }
      }
    } catch (err: unknown) {
      console.warn("Lỗi lưu document vào Firestore collection Users:", err);
      const fsErr = err as { code?: string; message?: string };
      if (userData.throwOnError) {
        if (fsErr?.code === "permission-denied") {
          throw new Error(
            "Không có quyền ghi hồ sơ vào Firestore (Users). Vui lòng kiểm tra và deploy Firestore Rules mới nhất."
          );
        }
        throw new Error(
          fsErr?.message || "Không thể lưu hồ sơ người dùng vào Firestore (Users)."
        );
      }
      return null;
    }
  },

  // 1. Đăng ký tài khoản THẬT trên Firebase + Tạo document trong Firestore Users
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

      const username = data.username.trim() || credential.user.email?.split("@")[0] || "Chỉ Huy";

      // Cập nhật Tên hiển thị (DisplayName) trên Firebase Auth
      if (data.username.trim()) {
        await updateProfile(credential.user, {
          displayName: username,
        });
      }

      // Tạo Document trong Firestore Users theo motip chuẩn:
      // UserId, Username, Email, Role, Status, IsBanned, CreatedAt, LastLogin
      let firestoreUser: FirestoreUserData | null = null;
      try {
        firestoreUser = await this.saveUserToFirestore({
          uid: credential.user.uid,
          email: credential.user.email || data.email.trim(),
          username,
          isNewUser: true,
          provider: "Email",
          throwOnError: true,
        });
      } catch (fsErr) {
        // Dọn tài khoản Auth vừa tạo nếu không ghi được hồ sơ Firestore Users (tránh tạo tài khoản rỗng)
        try {
          await deleteUser(credential.user);
        } catch {}
        throw fsErr;
      }

      // Đồng bộ sang NestJS Backend (/api/players) nếu Backend đang chạy
      try {
        await playersService.create({
          username,
          email: data.email.trim(),
        });
      } catch {
        // Nếu Backend chưa có DB thì vẫn tiếp tục, không chặn luồng đăng ký của Firebase
      }

      return {
        id: credential.user.uid,
        username,
        email: credential.user.email || data.email,
        level: 1,
        role: normalizeRole(firestoreUser?.Role),
        status: firestoreUser?.Status || "active",
        isBanned: firestoreUser?.IsBanned || false,
        createdAt: firestoreUser?.CreatedAt,
        lastLogin: firestoreUser?.LastLogin,
      };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng ký thất bại"));
    }
  },

  // 2. Đăng nhập tài khoản THẬT từ Firebase Authentication + Cập nhật LastLogin trên Firestore Users
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

      const username = credential.user.displayName || credential.user.email?.split("@")[0] || "Chỉ Huy";

      // 1. Kiểm tra tài khoản bị khóa trong Firestore NGAY LẬP TỨC
      if (db) {
        const snap = await getDoc(doc(db, "Users", credential.user.uid));
        if (snap.exists()) {
          const userData = snap.data();
          const isBanned = userData.IsBanned === true || userData.Status === "banned";
          if (isBanned) {
            // Chặn ngay từ đầu: Hủy phiên xác thực tức thì, không cập nhật LastLogin
            if (auth) await signOut(auth);
            inMemoryUser = null;
            try {
              localStorage.removeItem(AUTH_CACHE_KEY);
            } catch {}
            notifyAuthListeners();

            const rawBan = userData.BanDetails || userData.banDetails || {};
            throw new BannedAccountError(
              parseBanViolation(
                rawBan,
                userData,
                userData.Username || username,
                credential.user.email || data.email
              )
            );
          }
        }
      }

      // 2. CHỈ KHI HỢP LỆ VÀ KHÔNG BỊ KHÓA: mới ghi nhận LastLogin vào Firestore
      const firestoreUser = await this.saveUserToFirestore({
        uid: credential.user.uid,
        email: credential.user.email || data.email.trim(),
        username,
        isNewUser: false,
      });

      // Đọc quyền từ Subcollection Permissions nếu là Manager
      let permissionGroups: string[] = [];
      let permissions: string[] = [];
      const userRole = normalizeRole(firestoreUser?.Role);
      if (userRole === "Manager" && db) {
        try {
          const subSnap = await getDocs(collection(db, "Users", credential.user.uid, "Permissions"));
          subSnap.docs.forEach((d) => {
            const sData = d.data();
            if (sData.IsEnabled !== false) {
              permissionGroups.push(d.id);
              if (Array.isArray(sData.SubPermissions)) {
                permissions.push(...sData.SubPermissions);
              }
            }
          });
        } catch {}
      }

      return {
        id: credential.user.uid,
        username: firestoreUser?.Username || username,
        email: credential.user.email || data.email,
        level: 1,
        role: userRole,
        status: firestoreUser?.Status || "active",
        isBanned: false,
        createdAt: firestoreUser?.CreatedAt,
        lastLogin: firestoreUser?.LastLogin,
        permissionGroups: Array.from(new Set(permissionGroups)),
        permissions: Array.from(new Set(permissions)),
      };
    } catch (err: unknown) {
      if (err instanceof BannedAccountError || (err as any)?.name === "BannedAccountError") {
        throw err;
      }
      const error = err as { code?: string; message?: string };
      throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng nhập thất bại"));
    }
  },

  // 3. Đăng nhập một chạm bằng Google + Đồng bộ Firestore Users
  async loginWithGoogle(): Promise<AuthUser> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Cấu hình Firebase chưa được khởi tạo.");
    }

    try {
      const credential = await signInWithPopup(auth, googleProvider);

      const username = credential.user.displayName || credential.user.email?.split("@")[0] || "Chỉ Huy";

      // 1. Kiểm tra tài khoản bị khóa trong Firestore NGAY LẬP TỨC
      if (db) {
        const snap = await getDoc(doc(db, "Users", credential.user.uid));
        if (snap.exists()) {
          const userData = snap.data();
          const isBanned = userData.IsBanned === true || userData.Status === "banned";
          if (isBanned) {
            // Chặn ngay từ đầu: Hủy phiên xác thực tức thì, không cập nhật LastLogin
            if (auth) await signOut(auth);
            inMemoryUser = null;
            try {
              localStorage.removeItem(AUTH_CACHE_KEY);
            } catch {}
            notifyAuthListeners();

            const rawBan = userData.BanDetails || userData.banDetails || {};
            throw new BannedAccountError(
              parseBanViolation(
                rawBan,
                userData,
                userData.Username || username,
                credential.user.email || ""
              )
            );
          }
        }
      }

      // 2. CHỈ KHI HỢP LỆ VÀ KHÔNG BỊ KHÓA: mới ghi nhận LastLogin vào Firestore
      const firestoreUser = await this.saveUserToFirestore({
        uid: credential.user.uid,
        email: credential.user.email || "",
        username,
        isNewUser: false,
        provider: "Google",
      });

      // Đồng bộ thông tin người chơi sang NestJS
      try {
        await playersService.create({
          username: firestoreUser?.Username || username,
          email: credential.user.email || "",
        });
      } catch {
        // Backend optional
      }

      // Đọc quyền từ Subcollection Permissions nếu là Manager
      let permissionGroups: string[] = [];
      let permissions: string[] = [];
      const userRole = normalizeRole(firestoreUser?.Role);
      if (userRole === "Manager" && db) {
        try {
          const subSnap = await getDocs(collection(db, "Users", credential.user.uid, "Permissions"));
          subSnap.docs.forEach((d) => {
            const sData = d.data();
            if (sData.IsEnabled !== false) {
              permissionGroups.push(d.id);
              if (Array.isArray(sData.SubPermissions)) {
                permissions.push(...sData.SubPermissions);
              }
            }
          });
        } catch {}
      }

      return {
        id: credential.user.uid,
        username: firestoreUser?.Username || username,
        email: credential.user.email || "",
        level: 1,
        role: userRole,
        status: firestoreUser?.Status || "active",
        isBanned: false,
        createdAt: firestoreUser?.CreatedAt,
        lastLogin: firestoreUser?.LastLogin,
        permissionGroups: Array.from(new Set(permissionGroups)),
        permissions: Array.from(new Set(permissions)),
      };
    } catch (err: unknown) {
      if (err instanceof BannedAccountError || (err as any)?.name === "BannedAccountError") {
        throw err;
      }
      const error = err as { code?: string; message?: string };
      throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng nhập Google thất bại"));
    }
  },

  // 3b. Đăng nhập / Trải nghiệm nhanh dưới dạng Khách (Guest)
  async loginAsGuest(): Promise<AuthUser> {
    let guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const guestUsername = `Chỉ Huy Khách #${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    if (auth && isFirebaseConfigured) {
      try {
        const anonCred = await signInAnonymously(auth);
        if (anonCred.user?.uid) {
          guestId = anonCred.user.uid;
        }
      } catch {
        // Dự phòng nếu Anonymous Auth chưa được bật trong Firebase Console
      }
    }

    if (db) {
      try {
        const userDocRef = doc(db, "Users", guestId);
        const docData: FirestoreUserData = {
          UserId: guestId,
          Username: guestUsername,
          Email: "",
          Role: "Player",
          Status: "active",
          IsBanned: false,
          Provider: "Guest",
          CreatedAt: now,
          LastLogin: now,
        };
        await setDoc(userDocRef, docData);

        // Tăng bộ đếm GuestCount vào Counters/AccountStats
        await this.updateAccountStatsCounter("Guest");
      } catch (err) {
        console.warn("Lỗi lưu tài khoản khách vào Firestore:", err);
      }
    }

    const guestUser: AuthUser = {
      id: guestId,
      username: guestUsername,
      email: "",
      level: 1,
      role: "Player",
      status: "active",
      isBanned: false,
      createdAt: now,
      lastLogin: now,
    };

    this.setCachedUser(guestUser);
    return guestUser;
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

  // 7. Cập nhật bộ đếm tài khoản Người Chơi tạo mới hôm nay vào Counters/AccountStats
  async updateAccountStatsCounter(method: "Email" | "Google" | "Guest" = "Email"): Promise<void> {
    if (!db) return;
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const docRef = doc(db, "Counters", "AccountStats");
      const snap = await getDoc(docRef);
      const methodKey = `${method}Count`;

      // 1. Cập nhật Document cha: CHỈ LƯU 3 trường EmailCount, GoogleCount, GuestCount
      if (snap.exists()) {
        const data = snap.data();
        const currentMethodCount = Number(data[methodKey]) || 0;

        await setDoc(
          docRef,
          {
            [methodKey]: currentMethodCount + 1,
          },
          { merge: true }
        );
      } else {
        await setDoc(docRef, {
          EmailCount: method === "Email" ? 1 : 0,
          GoogleCount: method === "Google" ? 1 : 0,
          GuestCount: method === "Guest" ? 1 : 0,
        });
      }

      // Đồng thời cập nhật vào subcollection DailyStats/{todayStr}
      const dailyDocRef = doc(db, "Counters", "AccountStats", "DailyStats", todayStr);
      const dailySnap = await getDoc(dailyDocRef);
      if (dailySnap.exists()) {
        const dData = dailySnap.data();
        const curPlayers = Number(dData.PlayerCount) || 0;
        const curMethod = Number(dData[methodKey]) || 0;
        await setDoc(
          dailyDocRef,
          {
            Date: todayStr,
            PlayerCount: curPlayers + 1,
            [methodKey]: curMethod + 1,
            LastUpdated: new Date().toLocaleString("vi-VN"),
          },
          { merge: true }
        );
      } else {
        await setDoc(dailyDocRef, {
          Date: todayStr,
          PlayerCount: 1,
          EmailCount: method === "Email" ? 1 : 0,
          GoogleCount: method === "Google" ? 1 : 0,
          GuestCount: method === "Guest" ? 1 : 0,
          LastUpdated: new Date().toLocaleString("vi-VN"),
        });
      }
    } catch (err) {
      console.warn("Lỗi cập nhật Counters/AccountStats từ auth.service:", err);
    }
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
