"use client";

import { auth } from "@/lib/firebase";
import { GachaBannerConfig, GachaSeasonDocument } from "@/data/gacha";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type GachaLogAction =
  | "CREATE_SEASON"
  | "CLONE_SEASON"
  | "UPDATE_SEASON"
  | "ACTIVATE_SEASON"
  | "DEACTIVATE_SEASON"
  | "DELETE_SEASON"
  | "CREATE_BANNER"
  | "UPDATE_BANNER"
  | "TOGGLE_BANNER"
  | "DELETE_BANNER";

export interface GachaActivityLog {
  id: string;
  action: GachaLogAction;
  actionTitle: string;
  seasonId: string;
  seasonName: string;
  bannerId?: string;
  bannerTitle?: string;
  bannerType?: string;
  version?: number;
  details: string;
  performedBy: string;
  performedByRole?: string;
  timestamp: number;
  createdAt: string;
}

export interface GachaHeroReference {
  id: string;
  name: string;
  title?: string;
  role: string;
  rarity: number;
  rarityLabel: string;
  image: string;
}

export interface BackendGameItemReference {
  ItemId: string;
  Name: string;
  Description?: string;
  Type: number;
  Rarity?: string;
  IconUrl?: string;
  IconKey?: string;
}

export interface CreateSeasonInput {
  SeasonId: string;
  SeasonName: string;
  StartTime: string;
  EndTime: string;
  IsActive?: boolean;
}

export interface CloneSeasonInput extends CreateSeasonInput {
  syncLimitedBannerTimes?: boolean;
}

export interface UpdateSeasonMetadataInput {
  SeasonName: string;
  StartTime: string;
  EndTime: string;
}

export interface GachaMediaPresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  contentType: string;
  expiresInSeconds: number;
}

export class GachaApiError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(message: string, status = 400, errors: string[] = []) {
    super(message);
    this.name = "GachaApiError";
    this.status = status;
    this.errors = errors;
  }
}

class GachaService {
  private async getAuthToken(): Promise<string> {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new GachaApiError(
        "Phiên đăng nhập quản trị đã hết hạn. Vui lòng đăng nhập lại.",
        401
      );
    }
    try {
      return await currentUser.getIdToken();
    } catch {
      throw new GachaApiError(
        "Không thể xác thực phiên làm việc hiện tại. Vui lòng đăng nhập lại.",
        401
      );
    }
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (init?.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE_URL}/gacha${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as {
        message?: string | string[];
        errors?: string[];
      } | null;

      const errors: string[] = Array.isArray(payload?.errors)
        ? payload.errors.map((e) => String(e))
        : Array.isArray(payload?.message)
        ? payload.message.map((e) => String(e))
        : [];

      const message =
        typeof payload?.message === "string" && payload.message.trim()
          ? payload.message
          : errors[0] || `Yêu cầu thất bại (Mã ${res.status}).`;

      throw new GachaApiError(message, res.status, errors);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }

  // ==================== REFERENCES ====================

  async getReferenceHeroes(): Promise<GachaHeroReference[]> {
    return this.request<GachaHeroReference[]>("/references/heroes");
  }

  async getReferenceItems(): Promise<BackendGameItemReference[]> {
    return this.request<BackendGameItemReference[]>("/references/items");
  }

  // ==================== SEASONS ====================

  async getSeasons(): Promise<GachaSeasonDocument[]> {
    return this.request<GachaSeasonDocument[]>("/seasons");
  }

  async getSeasonById(seasonId: string): Promise<GachaSeasonDocument | null> {
    try {
      return await this.request<GachaSeasonDocument>(
        `/seasons/${encodeURIComponent(seasonId)}`
      );
    } catch (err) {
      if (err instanceof GachaApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async createSeason(input: CreateSeasonInput): Promise<GachaSeasonDocument> {
    return this.request<GachaSeasonDocument>("/seasons", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async cloneSeason(
    sourceSeasonId: string,
    input: CloneSeasonInput
  ): Promise<GachaSeasonDocument> {
    return this.request<GachaSeasonDocument>(
      `/seasons/${encodeURIComponent(sourceSeasonId)}/clone`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  }

  async updateSeasonMetadata(
    seasonId: string,
    patch: UpdateSeasonMetadataInput
  ): Promise<GachaSeasonDocument> {
    return this.request<GachaSeasonDocument>(
      `/seasons/${encodeURIComponent(seasonId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  }

  async activateSeason(seasonId: string): Promise<GachaSeasonDocument> {
    return this.request<GachaSeasonDocument>(
      `/seasons/${encodeURIComponent(seasonId)}/activate`,
      { method: "POST" }
    );
  }

  async deactivateSeason(seasonId: string): Promise<GachaSeasonDocument> {
    return this.request<GachaSeasonDocument>(
      `/seasons/${encodeURIComponent(seasonId)}/deactivate`,
      { method: "POST" }
    );
  }

  async deleteDraftSeason(
    seasonId: string
  ): Promise<{ success: boolean; deletedMediaKeys: string[] }> {
    return this.request<{ success: boolean; deletedMediaKeys: string[] }>(
      `/seasons/${encodeURIComponent(seasonId)}`,
      { method: "DELETE" }
    );
  }

  // ==================== BANNERS INSIDE SEASON ====================

  async saveBannerInSeason(
    seasonId: string,
    banner: GachaBannerConfig,
    options: { isNew: boolean }
  ): Promise<GachaBannerConfig> {
    if (options.isNew) {
      return this.request<GachaBannerConfig>(
        `/seasons/${encodeURIComponent(seasonId)}/banners`,
        {
          method: "POST",
          body: JSON.stringify(banner),
        }
      );
    }

    return this.request<GachaBannerConfig>(
      `/seasons/${encodeURIComponent(seasonId)}/banners/${encodeURIComponent(
        banner.BannerId
      )}`,
      {
        method: "PUT",
        body: JSON.stringify(banner),
      }
    );
  }

  async toggleBannerActive(
    seasonId: string,
    bannerId: string,
    isActive: boolean
  ): Promise<{ BannerId: string; IsActive: boolean }> {
    return this.request<{ BannerId: string; IsActive: boolean }>(
      `/seasons/${encodeURIComponent(seasonId)}/banners/${encodeURIComponent(
        bannerId
      )}/active`,
      {
        method: "PATCH",
        body: JSON.stringify({ IsActive: isActive }),
      }
    );
  }

  async deleteBannerFromSeason(
    seasonId: string,
    bannerId: string
  ): Promise<{ success: boolean; deletedMediaKeys: string[] }> {
    return this.request<{ success: boolean; deletedMediaKeys: string[] }>(
      `/seasons/${encodeURIComponent(seasonId)}/banners/${encodeURIComponent(
        bannerId
      )}`,
      { method: "DELETE" }
    );
  }

  // ==================== MEDIA PRESIGN & CLEANUP ====================

  async createMediaPresign(input: {
    seasonId: string;
    bannerId: string;
    variant: "main" | "tab";
    fileName: string;
    contentType: string;
    fileSize: number;
  }): Promise<GachaMediaPresignResponse> {
    return this.request<GachaMediaPresignResponse>("/media/presign", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async cleanupTempMedia(
    keys: string[]
  ): Promise<{ deletedKeys: string[]; skippedLiveKeys: string[] }> {
    return this.request<{ deletedKeys: string[]; skippedLiveKeys: string[] }>(
      "/media/cleanup",
      {
        method: "POST",
        body: JSON.stringify({ keys }),
      }
    );
  }

  // ==================== AUDIT LOGS (ADMIN ONLY) ====================

  async getGachaLogs(limitCount = 50): Promise<GachaActivityLog[]> {
    return this.request<GachaActivityLog[]>(
      `/logs?limit=${encodeURIComponent(String(limitCount))}`
    );
  }
}

export const gachaService = new GachaService();
