"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Bell,
  Droplets,
  LayoutDashboard,
  LogOut,
  Package,
  Shield,
  Store,
  Truck,
  Users,
  Boxes,
  ClipboardList,
  UserCircle,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@repo/types";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logout, selectAuth } from "@/features/auth/authSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationsBell } from "@/components/notifications-popover";
import { ServerStatusBanner } from "@/components/server-status-banner";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: Record<UserRole, NavItem[]> = {
  super_admin: [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/admin/vendors", label: "Vendors", icon: <Store /> },
    { href: "/admin/customers", label: "Customers", icon: <UserCircle /> },
    { href: "/admin/users", label: "Users", icon: <Users /> },
  ],
  vendor: [
    { href: "/vendor", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/vendor/orders", label: "Orders", icon: <ClipboardList /> },
    { href: "/vendor/products", label: "Products", icon: <Package /> },
    { href: "/vendor/inventory", label: "Inventory", icon: <Boxes /> },
    { href: "/vendor/customers", label: "Customers", icon: <UserCircle /> },
    { href: "/vendor/deliveries", label: "Record delivery", icon: <Truck /> },
    { href: "/vendor/staff", label: "Team", icon: <Users /> },
    { href: "/vendor/profile", label: "Business profile", icon: <Store /> },
  ],
  customer: [
    { href: "/customer", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/catalog", label: "Order water", icon: <Wallet /> },
    { href: "/customer/orders", label: "My orders", icon: <ClipboardList /> },
    { href: "/customer/profile", label: "Profile", icon: <UserCircle /> },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);

  const nav = useMemo(() => (user ? NAV[user.role] : []), [user]);

  if (!user) return null;

  function handleLogout() {
    dispatch(logout());
    router.replace("/");
    router.refresh();
  }

  const brand =
    user.role === "super_admin" ? (
      <>
        <Shield className="size-5" /> Admin
      </>
    ) : (
      <>
        <Droplets className="size-5" /> AquaGo
      </>
    );

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Full-width server status banner (only visible when not online) ── */}
      <ServerStatusBanner />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card md:flex">
        <Link
          href={nav[0]?.href ?? "/"}
          className="flex items-center gap-2 px-5 py-4 text-lg font-semibold"
        >
          {brand}
        </Link>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active =
              item.href === "/admin" || item.href === "/vendor" || item.href === "/customer"
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <div className="mb-2 flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut /> Log out
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card/80 px-4 backdrop-blur md:ml-60 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <Link href={nav[0]?.href ?? "/"} className="flex items-center gap-2 font-semibold">
            <Droplets className="size-5" /> AquaGo
          </Link>
        </div>
        <div className="hidden flex-col md:flex" />
        <div className="flex items-center gap-2">
          {/* Compact server status pill always visible in header */}
          <ServerStatusBanner compact />
          <NotificationsBell />
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 pb-16 md:ml-60 md:p-8">{children}</main>
    </div>
  );
}