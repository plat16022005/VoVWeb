// Service hỗ trợ tải trực tiếp file lên Cloudflare R2 qua Presigned URL có thanh tiến trình
import { gachaService } from "./gacha.service";

export interface UploadResult {
  publicUrl: string;
  mediaType: "image" | "video";
  key: string;
}

async function putFileWithPresignedUrl(
  file: File,
  uploadUrl: string,
  onProgress?: (percent: number) => void,
  contentTypeOverride?: string
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader(
      "Content-Type",
      contentTypeOverride || file.type || "application/octet-stream"
    );

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(
          new Error(
            `Hệ thống lưu trữ ảnh từ chối tải lên (HTTP ${xhr.status}). Vui lòng kiểm tra cấu hình quyền hạn và CORS.`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          "Lỗi mạng khi tải file lên hệ thống lưu trữ. Vui lòng kiểm tra kết nối hoặc cấu hình CORS."
        )
      );
    };

    xhr.send(file);
  });
}

export async function uploadMediaToR2(
  file: File,
  onProgress?: (percent: number) => void,
  folder?: string
): Promise<UploadResult> {
  // 1. Gọi API nội bộ của Next.js để xin link Presigned URL tạm thời
  const presignRes = await fetch("/api/upload/r2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
      folder: folder || "characters",
    }),
  });

  if (!presignRes.ok) {
    const errData = await presignRes.json().catch(() => ({}));
    throw new Error(
      errData.error || `Lỗi lấy link tải lên (Mã ${presignRes.status}).`
    );
  }

  const { uploadUrl, publicUrl, key, mediaType } = await presignRes.json();

  if (!uploadUrl || !publicUrl) {
    throw new Error("Không nhận được link tải lên hợp lệ từ hệ thống lưu trữ.");
  }

  // 2. Tải trực tiếp file bằng XMLHttpRequest (để đo % tiến trình)
  await putFileWithPresignedUrl(file, uploadUrl, onProgress);

  return { publicUrl, mediaType, key };
}

/**
 * Tải ảnh Banner Gacha lên hệ thống lưu trữ qua Backend Presigned URL:
 * Toàn bộ kiểm tra định dạng (chặn .webp), kích thước (<= 10MB) và chữ ký được thực hiện tại Backend.
 */
export async function uploadGachaBannerImage(
  file: File,
  params: {
    seasonId: string;
    bannerId: string;
    imageKind: "main" | "tab";
  },
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const presigned = await gachaService.createMediaPresign({
    seasonId: params.seasonId,
    bannerId: params.bannerId,
    variant: params.imageKind,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    fileSize: file.size,
  });

  if (!presigned.uploadUrl || !presigned.publicUrl || !presigned.key) {
    throw new Error("Không nhận được thông tin tải lên hợp lệ từ máy chủ.");
  }

  await putFileWithPresignedUrl(
    file,
    presigned.uploadUrl,
    onProgress,
    presigned.contentType
  );

  return {
    publicUrl: presigned.publicUrl,
    mediaType: "image",
    key: presigned.key,
  };
}

/**
 * Dọn các ảnh tạm chưa lưu qua Backend API (Backend tự kiểm tra chống xóa nhầm ảnh đang dùng).
 */
export async function deleteGachaTempImages(keys: string[]): Promise<void> {
  const cleanKeys = Array.from(
    new Set(keys.map((k) => k?.trim()).filter((k): k is string => Boolean(k)))
  );
  if (cleanKeys.length === 0) return;

  try {
    await gachaService.cleanupTempMedia(cleanKeys);
  } catch (err) {
    console.warn("Không thể dọn ảnh tạm trên hệ thống lưu trữ:", err);
  }
}
