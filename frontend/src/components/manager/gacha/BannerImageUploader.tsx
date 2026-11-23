"use client";

import { useRef, useState } from "react";
import { uploadGachaBannerImage } from "@/services/r2Upload.service";
import { soundEngine } from "@/services/audio.service";

interface BannerImageUploaderProps {
  label: string;
  description: string;
  imageKind: "main" | "tab";
  recommendedMaxBytes: number;
  recommendedLabel: string;
  seasonId: string;
  bannerId: string;
  imageUrl: string;
  imageKey: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (nextUrl: string, nextKey: string) => void;
  onTempUploadedKey?: (key: string) => void;
}

export default function BannerImageUploader({
  label,
  description,
  imageKind,
  recommendedMaxBytes,
  recommendedLabel,
  seasonId,
  bannerId,
  imageUrl,
  imageKey,
  required = false,
  disabled = false,
  onChange,
  onTempUploadedKey,
}: BannerImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  const canUpload = Boolean(seasonId.trim() && bannerId.trim());

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setSizeWarning(null);

    if (!canUpload) {
      setErrorMsg(
        "Vui lòng nhập BannerId trước khi tải ảnh lên."
      );
      return;
    }

    if (file.size > recommendedMaxBytes) {
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      setSizeWarning(
        `Dung lượng ảnh (${mb}MB) đang lớn hơn mức khuyến nghị (${recommendedLabel}). Nên tối ưu để Game Client tải nhanh hơn.`
      );
    }

    try {
      setUploading(true);
      setProgress(0);
      const res = await uploadGachaBannerImage(
        file,
        { seasonId, bannerId, imageKind },
        (pct) => setProgress(pct)
      );
      if (onTempUploadedKey && res.key) {
        onTempUploadedKey(res.key);
      }
      onChange(res.publicUrl, res.key);
      soundEngine.playCelestialChime();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : "Không thể tải ảnh lên kho lưu trữ."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#060814]/80 border border-white/10 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              {label}
            </span>
            {required ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Bắt buộc
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400 border border-white/10">
                Tùy chọn
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{description}</p>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#3fe9d6]/10 text-[#3fe9d6] border border-[#3fe9d6]/30 shrink-0">
          PNG / JPG · Khuyến nghị {recommendedLabel}
        </span>
      </div>

      {/* Preview Box + Dropzone */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Preview */}
        <div
          className={`md:col-span-5 rounded-xl overflow-hidden bg-[#04050d] border border-white/10 flex items-center justify-center relative ${
            imageKind === "main" ? "aspect-video" : "h-28"
          }`}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChange("", "");
                  }}
                  className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/75 hover:bg-rose-600 text-white text-[10px] font-mono border border-white/20 transition-colors cursor-pointer"
                  title="Gỡ ảnh hiện tại"
                >
                  Gỡ
                </button>
              )}
            </>
          ) : (
            <div className="text-center p-4">
              <div className="text-[11px] font-mono text-slate-500">
                Chưa có ảnh {imageKind === "main" ? "16:9" : "tab"}
              </div>
            </div>
          )}
        </div>

        {/* Upload Dropzone */}
        <div className="md:col-span-7 space-y-2.5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (disabled || uploading) return;
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={`p-4 rounded-xl border-2 border-dashed transition-all text-center space-y-2 ${
              dragOver
                ? "border-[#3fe9d6] bg-[#3fe9d6]/10"
                : "border-white/15 bg-[#090d24]/60 hover:border-[#f5c767]/40"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              disabled={disabled || uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="hidden"
            />

            {uploading ? (
              <div className="space-y-2 py-1">
                <div className="text-xs font-mono text-[#3fe9d6] font-bold">
                  Đang tải ảnh lên kho lưu trữ... {progress}%
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3fe9d6] to-[#f5c767] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs text-slate-300">
                  Kéo thả ảnh <strong>.png / .jpg / .jpeg</strong> vào đây hoặc
                </div>
                <button
                  type="button"
                  disabled={disabled || !canUpload}
                  onClick={() => {
                    soundEngine.playClick();
                    inputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6]/20 to-[#f5c767]/20 hover:from-[#3fe9d6]/30 hover:to-[#f5c767]/30 border border-[#3fe9d6]/40 text-white text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Chọn Ảnh Từ Máy Tính
                </button>
                {!canUpload && (
                  <div className="text-[10px] font-mono text-amber-300">
                    * Nhập BannerId hợp lệ (^[a-z0-9_]+$) trước khi tải ảnh
                  </div>
                )}
              </>
            )}
          </div>

          {/* URL & Key display (read-only) */}
          {imageUrl && (
            <div className="space-y-1 text-[10px] font-mono bg-black/30 p-2.5 rounded-xl border border-white/5">
              <div className="text-slate-400 truncate" title={imageUrl}>
                URL: <span className="text-emerald-300">{imageUrl}</span>
              </div>
              {imageKey && (
                <div className="text-slate-400 truncate" title={imageKey}>
                  Key: <span className="text-slate-300">{imageKey}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-sans">
          {errorMsg}
        </div>
      )}

      {sizeWarning && (
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-sans">
          {sizeWarning}
        </div>
      )}
    </div>
  );
}
