"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@repo/types";

import {
  useCreateCustomerPriceMutation,
  useCustomerPricesQuery,
  useDeleteCustomerPriceMutation,
  useUpdateCustomerPriceMutation,
  useVendorProductsQuery,
} from "@/features/api";
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

interface Props {
  customerId: string;
  customerName: string;
}

export function CustomerPricingCard({ customerId, customerName }: Props) {
  const { data: prices, isLoading } = useCustomerPricesQuery(customerId);
  const { data: productData } = useVendorProductsQuery();
  const [createPrice, { isLoading: creating }] = useCreateCustomerPriceMutation();
  const [updatePrice, { isLoading: updating }] = useUpdateCustomerPriceMutation();
  const [removePrice, { isLoading: removing }] = useDeleteCustomerPriceMutation();

  const [adding, setAdding] = useState(false);
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const allProducts = productData?.products ?? [];
  const pricedIds = new Set((prices?.prices ?? []).map((p) => p.productId));
  const available = allProducts.filter((p) => p.active && !pricedIds.has(p.id));

  const resetAdd = () => {
    setAdding(false);
    setProductId("");
    setAmount("");
  };

  const submitAdd = async () => {
    const value = Number(amount);
    if (!productId) {
      toast.error("Select a jar size");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a price greater than 0");
      return;
    }
    try {
      await createPrice({
        customerId,
        body: { productId, pricePerJar: value },
      }).unwrap();
      toast.success("Custom price saved");
      resetAdd();
    } catch {
      toast.error("Could not save the price");
    }
  };

  const submitEdit = async (priceId: string) => {
    const value = Number(editingValue);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a price greater than 0");
      return;
    }
    try {
      await updatePrice({
        customerId,
        priceId,
        body: { pricePerJar: value },
      }).unwrap();
      toast.success("Price updated");
      setEditingId(null);
      setEditingValue("");
    } catch {
      toast.error("Could not update the price");
    }
  };

  const submitDelete = async (priceId: string, label: string) => {
    if (!confirm(`Remove the custom ${label} price for ${customerName}? The standard price will apply again.`))
      return;
    try {
      await removePrice({ customerId, priceId }).unwrap();
      toast.success("Custom price removed");
      if (editingId === priceId) setEditingId(null);
    } catch {
      toast.error("Could not remove the price");
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Custom jar prices</CardTitle>
            <CardDescription>
              Set a special price per jar size for {customerName}. The refundable jar deposit
              stays the same.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={available.length === 0}
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? <X /> : <Plus />}
            {adding ? "Cancel" : "Add price"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {adding && (
          <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label htmlFor="price-product">Jar size</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="price-product" className="w-full">
                  <SelectValue placeholder="Select a jar size" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sizeLiters}L) — {formatINR(p.pricePerJar)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="price-amount">Price per jar</Label>
              <Input
                id="price-amount"
                type="number"
                min="1"
                step="0.5"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="40"
              />
            </div>
            <Button onClick={submitAdd} disabled={creating}>
              {creating && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (prices?.prices.length ?? 0) > 0 ? (
          <div className="grid gap-2">
            {prices!.prices.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    {p.productName} ({p.sizeLiters}L)
                  </p>
                  <p className="text-muted-foreground">
                    Standard {formatINR(p.basePrice)} · Deposit {formatINR(p.baseDeposit)}
                  </p>
                </div>

                {editingId === p.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      step="0.5"
                      inputMode="decimal"
                      className="w-28"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => submitEdit(p.id)}
                      disabled={updating}
                    >
                      {updating && <Loader2 className="animate-spin" />}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{formatINR(p.pricePerJar)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit price"
                      onClick={() => {
                        setEditingId(p.id);
                        setEditingValue(String(p.pricePerJar));
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Remove custom price"
                      onClick={() => submitDelete(p.id, `${p.sizeLiters}L`)}
                      disabled={removing}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No custom prices yet. {customerName} pays the standard price for every jar size.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
