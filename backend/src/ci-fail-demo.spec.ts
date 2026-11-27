// FILE TẠM để thử CI fail. Xóa file này sau khi test xong.
describe('CI fail demo (backend)', () => {
  it('cố tình fail để kiểm tra CI chặn merge', () => {
    expect(1 + 1).toBe(3);
  });
});
