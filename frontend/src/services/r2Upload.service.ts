// Service hỗ trợ tải trực tiếp file lên Cloudflare R2 qua Presigned URL có thanh tiến trình

export interface UploadResult {
  publicUrl: string;
  mediaType: "image" | "video";
  key: string;
}

export async function uploadMediaToR2(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  // 1. Gọi API nội bộ của Next.js để xin link Presigned URL tạm thời
  const presignRes = await fetch("/api/upload/r2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
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
    throw new Error("Không nhận được link tải lên hợp lệ từ Cloudflare R2.");
  }

  // 2. Tải trực tiếp file lên Cloudflare R2 bằng XMLHttpRequest (để đo % tiến trình)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

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
            `Cloudflare R2 từ chối upload (HTTP ${xhr.status}). Vui lòng kiểm tra quyền hạn của R2 Token và cấu hình CORS.`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          "Lỗi mạng khi tải file lên Cloudflare R2. Nếu là lỗi CORS, hãy bật CORS cho phép PUT trong cài đặt Bucket R2."
        )
      );
    };

    xhr.send(file);
  });

  return { publicUrl, mediaType, key };
}

