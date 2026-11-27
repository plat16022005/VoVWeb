import { afterEach, describe, expect, it, vi } from "vitest";
import { logsService } from "./logs.service";
import { adminService } from "./admin.service";
import { settingsService } from "./settings.service";
import { blogsService } from "./blogs.service";
import * as serverManagementService from "./serverManagement.service";
import { characterService } from "./character.service";
import { gachaService } from "./gacha.service";

describe("Admin Centralized Audit Logs (logs.service)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tổng hợp nhật ký từ các phân hệ của Admin và sắp xếp theo thời gian mới nhất", async () => {
    vi.spyOn(adminService, "getAccountLogs").mockResolvedValue([
      {
        id: "l1",
        action: "BAN",
        actionTitle: "Khóa tài khoản vi phạm",
        targetUserId: "u1",
        targetUsername: "BadPlayer",
        details: "Vi phạm điều khoản",
        performedBy: "admin@veyra.game",
        timestamp: 1000,
        createdAt: "10:00:00 27/11/2026",
      },
    ]);
    vi.spyOn(settingsService, "getTermsHistory").mockResolvedValue([
      {
        id: "t1",
        version: "1.1.0",
        note: "Cập nhật quy tắc Gacha",
        updatedBy: "admin@veyra.game",
        updatedAt: "11:00:00 27/11/2026",
        timestamp: 3000,
        termCount: 5,
      },
    ]);
    vi.spyOn(settingsService, "getPolicyHistory").mockResolvedValue([]);
    vi.spyOn(blogsService, "getBlogLogs").mockResolvedValue([
      {
        id: "b1",
        action: "PUBLISH",
        actionTitle: "Xuất bản bài viết",
        targetPostId: "p1",
        targetTitle: "Bản Tin Mới",
        performedBy: "mgr@veyra.game",
        timestamp: 2000,
        createdAt: "10:30:00 27/11/2026",
      },
    ]);
    vi.spyOn(serverManagementService, "getServerLogs").mockResolvedValue([]);
    vi.spyOn(characterService, "getGameDataLogs").mockResolvedValue([]);
    vi.spyOn(gachaService, "getGachaLogs").mockResolvedValue([]);

    const logs = await logsService.getAllLogs(50);
    expect(logs).toHaveLength(3);
    // Phải sắp xếp giảm dần theo timestamp: 3000 (TERMS) -> 2000 (BLOGS) -> 1000 (ACCOUNTS)
    expect(logs.map((l) => l.module)).toEqual(["TERMS", "BLOGS", "ACCOUNTS"]);
  });
});
