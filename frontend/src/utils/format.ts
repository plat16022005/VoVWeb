/**
 * Định dạng số có dấu chấm phân cách hàng nghìn (chuẩn Việt Nam: 18.450),
 * dùng Regex thuần túy để đảm bảo kết quả 100% đồng nhất giữa Node.js SSR và Client Browser,
 * triệt tiêu hoàn toàn lỗi Next.js Hydration Mismatch (Server 18.450 vs Client 18,450).
 */
export function formatNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return "0";
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num)) return "0";
  
  const parts = String(num).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
}

