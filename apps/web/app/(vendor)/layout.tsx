import { ProtectedLayout } from "@/components/protected-layout";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout role="vendor">{children}</ProtectedLayout>;
}