import { describe, expect, it } from "vitest";
import { inspectUnityZipFile } from "./events.service";

describe("Player & Manager WebGL Event Service (events.service)", () => {
  it("inspectUnityZipFile phát hiện tệp không phải định dạng ZIP Unity WebGL hợp lệ và báo thiếu đủ 4 thành phần", async () => {
    const invalidBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const fakeFile = {
      arrayBuffer: async () => invalidBytes.buffer,
    } as unknown as File;

    const res = await inspectUnityZipFile(fakeFile);
    expect(res.isValid).toBe(false);
    expect(res.missingRoles).toEqual([
      "*.loader.js",
      "*.data",
      "*.framework.js",
      "*.wasm",
    ]);
  });
});
