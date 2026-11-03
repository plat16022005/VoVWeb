import type { Metadata } from "next";
import AdminLogsView from "@/components/admin/logs/AdminLogsView";

export const metadata: Metadata = {
  title: "Nhật Ký Hoạt Động & Kiểm Toán | Valkyria of Veyra Admin",
  description: "Trang tổng hợp nhật ký hoạt động, kiểm toán bảo an và theo dõi dòng sự kiện của hệ thống Valkyria of Veyra.",
};

export default function AdminLogsPage() {
  return <AdminLogsView />;
}
