"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderDetailSchema = exports.deliverySchema = exports.deliveryEventSchema = exports.orderSchema = exports.orderItemSchema = exports.orderStatusUpdateSchema = exports.createOrderSchema = exports.orderItemInputSchema = void 0;
const zod_1 = require("zod");
exports.orderItemInputSchema = zod_1.z
    .object({
    productId: zod_1.z.string().uuid("Select a product"),
    quantity: zod_1.z.coerce.number().int().min(1, "Quantity must be at least 1"),
})
    .strict();
exports.createOrderSchema = zod_1.z
    .object({
    vendorId: zod_1.z.string().uuid("Select a vendor"),
    address: zod_1.z.string().min(5, "Delivery address is required"),
    city: zod_1.z.string().optional(),
    pinCode: zod_1.z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code").optional(),
    phone: zod_1.z.string().regex(/^[0-9+\-\s()]{8,15}$/, "Enter a valid phone number"),
    notes: zod_1.z.string().optional(),
    scheduledFor: zod_1.z.coerce.date().optional(),
    paymentMethod: zod_1.z.enum(["cash", "online"]).default("cash"),
    items: zod_1.z.array(exports.orderItemInputSchema).min(1, "Add at least one item"),
})
    .strict();
exports.orderStatusUpdateSchema = zod_1.z
    .object({
    status: zod_1.z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]),
    note: zod_1.z.string().optional(),
})
    .strict();
exports.orderItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderId: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid().nullable(),
    productName: zod_1.z.string(),
    sizeLiters: zod_1.z.string(),
    quantity: zod_1.z.number(),
    unitPrice: zod_1.z.number(),
    unitDeposit: zod_1.z.number(),
    total: zod_1.z.number(),
    depositTotal: zod_1.z.number(),
});
exports.orderSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderNumber: zod_1.z.string(),
    customerId: zod_1.z.string().uuid(),
    vendorId: zod_1.z.string().uuid(),
    address: zod_1.z.string(),
    city: zod_1.z.string().nullable(),
    pinCode: zod_1.z.string().nullable(),
    phone: zod_1.z.string(),
    notes: zod_1.z.string().nullable(),
    totalAmount: zod_1.z.number(),
    depositAmount: zod_1.z.number(),
    grandTotal: zod_1.z.number(),
    status: zod_1.z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]),
    source: zod_1.z.enum(["customer_order", "vendor_delivery"]),
    paymentMethod: zod_1.z.enum(["cash", "online"]),
    paymentStatus: zod_1.z.enum(["created", "paid", "failed", "refunded"]),
    scheduledFor: zod_1.z.coerce.date().nullable(),
    deliveredAt: zod_1.z.coerce.date().nullable(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.deliveryEventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    deliveryId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]),
    note: zod_1.z.string().nullable(),
    at: zod_1.z.coerce.date(),
});
exports.deliverySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]),
    assignedAt: zod_1.z.string().nullable(),
    outForDeliveryAt: zod_1.z.string().nullable(),
    deliveredAt: zod_1.z.string().nullable(),
    cancelledAt: zod_1.z.string().nullable(),
    notes: zod_1.z.string().nullable(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.orderDetailSchema = exports.orderSchema.extend({
    customer: zod_1.z
        .object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().nullable(),
        address: zod_1.z.string().nullable(),
        city: zod_1.z.string().nullable(),
        pinCode: zod_1.z.string().nullable(),
    })
        .nullable(),
    vendor: zod_1.z
        .object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        phone: zod_1.z.string().nullable(),
    })
        .nullable(),
    items: zod_1.z.array(exports.orderItemSchema),
    delivery: exports.deliverySchema.nullable(),
    deliveryEvents: zod_1.z.array(exports.deliveryEventSchema),
    payments: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        amount: zod_1.z.number(),
        method: zod_1.z.enum(["cash", "online"]),
        status: zod_1.z.enum(["created", "paid", "failed", "refunded"]),
        razorpayOrderId: zod_1.z.string().nullable(),
        razorpayPaymentId: zod_1.z.string().nullable(),
        receivedAt: zod_1.z.coerce.date().nullable(),
        createdAt: zod_1.z.coerce.date(),
    })),
});
