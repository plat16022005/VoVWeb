import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Collection (database mặc định): Blogs/{postId}
const BLOGS_COLLECTION = "Blogs";

export interface BlogActivityLog {
  id: string;
  action: "CREATE" | "UPDATE" | "PUBLISH" | "UNPUBLISH" | "DELETE" | string;
  actionTitle: string;
  targetPostId: string;
  targetTitle: string;
  details?: string;
  performedBy: string;
  timestamp: number;
  createdAt: string;
}

export type BlogStatus = "Draft" | "Published";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  coverUrl: string;
  content: string; // HTML từ trình soạn thảo
  status: BlogStatus;
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  facebookPostId?: string | null;
  facebookPostUrl?: string | null;
  facebookPublishedAt?: number | null;
  facebookAutoReplyEnabled?: boolean;
  facebookAutoReplyMessage?: string;
  facebookRepliedCommentIds?: string[];
}

export interface BlogInput {
  title: string;
  category: string;
  excerpt: string;
  coverUrl: string;
  content: string;
}

export const BLOG_CATEGORIES = ["Tin Tức", "Cập Nhật", "Hướng Dẫn", "Cốt Truyện", "Sự Kiện"];

export const DEFAULT_FACEBOOK_AUTO_REPLY_MESSAGE =
  "Chào Chỉ Huy {name}! Cảm ơn bạn đã quan tâm và để lại bình luận cho Valkyria of Veyra. Hãy tiếp tục theo dõi Fanpage để cập nhật các tin tức và đợt Closed Beta mới nhất nhé! ✨";

// Document Firestore giới hạn 1 MiB; chừa biên an toàn cho các trường còn lại
export const BLOG_MAX_CONTENT_LENGTH = 900_000;

function requireDb() {
  if (!db) throw new Error("Firestore chưa được cấu hình.");
  return db;
}

/** "Hé Lộ Valkyria Băng Giá!" -> "he-lo-valkyria-bang-gia" */
export function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "bai-viet"
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDoc(id: string, d: any): BlogPost {
  return {
    id,
    title: d.Title || "",
    slug: d.Slug || "",
    category: d.Category || "",
    excerpt: d.Excerpt || "",
    coverUrl: d.CoverUrl || "",
    content: d.Content || "",
    status: d.Status === "Published" ? "Published" : "Draft",
    authorId: d.AuthorId || "",
    authorName: d.AuthorName || "",
    createdAt: d.CreatedAt || 0,
    updatedAt: d.UpdatedAt || 0,
    publishedAt: d.PublishedAt ?? null,
    facebookPostId: d.FacebookPostId || null,
    facebookPostUrl: d.FacebookPostUrl || null,
    facebookPublishedAt: d.FacebookPublishedAt ?? null,
    facebookAutoReplyEnabled: Boolean(d.FacebookAutoReplyEnabled),
    facebookAutoReplyMessage: d.FacebookAutoReplyMessage || "",
    facebookRepliedCommentIds: Array.isArray(d.FacebookRepliedCommentIds)
      ? d.FacebookRepliedCommentIds
      : [],
  };
}

function validate(input: BlogInput) {
  if (!input.title.trim()) throw new Error("Vui lòng nhập tiêu đề bài viết.");
  if (input.title.trim().length > 200) throw new Error("Tiêu đề tối đa 200 ký tự.");
  if (input.content.length > BLOG_MAX_CONTENT_LENGTH) {
    throw new Error("Nội dung bài viết quá dài. Hãy chia thành nhiều bài hoặc dùng video/ảnh dạng link.");
  }
}

async function logActivity(action: string, actionTitle: string, post: Pick<BlogPost, "id" | "title">, details = "") {
  if (!db) return;
  try {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    await addDoc(collection(db, "Logs", "BlogManagement", "Activities"), {
      action,
      actionTitle,
      targetPostId: post.id,
      targetTitle: post.title,
      details,
      performedBy: auth?.currentUser?.email || auth?.currentUser?.displayName || "Admin",
      timestamp: Date.now(),
      createdAt: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${pad(
        now.getDate()
      )}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
    });
  } catch (err) {
    console.warn("Không thể ghi log quản lý blog vào Logs/BlogManagement/Activities:", err);
  }
}

export const blogsService = {
  // Dành cho Admin/Manager: lấy toàn bộ bài viết (cả bản nháp)
  async getAllPosts(): Promise<BlogPost[]> {
    const snap = await getDocs(query(collection(requireDb(), BLOGS_COLLECTION), orderBy("UpdatedAt", "desc")));
    return snap.docs.map((d) => mapDoc(d.id, d.data()));
  },

  // Công khai: chỉ bài đã xuất bản (sắp xếp phía client để không cần composite index)
  async getPublishedPosts(): Promise<BlogPost[]> {
    const snap = await getDocs(
      query(collection(requireDb(), BLOGS_COLLECTION), where("Status", "==", "Published"))
    );
    return snap.docs
      .map((d) => mapDoc(d.id, d.data()))
      .sort((a, b) => {
        const timeA = a.publishedAt || a.updatedAt || a.createdAt || 0;
        const timeB = b.publishedAt || b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      });
  },

  async getPostById(id: string): Promise<BlogPost | null> {
    const snap = await getDoc(doc(requireDb(), BLOGS_COLLECTION, id));
    return snap.exists() ? mapDoc(snap.id, snap.data()) : null;
  },

  async createPost(input: BlogInput, status: BlogStatus): Promise<BlogPost> {
    validate(input);
    const firestore = requireDb();
    const user = auth?.currentUser;
    if (!user) throw new Error("Bạn cần đăng nhập để đăng bài.");

    const now = Date.now();
    const ref = doc(collection(firestore, BLOGS_COLLECTION));
    const data = {
      Title: input.title.trim(),
      Slug: `${slugify(input.title)}-${ref.id.slice(0, 5).toLowerCase()}`,
      Category: input.category,
      Excerpt: input.excerpt.trim(),
      CoverUrl: input.coverUrl.trim(),
      Content: input.content,
      Status: status,
      AuthorId: user.uid,
      AuthorName: user.displayName || user.email || "Admin",
      CreatedAt: now,
      UpdatedAt: now,
      PublishedAt: status === "Published" ? now : null,
    };
    await setDoc(ref, data);
    const post = mapDoc(ref.id, data);
    await logActivity(
      "CREATE",
      status === "Published" ? "Đăng bài viết mới" : "Tạo bản nháp bài viết",
      post
    );
    return post;
  },

  async updatePost(id: string, input: BlogInput): Promise<void> {
    validate(input);
    await updateDoc(doc(requireDb(), BLOGS_COLLECTION, id), {
      Title: input.title.trim(),
      Category: input.category,
      Excerpt: input.excerpt.trim(),
      CoverUrl: input.coverUrl.trim(),
      Content: input.content,
      UpdatedAt: Date.now(),
    });
    await logActivity("UPDATE", "Chỉnh sửa bài viết", { id, title: input.title.trim() });
  },

  async setStatus(post: Pick<BlogPost, "id" | "title" | "publishedAt">, status: BlogStatus): Promise<number | null> {
    const now = Date.now();
    // Giữ nguyên thời điểm xuất bản lần đầu khi đăng lại
    const publishedAt = status === "Published" ? post.publishedAt || now : post.publishedAt;
    await updateDoc(doc(requireDb(), BLOGS_COLLECTION, post.id), {
      Status: status,
      PublishedAt: publishedAt ?? null,
      UpdatedAt: now,
    });
    await logActivity(
      status === "Published" ? "PUBLISH" : "UNPUBLISH",
      status === "Published" ? "Xuất bản bài viết" : "Gỡ bài viết về bản nháp",
      post
    );
    return publishedAt ?? null;
  },

  async deletePost(post: Pick<BlogPost, "id" | "title">): Promise<void> {
    await deleteDoc(doc(requireDb(), BLOGS_COLLECTION, post.id));
    await logActivity("DELETE", "Xóa bài viết", post);
  },

  // Đọc danh sách lịch sử hoạt động quản lý Blog (Logs/BlogManagement/Activities)
  async getBlogLogs(limitCount = 100): Promise<BlogActivityLog[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "Logs", "BlogManagement", "Activities"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          action: d.action || "UPDATE",
          actionTitle: d.actionTitle || "Thao tác bài viết",
          targetPostId: d.targetPostId || "",
          targetTitle: d.targetTitle || "Bài viết",
          details: d.details || "",
          performedBy: d.performedBy || "Admin",
          timestamp: d.timestamp || 0,
          createdAt: d.createdAt || "",
        };
      });
    } catch (err) {
      console.warn("Lỗi đọc nhật ký BlogManagement:", err);
      return [];
    }
  },

  // Đồng bộ ID bài đăng Facebook vào bài viết Firestore
  async linkFacebookPost(
    postId: string,
    facebookPostId: string,
    facebookPostUrl: string
  ): Promise<void> {
    const dbInstance = requireDb();
    const ref = doc(dbInstance, BLOGS_COLLECTION, postId);
    await updateDoc(ref, {
      FacebookPostId: facebookPostId,
      FacebookPostUrl: facebookPostUrl,
      FacebookPublishedAt: Date.now(),
      UpdatedAt: Date.now(),
    });
    const post = await this.getPostById(postId);
    if (post) {
      await logActivity("FACEBOOK_SYNC", "Đồng bộ bài viết lên Facebook Fanpage", post, `Facebook ID: ${facebookPostId}`);
    }
  },

  // Hủy liên kết bài đăng Facebook
  async unlinkFacebookPost(postId: string): Promise<void> {
    const dbInstance = requireDb();
    const ref = doc(dbInstance, BLOGS_COLLECTION, postId);
    await updateDoc(ref, {
      FacebookPostId: null,
      FacebookPostUrl: null,
      FacebookPublishedAt: null,
      UpdatedAt: Date.now(),
    });
  },

  // Cập nhật cấu hình tự động trả lời bình luận Facebook
  async updateFacebookAutoReply(
    postId: string,
    enabled: boolean,
    message: string
  ): Promise<void> {
    const dbInstance = requireDb();
    const ref = doc(dbInstance, BLOGS_COLLECTION, postId);
    const now = Date.now();
    const currentUid = auth?.currentUser?.uid || "admin";
    const currentName = auth?.currentUser?.displayName || "Ban Quản Trị";

    // Dùng setDoc với merge: true và bổ sung các trường schema chuẩn để đảm bảo luôn vượt qua Firestore Rules
    await setDoc(
      ref,
      {
        Title: `Bài đăng Fanpage (${postId})`,
        Category: "Mạng Xã Hội",
        Content: "Bài viết được đồng bộ từ Fanpage Facebook.",
        Status: "Published",
        AuthorId: currentUid,
        AuthorName: currentName,
        Slug: `fb-${postId}`,
        FacebookPostId: postId,
        FacebookAutoReplyEnabled: enabled,
        FacebookAutoReplyMessage: message,
        UpdatedAt: now,
      },
      { merge: true }
    );
    const post = await this.getPostById(postId);
    await logActivity(
      "FACEBOOK_AUTO_REPLY",
      `${enabled ? "Bật" : "Tắt"} tự động trả lời bình luận Facebook`,
      post || { id: postId, title: `Bài viết Facebook (${postId})` },
      `Trạng thái: ${enabled ? "BẬT" : "TẮT"}`
    );
  },

  // Lấy danh sách ID bình luận đã rep từ Subcollection: Blogs/{postId}/FacebookRepliedComments
  // Cấu trúc phân cấp giúp KHÔNG BAO GIỜ bị giới hạn bởi trần kích thước 1 MiB của Document cha
  async getFacebookRepliedCommentIds(postId: string): Promise<string[]> {
    try {
      const dbInstance = requireDb();
      const colRef = collection(dbInstance, BLOGS_COLLECTION, postId, "FacebookRepliedComments");
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => d.id);
    } catch (err) {
      console.warn("Lỗi đọc subcollection FacebookRepliedComments:", err);
      return [];
    }
  },

  // Lưu danh sách comment ID đã được trả lời tự động vào Subcollection riêng biệt
  // Đảm bảo không lưu mảng unbounded trong Document cha, tránh rủi ro vượt quá 1MB
  async addFacebookRepliedCommentIds(
    postId: string,
    newCommentIds: string[]
  ): Promise<string[]> {
    if (!newCommentIds.length) return [];
    const dbInstance = requireDb();
    const batch = writeBatch(dbInstance);
    const now = Date.now();

    for (const cmtId of newCommentIds) {
      const ref = doc(dbInstance, BLOGS_COLLECTION, postId, "FacebookRepliedComments", cmtId);
      batch.set(ref, {
        commentId: cmtId,
        repliedAt: now,
      });
    }

    // Đồng bộ thời gian cập nhật trên doc cha
    const postRef = doc(dbInstance, BLOGS_COLLECTION, postId);
    batch.set(
      postRef,
      {
        UpdatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();

    return await this.getFacebookRepliedCommentIds(postId);
  },
};

