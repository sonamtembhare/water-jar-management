"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@repo/types";

import { useAppSelector } from "@/lib/hooks";
import { selectAuth } from "@/features/auth/authSlice";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

const HOME_BY_ROLE: Record<UserRole, string> = {
  super_admin: "/admin",
  vendor: "/vendor",
  customer: "/customer",
};

export function ProtectedLayout({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user } = useAppSelector(selectAuth);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(HOME_BY_ROLE[user.role]);
    }
  }, [ready, user, role, router]);

  if (!ready || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

export { HOME_BY_ROLE };