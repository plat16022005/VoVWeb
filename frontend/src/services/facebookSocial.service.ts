export interface FacebookMetrics {
  likes: number;
  comments: number;
  shares: number;
  reactions: {
    like: number;
    love: number;
    haha: number;
    wow: number;
  };
  isDemo?: boolean;
}

export interface FacebookCommentItem {
  id: string;
  from: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  message: string;
  created_time: string;
  like_count: number;
  replies?: {
    id: string;
    from: { name: string; avatarUrl?: string };
    message: string;
    created_time: string;
  }[];
}

export interface FacebookFeedPost {
  id: string;
  message: string;
  story?: string | null;
  created_time: string;
  full_picture?: string | null;
  permalink_url: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface PublishToFacebookParams {
  postId: string;
  title: string;
  excerpt: string;
  coverUrl?: string;
  contentHtml?: string;
  customCaption?: string;
  mediaItems?: {
    type: "image" | "video";
    url: string;
    label?: string;
  }[];
}

export const facebookSocialService = {
  /**
   * Đăng bài viết lên Fanpage Facebook qua Backend Route
   */
  async publishPost(params: PublishToFacebookParams): Promise<{
    success: boolean;
    facebookPostId: string;
    facebookPostUrl: string;
    isDemo?: boolean;
    message: string;
  }> {
    const res = await fetch("/api/social/facebook?action=publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "Không thể đăng bài lên Facebook");
    }

    return data;
  },

  /**
   * Lấy số liệu tương tác (Reactions, Comments, Shares)
   */
  async getMetrics(facebookPostId: string): Promise<FacebookMetrics> {
    const res = await fetch(
      `/api/social/facebook?action=metrics&facebookPostId=${encodeURIComponent(facebookPostId)}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "Không thể lấy thông số tương tác Facebook");
    }
    return data;
  },

  /**
   * Lấy danh sách bình luận mới nhất từ Facebook
   */
  async getComments(facebookPostId: string): Promise<{
    isDemo: boolean;
    comments: FacebookCommentItem[];
  }> {
    const res = await fetch(
      `/api/social/facebook?action=comments&facebookPostId=${encodeURIComponent(facebookPostId)}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "Không thể tải bình luận Facebook");
    }
    return {
      isDemo: data.isDemo,
      comments: data.comments || [],
    };
  },

  /**
   * Trả lời một bình luận trực tiếp dưới danh nghĩa Fanpage
   */
  async replyComment(commentId: string, message: string): Promise<{
    success: boolean;
    replyId: string;
    isDemo: boolean;
  }> {
    const res = await fetch("/api/social/facebook?action=reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, message }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "Không thể gửi phản hồi bình luận");
    }
    return data;
  },

  /**
   * Lấy danh sách toàn bộ bài đăng trực tiếp trên Fanpage
   */
  async getPagePosts(limit = 25): Promise<{
    success: boolean;
    posts: FacebookFeedPost[];
    total?: number;
    error?: string;
  }> {
    const res = await fetch(`/api/social/facebook?action=posts&limit=${limit}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "Không thể lấy danh sách bài viết từ Fanpage");
    }
    return data;
  },
};

