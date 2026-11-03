import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Các loại MIME được phép tải lên bài blog
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

function slugifyFileName(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "file";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Thiếu thông tin filename hoặc contentType." },
        { status: 400 }
      );
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType.toLowerCase());
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType.toLowerCase());

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            "Định dạng file không được hỗ trợ. Chỉ chấp nhận ảnh (JPG, PNG, WebP, GIF) hoặc video (MP4, WebM).",
        },
        { status: 400 }
      );
    }

    // Giới hạn dung lượng (Ảnh tối đa 20MB, Video tối đa 500MB)
    if (isImage && fileSize && fileSize > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ảnh không được vượt quá 20MB." },
        { status: 400 }
      );
    }
    if (isVideo && fileSize && fileSize > 500 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Video không được vượt quá 500MB." },
        { status: 400 }
      );
    }

    // Đọc thông tin cấu hình Cloudflare R2 từ biến môi trường
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain =
      process.env.R2_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json(
        {
          error:
            "Cloudflare R2 chưa được cấu hình đầy đủ. Vui lòng thêm R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME vào .env.local",
        },
        { status: 500 }
      );
    }

    // Khởi tạo S3Client kết nối tới Cloudflare R2
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Tạo đường dẫn lưu trữ có tổ chức: blogs/images/... hoặc blogs/videos/...
    const folder = isVideo ? "videos" : "images";
    const parts = filename.split(".");
    const ext = (parts.length > 1 ? parts.pop() : isVideo ? "mp4" : "png")?.toLowerCase();
    const baseName = slugifyFileName(parts.join("."));
    const key = `blogs/${folder}/${Date.now()}-${baseName}.${ext}`;

    // Sinh Presigned URL (có hiệu lực trong 5 phút để client tải trực tiếp lên R2)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Tạo link công khai để hiển thị trong bài viết
    const cleanDomain = publicDomain
      ? publicDomain.replace(/\/+$/, "")
      : `https://${bucketName}.${accountId}.r2.dev`;
    const publicUrl = `${cleanDomain}/${key}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
      mediaType: isVideo ? "video" : "image",
    });
  } catch (err) {
    console.error("Lỗi tạo Presigned URL cho Cloudflare R2:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi máy chủ nội bộ." },
      { status: 500 }
    );
  }
}

