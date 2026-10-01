"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail, MapPin, Phone, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, formatINR } from "@repo/types";

import {
  useUpdateVendorCustomerStatusMutation,
  useVendorCustomerDetailQuery,
} from "@/features/api";
import { CustomerPricingCard } from "./pricing-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerRelationStatusBadge, OrderStatusBadge } from "@/components/status-badge";
import type { OrderStatus } from "@repo/types";

export default function VendorCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: customer, isLoading } = useVendorCustomerDetailQuery(id);
  const [setStatus, { isLoading: updating }] = useUpdateVendorCustomerStatusMutation();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="font-medium">Customer not found</p>
        <Button asChild variant="outline">
          <Link href="/vendor/customers">Back to customers</Link>
        </Button>
      </div>
    );
  }

  const closing = customer.status === "running";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" title="Back to customers">
            <Link href="/vendor/customers">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              {customer.name}
              <CustomerRelationStatusBadge status={customer.status} />
            </h1>
            <p className="text-sm text-muted-foreground">
              Added on {formatDateTime(customer.createdAt)}
            </p>
          </div>
        </div>
        <Button
          variant={closing ? "destructive" : "default"}
          disabled={updating}
          onClick={async () => {
            const msg = closing
              ? `Close the account of ${customer.name}? They will not be able to place new orders until reopened.`
              : `Reopen the account of ${customer.name}?`;
            if (!confirm(msg)) return;
            try {
              await setStatus({ id: customer.id, status: closing ? "closed" : "running" }).unwrap();
              toast.success(closing ? "Customer account closed" : "Customer account reopened");
            } catch {
              toast.error("Could not update account status");
            }
          }}
        >
          {closing ? <XCircle /> : <RotateCcw />}
          {closing ? "Close account" : "Reopen account"}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              <span className="font-medium">Mobile:</span>
              <span>{customer.phone ?? "—"}</span>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <MapPin className="size-4 text-muted-foreground" />
              <span className="font-medium">Address:</span>
              <span>{customer.address ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total orders</span>
              <span className="font-semibold">{customer.totalOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivered orders</span>
              <span className="font-semibold">{customer.deliveredOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total spent</span>
              <span className="font-semibold">{formatINR(customer.totalSpent)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last order</span>
              <span className="font-semibold">{formatDateTime(customer.lastOrderAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <CustomerPricingCard customerId={customer.id} customerName={customer.name} />

      <Card className="mt-4">
        <CardHeader className="border-b">
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest orders placed with your business.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {customer.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.recentOrders.map((o) => (
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
                        <OrderStatusBadge status={o.status as OrderStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No orders placed yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}