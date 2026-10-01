import { ProtectedLayout } from "@/components/protected-layout";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout role="customer">{children}</ProtectedLayout>;
}