import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CHARACTERS, Character, CharacterSkill } from "@/data/characters";

// Collection chính trên Firestore đồng bộ trực tiếp với Unity Game Client (CHỈ CHỨA ĐÚNG 16 TRƯỜNG THÔNG SỐ)
const PRIMARY_COLLECTION = "HeroConfigs";
// Subcollection bên trong mỗi Document HeroConfigs/{heroId} để lưu thông tin mở rộng trên Web (Ảnh R2, Danh hiệu, Kỹ năng, Cốt truyện...)
const SUBCOLLECTION_NAME = "Profile";
const SUBCOLLECTION_DOC = "info";
const LOCAL_STORAGE_KEY = "vov_gamedata_heroconfigs_v6";
const LOGS_STORAGE_KEY = "vov_gamedata_logs_v1";

export const DEFAULT_HERO_IMAGE = "/images/default_hero.png";

export type GameDataLogAction =
  | "CREATE_CHARACTER"
  | "UPDATE_CHARACTER"
  | "DELETE_CHARACTER"
  | "SEED_CHARACTERS"
  | "RESET_CHARACTERS";

export interface GameDataActivityLog {
  id: string;
  action: GameDataLogAction;
  actionTitle: string;
  characterId?: string;
  characterName?: string;
  rarity?: string;
  role?: string;
  details: string;
  performedBy: string;
  performedByRole?: string;
  timestamp: number;
  createdAt: string;
}

function getLocalLogsCache(): GameDataActivityLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLog(log: GameDataActivityLog): void {
  if (typeof window === "undefined") return;
  try {
    const list = getLocalLogsCache();
    const updated = [log, ...list.filter((l) => l.id !== log.id)].slice(0, 300);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Ghi nhật ký hoạt động vào Firestore theo chuẩn Rule 6: Logs/GameData/Characters/{logId}
 * Kết hợp LocalStorage cache để UI hiển thị tức thời và không bị phụ thuộc kết nối
 */
async function logGameDataActivity(
  action: GameDataLogAction,
  actionTitle: string,
  details: string,
  character?: Partial<Character>,
  performedBy = "Quản Trị Viên",
  performedByRole = "Manager"
): Promise<void> {
  const now = new Date();
  const formattedTime = now.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const newLog: GameDataActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    actionTitle,
    characterId: character?.id || "",
    characterName: character?.name || "",
    rarity: character?.rarityLabel || (character?.rarity && character.rarity >= 5 ? "SSR" : "R") || "",
    role: character?.role || "",
    details,
    performedBy,
    performedByRole,
    timestamp: Date.now(),
    createdAt: formattedTime,
  };

  // 1. Luôn lưu vào LocalStorage tức thì
  saveLocalLog(newLog);

  // 2. Ghi vào Firestore nếu có kết nối
  const firestore = db;
  if (!firestore) return;

  try {
    await addDoc(collection(firestore, "Logs", "GameData", "Characters"), newLog);
  } catch (err) {
    console.warn("Không thể ghi log vào Logs/GameData/Characters (đã lưu cache cục bộ):", err);
  }
}

export const ROLE_OPTIONS = [
  { label: "Archer (Xạ Thủ)", value: "Archer", icon: "", spec: "Xạ Kích Tầm Xa", desc: "Tấn công tầm xa, bạo kích cao" },
  { label: "Tank (Đỡ Đòn)", value: "Tank", icon: "", spec: "Hộ Vệ Kiên Cố", desc: "Sinh lực & phòng ngự vững chắc" },
  { label: "Warrior (Đấu Sĩ)", value: "Warrior", icon: "", spec: "Tiên Phong Cận Chiến", desc: "Cận chiến, công thủ toàn diện" },
  { label: "Mage (Pháp Sư)", value: "Mage", icon: "", spec: "Ma Thuật Khống Chế", desc: "Sát thương ma thuật diện rộng" },
  { label: "Support (Hỗ Trợ)", value: "Support", icon: "", spec: "Cường Hóa Đội Hình", desc: "Hỗ trợ, khống chế và buff chỉ số" },
  { label: "Healer (Trị Liệu)", value: "Healer", icon: "", spec: "Trị Liệu Sinh Lực", desc: "Hồi phục sinh lực và thanh tẩy hiệu ứng xấu" },
  { label: "Assassin (Sát Thủ)", value: "Assassin", icon: "", spec: "Đột Kích Ám Sát", desc: "Bộc phát sát thương hạ gục nhanh" },
] as const;

export const RARITY_OPTIONS = [
  { label: "UR (Trắng)", value: "UR", color: "#ffffff", image: null },
  { label: "SSR (Đỏ)", value: "SSR", color: "#ef4444", image: "/images/SSR.png" },
  { label: "SR (Vàng)", value: "SR", color: "#f5c767", image: "/images/SR.png" },
  { label: "R (Xanh)", value: "R", color: "#38bdf8", image: "/images/R.png" },
] as const;

export function getRarityImage(rarity?: string | number): string | null {
  const r = String(rarity || "").toUpperCase();
  if (r === "SSR" || r === "5") return "/images/SSR.png";
  if (r === "SR" || r === "4") return "/images/SR.png";
  if (r === "R" || r === "3") return "/images/R.png";
  return null;
}

export function getRarityColor(rarity?: string | number): string {
  const r = String(rarity || "").toUpperCase();
  if (r === "UR") return "#ffffff"; // Trắng
  if (r === "SSR" || r === "5") return "#ef4444"; // Đỏ
  if (r === "SR" || r === "4") return "#f5c767"; // Vàng
  // R là thấp nhất
  return "#38bdf8"; // Xanh
}

/**
 * Trọng số phẩm chất nhân vật (từ cao xuống thấp: UR -> SSR -> SR -> R)
 */
export function getRarityWeight(rarity?: string | number): number {
  const r = String(rarity || "").toUpperCase();
  if (r === "UR" || r === "6") return 4;
  if (r === "SSR" || r === "5") return 3;
  if (r === "SR" || r === "4") return 2;
  // R là thấp nhất
  return 1;
}

/**
 * Sắp xếp danh sách nhân vật theo thứ tự phẩm chất từ cao xuống thấp (UR -> SSR -> SR -> R).
 * Nếu cùng phẩm chất thì sắp xếp theo tên hiển thị A-Z.
 */
export function sortCharactersByRarity(chars: Character[]): Character[] {
  return [...chars].sort((a, b) => {
    const weightA = getRarityWeight(a.rarityLabel || a.rarity);
    const weightB = getRarityWeight(b.rarityLabel || b.rarity);
    if (weightB !== weightA) {
      return weightB - weightA; // Giảm dần: cao xuống thấp
    }
    return (a.name || "").localeCompare(b.name || "", "vi");
  });
}

/**
 * Chuẩn ĐÚNG 16 TRƯỜNG DUY NHẤT của HeroConfigs dành riêng cho Unity Game Client
 * TUYỆT ĐỐI không thêm bất kỳ trường nào khác vào collection này.
 */
function mapCharacterToHeroConfig(char: Character): Record<string, any> {
  const rarityStr = char.rarityLabel || (char.rarity >= 5 ? "SSR" : char.rarity === 4 ? "SR" : "R");

  return {
    AtkGrowthPerLevel: Number(char.atkGrowthPerLevel) || 12,
    BaseAtk: Number(char.baseAtk) || 120,
    BaseCritDamage: Number(char.critDmg) || 150,
    BaseCritRate: Number(char.critRate) || 5,
    BaseDef: Number(char.baseDef) || 50,
    BaseDodgeRate: Number(char.baseDodgeRate) || 5,
    BaseHp: Number(char.baseHp) || 900,
    BaseParryRate: Number(char.baseParryRate) || 5,
    BaseSpeed: Number(char.baseSpd) || 100,
    DefGrowthPerLevel: Number(char.defGrowthPerLevel) || 5,
    HeroId: char.id.toLowerCase().trim().replace(/\s+/g, "_"),
    HeroName: char.name.trim(),
    HpGrowthPerLevel: Number(char.hpGrowthPerLevel) || 90,
    MaxRage: Number(char.maxRage) || 100,
    Rarity: rarityStr,
    Role: char.role || "Archer",
  };
}

/**
 * Collection mới: HeroProfiles lưu trữ toàn bộ trường hiển thị mở rộng trên Web (ảnh R2, danh hiệu, kỹ năng, cốt truyện...)
 */
function mapCharacterToHeroProfile(char: Character): Record<string, any> {
  return {
    HeroId: char.id.toLowerCase().trim().replace(/\s+/g, "_"),
    HeroName: char.name.trim(),
    Title: char.title || "",
    Image: char.image || DEFAULT_HERO_IMAGE,
    Quote: char.quote || "",
    Lore: char.lore || "",
    Skills: char.skills || [],
    Cv: char.cv || "Chưa cập nhật",
    Height: (char.height || "").trim(),
    Weight: (char.weight || "").trim(),
    Birthday: (char.birthday || "").trim(),
    Status: char.status || "Active",
    ReleaseVersion: char.releaseVersion || "v1.0",
    UpdatedAt: Date.now(),
  };
}

/**
 * Kết hợp thông số game từ HeroConfigs và thông tin mở rộng từ HeroProfiles thành đối tượng Character
 */
function mergeConfigAndProfile(heroId: string, configData: any, profileData?: any): Character {
  const rawRarity = String(configData?.Rarity || configData?.rarity || profileData?.Rarity || "R").toUpperCase();
  let rarityNum = 3;
  if (rawRarity === "UR" || rawRarity === "SSR" || rawRarity === "5") rarityNum = 5;
  else if (rawRarity === "SR" || rawRarity === "4") rarityNum = 4;
  else rarityNum = 3; // R là thấp nhất

  const role = configData?.Role || configData?.role || profileData?.Role || "Archer";
  const name = configData?.HeroName || configData?.name || profileData?.HeroName || heroId;

  return {
    // 16 Game Config Stats từ HeroConfigs (Unity Game Client)
    id: configData?.HeroId || heroId,
    name: name,
    role: role,
    path: role,
    rarity: rarityNum,
    rarityLabel: rawRarity === "N" ? "R" : rawRarity,
    baseHp: Number(configData?.BaseHp ?? 900),
    baseAtk: Number(configData?.BaseAtk ?? 120),
    baseDef: Number(configData?.BaseDef ?? 50),
    baseSpd: Number(configData?.BaseSpeed ?? 100),
    critRate: Number(configData?.BaseCritRate ?? 5),
    critDmg: Number(configData?.BaseCritDamage ?? 150),
    baseDodgeRate: Number(configData?.BaseDodgeRate ?? 5),
    baseParryRate: Number(configData?.BaseParryRate ?? 5),
    maxRage: Number(configData?.MaxRage ?? 100),
    hpGrowthPerLevel: Number(configData?.HpGrowthPerLevel ?? 90),
    atkGrowthPerLevel: Number(configData?.AtkGrowthPerLevel ?? 12),
    defGrowthPerLevel: Number(configData?.DefGrowthPerLevel ?? 5),

    // Các trường hiển thị mở rộng từ Subcollection Profile
    title: (profileData?.Title || profileData?.title || "").toLowerCase().startsWith("valkyria ")
      ? ""
      : (profileData?.Title || profileData?.title || ""),
    element: "",
    elementColor: "",
    image: profileData?.Image || profileData?.image || profileData?.AvatarUrl || DEFAULT_HERO_IMAGE,
    quote: profileData?.Quote || profileData?.quote || "Vì công lý và hòa bình đại lục Veyra!",
    lore: profileData?.Lore || profileData?.lore || "",
    skills: Array.isArray(profileData?.Skills || profileData?.skills) ? (profileData?.Skills || profileData?.skills) : [],
    cv: profileData?.Cv || profileData?.cv || "Chưa cập nhật",
    height: profileData?.Height || profileData?.height || "",
    weight: profileData?.Weight || profileData?.weight || "",
    birthday: profileData?.Birthday || profileData?.birthday || "",
    status: profileData?.Status || profileData?.status || "Active",
    releaseVersion: profileData?.ReleaseVersion || profileData?.releaseVersion || "v1.0",
    createdAt: profileData?.CreatedAt || profileData?.createdAt || Date.now(),
    updatedAt: profileData?.UpdatedAt || profileData?.updatedAt || Date.now(),
  };
}

class CharacterService {
  public getLocalCache(): Character[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (c: Character) => c.id !== "aurelia" && c.id !== "solas" && c.id !== "lyra" && c.id !== "kaelen"
          );
          if (valid.length > 0) return sortCharactersByRarity(valid);
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }
    return [];
  }

  private setLocalCache(items: Character[]): void {
    if (typeof window === "undefined") return;
    try {
      const sorted = sortCharactersByRarity(items);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
    } catch {
      // Bỏ qua lỗi quota
    }
  }

  /**
   * Lấy danh sách tướng từ Firestore (sắp xếp theo phẩm chất từ cao xuống thấp):
   * - Document cha HeroConfigs/{heroId}: Lấy 16 thông số game cho Unity
   * - Subcollection HeroConfigs/{heroId}/Profile/info: Lấy ảnh R2, danh hiệu, kỹ năng...
   */
  async getCharacters(): Promise<Character[]> {
    const firestore = db;
    if (firestore) {
      try {
        // 1. Lấy toàn bộ 16 trường cấu hình từ Document cha HeroConfigs
        const primaryRef = collection(firestore, PRIMARY_COLLECTION);
        const snapshot = await getDocs(primaryRef);

        if (!snapshot.empty) {
          // 2. Lấy hồ sơ mở rộng từ Subcollection Profile/info
          const profileMap = new Map<string, any>();
          try {
            const groupSnap = await getDocs(collectionGroup(firestore, SUBCOLLECTION_NAME));
            groupSnap.forEach((d) => {
              const heroId = d.data().HeroId || d.ref.parent.parent?.id;
              if (heroId) {
                profileMap.set(heroId, d.data());
              }
            });
          } catch {
            // Fallback: Đọc trực tiếp subcollection của từng HeroId
            await Promise.all(
              snapshot.docs.map(async (docSnap) => {
                try {
                  const pSnap = await getDoc(
                    doc(firestore, PRIMARY_COLLECTION, docSnap.id, SUBCOLLECTION_NAME, SUBCOLLECTION_DOC)
                  );
                  if (pSnap.exists()) {
                    profileMap.set(docSnap.id, pSnap.data());
                  }
                } catch {
                  // Bỏ qua nếu hero chưa tạo subcollection
                }
              })
            );
          }

          // 3. Kết hợp thông số game từ Document cha và thông tin web từ Subcollection
          const list: Character[] = [];
          snapshot.forEach((d) => {
            const heroId = d.data().HeroId || d.id;
            const profileData = profileMap.get(heroId) || profileMap.get(d.id);
            list.push(mergeConfigAndProfile(heroId, d.data(), profileData));
          });

          const validList = list.filter(
            (c) => c.id !== "aurelia" && c.id !== "solas" && c.id !== "lyra" && c.id !== "kaelen"
          );
          const target = validList.length > 0 ? validList : list;
          const sortedList = sortCharactersByRarity(target);
          this.setLocalCache(sortedList);
          return sortedList;
        }

        // 3. Nếu HeroConfigs trống, trả về mảng rỗng
        return [];
      } catch (err) {
        console.warn("Lỗi khi tải HeroConfigs từ Firestore, sử dụng cache:", err);
      }
    }

    return this.getLocalCache();
  }

  /**
   * Đồng bộ danh sách tướng mẫu:
   * - Document cha HeroConfigs/{heroId}: CHỈ lưu đúng 16 trường thông số chiến đấu cho Unity Game Client
   * - Subcollection HeroConfigs/{heroId}/Profile/info: Lưu các trường mở rộng (ảnh, danh hiệu, cốt truyện, kỹ năng)
   */
  async seedInitialCharacters(performedBy = "Quản Trị Viên", performedByRole = "Admin"): Promise<void> {
    this.setLocalCache(CHARACTERS);
    const firestore = db;
    if (!firestore) return;

    for (const char of CHARACTERS) {
      const heroConfig = mapCharacterToHeroConfig(char);
      const heroProfile = mapCharacterToHeroProfile(char);

      // 1. Lưu CHÍNH XÁC 16 TRƯỜNG vào Document cha HeroConfigs
      const configRef = doc(firestore, PRIMARY_COLLECTION, heroConfig.HeroId);
      await setDoc(configRef, heroConfig);

      // 2. Lưu thông tin web vào Subcollection Profile/info
      try {
        const subRef = doc(firestore, PRIMARY_COLLECTION, heroConfig.HeroId, SUBCOLLECTION_NAME, SUBCOLLECTION_DOC);
        await setDoc(subRef, heroProfile, { merge: true });
      } catch (err) {
        console.warn("Lỗi lưu subcollection Profile ban đầu:", err);
      }
    }

    // Ghi nhật ký đồng bộ
    await logGameDataActivity(
      "SEED_CHARACTERS",
      "Đồng bộ danh sách nhân vật lên hệ thống máy chủ",
      `Đồng bộ cấu hình HeroConfigs và Subcollection Profile cho ${CHARACTERS.length} nhân vật mẫu.`,
      undefined,
      performedBy,
      performedByRole
    );
  }

  /**
   * Lấy chi tiết 1 tướng theo HeroId (kết hợp Document cha HeroConfigs & Subcollection Profile)
   */
  async getCharacterById(id: string): Promise<Character | null> {
    const firestore = db;
    if (firestore) {
      try {
        const docRef = doc(firestore, PRIMARY_COLLECTION, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          let profileData: any = null;
          try {
            const profileSnap = await getDoc(
              doc(firestore, PRIMARY_COLLECTION, id, SUBCOLLECTION_NAME, SUBCOLLECTION_DOC)
            );
            if (profileSnap.exists()) {
              profileData = profileSnap.data();
            }
          } catch {
            // Dùng mặc định nếu chưa có profile
          }
          return mergeConfigAndProfile(snap.id, snap.data(), profileData);
        }
      } catch {
        // Fallback local
      }
    }

    const localList = this.getLocalCache();
    return localList.find((c) => c.id === id) || null;
  }

  /**
   * Lưu hoặc Thêm mới tướng:
   * - Document cha HeroConfigs/{heroId}: Ghi đè CHÍNH XÁC 16 TRƯỜNG, TUYỆT ĐỐI KHÔNG thêm trường thừa
   * - Subcollection HeroConfigs/{heroId}/Profile/info: Lưu toàn bộ trường hiển thị web (ảnh R2, danh hiệu, kỹ năng, cốt truyện...)
   */
  async saveCharacter(
    character: Character,
    performedBy = "Quản Trị Viên",
    performedByRole = "Manager"
  ): Promise<Character> {
    const heroConfig = mapCharacterToHeroConfig(character);
    const heroProfile = mapCharacterToHeroProfile(character);
    const heroId = heroConfig.HeroId;
    const firestore = db;

    // Kiểm tra nhân vật đã tồn tại hay chưa để phân loại log
    const currentList = this.getLocalCache();
    const existingIndex = currentList.findIndex((c) => c.id === heroId);
    const isNew = existingIndex < 0;

    if (firestore) {
      // 1. Ghi CHÍNH XÁC 16 TRƯỜNG vào Document cha HeroConfigs (không dùng merge để loại bỏ mọi trường lạ cũ nếu có)
      const configDocRef = doc(firestore, PRIMARY_COLLECTION, heroId);
      await setDoc(configDocRef, heroConfig);

      // 2. Ghi toàn bộ trường mở rộng vào Subcollection HeroConfigs/{heroId}/Profile/info
      try {
        const subDocRef = doc(firestore, PRIMARY_COLLECTION, heroId, SUBCOLLECTION_NAME, SUBCOLLECTION_DOC);
        await setDoc(subDocRef, heroProfile, { merge: true });
      } catch (subErr) {
        console.warn("Lỗi khi ghi vào Subcollection Profile:", subErr);
      }
    }

    // 3. Cập nhật local cache
    const merged = mergeConfigAndProfile(heroId, heroConfig, heroProfile);
    if (!isNew) {
      currentList[existingIndex] = merged;
    } else {
      currentList.unshift(merged);
    }
    this.setLocalCache(currentList);

    // 4. Ghi Audit Log theo Rule 6
    await logGameDataActivity(
      isNew ? "CREATE_CHARACTER" : "UPDATE_CHARACTER",
      isNew
        ? `Khởi tạo chiến binh Valkyria [${character.name}]`
        : `Cập nhật hồ sơ Valkyria [${character.name}]`,
      isNew
        ? `Tạo mới nhân vật: Phẩm cấp ${character.rarityLabel || "R"}, Vai trò ${character.role || "Archer"}, HP ${character.baseHp || 900}, ATK ${character.baseAtk || 120}, DEF ${character.baseDef || 50}, SPD ${character.baseSpd || 100}.`
        : `Cập nhật thông số: HP ${character.baseHp}, ATK ${character.baseAtk}, DEF ${character.baseDef}, SPD ${character.baseSpd}. Cập nhật ${character.skills?.length || 0} kỹ năng.`,
      character,
      performedBy,
      performedByRole
    );

    return merged;
  }

  /**
   * Xóa một tướng khỏi cả HeroConfigs và Subcollection của nó
   */
  async deleteCharacter(
    id: string,
    characterName?: string,
    performedBy = "Quản Trị Viên",
    performedByRole = "Manager"
  ): Promise<boolean> {
    const firestore = db;
    const currentList = this.getLocalCache();
    const target = currentList.find((c) => c.id === id);
    const targetName = characterName || target?.name || id;

    if (firestore) {
      try {
        // Xóa subcollection document
        await deleteDoc(doc(firestore, PRIMARY_COLLECTION, id, SUBCOLLECTION_NAME, SUBCOLLECTION_DOC));
      } catch (err) {
        console.warn("Lỗi khi xóa Subcollection Profile:", err);
      }
      try {
        // Xóa document cha
        await deleteDoc(doc(firestore, PRIMARY_COLLECTION, id));
      } catch (err) {
        console.warn("Lỗi khi xóa Document cha HeroConfigs:", err);
      }
    }

    // Xóa khỏi local cache
    const filtered = currentList.filter((c) => c.id !== id);
    this.setLocalCache(filtered);

    // Ghi Audit Log
    await logGameDataActivity(
      "DELETE_CHARACTER",
      `Xóa chiến binh Valkyria [${targetName}] khỏi hệ thống`,
      `Đã xóa vĩnh viễn cấu hình thông số và hồ sơ web của nhân vật [${id}].`,
      target || { id, name: targetName },
      performedBy,
      performedByRole
    );

    return true;
  }

  /**
   * Đặt lại toàn bộ danh sách về mẫu gốc
   */
  async resetToDefaults(performedBy = "Quản Trị Viên", performedByRole = "Admin"): Promise<Character[]> {
    const sorted = sortCharactersByRarity(CHARACTERS);
    this.setLocalCache(sorted);
    await this.seedInitialCharacters(performedBy, performedByRole);

    await logGameDataActivity(
      "RESET_CHARACTERS",
      "Khôi phục danh sách nhân vật mẫu ban đầu",
      "Đặt lại toàn bộ danh sách Valkyria về các nhân vật mẫu mặc định.",
      undefined,
      performedBy,
      performedByRole
    );

    return sorted;
  }

  /**
   * Đọc danh sách lịch sử thao tác dữ liệu Game (Logs/GameData/Characters)
   * Kết hợp cả LocalStorage và Firestore để luôn hiển thị đầy đủ, không độ trễ
   */
  async getGameDataLogs(limitCount = 200): Promise<GameDataActivityLog[]> {
    const localLogs = getLocalLogsCache();
    const firestore = db;
    if (!firestore) return localLogs.slice(0, limitCount);

    try {
      const q = query(
        collection(firestore, "Logs", "GameData", "Characters"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const remoteLogs: GameDataActivityLog[] = [];
      snap.forEach((d) => {
        const data = d.data();
        remoteLogs.push({
          id: d.id,
          action: data.action || "UPDATE_CHARACTER",
          actionTitle: data.actionTitle || "Thao tác dữ liệu nhân vật",
          characterId: data.characterId || "",
          characterName: data.characterName || "",
          rarity: data.rarity || "",
          role: data.role || "",
          details: data.details || "",
          performedBy: data.performedBy || "Quản Trị Viên",
          performedByRole: data.performedByRole || "Manager",
          timestamp: data.timestamp || 0,
          createdAt: data.createdAt || "",
        });
      });

      // Hợp nhất dữ liệu Cloud và Local để không bao giờ bị mất log vừa tạo
      const map = new Map<string, GameDataActivityLog>();
      remoteLogs.forEach((l) => map.set(l.id, l));
      localLogs.forEach((l) => {
        if (!map.has(l.id)) map.set(l.id, l);
      });
      const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(merged.slice(0, 300)));
        } catch {}
      }
      return merged.slice(0, limitCount);
    } catch (err) {
      console.warn("Lỗi khi tải nhật ký Game Data từ Firestore, sử dụng cache cục bộ:", err);
      return localLogs.slice(0, limitCount);
    }
  }
}

export const characterService = new CharacterService();
