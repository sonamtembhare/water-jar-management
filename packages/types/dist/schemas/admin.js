"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffListResponseSchema = exports.broadcastNotificationSchema = exports.userStatusUpdateSchema = exports.vendorStatusUpdateSchema = exports.userListResponseSchema = exports.adminCustomerListResponseSchema = exports.adminCustomerSchema = exports.adminVendorDetailSchema = exports.staffSchema = exports.vendorBlockSchema = exports.adminVendorListResponseSchema = exports.adminVendorSchema = void 0;
const zod_1 = require("zod");
const user_1 = require("./user");
exports.adminVendorSchema = user_1.publicVendorSchema.extend({
    ownerName: zod_1.z.string().nullable(),
    ownerEmail: zod_1.z.string().nullable(),
    ownerPhone: zod_1.z.string().nullable(),
    staffCount: zod_1.z.number(),
    blocked: zod_1.z.boolean(),
    blockedAt: zod_1.z.coerce.date().nullable(),
});
exports.adminVendorListResponseSchema = zod_1.z.object({
    vendors: zod_1.z.array(exports.adminVendorSchema),
    total: zod_1.z.number(),
});
exports.vendorBlockSchema = zod_1.z
    .object({
    blocked: zod_1.z.boolean(),
})
    .strict();
exports.staffSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().nullable(),
    role: zod_1.z.enum(["super_admin", "vendor", "customer"]),
    status: zod_1.z.enum(["active", "blocked"]),
});
exports.adminVendorDetailSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    phone: zod_1.z.string().nullable(),
    gstin: zod_1.z.string().nullable(),
    status: zod_1.z.enum(["pending", "approved", "rejected"]),
    approvedAt: zod_1.z.coerce.date().nullable(),
    blocked: zod_1.z.boolean(),
    blockedAt: zod_1.z.coerce.date().nullable(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
    ownerName: zod_1.z.string().nullable(),
    ownerEmail: zod_1.z.string().nullable(),
    ownerPhone: zod_1.z.string().nullable(),
    staff: zod_1.z.array(exports.staffSchema),
    productCount: zod_1.z.number(),
    activeProductCount: zod_1.z.number(),
    totalOrders: zod_1.z.number(),
    deliveredOrders: zod_1.z.number(),
    pendingOrders: zod_1.z.number(),
    revenue: zod_1.z.number(),
});
exports.adminCustomerSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().nullable(),
    status: zod_1.z.enum(["active", "blocked"]),
    address: zod_1.z.string().nullable(),
    city: zod_1.z.string().nullable(),
    pinCode: zod_1.z.string().nullable(),
    totalOrders: zod_1.z.number(),
    deliveredOrders: zod_1.z.number(),
    totalSpent: zod_1.z.number(),
    vendorsOrderedFrom: zod_1.z.array(zod_1.z.object({ vendorId: zod_1.z.string().uuid(), name: zod_1.z.string() })),
    createdAt: zod_1.z.coerce.date(),
});
exports.adminCustomerListResponseSchema = zod_1.z.object({
    customers: zod_1.z.array(exports.adminCustomerSchema),
    total: zod_1.z.number(),
});
exports.userListResponseSchema = zod_1.z.object({
    users: zod_1.z.array(user_1.userSchema),
    total: zod_1.z.number(),
});
exports.vendorStatusUpdateSchema = zod_1.z
    .object({
    status: zod_1.z.enum(["approved", "rejected"]),
    note: zod_1.z.string().optional(),
})
    .strict();
exports.userStatusUpdateSchema = zod_1.z
    .object({
    status: zod_1.z.enum(["active", "blocked"]),
})
    .strict();
exports.broadcastNotificationSchema = zod_1.z
    .object({
    userIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    role: zod_1.z.enum(["super_admin", "vendor", "customer"]).optional(),
    title: zod_1.z.string().min(2, "Title is required"),
    body: zod_1.z.string().min(2, "Message is required"),
})
    .strict();
exports.staffListResponseSchema = zod_1.z.object({
    staff: zod_1.z.array(exports.staffSchema),
    total: zod_1.z.number(),
});
