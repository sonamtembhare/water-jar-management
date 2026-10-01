"use client";

import Link from "next/link";
import { formatINR } from "@repo/types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Handshake } from "lucide-react";

import { useAnalyticsOverviewQuery } from "@/features/api";
import { StatsGrid, PageHeader } from "@/components/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data, isLoading } = useAnalyticsOverviewQuery();

  const stats = [
    { label: "Total vendors", value: data?.totalVendors ?? "—" },
    { label: "Active vendors", value: data?.activeVendors ?? "—" },
    { label: "Blocked vendors", value: data?.blockedVendors ?? "—" },
    { label: "Total customers", value: data?.totalCustomers ?? "—" },
    { label: "Deliveries today", value: data?.deliveriesToday ?? "—" },
  ];

  const statusData =
    data?.statusBreakdown.map((s) => ({
      name: s.status.replaceAll("_", " "),
      count: s.count,
    })) ?? [];
  const trendData = data?.revenueTrend ?? [];
  const topVendors = data?.topVendors ?? [];

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Everything happening across AquaGo."
        action={
          <Button asChild>
            <Link href="/admin/vendors">
              <Handshake /> Review vendors
            </Link>
          </Button>
        }
      />

      <StatsGrid stats={stats} loading={isLoading} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip formatter={(v) => [formatINR(Number(v)), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      {topVendors.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="border-b">
            <CardTitle>Top vendors</CardTitle>
            <CardDescription>By revenue</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 py-4">
            {topVendors.map((v, i) => (
              <div
                key={v.vendorId}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-accent text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      <Building2 className="mr-1 inline size-3.5 text-muted-foreground" />
                      {v.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {v.orders} orders
                    </span>
                  </div>
                </div>
                <span className="font-semibold">{formatINR(v.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Not enough data yet
    </div>
  );
}