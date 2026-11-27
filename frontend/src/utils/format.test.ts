import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

describe("formatNumber", () => {
  it("thêm dấu chấm phân cách hàng nghìn", () => {
    expect(formatNumber(18450)).toBe("18.450");
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("giữ nguyên số nhỏ hơn 1000", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });

  it("dùng dấu phẩy cho phần thập phân", () => {
    expect(formatNumber(1234.5)).toBe("1.234,5");
  });

  it("xử lý số âm", () => {
    expect(formatNumber(-12345)).toBe("-12.345");
  });

  it("chấp nhận chuỗi số", () => {
    expect(formatNumber("5000")).toBe("5.000");
  });

  it("trả về 0 với giá trị rỗng hoặc không hợp lệ", () => {
    expect(formatNumber(undefined)).toBe("0");
    expect(formatNumber(null)).toBe("0");
    expect(formatNumber("abc")).toBe("0");
  });
});
