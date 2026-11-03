import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export interface TermHistoryLog {
  id: string;
  version: string;
  note: string;
  updatedBy: string;
  updatedAt: string;
  timestamp: number;
  termCount: number;
}

export interface TermsConfig {
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  updatedBy?: string;
  title: string;
  summary: string;
  content: string; // Markdown / Text
}

export interface GameInfoConfig {
  gameTitle: string;
  slogan: string;
  currentVersion: string;
  unityBuild: string;
  forceUpdate: boolean;
  downloadPcUrl: string;
  downloadAndroidUrl: string;
  downloadIosUrl: string;
  discordUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
}

export interface SecurityConfig {
  allowRegistration: boolean;
  registrationMode: "open" | "closed_beta" | "maintenance";
  supportEmail: string;
  minPasswordLength: number;
}

export interface BannerConfig {
  enabled: boolean;
  message: string;
  type: "info" | "warning" | "danger" | "celebrate";
  actionText?: string;
  actionUrl?: string;
}

export const DEFAULT_TERMS: TermsConfig = {
  version: "1.0.0",
  effectiveDate: "2026-10-30",
  lastUpdated: "30/10/2026",
  title: "Điều Khoản Dịch Vụ & Hiệp Ước Đại Lục Veyra",
  summary: "Vui lòng đọc kỹ các điều khoản trước khi gia nhập đại lục Veyra và đồng hành cùng các Valkyria. Việc đăng ký tài khoản đồng nghĩa với việc bạn chấp thuận toàn bộ quy ước này.",
  content: `# ĐIỀU KHOẢN DỊCH VỤ VÀ HIỆP ƯỚC CHỈ HUY - VALKYRIA OF VEYRA

Chào mừng bạn đến với **Valkyria of Veyra** (sau đây gọi tắt là "Trò Chơi" hoặc "Hệ Thống"), tựa game Nhập Vai Chiến Thuật Theo Lượt (Turn-Based RPG).

Khi bạn tạo tài khoản, đăng nhập hoặc tham gia bất kỳ hoạt động nào trong trò chơi, bạn chính thức trở thành một **Chỉ Huy** và đồng ý chịu ràng buộc bởi các điều khoản dưới đây.

---

### 1. QUYỀN SỞ HỮU & TÀI KHOẢN CHỈ HUY
1.1. Mỗi Chỉ Huy chịu trách nhiệm hoàn toàn về việc bảo mật thông tin đăng nhập, mật khẩu và hòm thư liên kết.
1.2. Mọi tài khoản, nhân vật Valkyria, trang bị và vật phẩm ảo trong game đều thuộc quyền sở hữu trí tuệ của nhà phát hành Valkyria of Veyra. Người chơi được cấp quyền sử dụng dịch vụ phi thương mại.
1.3. Nghiêm cấm hành vi mua bán, trao đổi tài khoản bằng tiền mặt ngoài hệ thống chính thức. Mọi tranh chấp phát sinh từ việc chia sẻ hoặc mua bán tài khoản sẽ không được hỗ trợ giải quyết.

---

### 2. QUY TẮC ỨNG XỬ & CHỐNG GIAN LẬN (ANTI-CHEAT)
2.1. **Nghiêm cấm can thiệp**: Mọi hành vi sử dụng phần mềm thứ ba, can thiệp bộ nhớ, chỉnh sửa tệp tin cài đặt trò chơi, sử dụng auto/bot/macro không được cấp phép đều bị coi là vi phạm nghiêm trọng.
2.2. **Lợi dụng lỗi (Bug Abuse)**: Chỉ Huy phát hiện lỗ hổng hệ thống có nghĩa vụ thông báo cho Ban Quản Trị. Việc cố tình trục lợi từ lỗi game sẽ dẫn đến việc thu hồi vật phẩm hoặc khóa tài khoản vĩnh viễn (Perma-ban).
2.3. **Văn hóa cộng đồng**: Tôn trọng các Chỉ Huy khác. Nghiêm cấm phát ngôn thù địch, xúc phạm danh dự, truyền bá văn hóa phẩm đồi trụy hoặc lừa đảo trong các kênh chat thế giới và diễn đàn.

---

### 3. HỆ THỐNG TIỀN TỆ & TÍNH NĂNG TRIỆU HỒI (GACHA)
3.1. Các đơn vị tiền tệ ảo (như Tinh Thể Veyra, Vé Triệu Hồi Valkyria) được cung cấp thông qua nhiệm vụ hoặc nạp thẻ.
3.2. Tính năng Triệu Hồi Valkyria tuân thủ tỷ lệ xuất hiện ngẫu nhiên công khai. Mọi lượt triệu hồi khi đã thực hiện thành công sẽ không thể hoàn tác hoặc hoàn tiền.
3.3. Các trường hợp nạp tiền qua cổng thanh toán không chính thống hoặc nạp lậu / refund gian lận sẽ bị phong ấn tài khoản ngay lập tức cho đến khi bồi hoàn đầy đủ.

---

### 4. BẢO TRÌ & CẬP NHẬT MÁY CHỦ
4.1. Hệ thống có quyền tạm ngưng cung cấp dịch vụ định kỳ để bảo trì, cập nhật tính năng mới hoặc vá lỗi kỹ thuật. Lịch bảo trì sẽ được thông báo trước trên Trang Chủ và các kênh truyền thông chính thức.
4.2. Ban Quản Trị sẽ gửi thư đền bù tương ứng (Veyra Crystals, Năng Lượng) đến hòm thư của toàn thể Chỉ Huy sau mỗi đợt bảo trì.

---

### 5. SỬA ĐỔI ĐIỀU KHOẢN
5.1. Ban Quản Trị có quyền điều chỉnh nội dung Hiệp ước này để phù hợp với quy định pháp luật và định hướng phát triển của trò chơi.
5.2. Mọi thay đổi sẽ có hiệu lực kể từ ngày được công bố trên trang Cấu hình chính thức. Việc bạn tiếp tục tham gia trò chơi đồng nghĩa với việc chấp thuận các điều khoản sửa đổi.

*Ban Quản Trị Valkyria of Veyra trân trọng cảm ơn sự đồng hành của bạn trên hành trình thám hiểm đại lục Veyra!*`,
};

export const DEFAULT_GAME_INFO: GameInfoConfig = {
  gameTitle: "Valkyria of Veyra",
  slogan: "Khám phá đại lục Veyra huyền bí, sát cánh chiến đấu cùng các Valkyria kiêu hùng.",
  currentVersion: "v1.0.4",
  unityBuild: "v1.0.4 - Build #142",
  forceUpdate: false,
  downloadPcUrl: "https://vov.gg/download/client-pc-v1.0.4.exe",
  downloadAndroidUrl: "https://play.google.com/store/apps/details?id=com.vov.game",
  downloadIosUrl: "https://testflight.apple.com/join/vov2026",
  discordUrl: "https://discord.gg/valkyria-veyra",
  facebookUrl: "https://facebook.com/valkyriaofveyra",
  youtubeUrl: "https://youtube.com/@valkyriaofveyra",
};

export const DEFAULT_SECURITY: SecurityConfig = {
  allowRegistration: true,
  registrationMode: "open",
  supportEmail: "support@veyra.game",
  minPasswordLength: 6,
};

export const DEFAULT_BANNER: BannerConfig = {
  enabled: true,
  message: "Chiến dịch Thử Nghiệm Alpha Test đã chính thức khai mở trên đại lục Veyra! Đăng ký ngay để nhận 50 lượt Triệu Hồi Valkyria miễn phí.",
  type: "celebrate",
  actionText: "Khám Phá Ngay",
  actionUrl: "/login",
};

export interface TermItem {
  id: string; // e.g. "term01", "term02"
  Title: string;
  Content: string;
}

export const DEFAULT_TERMS_LIST: TermItem[] = [
  {
    id: "term01",
    Title: "Quyền Sở Hữu & Tài Khoản Chỉ Huy",
    Content: "Mỗi Chỉ Huy chịu trách nhiệm hoàn toàn về việc bảo mật thông tin đăng nhập, mật khẩu và hòm thư liên kết. Mọi tài khoản, nhân vật Valkyria, trang bị và vật phẩm ảo trong game đều thuộc quyền sở hữu trí tuệ của nhà phát hành Valkyria of Veyra (Turn-Based RPG). Nghiêm cấm hành vi mua bán, trao đổi tài khoản bằng tiền mặt ngoài hệ thống chính thức.",
  },
  {
    id: "term02",
    Title: "Quy Tắc Ứng Xử & Chống Gian Lận (Anti-Cheat)",
    Content: "Nghiêm cấm can thiệp bộ nhớ, chỉnh sửa tệp tin cài đặt trò chơi, sử dụng phần mềm thứ ba hoặc macro/bot không được cấp phép. Chỉ Huy phát hiện lỗi game có nghĩa vụ thông báo cho Ban Quản Trị, việc cố tình trục lợi từ lỗi game sẽ dẫn đến việc thu hồi vật phẩm hoặc khóa tài khoản vĩnh viễn.",
  },
  {
    id: "term03",
    Title: "Hệ Thống Tiền Tệ & Tính Năng Triệu Hồi (Gacha)",
    Content: "Các đơn vị tiền tệ ảo (Tinh Thể Veyra, Vé Triệu Hồi Valkyria) được cung cấp thông qua nhiệm vụ hoặc nạp thẻ. Tính năng Triệu Hồi Valkyria tuân thủ tỷ lệ xuất hiện ngẫu nhiên công khai. Mọi lượt triệu hồi khi đã thực hiện thành công sẽ không thể hoàn tác hoặc hoàn tiền.",
  },
  {
    id: "term04",
    Title: "Bảo Trì Máy Chủ & Sửa Đổi Điều Khoản",
    Content: "Hệ thống có quyền tạm ngưng cung cấp dịch vụ định kỳ để bảo trì, cập nhật tính năng mới hoặc vá lỗi kỹ thuật. Ban Quản Trị có quyền điều chỉnh nội dung các điều khoản này để phù hợp với quy định và định hướng phát triển của trò chơi.",
  },
];

export const DEFAULT_POLICY_LIST: TermItem[] = [
  {
    id: "policy01",
    Title: "Thu Thập & Sử Dụng Dữ Liệu Chỉ Huy",
    Content: "Chúng tôi chỉ thu thập thông tin tối thiểu cần thiết để vận hành tài khoản Chỉ Huy và lưu trữ tiến trình game (bao gồm Email, Tên nhân vật, Dữ liệu chiến dịch thám hiểm Veyra). Mọi dữ liệu không bao giờ được cung cấp cho bên thứ ba cho mục đích thương mại trái phép.",
  },
  {
    id: "policy02",
    Title: "Bảo Mật Thông Tin & Mã Hóa Dữ Liệu",
    Content: "Toàn bộ mật khẩu và phiên đăng nhập được mã hóa theo tiêu chuẩn quốc tế an toàn cao. Hệ thống giám sát tự động 24/7 nhằm phát hiện và ngăn chặn các hành vi tấn công mạng hoặc đánh cắp tài khoản.",
  },
  {
    id: "policy03",
    Title: "Chính Sách Hoàn Tiền & Giao Dịch Nạp Thẻ",
    Content: "Mọi giao dịch mua Tinh Thể Veyra hoặc vật phẩm ảo khi đã chuyển giao thành công vào hòm thư tài khoản game sẽ không áp dụng chính sách hoàn trả, ngoại trừ các lỗi kỹ thuật phát sinh từ cổng thanh toán chính thống.",
  },
  {
    id: "policy04",
    Title: "Quyền Riêng Tư Của Trẻ Em & Vị Thành Niên",
    Content: "Người chơi dưới độ tuổi quy định theo pháp luật địa phương cần có sự đồng ý của phụ huynh hoặc người giám hộ hợp pháp trước khi đăng ký tài khoản hoặc thực hiện giao dịch thanh toán trong trò chơi.",
  },
];

const SYSTEM_CONFIG_COL = "SystemConfig";

export const settingsService = {
  // ==========================================
  // 1. Quản lý Điều khoản dịch vụ (GameConfig / Terms)
  // ==========================================
  async getTermsList(): Promise<TermItem[]> {
    if (!db) return DEFAULT_TERMS_LIST;
    try {
      const snap = await getDoc(doc(db, "GameConfig", "Terms"));
      if (snap.exists()) {
        const data = snap.data();
        const items: TermItem[] = [];
        Object.keys(data).forEach((key) => {
          const val = data[key];
          if (val && typeof val === "object" && ("Title" in val || "Content" in val)) {
            items.push({
              id: key,
              Title: typeof val.Title === "string" ? val.Title : "",
              Content: typeof val.Content === "string" ? val.Content : "",
            });
          }
        });
        // Sắp xếp tự nhiên theo id: term01, term02, term03...
        items.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" }));
        if (items.length > 0) return items;
      }
      return DEFAULT_TERMS_LIST;
    } catch (err) {
      console.warn("Lỗi đọc cấu hình Terms từ GameConfig/Terms, dùng mặc định:", err);
      return DEFAULT_TERMS_LIST;
    }
  },

  async getTermsHistory(): Promise<TermHistoryLog[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "Logs", "Term&Policy", "Term"),
        orderBy("timestamp", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);
      const list: TermHistoryLog[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          version: data.version || "1.0",
          note: data.note || "",
          updatedBy: data.updatedBy || "Admin",
          updatedAt: data.updatedAt || "",
          timestamp: data.timestamp || 0,
          termCount: data.termCount || 0,
        });
      });
      return list;
    } catch (err) {
      console.warn("Lỗi đọc nhật ký từ Logs/Term&Policy/Term:", err);
      return [];
    }
  },

  async saveTermsList(
    items: TermItem[],
    meta?: { version: string; note: string; updatedBy?: string }
  ): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");
    const docRef = doc(db, "GameConfig", "Terms");
    const payload: Record<string, { Title: string; Content: string }> = {};

    items.forEach((item, index) => {
      // Tự động chuẩn hóa mã theo đúng thứ tự mảng: term01, term02... để bảo toàn 100% thứ tự
      const cleanId = `term${String(index + 1).padStart(2, "0")}`;
      payload[cleanId] = {
        Title: item.Title || "",
        Content: item.Content || "",
      };
    });

    // 1. Ghi đè toàn bộ tài liệu Terms
    await setDoc(docRef, payload);

    // 2. Ghi nhật ký vào Logs/Term&Policy/Term
    if (meta) {
      try {
        const logId = `term_${Date.now()}`;
        const logDocRef = doc(db, "Logs", "Term&Policy", "Term", logId);
        await setDoc(logDocRef, {
          action: "UPDATE_TERMS",
          title: "Cập nhật Điều Khoản Dịch Vụ",
          version: meta.version || "v1.0",
          note: meta.note || "Cập nhật điều khoản dịch vụ",
          updatedBy: meta.updatedBy || auth?.currentUser?.email || "Admin",
          updatedAt: new Date().toLocaleString("vi-VN"),
          timestamp: Date.now(),
          termCount: items.length,
        });
      } catch (hErr) {
        console.warn("Lưu nhật ký vào Logs/Term&Policy/Term không thành công:", hErr);
      }
    }
  },

  // ==========================================
  // 2. Quản lý Chính Sách & Quyền Riêng Tư (GameConfig / Policy)
  // ==========================================
  async getPolicyList(): Promise<TermItem[]> {
    if (!db) return DEFAULT_POLICY_LIST;
    try {
      const snap = await getDoc(doc(db, "GameConfig", "Policy"));
      if (snap.exists()) {
        const data = snap.data();
        const items: TermItem[] = [];
        Object.keys(data).forEach((key) => {
          const val = data[key];
          if (val && typeof val === "object" && ("Title" in val || "Content" in val)) {
            items.push({
              id: key,
              Title: typeof val.Title === "string" ? val.Title : "",
              Content: typeof val.Content === "string" ? val.Content : "",
            });
          }
        });
        // Sắp xếp tự nhiên theo id: policy01, policy02...
        items.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" }));
        if (items.length > 0) return items;
      }
      return DEFAULT_POLICY_LIST;
    } catch (err) {
      console.warn("Lỗi đọc cấu hình Policy từ GameConfig/Policy, dùng mặc định:", err);
      return DEFAULT_POLICY_LIST;
    }
  },

  async getPolicyHistory(): Promise<TermHistoryLog[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "Logs", "Term&Policy", "Policy"),
        orderBy("timestamp", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);
      const list: TermHistoryLog[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          version: data.version || "1.0",
          note: data.note || "",
          updatedBy: data.updatedBy || "Admin",
          updatedAt: data.updatedAt || "",
          timestamp: data.timestamp || 0,
          termCount: data.termCount || 0,
        });
      });
      return list;
    } catch (err) {
      console.warn("Lỗi đọc nhật ký từ Logs/Term&Policy/Policy:", err);
      return [];
    }
  },

  async savePolicyList(
    items: TermItem[],
    meta?: { version: string; note: string; updatedBy?: string }
  ): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");
    const docRef = doc(db, "GameConfig", "Policy");
    const payload: Record<string, { Title: string; Content: string }> = {};

    items.forEach((item, index) => {
      // Tự động chuẩn hóa mã theo đúng thứ tự mảng: policy01, policy02... để bảo toàn 100% thứ tự
      const cleanId = `policy${String(index + 1).padStart(2, "0")}`;
      payload[cleanId] = {
        Title: item.Title || "",
        Content: item.Content || "",
      };
    });

    // 1. Ghi đè toàn bộ tài liệu Policy
    await setDoc(docRef, payload);

    // 2. Ghi nhật ký vào Logs/Term&Policy/Policy
    if (meta) {
      try {
        const logId = `policy_${Date.now()}`;
        const logDocRef = doc(db, "Logs", "Term&Policy", "Policy", logId);
        await setDoc(logDocRef, {
          action: "UPDATE_POLICY",
          title: "Cập nhật Chính Sách & Quyền Riêng Tư",
          version: meta.version || "v1.0",
          note: meta.note || "Cập nhật chính sách dịch vụ",
          updatedBy: meta.updatedBy || auth?.currentUser?.email || "Admin",
          updatedAt: new Date().toLocaleString("vi-VN"),
          timestamp: Date.now(),
          termCount: items.length,
        });
      } catch (hErr) {
        console.warn("Lưu nhật ký vào Logs/Term&Policy/Policy không thành công:", hErr);
      }
    }
  },

  // Phương thức tương thích ngược getTerms
  async getTerms(): Promise<TermsConfig> {
    const list = await this.getTermsList();
    const formattedContent = list
      .map((item, idx) => `### ${idx + 1}. ${item.Title.toUpperCase()}\n${item.Content}`)
      .join("\n\n---\n\n");
    return {
      ...DEFAULT_TERMS,
      content: formattedContent,
    };
  },

  // 2. Thông tin Game & Link Tải
  async getGameInfo(): Promise<GameInfoConfig> {
    if (!db) return DEFAULT_GAME_INFO;
    try {
      const snap = await getDoc(doc(db, SYSTEM_CONFIG_COL, "gameInfo"));
      if (snap.exists()) {
        return { ...DEFAULT_GAME_INFO, ...snap.data() } as GameInfoConfig;
      }
      return DEFAULT_GAME_INFO;
    } catch {
      return DEFAULT_GAME_INFO;
    }
  },

  async updateGameInfo(data: Partial<GameInfoConfig>): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");
    const docRef = doc(db, SYSTEM_CONFIG_COL, "gameInfo");
    await setDoc(docRef, data, { merge: true });
  },

  // 3. Cổng Đăng Ký & Bảo Mật
  async getSecurity(): Promise<SecurityConfig> {
    if (!db) return DEFAULT_SECURITY;
    try {
      const snap = await getDoc(doc(db, SYSTEM_CONFIG_COL, "security"));
      if (snap.exists()) {
        return { ...DEFAULT_SECURITY, ...snap.data() } as SecurityConfig;
      }
      return DEFAULT_SECURITY;
    } catch {
      return DEFAULT_SECURITY;
    }
  },

  async updateSecurity(data: Partial<SecurityConfig>): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");
    const docRef = doc(db, SYSTEM_CONFIG_COL, "security");
    await setDoc(docRef, data, { merge: true });
  },

  // 4. Biểu ngữ Thông Báo Website
  async getBanner(): Promise<BannerConfig> {
    if (!db) return DEFAULT_BANNER;
    try {
      const snap = await getDoc(doc(db, SYSTEM_CONFIG_COL, "banner"));
      if (snap.exists()) {
        return { ...DEFAULT_BANNER, ...snap.data() } as BannerConfig;
      }
      return DEFAULT_BANNER;
    } catch {
      return DEFAULT_BANNER;
    }
  },

  async updateBanner(data: Partial<BannerConfig>): Promise<void> {
    if (!db) throw new Error("Chưa kết nối được Firebase Firestore.");
    const docRef = doc(db, SYSTEM_CONFIG_COL, "banner");
    await setDoc(docRef, data, { merge: true });
  },
};
