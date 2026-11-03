import type { Metadata } from "next";
import AdminServersView from "@/components/admin/servers/AdminServersView";

export const metadata: Metadata = {
  title: "Hạ Tầng & Máy Chủ | Valkyria of Veyra Admin",
  description:
    "Trung tâm điều phối hạ tầng, giám sát trạng thái cụm máy chủ game Unity, quản lý bảo trì và kiểm soát phiên bản client của Valkyria of Veyra.",
};

export default function AdminServersPage() {
  return <AdminServersView />;
}
