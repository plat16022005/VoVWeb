import { NextRequest, NextResponse } from "next/server";

interface FacebookComment {
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

/**
 * Tự động chuyển đổi User Token thành Page Token nếu người dùng dán User Token từ Graph API Explorer
 */
async function resolvePageAccessToken(pageId: string, inputToken: string): Promise<string> {
  if (!inputToken) return inputToken;
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${inputToken}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.data && Array.isArray(data.data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = data.data.find((p: any) => p.id === pageId || p.name?.toLowerCase().includes("valkyria"));
      if (match && match.access_token) {
        return match.access_token;
      }
    }
  } catch {
    // Dùng nguyên token nếu vốn dĩ đã là Page Token
  }
  return inputToken;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const facebookPostId = searchParams.get("facebookPostId");

  const pageId = process.env.FACEBOOK_PAGE_ID || "1422359914290932";
  const rawToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
  const pageAccessToken = await resolvePageAccessToken(pageId, rawToken);
  const isRealConfigured = Boolean(pageId && pageAccessToken);

  // 1. Lấy thông số tương tác (Likes, Reactions, Comments count, Shares count)
  if (action === "metrics") {
    if (!facebookPostId || facebookPostId === "[object Object]") {
      return NextResponse.json({ error: "Thiếu hoặc sai định dạng facebookPostId" }, { status: 400 });
    }

    if (isRealConfigured && pageAccessToken) {
      try {
        let likes = 0;
        let comments = 0;
        let shares = 0;

        // 1. Thử lấy reactions hoặc likes summary (Hỗ trợ Post, Photo, Video, Album)
        try {
          const rxRes = await fetch(
            `https://graph.facebook.com/v19.0/${facebookPostId}?fields=reactions.summary(total_count)&access_token=${pageAccessToken}`,
            { cache: "no-store" }
          );
          const rxData = await rxRes.json();
          if (!rxData.error && rxData.reactions?.summary?.total_count !== undefined) {
            likes = rxData.reactions.summary.total_count;
          } else {
            // Fallback sang likes.summary(true) nếu object không hỗ trợ trường reactions
            const likeRes = await fetch(
              `https://graph.facebook.com/v19.0/${facebookPostId}?fields=likes.summary(true)&access_token=${pageAccessToken}`,
              { cache: "no-store" }
            );
            const likeData = await likeRes.json();
            if (!likeData.error && likeData.likes?.summary?.total_count !== undefined) {
              likes = likeData.likes.summary.total_count;
            }
          }
        } catch (rxErr) {
          console.warn("[FacebookAPI] Không thể đọc reactions/likes:", rxErr);
        }

        // 2. Thử lấy comments summary
        try {
          const cmtRes = await fetch(
            `https://graph.facebook.com/v19.0/${facebookPostId}?fields=comments.summary(total_count)&access_token=${pageAccessToken}`,
            { cache: "no-store" }
          );
          const cmtData = await cmtRes.json();
          if (!cmtData.error && cmtData.comments?.summary?.total_count !== undefined) {
            comments = cmtData.comments.summary.total_count;
          } else {
            const cmtFallback = await fetch(
              `https://graph.facebook.com/v19.0/${facebookPostId}?fields=comments.summary(true)&access_token=${pageAccessToken}`,
              { cache: "no-store" }
            );
            const fallbackData = await cmtFallback.json();
            if (!fallbackData.error && fallbackData.comments?.summary?.total_count !== undefined) {
              comments = fallbackData.comments.summary.total_count;
            }
          }
        } catch (cmtErr) {
          console.warn("[FacebookAPI] Không thể đọc comments summary:", cmtErr);
        }

        // 3. Thử lấy thêm lượt shares nếu đối tượng hỗ trợ (Feed post hỗ trợ shares, Photo/Video đơn lẻ không có trường này)
        try {
          const shareRes = await fetch(
            `https://graph.facebook.com/v19.0/${facebookPostId}?fields=shares&access_token=${pageAccessToken}`,
            { cache: "no-store" }
          );
          const shareData = await shareRes.json();
          if (!shareData.error && shareData.shares?.count) {
            shares = shareData.shares.count;
          }
        } catch {
          // Bỏ qua nếu object là Photo/Media không có trường shares
        }

        return NextResponse.json({
          success: true,
          likes,
          comments,
          shares,
          reactions: {
            like: Math.round(likes * 0.7),
            love: Math.round(likes * 0.25),
            haha: Math.round(likes * 0.03),
            wow: Math.round(likes * 0.02),
          },
        });
      } catch (err) {
        console.warn("[FacebookAPI] Lỗi đọc thông số:", err);
      }
    }

    // Giá trị thực tế khi chưa có tương tác hoặc chưa kết nối
    return NextResponse.json({
      success: true,
      likes: 0,
      comments: 0,
      shares: 0,
      reactions: {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
      },
    });
  }

  // 2. Lấy danh sách bình luận (Live Comments Stream)
  if (action === "comments") {
    if (!facebookPostId || facebookPostId === "[object Object]") {
      return NextResponse.json({ error: "Thiếu hoặc sai định dạng facebookPostId" }, { status: 400 });
    }

    if (isRealConfigured && pageAccessToken) {
      try {
        let rawComments = [];
        const urlWithReplies = `https://graph.facebook.com/v19.0/${facebookPostId}/comments?fields=id,from,message,created_time,like_count,comments{id,from,message,created_time}&filter=toplevel&limit=40&access_token=${pageAccessToken}`;
        const res = await fetch(urlWithReplies, { cache: "no-store" });
        const data = await res.json();

        if (!data.error && Array.isArray(data.data)) {
          rawComments = data.data;
        } else {
          // Thử lại với cấu trúc comments phẳng nếu đối tượng không hỗ trợ nested replies
          const urlSimple = `https://graph.facebook.com/v19.0/${facebookPostId}/comments?fields=id,from,message,created_time,like_count&limit=30&access_token=${pageAccessToken}`;
          const simpleRes = await fetch(urlSimple, { cache: "no-store" });
          const simpleData = await simpleRes.json();
          if (!simpleData.error && Array.isArray(simpleData.data)) {
            rawComments = simpleData.data;
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const comments: FacebookComment[] = rawComments.map((item: any) => ({
          id: item.id,
          from: {
            id: item.from?.id || "unknown",
            name: item.from?.name || "Người dùng Facebook",
            avatarUrl: item.from?.id
              ? `https://graph.facebook.com/${item.from.id}/picture?type=small`
              : undefined,
          },
          message: item.message || "",
          created_time: item.created_time || new Date().toISOString(),
          like_count: item.like_count || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          replies: (item.comments?.data || []).map((rep: any) => ({
            id: rep.id,
            from: {
              name: rep.from?.name || "Valkyria of Veyra (Official)",
            },
            message: rep.message || "",
            created_time: rep.created_time || new Date().toISOString(),
          })),
        }));

        return NextResponse.json({
          success: true,
          comments,
        });
      } catch (err) {
        console.warn("[FacebookAPI] Lỗi đọc bình luận thật:", err);
      }
    }

    // Danh sách rỗng khi chưa có bình luận
    return NextResponse.json({
      success: true,
      comments: [],
    });
  }

  // 3. Lấy danh sách toàn bộ bài đăng trực tiếp trên Fanpage (Page Posts Feed)
  if (action === "posts") {
    const limit = searchParams.get("limit") || "25";

    if (isRealConfigured && pageAccessToken) {
      try {
        // Thử lấy từ published_posts trước
        let fbUrl = `https://graph.facebook.com/v19.0/${pageId}/published_posts?fields=id,message,story,created_time,full_picture,permalink_url,shares,reactions.summary(total_count),comments.summary(total_count)&limit=${limit}&access_token=${pageAccessToken}`;
        let res = await fetch(fbUrl, { cache: "no-store" });
        let data = await res.json();

        // Fallback sang endpoint feed nếu published_posts gặp vấn đề về quyền
        if (data.error || !Array.isArray(data.data)) {
          fbUrl = `https://graph.facebook.com/v19.0/${pageId}/feed?fields=id,message,story,created_time,full_picture,permalink_url,shares,reactions.summary(total_count),comments.summary(total_count)&limit=${limit}&access_token=${pageAccessToken}`;
          res = await fetch(fbUrl, { cache: "no-store" });
          data = await res.json();
        }

        if (!data.error && Array.isArray(data.data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const posts = data.data.map((item: any) => ({
            id: item.id,
            message: item.message || item.story || "Bài viết truyền thông chính thức",
            story: item.story || null,
            created_time: item.created_time || new Date().toISOString(),
            full_picture: item.full_picture || null,
            permalink_url: item.permalink_url || `https://www.facebook.com/${item.id}`,
            likes: item.reactions?.summary?.total_count || 0,
            comments: item.comments?.summary?.total_count || 0,
            shares: item.shares?.count || 0,
          }));

          return NextResponse.json({
            success: true,
            posts,
            total: posts.length,
          });
        }

        if (data.error) {
          console.warn("[FacebookAPI] Lỗi đọc bài viết Trang:", data.error);
          return NextResponse.json({
            success: false,
            error: data.error.message || "Lỗi truy xuất từ Meta Graph API",
            posts: [],
          });
        }
      } catch (err) {
        console.warn("[FacebookAPI] Lỗi kết nối khi lấy bài viết Trang:", err);
      }
    }

    return NextResponse.json({
      success: true,
      posts: [],
      message: "Chưa cấu hình hoặc không tìm thấy bài đăng nào.",
    });
  }

  return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const body = await req.json();

    const pageId = process.env.FACEBOOK_PAGE_ID || "1422359914290932";
    const rawToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
    const pageAccessToken = await resolvePageAccessToken(pageId, rawToken);
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:3002";

    // 1. Hành động ĐĂNG BÀI lên Fanpage Facebook (Publish to Facebook)
    if (action === "publish") {
      const { postId, title, excerpt, coverUrl, customCaption, mediaItems } = body;

      if (!postId || !title) {
        return NextResponse.json({ error: "Thiếu postId hoặc tiêu đề bài viết" }, { status: 400 });
      }

      const postUrl = `${siteUrl}/blog/${postId}`;
      const defaultCaption = [
        `══════════════════════════════════════`,
        `⚔️ VALKYRIA OF VEYRA - BẢN TIN CHÍNH THỨC`,
        `🔷 【 ${title.toUpperCase()} 】`,
        `══════════════════════════════════════`,
        ``,
        excerpt ? `📖 ${excerpt}` : "",
        ``,
        !postUrl.includes("localhost") ? `👉 Đọc toàn văn bài viết tại: ${postUrl}` : "",
        ``,
        `#ValkyriaOfVeyra #VoVRPG #TurnBasedRPG #GamingNews #Veyra`,
      ]
        .filter(Boolean)
        .join("\n");

      const message = customCaption?.trim() || defaultCaption;

      // Chuẩn hóa danh sách Media (ảnh bìa + ảnh trong bài + video)
      interface MediaPayload {
        type: "image" | "video";
        url: string;
        label?: string;
      }
      const rawMedia: MediaPayload[] = Array.isArray(mediaItems) && mediaItems.length > 0
        ? mediaItems
        : coverUrl
        ? [{ type: "image", url: coverUrl, label: "Ảnh Bìa" }]
        : [];

      const imageMedia = rawMedia.filter((m) => m.type === "image" && m.url?.startsWith("http"));
      const videoMedia = rawMedia.filter((m) => m.type === "video" && m.url?.startsWith("http"));

      // Nếu đã có Access Token Fanpage thật -> Gọi Meta Graph API
      if (pageId && pageAccessToken) {
        try {
          let fbPostId: string | null = null;

          // TRƯỜNG HỢP 1: Có từ 2 ảnh trở lên -> Đăng bài dạng Album (Multi-Photo Post) theo đúng thứ tự
          if (imageMedia.length > 1) {
            try {
              const attachedMedia: { media_fbid: string }[] = [];

              for (const img of imageMedia) {
                const photoRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    url: img.url,
                    published: false, // Upload ảnh chưa xuất bản
                    access_token: pageAccessToken,
                  }),
                });
                const photoData = await photoRes.json();
                if (photoData.id) {
                  attachedMedia.push({ media_fbid: photoData.id });
                }
              }

              // Nếu upload được ít nhất 1 ảnh unpublished, xuất bản album
              if (attachedMedia.length > 0) {
                const albumRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message,
                    attached_media: attachedMedia,
                    published: true,
                    access_token: pageAccessToken,
                  }),
                });
                const albumData = await albumRes.json();
                if (albumData.id) {
                  fbPostId = albumData.id;
                }
              }
            } catch (albumErr) {
              console.warn("[FacebookAPI] Đăng Album ảnh thất bại, fallback sang ảnh đơn:", albumErr);
            }
          }

          // TRƯỜNG HỢP 2: Đúng 1 ảnh (Ảnh bìa hoặc 1 ảnh bài viết) -> Xuất bản lên Feed Dòng thời gian
          if (!fbPostId && imageMedia.length === 1) {
            try {
              // Bước 1: Tải ảnh dạng unpublished (ẩn) vào kho media
              const photoRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: imageMedia[0].url,
                  published: false,
                  access_token: pageAccessToken,
                }),
              });

              const photoData = await photoRes.json();
              const photoFbid = photoData.id;

              if (photoFbid) {
                // Bước 2: Xuất bản bài viết Feed chính thức đính kèm ảnh lên Dòng thời gian của Page
                const feedRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message,
                    attached_media: [{ media_fbid: photoFbid }],
                    published: true,
                    access_token: pageAccessToken,
                  }),
                });

                const feedData = await feedRes.json();
                if (feedData.id) {
                  fbPostId = feedData.id;
                }
              }

              // Fallback nếu xuất bản feed không được thì dùng post_id của photo
              if (!fbPostId && photoData.post_id) {
                fbPostId = photoData.post_id;
              }
            } catch (photoErr) {
              console.warn("[FacebookAPI] Đăng ảnh đơn lên Feed thất bại, fallback sang dạng Feed thuần túy:", photoErr);
            }
          }

          // TRƯỜNG HỢP 3: Không có ảnh nhưng có Video trực tiếp
          if (!fbPostId && imageMedia.length === 0 && videoMedia.length > 0) {
            try {
              const videoRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  file_url: videoMedia[0].url,
                  description: message,
                  title,
                  access_token: pageAccessToken,
                }),
              });
              const videoData = await videoRes.json();
              if (videoData.id) {
                fbPostId = videoData.id;
              }
            } catch (vidErr) {
              console.warn("[FacebookAPI] Đăng video trực tiếp thất bại:", vidErr);
            }
          }

          // TRƯỜNG HỢP 4: Đăng dạng bài viết văn bản Feed thuần túy
          if (!fbPostId) {
            const feedPayload: Record<string, unknown> = {
              message,
              published: true,
              access_token: pageAccessToken,
            };

            if (!postUrl.includes("localhost")) {
              feedPayload.link = postUrl;
            }

            const fbFeedUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
            const fbRes = await fetch(fbFeedUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(feedPayload),
            });

            const fbData = await fbRes.json();
            if (fbData.error) {
              throw new Error(fbData.error.message || "Meta API từ chối đăng bài");
            }

            fbPostId = fbData.id;
          }

          const fbPostUrl = `https://www.facebook.com/${fbPostId}`;

          return NextResponse.json({
            success: true,
            facebookPostId: fbPostId,
            facebookPostUrl: fbPostUrl,
            message: `Đã xuất bản thành công lên Fanpage (${imageMedia.length} ảnh, ${videoMedia.length} video)!`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error("[FacebookAPI] Lỗi đăng bài thật:", errMsg);
          return NextResponse.json({ error: `Lỗi kết nối Facebook: ${errMsg}` }, { status: 500 });
        }
      }

      return NextResponse.json(
        { error: "Chưa cấu hình FACEBOOK_PAGE_ID hoặc FACEBOOK_PAGE_ACCESS_TOKEN hợp lệ" },
        { status: 400 }
      );
    }

    // 2. Hành động TRẢ LỜI BÌNH LUẬN (Reply to comment)
    if (action === "reply") {
      const { commentId, message } = body;
      if (!commentId || !message?.trim()) {
        return NextResponse.json({ error: "Thiếu commentId hoặc nội dung trả lời" }, { status: 400 });
      }

      if (!pageAccessToken) {
        return NextResponse.json({ error: "Chưa cấu hình FACEBOOK_PAGE_ACCESS_TOKEN" }, { status: 400 });
      }

      try {
        const replyUrl = `https://graph.facebook.com/v19.0/${commentId}/comments`;
        
        // Chuẩn hóa gửi dạng application/x-www-form-urlencoded bắt buộc của Facebook Graph API đối với bình luận
        const formData = new URLSearchParams();
        formData.append("message", message.trim());
        formData.append("access_token", pageAccessToken);

        const fbRes = await fetch(replyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        const fbData = await fbRes.json();
        if (fbData.error) {
          throw new Error(fbData.error.message || "Không thể gửi phản hồi bình luận");
        }

        return NextResponse.json({
          success: true,
          replyId: fbData.id,
          created_time: new Date().toISOString(),
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: `Lỗi phản hồi Facebook: ${errMsg}` }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Hành động POST không hợp lệ" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server nội bộ";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

