import { afterEach, describe, expect, it, vi } from "vitest";
import { playersService } from "./players.service";

describe("Player Pre-Registration & Leaderboard Service (players.service)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("getAll và getById trả về dữ liệu Chỉ Huy trên Bảng Chiến Tích", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "p1", username: "Commander_01", level: 60 }],
    }) as unknown as typeof fetch;

    const all = await playersService.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].username).toBe("Commander_01");
  });

  it("create gửi thông tin ghi danh Chỉ Huy mới từ PlayModal", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "new-id",
        username: "NewCommander",
        email: "new@veyra.game",
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const created = await playersService.create({
      username: "NewCommander",
      email: "new@veyra.game",
    });
    expect(created.username).toBe("NewCommander");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ném lỗi khi API trả về trạng thái thất bại", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;

    await expect(playersService.getById("missing")).rejects.toThrow(
      "Player missing not found"
    );
  });
});
