import { ProtectedLayout } from "@/components/protected-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout role="super_admin">{children}</ProtectedLayout>;
}