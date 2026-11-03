import type { Metadata } from "next";
import AdminAccountsView from "@/components/admin/AdminAccountsView";

export const metadata: Metadata = {
  title: "Tổng Hành Dinh Quản Trị — Valkyria of Veyra",
  description: "Trang quản trị trung tâm của Valkyria of Veyra: Quản lý tài khoản Chỉ Huy, bảo an, phân quyền và dữ liệu người chơi.",
};

export default function AdminPage() {
  return <AdminAccountsView />;
}
