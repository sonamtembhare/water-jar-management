"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatINR } from "@repo/types";
import { Ban, Check, CheckCircle2, Search, Store, X } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminBlockVendorMutation,
  useAdminVendorDetailQuery,
  useAdminVendorsQuery,
  useUpdateVendorStatusMutation,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VendorStatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminVendorsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useAdminVendorsQuery({
    search: debounced || undefined,
  });

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Approve applications, block/unblock, and inspect suppliers."
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, owner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 pl-9"
            />
          </div>
        }
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>All vendors</CardTitle>
          <CardDescription>
            {data?.total ?? 0} registered ·{" "}
            {data?.vendors.filter((v) => v.blocked).length ?? 0} shown blocked
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.vendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.address ?? "—"} · {v.staffCount} staff
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{v.ownerName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.ownerEmail ?? ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.approvedAt ? formatDateTime(v.approvedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <VendorStatusBadge status={v.status} />
                        {v.blocked && <Badge variant="destructive">Blocked</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(v.id)}>
                          Details
                        </Button>
                        {v.status === "approved" && (
                          <BlockButton id={v.id} blocked={v.blocked} />
                        )}
                        {v.status !== "approved" && (
                          <ApproveButton id={v.id} />
                        )}
                        {v.status !== "rejected" && (
                          <RejectButton id={v.id} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Store className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No vendors match your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
      <VendorDetailsDialog
        vendorId={detailId}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}

function BlockButton({ id, blocked }: { id: string; blocked: boolean }) {
  const [block, { isLoading }] = useAdminBlockVendorMutation();
  return (
    <Button
      size="sm"
      variant={blocked ? "default" : "ghost"}
      className={blocked ? undefined : "text-muted-foreground"}
      disabled={isLoading}
      onClick={async () => {
        const next = !blocked;
        if (next && !confirm("Block this vendor? Their login and catalog access will be disabled."))
          return;
        try {
          await block({ id, body: { blocked: next } }).unwrap();
          toast.success(next ? "Vendor blocked" : "Vendor unblocked");
        } catch {
          toast.error("Action failed");
        }
      }}
    >
      {blocked ? <CheckCircle2 /> : <Ban />}
      {blocked ? "Unblock" : "Block"}
    </Button>
  );
}

function ApproveButton({ id }: { id: string }) {
  const [update, { isLoading }] = useUpdateVendorStatusMutation();
  return (
    <Button
      size="sm"
      variant="default"
      disabled={isLoading}
      onClick={async () => {
        try {
          await update({ id, body: { status: "approved" } }).unwrap();
          toast.success("Vendor approved");
        } catch {
          toast.error("Action failed");
        }
      }}
    >
      <Check /> Approve
    </Button>
  );
}

function RejectButton({ id }: { id: string }) {
  const [update, { isLoading }] = useUpdateVendorStatusMutation();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground"
      disabled={isLoading}
      onClick={async () => {
        if (!confirm("Reject this vendor application?")) return;
        try {
          await update({ id, body: { status: "rejected" } }).unwrap();
          toast.success("Vendor rejected");
        } catch {
          toast.error("Action failed");
        }
      }}
    >
      <X /> Reject
    </Button>
  );
}

function VendorDetailsDialog({
  vendorId,
  onClose,
}: {
  vendorId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useAdminVendorDetailQuery(vendorId ?? "", {
    skip: !vendorId,
  });

  return (
    <Dialog open={Boolean(vendorId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.name ?? "Vendor details"}</DialogTitle>
          <DialogDescription>
            {isLoading && "Loading…"}
            {data &&
              `${data.staff.length} staff · ${data.activeProductCount} of ${data.productCount} products active · ${data.totalOrders} orders`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Owner" value={data.ownerName ?? "—"} />
              <InfoRow label="Owner email" value={data.ownerEmail ?? "—"} />
              <InfoRow label="Address" value={data.address ?? "—"} />
              <InfoRow label="Phone" value={data.phone ?? "—"} />
              <InfoRow label="GSTIN" value={data.gstin ?? "—"} />
              <InfoRow
                label="Blocked"
                value={data.blocked ? `Yes${data.blockedAt ? ` (${formatDateTime(data.blockedAt)})` : ""}` : "No"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Total orders" value={data.totalOrders} />
              <MiniStat label="Delivered" value={data.deliveredOrders} />
              <MiniStat label="Pending" value={data.pendingOrders} />
              <MiniStat label="Revenue" value={formatINR(data.revenue)} />
            </div>

            {data.staff.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Team ({data.staff.length})</p>
                <ul className="flex flex-col gap-1">
                  {data.staff.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.email} · {s.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}