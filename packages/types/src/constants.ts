export const USER_ROLES = ["super_admin", "vendor", "customer"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_STATUSES = ["active", "blocked"] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const VENDOR_STATUSES = ["pending", "approved", "rejected"] as const
export type VendorStatus = (typeof VENDOR_STATUSES)[number]

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_METHODS = ["cash", "online"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_STATUSES = ["created", "paid", "failed", "refunded"] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const INVENTORY_REASONS = [
  "sale",
  "refund",
  "restock",
  "lost",
  "damaged",
] as const
export type InventoryReason = (typeof INVENTORY_REASONS)[number]

export type NotificationType =
  | "order_placed"
  | "order_accepted"
  | "order_rejected"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_cancelled"
  | "payment_received"
  | "payment_failed"
  | "vendor_approved"
  | "vendor_rejected"
  | "vendor_application_submitted"
  | "vendor_application_status"
  | "vendor_blocked"
  | "vendor_unblocked"
  | "new_order"
  | "payment_pending"
  | "customer_added"
  | "customer_closed"
  | "customer_reopened"
  | "delivery_created"
  | "reminder"
  | "general"

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  created: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
}

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  blocked: "Blocked",
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash on delivery",
  online: "Online (Razorpay)",
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}