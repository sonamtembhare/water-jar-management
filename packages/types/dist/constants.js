"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_METHOD_LABELS = exports.USER_STATUS_LABELS = exports.VENDOR_STATUS_LABELS = exports.PAYMENT_STATUS_LABELS = exports.ORDER_STATUS_LABELS = exports.INVENTORY_REASONS = exports.PAYMENT_STATUSES = exports.PAYMENT_METHODS = exports.ORDER_STATUSES = exports.VENDOR_STATUSES = exports.USER_STATUSES = exports.USER_ROLES = void 0;
exports.formatINR = formatINR;
exports.formatDateTime = formatDateTime;
exports.formatDate = formatDate;
exports.USER_ROLES = ["super_admin", "vendor", "customer"];
exports.USER_STATUSES = ["active", "blocked"];
exports.VENDOR_STATUSES = ["pending", "approved", "rejected"];
exports.ORDER_STATUSES = [
    "pending",
    "accepted",
    "out_for_delivery",
    "delivered",
    "cancelled",
];
exports.PAYMENT_METHODS = ["cash", "online"];
exports.PAYMENT_STATUSES = ["created", "paid", "failed", "refunded"];
exports.INVENTORY_REASONS = [
    "sale",
    "refund",
    "restock",
    "lost",
    "damaged",
];
exports.ORDER_STATUS_LABELS = {
    pending: "Pending",
    accepted: "Accepted",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
};
exports.PAYMENT_STATUS_LABELS = {
    created: "Awaiting payment",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
};
exports.VENDOR_STATUS_LABELS = {
    pending: "Pending approval",
    approved: "Approved",
    rejected: "Rejected",
};
exports.USER_STATUS_LABELS = {
    active: "Active",
    blocked: "Blocked",
};
exports.PAYMENT_METHOD_LABELS = {
    cash: "Cash on delivery",
    online: "Online (Razorpay)",
};
function formatINR(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    }).format(amount);
}
function formatDateTime(value) {
    if (!value)
        return "—";
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
function formatDate(value) {
    if (!value)
        return "—";
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}
