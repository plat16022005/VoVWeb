// FILE TẠM để thử CI fail (Lần 2). Xóa file này sau khi test xong.
describe('CI fail demo (backend)', () => {
  it('cố tình fail lần 2 để kiểm tra Ruleset chặn merge', () => {
    expect(2 + 2).toBe(5);
  });
});
