"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vendorCustomerCreateSchema,
  vendorCustomerUpdateSchema,
  type VendorCustomerCreateInput,
  type VendorCustomerUpdateInput,
} from "@repo/types";
import { formatDateTime, formatINR } from "@repo/types";
import { Loader2, Pencil, Plus, RotateCcw, Search, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateVendorCustomerMutation,
  useUpdateVendorCustomerMutation,
  useUpdateVendorCustomerStatusMutation,
  useVendorCustomersQuery,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { CustomerRelationStatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { VendorCustomerListItem } from "@repo/types";

export default function VendorCustomersPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, isLoading } = useVendorCustomersQuery({ search: q });

  return (
    <>
      <PageHeader
        title="Customers"
        description="Customers added by your business."
        action={<AddCustomerDialog />}
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>All customers</CardTitle>
          <CardDescription>
            {data?.total ?? 0} customer{data?.total === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b p-4">
            <Input
              placeholder="Search by name, email or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setQ(search.trim());
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQ(search.trim())}
              aria-label="Search customers"
            >
              <Search />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.customers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Total spent</TableHead>
                    <TableHead>Added on</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.email}</p>
                      </TableCell>
                      <TableCell>{c.phone ?? "—"}</TableCell>
                      <TableCell>
                        <CustomerRelationStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell>{c.totalOrders}</TableCell>
                      <TableCell>{c.deliveredOrders}</TableCell>
                      <TableCell>{formatINR(c.totalSpent)}</TableCell>
                      <TableCell>{formatDateTime(c.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="View details">
                            <Link href={`/vendor/customers/${c.id}`}>
                              <UserRound />
                            </Link>
                          </Button>
                          <EditCustomerDialog customer={c} />
                          <CustomerStatusButton customer={c} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <UserRound className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No customers yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first customer to get started.
              </p>
              <AddCustomerDialog />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [create, { isLoading }] = useCreateVendorCustomerMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorCustomerCreateInput>({
    resolver: zodResolver(vendorCustomerCreateSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", address: "" },
  });

  async function onSubmit(values: VendorCustomerCreateInput) {
    try {
      await create(values).unwrap();
      toast.success(`${values.name} added`);
      reset();
      setOpen(false);
    } catch (e) {
      const msg =
        (e as { data?: { error?: string } })?.data?.error ??
        "Could not add customer (email may already exist)";
      toast.error(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent">
          <Plus /> Add customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a customer</DialogTitle>
          <DialogDescription>
            The customer gets login access to the customer portal with the password you set.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Mobile</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />} Save customer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCustomerDialog({ customer }: { customer: VendorCustomerListItem }) {
  const [open, setOpen] = useState(false);
  const [update, { isLoading }] = useUpdateVendorCustomerMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorCustomerUpdateInput>({
    resolver: zodResolver(vendorCustomerUpdateSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone ?? "",
      address: customer.address ?? "",
    },
  });

  async function onSubmit(values: VendorCustomerUpdateInput) {
    try {
      await update({ id: customer.id, body: values }).unwrap();
      toast.success("Customer updated");
      setOpen(false);
    } catch {
      toast.error("Could not update customer");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          reset({
            name: customer.name,
            phone: customer.phone ?? "",
            address: customer.address ?? "",
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title={`Edit ${customer.name}`}>
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {customer.name}</DialogTitle>
          <DialogDescription>Update customer details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`name-${customer.id}`}>Full name</Label>
            <Input id={`name-${customer.id}`} {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`phone-${customer.id}`}>Mobile</Label>
            <Input id={`phone-${customer.id}`} {...register("phone")} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`address-${customer.id}`}>Address</Label>
            <Input id={`address-${customer.id}`} {...register("address")} />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />} Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerStatusButton({ customer }: { customer: VendorCustomerListItem }) {
  const [setStatus, { isLoading }] = useUpdateVendorCustomerStatusMutation();
  const closing = customer.status === "running";

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isLoading}
      title={closing ? `Close ${customer.name}` : `Reopen ${customer.name}`}
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
    </Button>
  );
}