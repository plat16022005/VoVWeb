import type { Metadata } from "next";
import AdminAccountsView from "@/components/admin/AdminAccountsView";

export const metadata: Metadata = {
  title: "Quản Lý Tài Khoản Chỉ Huy — Valkyria of Veyra Admin",
  description: "Bảng quản lý tài khoản, phân quyền và dữ liệu Chỉ Huy trong hệ sinh thái Valkyria of Veyra.",
};

export default function AdminAccountsPage() {
  return <AdminAccountsView />;
}
