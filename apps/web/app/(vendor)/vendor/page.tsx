"use client";

import Link from "next/link";
import { formatDateTime, formatINR } from "@repo/types";
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
import { PackagePlus, ClipboardList } from "lucide-react";

import { useVendorAnalyticsQuery, useVendorOrdersQuery } from "@/features/api";
import { StatsGrid, PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorDashboard() {
  const { data: analytics, isLoading } = useVendorAnalyticsQuery();
  const { data: orders, isLoading: oLoading } = useVendorOrdersQuery({
    pageSize: 5,
  });

  const stats = [
    { label: "Deliveries today", value: analytics?.deliveriesToday ?? "—" },
    {
      label: "Income today",
      value: analytics ? formatINR(analytics.incomeToday) : "—",
    },
    {
      label: "Monthly income",
      value: analytics ? formatINR(analytics.monthlyIncome) : "—",
    },
    { label: "Active customers", value: analytics?.activeCustomers ?? "—" },
    { label: "Closed customers", value: analytics?.closedCustomers ?? "—" },
    { label: "New this month", value: analytics?.newCustomersThisMonth ?? "—" },
  ];

  return (
    <>
      <PageHeader
        title="Business dashboard"
        description="Deliveries, income and customer activity."
        action={
          <Button asChild variant="accent">
            <Link href="/vendor/orders">
              <ClipboardList /> View orders
            </Link>
          </Button>
        }
      />

      <StatsGrid stats={stats} loading={isLoading} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Daily sales</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.dailySales ?? []}>
                  <defs>
                    <linearGradient id="daily" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip formatter={(v) => [formatINR(Number(v)), "Revenue"]} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--accent)"
                    fill="url(#daily)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Monthly sales</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.monthlySales ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip formatter={(v) => [formatINR(Number(v)), "Revenue"]} />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Jar delivery trend</CardTitle>
            <CardDescription>Jars delivered, last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.jarDeliveryTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip formatter={(v) => [`${v} jars`, "Delivered"]} />
                  <Bar dataKey="jars" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Newest incoming orders</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {oLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : orders && orders.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.items.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/vendor/orders/${o.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                    <TableCell>{formatINR(o.grandTotal)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <PackagePlus className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                Customer orders will appear here. Set up products first.
              </p>
              <Button asChild>
                <Link href="/vendor/products">Add products</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}