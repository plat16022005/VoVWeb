import RoleRouteGuard from "@/components/auth/RoleRouteGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleRouteGuard requiredRole="Admin">{children}</RoleRouteGuard>;
}

