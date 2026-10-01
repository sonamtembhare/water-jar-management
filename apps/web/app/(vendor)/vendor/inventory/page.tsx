"use client";

import { useState } from "react";
import { formatDateTime, formatINR } from "@repo/types";
import { Boxes, Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { useInventoryQuery, useRestockMutation } from "@/features/api";
import { PageHeader } from "@/components/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function VendorInventoryPage() {
  const { data, isLoading } = useInventoryQuery();

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock levels and movement history."
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Current stock</CardTitle>
          <CardDescription>Restock jars that are running low</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">In stock</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="w-44">Restock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.sizeLiters} L</TableCell>
                    <TableCell className="text-right">{p.availableStock}</TableCell>
                    <TableCell className="text-right">
                      {p.availableStock === 0 ? (
                        <Badge variant="destructive">Out of stock</Badge>
                      ) : p.availableStock < 20 ? (
                        <Badge variant="warning">Low</Badge>
                      ) : (
                        <Badge variant="success">Healthy</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <RestockForm productId={p.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Boxes className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No products tracked</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle>Movement history</CardTitle>
          <CardDescription>Recent stock changes (last 50)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.log.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.log.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.productName}</TableCell>
                    <TableCell
                      className={
                        l.change > 0
                          ? "text-right font-medium text-emerald-600"
                          : "text-right font-medium text-destructive"
                      }
                    >
                      {l.change > 0 ? `+${l.change}` : l.change}
                    </TableCell>
                    <TableCell className="capitalize">{l.reason}</TableCell>
                    <TableCell>{formatDateTime(l.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No stock movements recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function RestockForm({ productId }: { productId: string }) {
  const [qty, setQty] = useState("10");
  const [restock, { isLoading }] = useRestockMutation();

  async function handleRestock() {
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Enter a valid quantity");
      return;
    }
    try {
      await restock({ productId, quantity }).unwrap();
      toast.success(`Restocked +${quantity}`);
      setQty("10");
    } catch {
      toast.error("Restock failed");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={`restock-${productId}`} className="sr-only">
        Quantity
      </Label>
      <Input
        id={`restock-${productId}`}
        type="number"
        min="1"
        className="w-20"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />
      <Button size="sm" variant="accent" onClick={handleRestock} disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : <PackagePlus />}
        Restock
      </Button>
    </div>
  );
}