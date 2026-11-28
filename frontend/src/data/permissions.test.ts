import { describe, expect, it } from "vitest";
import {
  PERMISSION_GROUPS,
  getAllSubPermissionIds,
  hasPermission,
  hasPermissionGroup,
} from "./permissions";

describe("Hệ thống phân quyền RBAC (permissions.ts)", () => {
  it("khai báo đủ 4 nhóm chức năng lớn của Manager", () => {
    const groupIds = PERMISSION_GROUPS.map((g) => g.id);
    expect(groupIds).toEqual([
      "content_management",
      "game_data",
      "event_management",
      "player_support",
    ]);
  });

  it("getAllSubPermissionIds trả về danh sách quyền con của nhóm hợp lệ và mảng rỗng khi sai mã nhóm", () => {
    const contentPerms = getAllSubPermissionIds("content_management");
    expect(contentPerms).toContain("content.blog.view");
    expect(contentPerms).toContain("content.facebook.bot");
    const supportPerms = getAllSubPermissionIds("player_support");
    expect(supportPerms).toContain("support.player.view");
    expect(supportPerms).toContain("support.player.activity_logs");
    expect(supportPerms).toContain("support.player.revoke_item");
    expect(getAllSubPermissionIds("unknown_group")).toEqual([]);
  });

  describe("hasPermissionGroup", () => {
    it("Admin luôn có toàn quyền truy cập mọi nhóm chức năng", () => {
      expect(
        hasPermissionGroup({ role: "Admin", permissionGroups: [] }, "game_data")
      ).toBe(true);
    });

    it("Manager chỉ được truy cập nhóm có trong permissionGroups", () => {
      const manager = {
        role: "Manager",
        permissionGroups: ["content_management", "event_management"],
      };
      expect(hasPermissionGroup(manager, "content_management")).toBe(true);
      expect(hasPermissionGroup(manager, "game_data")).toBe(false);
    });

    it("Người chơi (Player) hoặc khách chưa đăng nhập luôn bị từ chối", () => {
      expect(
        hasPermissionGroup(
          { role: "Player", permissionGroups: ["content_management"] },
          "content_management"
        )
      ).toBe(false);
      expect(hasPermissionGroup(null, "content_management")).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("Admin luôn có mọi quyền thao tác con", () => {
      expect(
        hasPermission({ role: "Admin", permissions: [] }, "support.player.revoke_item")
      ).toBe(true);
    });

    it("Manager cần có đồng thời nhóm chức năng lớn và quyền con tương ứng", () => {
      const validManager = {
        role: "Manager",
        permissionGroups: ["game_data"],
        permissions: ["gamedata.gacha.view", "gamedata.gacha.edit"],
      };
      expect(hasPermission(validManager, "gamedata.gacha.edit")).toBe(true);
      expect(hasPermission(validManager, "gamedata.gacha.activate")).toBe(false);

      // Có quyền con trong mảng permissions nhưng bị gỡ khỏi nhóm lớn game_data -> phải bị chặn
      const orphanedPermManager = {
        role: "Manager",
        permissionGroups: [],
        permissions: ["gamedata.gacha.edit"],
      };
      expect(hasPermission(orphanedPermManager, "gamedata.gacha.edit")).toBe(false);
    });
  });
});
