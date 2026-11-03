import RoleRouteGuard from "@/components/auth/RoleRouteGuard";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleRouteGuard requiredRole="Manager">{children}</RoleRouteGuard>;
}

