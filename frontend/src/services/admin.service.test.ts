import { describe, expect, it } from "vitest";
import { getTodayDateString } from "./admin.service";
import {
  BannedAccountError,
  normalizeRole,
  parseBanViolation,
} from "./auth.service";

describe("Admin Account & Auth Helpers (admin.service & auth.service)", () => {
  it("getTodayDateString trả về định dạng YYYY-MM-DD chuẩn cho Subcollection DailyStats", () => {
    const ts = new Date(2026, 9, 5, 14, 30, 0).getTime(); // 05/10/2026
    expect(getTodayDateString(ts)).toBe("2026-10-05");
  });

  it("normalizeRole chuẩn hóa đúng 3 vai trò hệ thống (Admin, Manager, Player)", () => {
    expect(normalizeRole("admin")).toBe("Admin");
    expect(normalizeRole(" ADMIN ")).toBe("Admin");
    expect(normalizeRole("Manager")).toBe("Manager");
    expect(normalizeRole("player")).toBe("Player");
    expect(normalizeRole("")).toBe("Player");
    expect(normalizeRole(null)).toBe("Player");
  });

  it("parseBanViolation và BannedAccountError trích xuất đầy đủ điều khoản vi phạm khi tài khoản bị khóa", () => {
    const violation = parseBanViolation(
      {
        termId: "term02",
        termTitle: "Quy Tắc Chống Gian Lận",
        termContent: "Nghiêm cấm sử dụng phần mềm thứ ba.",
        note: "Phát hiện can thiệp bộ nhớ trận đấu",
        bannedBy: "AdminMaster",
      },
      { Username: "Cheater_01", Email: "cheat@veyra.game" },
      "FallbackUser",
      "fallback@veyra.game"
    );

    expect(violation.termId).toBe("term02");
    expect(violation.termTitle).toBe("Quy Tắc Chống Gian Lận");
    expect(violation.terms).toHaveLength(1);
    expect(violation.note).toBe("Phát hiện can thiệp bộ nhớ trận đấu");
    expect(violation.username).toBe("Cheater_01");

    const err = new BannedAccountError(violation);
    expect(err.name).toBe("BannedAccountError");
    expect(err.violation.bannedBy).toBe("AdminMaster");
  });
});
