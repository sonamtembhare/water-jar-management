"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatINR } from "@repo/types";
import { Ban, CheckCircle2, Search, Users } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminCustomersQuery,
  useAdminVendorsQuery,
  useUpdateUserStatusMutation,
} from "@/features/api";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [vendorId, setVendorId] = useState("__all");
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: vendorData } = useAdminVendorsQuery({});
  const { data, isLoading } = useAdminCustomersQuery({
    search: debounced || undefined,
    vendorId: vendorId === "__all" ? undefined : vendorId,
  });

  const detail = data?.customers.find((c) => c.id === detailId) ?? null;

  return (
    <>
      <PageHeader
        title="Customers"
        description="View every customer and filter by the vendor they order from."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Filter by vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All vendors</SelectItem>
                {(vendorData?.vendors ?? []).map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>All customers</CardTitle>
          <CardDescription>{data?.total ?? 0} customers</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Vendors</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.email} {c.phone ? `· ${c.phone}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>{c.city ?? "—"}</TableCell>
                    <TableCell>
                      <div>{c.totalOrders}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.deliveredOrders} delivered
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-52 flex-wrap gap-1">
                        {c.vendorsOrderedFrom.length > 0 ? (
                          c.vendorsOrderedFrom.map((v) => (
                            <span
                              key={v.vendorId}
                              className="rounded-full bg-accent px-2 py-0.5 text-xs"
                            >
                              {v.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(c.createdAt)}</TableCell>
                    <TableCell>
                      <UserStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailId(c.id)}
                        >
                          View
                        </Button>
                        <CustomerStatusButton
                          userId={c.userId}
                          status={c.status}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Users className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No customers match your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.name ?? "Customer details"}</DialogTitle>
            <DialogDescription>
              {detail?.email} {detail?.phone ? `· ${detail.phone}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail stat="Status" value={detail.status} />
                <Detail stat="Joined" value={formatDateTime(detail.createdAt)} />
                <Detail
                  stat="Address"
                  value={[detail.address, detail.city, detail.pinCode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                />
                <Detail stat="Spent" value={formatINR(detail.totalSpent)} />
                <Detail stat="Orders" value={`${detail.totalOrders}`} />
                <Detail stat="Delivered" value={`${detail.deliveredOrders}`} />
              </div>
              {detail.vendorsOrderedFrom.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold">Orders from</p>
                  <div className="flex flex-wrap gap-1">
                    {detail.vendorsOrderedFrom.map((v) => (
                      <span
                        key={v.vendorId}
                        className="rounded-full bg-accent px-2 py-0.5 text-xs"
                      >
                        {v.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ stat, value }: { stat: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border px-3 py-2">
      <span className="text-xs text-muted-foreground">{stat}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function CustomerStatusButton({
  userId,
  status,
}: {
  userId: string;
  status: "active" | "blocked";
}) {
  const [update, { isLoading }] = useUpdateUserStatusMutation();
  const next = status === "active" ? "blocked" : "active";
  return (
    <Button
      size="sm"
      variant={status === "active" ? "ghost" : "default"}
      className={status === "active" ? "text-muted-foreground" : undefined}
      disabled={isLoading}
      onClick={async () => {
        if (next === "blocked" && !confirm("Block this customer?")) return;
        try {
          await update({ id: userId, body: { status: next } }).unwrap();
          toast.success(next === "active" ? "Customer unblocked" : "Customer blocked");
        } catch {
          toast.error("Action failed");
        }
      }}
    >
      {status === "active" ? <Ban /> : <CheckCircle2 />}
      {status === "active" ? "Block" : "Unblock"}
    </Button>
  );
}