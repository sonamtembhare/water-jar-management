"use client";

import type { ReactNode } from "react";
import { formatDateTime, formatINR, type OrderDetail } from "@repo/types";

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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";

export function OrderDetailView({
  order,
  loading,
  header,
}: {
  order?: OrderDetail;
  loading: boolean;
  header?: ReactNode;
}) {
  if (loading || !order) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header && <div>{header}</div>}

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{order.orderNumber}</CardTitle>
              <CardDescription>Placed {formatDateTime(order.createdAt)}</CardDescription>
            </div>
            <div className="flex gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 py-5">
          <InfoRow label="Delivery address" value={`${order.address}${order.city ? `, ${order.city}` : ""}${order.pinCode ? ` — ${order.pinCode}` : ""}`} />
          <InfoRow label="Phone" value={order.phone} />
          {order.notes && <InfoRow label="Notes" value={order.notes} />}
          {order.scheduledFor && (
            <InfoRow label="Scheduled for" value={formatDateTime(order.scheduledFor)} />
          )}
          {order.deliveredAt && (
            <InfoRow label="Delivered at" value={formatDateTime(order.deliveredAt)} />
          )}
          {order.vendor && (
            <InfoRow label="Vendor" value={`${order.vendor.name}${order.vendor.phone ? ` · ${order.vendor.phone}` : ""}`} />
          )}
          {order.customer && (
            <InfoRow label="Customer" value={`${order.customer.name} (${order.customer.email})`} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{item.sizeLiters} L</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatINR(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatINR(item.unitDeposit)}</TableCell>
                  <TableCell className="text-right">{formatINR(item.total + item.depositTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col items-end gap-1 border-t px-6 py-4 text-sm">
            <div className="flex w-full max-w-xs justify-between">
              <span className="text-muted-foreground">Products</span>
              <span>{formatINR(order.totalAmount)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between">
              <span className="text-muted-foreground">Jar deposits</span>
              <span>{formatINR(order.depositAmount)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between border-t pt-2 text-base font-semibold">
              <span>Grand total</span>
              <span>{formatINR(order.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Delivery timeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 py-5">
            {order.deliveryEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              order.deliveryEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="mt-1 flex size-2 shrink-0 rounded-full bg-accent" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize">
                      {e.status.replaceAll("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(e.at)}
                      {e.note ? ` — ${e.note}` : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 py-5">
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment records.</p>
            ) : (
              order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize">
                      {p.method} payment
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(p.receivedAt ?? p.createdAt)}
                    </span>
                  </div>
                  <Badge variant={p.status === "paid" ? "success" : "warning"}>
                    {formatINR(p.amount)} · {p.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-right font-medium">{value}</span>
    </div>
  );
}