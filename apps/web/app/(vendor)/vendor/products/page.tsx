"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import {
  formatINR,
  productCreateSchema,
  type Product,
  type ProductCreateInput,
} from "@repo/types";
import { Loader2, Pencil, Plus, Power, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import {
  useChangeProductPriceMutation,
  useCreateProductMutation,
  useToggleProductMutation,
  useUpdateProductMutation,
  useVendorProductsQuery,
} from "@/features/api";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorProductsPage() {
  const { data, isLoading } = useVendorProductsQuery();

  return (
    <>
      <PageHeader
        title="Products"
        description="Your jar catalogue, pricing and stock levels."
        action={<ProductFormDialog existing={null} />}
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Catalogue</CardTitle>
          <CardDescription>{data?.total ?? 0} products</CardDescription>
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
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Deposit</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.sizeLiters} L</TableCell>
                    <TableCell className="text-right">{formatINR(p.pricePerJar)}</TableCell>
                    <TableCell className="text-right">{formatINR(p.depositPerJar)}</TableCell>
                    <TableCell className="text-right">{p.availableStock}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "success" : "outline"}>
                        {p.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <PriceDialog product={p} />
                        <ProductFormDialog existing={p} />
                        <ToggleProductButton product={p} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="font-medium">No products yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first water jar product to start selling.
              </p>
              <ProductFormDialog existing={null} />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ToggleProductButton({ product }: { product: Product }) {
  const [toggle, { isLoading }] = useToggleProductMutation();
  return (
    <Button
      variant="ghost"
      size="icon"
      title={product.active ? "Deactivate" : "Activate"}
      disabled={isLoading}
      onClick={async () => {
        try {
          await toggle(product.id).unwrap();
          toast.success(product.active ? "Product deactivated" : "Product activated");
        } catch {
          toast.error("Action failed");
        }
      }}
    >
      <Power />
    </Button>
  );
}

function PriceDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [changePrice, { isLoading }] = useChangeProductPriceMutation();
  const [price, setPrice] = useState(String(product.pricePerJar));
  const [deposit, setDeposit] = useState(String(product.depositPerJar));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Change price">
          <TrendingUp />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update pricing</DialogTitle>
          <DialogDescription>
            {product.name} — price changes are recorded in history.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`price-${product.id}`}>Price per jar (₹)</Label>
            <Input
              id={`price-${product.id}`}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`deposit-${product.id}`}>Deposit per jar (₹)</Label>
            <Input
              id={`deposit-${product.id}`}
              type="number"
              min="0"
              step="0.01"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
          <Button
            disabled={isLoading}
            onClick={async () => {
              try {
                await changePrice({
                  id: product.id,
                  pricePerJar: Number(price),
                  depositPerJar: Number(deposit),
                }).unwrap();
                toast.success("Price updated");
                setOpen(false);
              } catch {
                toast.error("Invalid price");
              }
            }}
          >
            {isLoading && <Loader2 className="animate-spin" />} Save price
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductFormDialog({ existing }: { existing: Product | null }) {
  const [open, setOpen] = useState(false);
  const [create, { isLoading: creating }] = useCreateProductMutation();
  const [update, { isLoading: updating }] = useUpdateProductMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema) as unknown as Resolver<ProductCreateInput>,
    defaultValues: existing
      ? {
          name: existing.name,
          description: existing.description ?? "",
          sizeLiters: Number(existing.sizeLiters),
          pricePerJar: existing.pricePerJar,
          depositPerJar: existing.depositPerJar,
          availableStock: existing.availableStock,
        }
      : {
          name: "",
          description: "",
          sizeLiters: 20,
          pricePerJar: 0,
          depositPerJar: 0,
          availableStock: 0,
        },
  });

  async function onSubmit(values: ProductCreateInput) {
    try {
      if (existing) {
        await update({ id: existing.id, body: values }).unwrap();
      } else {
        await create(values).unwrap();
      }
      toast.success(existing ? "Product updated" : "Product created");
      setOpen(false);
    } catch {
      toast.error("Could not save product");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={existing ? "ghost" : "default"}
          size={existing ? "icon" : "default"}
          title={existing ? "Edit product" : undefined}
        >
          {existing ? <Pencil /> : (
            <>
              <Plus /> Add product
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Define jar size, pricing and starting stock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" {...register("name")} placeholder="20L Water Bottle" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sizeLiters">Size (L)</Label>
              <Input id="sizeLiters" type="number" min="0" step="0.1" {...register("sizeLiters")} />
              {errors.sizeLiters && <p className="text-sm text-destructive">{errors.sizeLiters.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="availableStock">Stock</Label>
              <Input id="availableStock" type="number" min="0" step="1" {...register("availableStock")} />
              {errors.availableStock && <p className="text-sm text-destructive">{errors.availableStock.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pricePerJar">Price (₹)</Label>
              <Input id="pricePerJar" type="number" min="0" step="0.01" {...register("pricePerJar")} />
              {errors.pricePerJar && <p className="text-sm text-destructive">{errors.pricePerJar.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="depositPerJar">Deposit (₹)</Label>
              <Input id="depositPerJar" type="number" min="0" step="0.01" {...register("depositPerJar")} />
              {errors.depositPerJar && <p className="text-sm text-destructive">{errors.depositPerJar.message}</p>}
            </div>
          </div>
          <Button type="submit" disabled={creating || updating}>
            {(creating || updating) && <Loader2 className="animate-spin" />} Save product
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}