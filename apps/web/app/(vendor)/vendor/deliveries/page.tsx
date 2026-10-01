"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Minus, Plus, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, formatINR } from "@repo/types";

import {
  useCreateVendorDeliveryMutation,
  useVendorCustomersQuery,
  useVendorDeliveriesQuery,
  useVendorProductsQuery,
} from "@/features/api";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { OrderStatusBadge } from "@/components/status-badge";
import type { OrderStatus, Product } from "@repo/types";

interface Line {
  product: Product;
  qty: number;
}

export default function VendorDeliveriesPage() {
  const { data, isLoading } = useVendorDeliveriesQuery({ pageSize: 50 });

  return (
    <>
      <PageHeader
        title="Record delivery"
        description="Log a delivery for one of your customers. It becomes a pending order you can dispatch."
      />

      <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
        <NewDeliveryForm />

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Deliveries</CardTitle>
            <CardDescription>
              {data?.total ?? 0} delivery record{data?.total === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (data?.deliveries.length ?? 0) > 0 ? (
              <div className="divide-y">
                {data!.deliveries.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/vendor/orders/${d.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {d.orderNumber}
                        </Link>
                        <OrderStatusBadge status={d.status as OrderStatus} />
                      </div>
                      <p className="mt-1">
                        <span className="font-medium">{d.customerName}</span>
                        {d.customerPhone ? ` · ${d.customerPhone}` : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {d.items
                          .map((i) => `${i.quantity} x ${i.productName} (${i.sizeLiters}L)`)
                          .join(", ")}
                      </p>
                      {d.notes && <p className="mt-1 text-muted-foreground">Note: {d.notes}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(d.createdAt)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatINR(d.grandTotal)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No deliveries recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function NewDeliveryForm() {
  const { data: customerData } = useVendorCustomersQuery({ pageSize: 100 });
  const { data: productData } = useVendorProductsQuery();
  const [createDelivery, { isLoading }] = useCreateVendorDeliveryMutation();

  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const customers = (customerData?.customers ?? []).filter(
    (c) => c.status === "running",
  );
  const products = (productData?.products ?? []).filter((p) => p.active);
  const selected = customers.find((c) => c.id === customerId);

  const totals = lines.reduce(
    (acc, l) => {
      acc.products += l.product.pricePerJar * l.qty;
      acc.deposits += l.product.depositPerJar * l.qty;
      return acc;
    },
    { products: 0, deposits: 0 },
  );

  function addLine(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, qty: Math.min(l.qty + 1, Math.max(l.product.availableStock, 1)) }
            : l,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.product.id === productId ? { ...l, qty: Math.max(0, l.qty + delta) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function reset() {
    setCustomerId("");
    setLines([]);
    setNotes("");
    setAddress("");
    setPhone("");
  }

  async function submit() {
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one jar");
      return;
    }
    try {
      const order = await createDelivery({
        customerId,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
        notes: notes.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      }).unwrap();
      toast.success(`Delivery ${order.orderNumber} created`);
      reset();
    } catch {
      toast.error("Could not create the delivery. Check stock and customer details.");
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle>New delivery</CardTitle>
        <CardDescription>
          Only customers added by your business can receive a delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="grid gap-1.5">
          <Label htmlFor="delivery-customer">Customer</Label>
          <Select
            value={customerId}
            onValueChange={(v) => {
              setCustomerId(v);
              const c = customers.find((x) => x.id === v);
              setAddress(c?.address ?? "");
              setPhone(c?.phone ?? "");
            }}
          >
            <SelectTrigger id="delivery-customer" className="w-full">
              <SelectValue placeholder="Select a running customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.customerId}>
                  {c.name} {c.email ? `(${c.email})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {customers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No running customers yet. Add one from the Customers page.
            </p>
          )}
        </div>

        {customerId && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="delivery-phone">Phone</Label>
              <Input
                id="delivery-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={selected?.phone ?? "Customer phone"}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="delivery-address">Delivery address</Label>
              <Textarea
                id="delivery-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={selected?.address ?? "Customer address"}
              />
            </div>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label>Jars</Label>
          <div className="grid gap-2">
            {products.map((p) => {
              const line = lines.find((l) => l.product.id === p.id);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="text-sm">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-muted-foreground">
                      {p.sizeLiters} L · {formatINR(p.pricePerJar)} · {p.availableStock} in stock
                    </p>
                  </div>
                  {line ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changeQty(p.id, -1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-6 text-center font-medium">{line.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={line.qty >= p.availableStock}
                        onClick={() => changeQty(p.id, 1)}
                      >
                        <Plus />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remove"
                        onClick={() =>
                          setLines((prev) => prev.filter((l) => l.product.id !== p.id))
                        }
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={p.availableStock === 0}
                      onClick={() => addLine(p)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground">No active jar sizes available.</p>
            )}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="delivery-notes">Delivery note (optional)</Label>
          <Textarea
            id="delivery-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Left with the security guard"
          />
        </div>

        {lines.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg bg-muted px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Products</span>
              <span>{formatINR(totals.products)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposits</span>
              <span>{formatINR(totals.deposits)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatINR(totals.products + totals.deposits)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={submit}
          disabled={isLoading || !customerId || lines.length === 0}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Truck />}
          Create delivery
        </Button>
      </CardContent>
    </Card>
  );
}
