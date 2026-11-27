// FILE TẠM để thử CI fail. Xóa file này sau khi test xong.
import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

describe("CI fail demo (frontend)", () => {
  it("cố tình fail để kiểm tra CI chặn merge", () => {
    expect(formatNumber(1000)).toBe("1,000");
  });
});
