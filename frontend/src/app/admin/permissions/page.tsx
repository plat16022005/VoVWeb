import type { Metadata } from "next";
import AdminPermissionsView from "@/components/admin/permissions/AdminPermissionsView";

export const metadata: Metadata = {
  title: "Phân Quyền Quản Trị | Valkyria of Veyra Admin",
  description:
    "Trung tâm phân quyền quản trị đa cấp (RBAC), quản lý nhóm chức năng lớn và cụm quyền tác vụ nhỏ cho tài khoản Quản Lý (Manager) của Valkyria of Veyra.",
};

export default function AdminPermissionsPage() {
  return <AdminPermissionsView />;
}

