"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorCustomerDetailSchema = exports.vendorCustomerListResponseSchema = exports.vendorCustomerListItemSchema = exports.vendorCustomerStatusUpdateSchema = exports.vendorCustomerUpdateSchema = exports.vendorCustomerCreateSchema = void 0;
const zod_1 = require("zod");
const auth_1 = require("./auth");
exports.vendorCustomerCreateSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Name is required"),
    email: auth_1.emailSchema,
    password: auth_1.passwordSchema,
    phone: auth_1.phoneSchema.optional(),
    address: zod_1.z.string().min(1, "Address is required").optional(),
})
    .strict();
exports.vendorCustomerUpdateSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Name is required").optional(),
    phone: auth_1.phoneSchema.optional(),
    address: zod_1.z.string().min(1, "Address is required").optional(),
})
    .strict();
exports.vendorCustomerStatusUpdateSchema = zod_1.z
    .object({
    status: zod_1.z.enum(["running", "closed"]),
})
    .strict();
exports.vendorCustomerListItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    customerId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    status: zod_1.z.enum(["running", "closed"]),
    totalOrders: zod_1.z.number(),
    deliveredOrders: zod_1.z.number(),
    totalSpent: zod_1.z.number(),
    lastOrderAt: zod_1.z.coerce.date().nullable(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.vendorCustomerListResponseSchema = zod_1.z.object({
    customers: zod_1.z.array(exports.vendorCustomerListItemSchema),
    total: zod_1.z.number(),
});
exports.vendorCustomerDetailSchema = exports.vendorCustomerListItemSchema.extend({
    recentOrders: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        orderNumber: zod_1.z.string(),
        status: zod_1.z.string(),
        grandTotal: zod_1.z.number(),
        createdAt: zod_1.z.coerce.date(),
    })),
});
