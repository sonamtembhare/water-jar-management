"use client";

import Link from "next/link";
import { formatDateTime, formatINR } from "@repo/types";
import { Plus, Sparkles } from "lucide-react";

import { useAnalyticsOverviewQuery, useCustomerOrdersQuery } from "@/features/api";
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

export default function CustomerDashboard() {
  const { data: analytics, isLoading: aLoading } = useAnalyticsOverviewQuery();
  const { data: orders, isLoading: oLoading } = useCustomerOrdersQuery({
    pageSize: 5,
  });

  const stats = [
    { label: "Total orders", value: analytics?.totalOrders ?? "—" },
    { label: "Delivered", value: analytics?.deliveredOrders ?? "—" },
    { label: "Active", value: analytics?.activeOrders ?? "—" },
    {
      label: "Money spent",
      value: analytics ? formatINR(analytics.totalRevenue) : "—",
    },
  ];

  return (
    <>
      <PageHeader
        title="My water"
        description="Track your jars, deposits and deliveries."
        action={
          <Button asChild>
            <Link href="/catalog">
              <Plus /> Order water
            </Link>
          </Button>
        }
      />

      <StatsGrid stats={stats} loading={aLoading} />

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Your latest water orders</CardDescription>
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
                        href={`/customer/orders/${o.id}`}
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
              <Sparkles className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                Pick a vendor and order jars to get started.
              </p>
              <Button asChild variant="accent">
                <Link href="/catalog">Browse vendors</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}