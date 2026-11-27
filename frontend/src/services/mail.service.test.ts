import { describe, expect, it } from "vitest";
import {
  MAIL_QUICK_TEMPLATES,
  SystemMailDocument,
  getMailCategoryMeta,
  isMailExpired,
} from "./mail.service";

describe("mail.service helpers", () => {
  const nowMs = new Date("2026-11-27T12:00:00Z").getTime();

  it("isMailExpired kiểm tra chính xác thời hạn hiệu lực của thư hệ thống", () => {
    const expiredMail = {
      ExpiresAt: "2026-11-20T00:00:00Z",
    } as SystemMailDocument;
    const validMail = {
      ExpiresAt: "2026-12-20T00:00:00Z",
    } as SystemMailDocument;
    const noExpiryMail = { ExpiresAt: "" } as SystemMailDocument;

    expect(isMailExpired(expiredMail, nowMs)).toBe(true);
    expect(isMailExpired(validMail, nowMs)).toBe(false);
    expect(isMailExpired(noExpiryMail, nowMs)).toBe(false);
  });

  it("getMailCategoryMeta và MAIL_QUICK_TEMPLATES cung cấp mẫu thư vận hành chuẩn", () => {
    expect(getMailCategoryMeta("COMPENSATION").shortLabel).toBe("Đền Bù Lỗi");
    expect(MAIL_QUICK_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });
});
