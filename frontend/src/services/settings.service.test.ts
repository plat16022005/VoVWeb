import { describe, expect, it } from "vitest";
import {
  DEFAULT_BANNER,
  DEFAULT_GAME_INFO,
  DEFAULT_SECURITY,
  DEFAULT_TERMS,
  DEFAULT_TERMS_LIST,
} from "./settings.service";

describe("Admin Settings & Player Terms of Service (settings.service)", () => {
  it("DEFAULT_TERMS và DEFAULT_TERMS_LIST cung cấp đầy đủ các điều khoản dịch vụ cho Chỉ Huy", () => {
    expect(DEFAULT_TERMS.version).toBe("1.0.0");
    expect(DEFAULT_TERMS.content).toContain("Valkyria of Veyra");
    expect(DEFAULT_TERMS.content).toContain("Turn-Based RPG");
    expect(DEFAULT_TERMS_LIST.length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_TERMS_LIST[0].Title).toContain("Chỉ Huy");
  });

  it("DEFAULT_GAME_INFO, DEFAULT_SECURITY và DEFAULT_BANNER tuân thủ đúng chuẩn cốt truyện và bảo mật", () => {
    expect(DEFAULT_GAME_INFO.gameTitle).toBe("Valkyria of Veyra");
    expect(DEFAULT_GAME_INFO.slogan).toContain("Veyra");
    expect(DEFAULT_SECURITY.minPasswordLength).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_BANNER.enabled).toBe(true);
  });
});
