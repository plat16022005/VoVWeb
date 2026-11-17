import { adminService } from "./admin.service";
import { settingsService } from "./settings.service";
import { blogsService } from "./blogs.service";
import { getServerLogs } from "./serverManagement.service";
import { characterService } from "./character.service";
import { gachaService } from "./gacha.service";

export type LogModuleType =
  | "ALL"
  | "ACCOUNTS"
  | "TERMS"
  | "POLICY"
  | "BLOGS"
  | "SERVERS"
  | "GAMEDATA"
  | "GACHA"
  | "SYSTEM";

export interface SystemLogItem {
  id: string;
  module: "ACCOUNTS" | "TERMS" | "POLICY" | "BLOGS" | "SERVERS" | "GAMEDATA" | "GACHA" | "SYSTEM";
  moduleName: string;
  action: string;
  actionTitle: string;
  target?: string;
  details: string;
  performedBy: string;
  timestamp: number;
  createdAt: string;
}

export const logsService = {
  // Đọc và tổng hợp toàn bộ nhật ký từ tất cả các phân hệ của hệ thống
  async getAllLogs(limitCount = 200): Promise<SystemLogItem[]> {
    const allItems: SystemLogItem[] = [];

    // 1. Lấy nhật ký Quản lý Tài khoản (Logs/AccountManagement/Activities)
    try {
      const accountLogs = await adminService.getAccountLogs(limitCount);
      accountLogs.forEach((l) => {
        allItems.push({
          id: `acc_${l.id}`,
          module: "ACCOUNTS",
          moduleName: "Quản Lý Tài Khoản",
          action: l.action,
          actionTitle: l.actionTitle,
          target: l.targetUsername || l.targetUserId,
          details: l.details || "",
          performedBy: l.performedBy || "Admin",
          timestamp: l.timestamp || 0,
          createdAt: l.createdAt || "",
        });
      });
    } catch (err) {
      console.warn("Lỗi đọc log tài khoản trong logsService:", err);
    }

    // 2. Lấy nhật ký Điều khoản Dịch vụ (Logs/Term&Policy/Term)
    try {
      const termLogs = await settingsService.getTermsHistory();
      termLogs.forEach((l) => {
        allItems.push({
          id: `term_${l.id}`,
          module: "TERMS",
          moduleName: "Điều Khoản Dịch Vụ",
          action: "PUBLISH",
          actionTitle: `Xuất bản Điều khoản (${l.version})`,
          target: `${l.termCount} điều khoản`,
          details: l.note || "Xuất bản phiên bản Điều khoản Dịch vụ mới.",
          performedBy: l.updatedBy || "Admin",
          timestamp: l.timestamp || 0,
          createdAt: l.updatedAt || "",
        });
      });
    } catch (err) {
      console.warn("Lỗi đọc log điều khoản trong logsService:", err);
    }

    // 3. Lấy nhật ký Chính sách Bảo mật (Logs/Term&Policy/Policy)
    try {
      const policyLogs = await settingsService.getPolicyHistory();
      policyLogs.forEach((l) => {
        allItems.push({
          id: `policy_${l.id}`,
          module: "POLICY",
          moduleName: "Chính Sách Bảo Mật",
          action: "PUBLISH",
          actionTitle: `Xuất bản Chính sách (${l.version})`,
          target: `${l.termCount} chính sách`,
          details: l.note || "Xuất bản phiên bản Chính sách Bảo mật mới.",
          performedBy: l.updatedBy || "Admin",
          timestamp: l.timestamp || 0,
          createdAt: l.updatedAt || "",
        });
      });
    } catch (err) {
      console.warn("Lỗi đọc log chính sách trong logsService:", err);
    }

    // 4. Lấy nhật ký Quản lý Blog & Tin Tức (Logs/BlogManagement/Activities)
    try {
      const blogLogs = await blogsService.getBlogLogs(limitCount);
      blogLogs.forEach((l) => {
        allItems.push({
          id: `blog_${l.id}`,
          module: "BLOGS",
          moduleName: "Quản Lý Blog & Tin Tức",
          action: l.action,
          actionTitle: l.actionTitle,
          target: l.targetTitle,
          details: l.details || l.actionTitle,
          performedBy: l.performedBy || "Admin",
          timestamp: l.timestamp || 0,
          createdAt: l.createdAt || "",
        });
      });
    } catch (err) {
      console.warn("Lỗi đọc log blog trong logsService:", err);
    }

    // 5. Lấy nhật ký Quản lý Hạ tầng & Máy chủ (Logs/ServerManagement/Activities)
    try {
      const serverLogs = await getServerLogs(limitCount);
      serverLogs.forEach((l) => {
        allItems.push({
          id: `srv_${l.id}`,
          module: "SERVERS",
          moduleName: "Hạ Tầng & Máy Chủ",
          action: l.action,
          actionTitle: l.actionTitle,
          target: l.serverId ? `[${l.serverId}] ${l.serverName || ""}`.trim() : "Toàn Hệ Thống",
          details: l.reason || l.message || l.actionTitle,
          performedBy: l.performedBy || "Admin",
          timestamp: l.timestamp || 0,
          createdAt: l.createdAt || "",
        });
      });
    } catch (err) {
      console.warn("Lỗi đọc log máy chủ trong logsService:", err);
    }

    // 6. Lấy nhật ký Dữ Liệu Game (Logs/GameData/Characters)
    try {
      const gameDataLogs = await characterService.getGameDataLogs(limitCount);
      gameDataLogs.forEach((l) => {
        allItems.push({
          id: `gd_${l.id}`,
          module: "GAMEDATA",
          moduleName: "Dữ Liệu Game",
          action: l.action,
          actionTitle: l.actionTitle,
          target: l.characterName ? `${l.characterName} (#${l.characterId})` : l.characterId || "Toàn Hệ Thống",
          details: l.details || l.actionTitle,
          performedBy: l.performedBy || "Quản Trị Viên",
          timestamp: l.timestamp || 0,
          createdAt: l.createdAt || "",
        });
      });
    } catch (err) {
      console.warn("Lỗi đọc log dữ liệu game trong logsService:", err);
    }

    // 7. Lấy nhật ký Banner Gacha (Logs/GachaBanners/Activities)
    try {
      const gachaLogs = await gachaService.getGachaLogs(limitCount);
      gachaLogs.forEach((l) => {
        allItems.push({
          id: `gacha_${l.id}`,
          module: "GACHA",
          moduleName: "Banner Gacha",
          action: l.action,
          actionTitle: l.actionTitle,
          target: l.bannerTitle
            ? `${l.seasonName} • ${l.bannerTitle}`
            : l.seasonName || l.seasonId,
          details: l.details || l.actionTitle,
          performedBy: l.performedBy || "Quản Trị Viên",
          timestamp: l.timestamp || 0,
          createdAt: l.createdAt || "",
        });
      });
    } catch (err) {
      console.warn("Lỗi đọc log Banner Gacha trong logsService:", err);
    }

    // 8. Sắp xếp toàn bộ nhật ký theo mốc thời gian mới nhất lên đầu
    allItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return allItems.slice(0, limitCount);
  },
};
