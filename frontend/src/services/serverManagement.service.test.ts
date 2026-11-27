import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchServersList } from "./serverManagement.service";
import { initialServers, initialSystemHealth } from "@/data/servers";

describe("Admin Server Management (serverManagement.service & servers.ts)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("khởi tạo danh sách máy chủ mặc định rỗng để chống hiển thị dữ liệu ảo và có cấu hình health chuẩn", () => {
    expect(initialServers).toEqual([]);
    expect(initialSystemHealth.apiGatewayStatus).toBe("optimal");
    expect(initialSystemHealth.databaseStatus).toBe("optimal");
  });

  it("fetchServersList gọi đúng endpoint danh sách máy chủ và hỗ trợ cờ làm mới (forceRefresh)", async () => {
    const mockServers = [
      { id: "server-1", name: "Thánh Địa Veyra 01", status: "online", ccu: 120 },
    ];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockServers,
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const list = await fetchServersList(true);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("server-1");
    expect(fetchMock.mock.calls[0][0]).toContain("/servers?refresh=true");
  });

  it("fetchServersList ném lỗi rõ ràng khi máy chủ Backend trả về mã lỗi HTTP", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    await expect(fetchServersList(false)).rejects.toThrow("HTTP 500");
  });
});
