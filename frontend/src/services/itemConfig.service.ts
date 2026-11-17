"use client";

import { gachaService } from "./gacha.service";

export interface GameItemConfig {
  id: string;
  name: string;
  type: number;
  rarity?: string;
  description?: string;
  iconUrl?: string;
}

class ItemConfigService {
  /**
   * Đọc danh sách vật phẩm từ Backend API (đã sắp xếp Type === 4 lên đầu).
   */
  async getItems(): Promise<GameItemConfig[]> {
    const refs = await gachaService.getReferenceItems();
    return refs.map((item) => ({
      id: item.ItemId,
      name: item.Name,
      type: item.Type,
      rarity: item.Rarity,
      description: item.Description,
      iconUrl: item.IconUrl,
    }));
  }
}

export const itemConfigService = new ItemConfigService();
