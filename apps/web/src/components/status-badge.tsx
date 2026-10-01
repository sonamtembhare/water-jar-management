import type { OrderStatus, PaymentStatus, VendorStatus, UserStatus } from "@repo/types";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  USER_STATUS_LABELS,
  VENDOR_STATUS_LABELS,
} from "@repo/types";

import { Badge } from "@/components/ui/badge";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] =
    status === "delivered"
      ? "success"
      : status === "cancelled"
        ? "destructive"
        : status === "pending"
          ? "warning"
          : status === "out_for_delivery"
            ? "accent"
            : "info";
  return <Badge variant={variant}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] =
    status === "paid"
      ? "success"
      : status === "refunded"
        ? "info"
        : status === "failed"
          ? "destructive"
          : "warning";
  return <Badge variant={variant}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] =
    status === "approved"
      ? "success"
      : status === "rejected"
        ? "destructive"
        : "warning";
  return <Badge variant={variant}>{VENDOR_STATUS_LABELS[status]}</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] =
    status === "active" ? "success" : "destructive";
  return <Badge variant={variant}>{USER_STATUS_LABELS[status]}</Badge>;
}

export function CustomerRelationStatusBadge({
  status,
}: {
  status: "running" | "closed";
}) {
  return (
    <Badge variant={status === "running" ? "success" : "outline"}>
      {status === "running" ? "Running" : "Closed"}
    </Badge>
  );
}