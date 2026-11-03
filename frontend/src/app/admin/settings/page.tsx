import type { Metadata } from "next";
import AdminSettingsView from "@/components/admin/settings/AdminSettingsView";

export const metadata: Metadata = {
  title: "Cấu Hình Hệ Thống & Điều Khoản | Valkyria of Veyra Admin",
  description: "Trang thiết lập điều khoản dịch vụ, phiên bản game client, cổng đăng ký và biểu ngữ thông báo trung tâm của Valkyria of Veyra.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsView />;
}
