// FILE TẠM để thử CI fail (Lần 2). Xóa file này sau khi test xong.
import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

describe("CI fail demo (frontend)", () => {
  it("cố tình fail lần 2 để kiểm tra Ruleset chặn merge", () => {
    expect(formatNumber(2000)).toBe("2,000");
  });
});
