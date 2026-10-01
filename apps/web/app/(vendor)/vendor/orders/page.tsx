"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateTime, formatINR, type OrderStatus, ORDER_STATUSES } from "@repo/types";
import { ClipboardList } from "lucide-react";

import { useVendorOrdersQuery } from "@/features/api";
import { PageHeader } from "@/components/dashboard-ui";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const { data, isLoading } = useVendorOrdersQuery({
    pageSize: 25,
    status: status === "all" ? undefined : status,
  });

  return (
    <>
      <PageHeader
        title="Orders"
        description="Manage and fulfil incoming water orders."
        action={
          <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus | "all")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="capitalize">{s.replaceAll("_", " ")}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Incoming orders</CardTitle>
          <CardDescription>{data?.total ?? 0} total</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/vendor/orders/${o.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.source === "vendor_delivery" ? "accent" : "secondary"}>
                        {o.source === "vendor_delivery" ? "Logged" : "Customer"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {o.address}
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
              <ClipboardList className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No orders found</p>
              <p className="text-sm text-muted-foreground">
                Try a different status filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}