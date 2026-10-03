"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginResponseSchema = exports.authUserSchema = exports.vendorUpdateSchema = exports.customerProfileSchema = exports.publicVendorSchema = exports.userSchema = exports.baseEntitySchema = void 0;
const zod_1 = require("zod");
const auth_1 = require("./auth");
exports.baseEntitySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    phone: zod_1.z.string().nullable(),
    role: zod_1.z.enum(["super_admin", "vendor", "customer"]),
    status: zod_1.z.enum(["active", "blocked"]),
    vendorId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.publicVendorSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    phone: zod_1.z.string().nullable(),
    gstin: zod_1.z.string().nullable(),
    status: zod_1.z.enum(["pending", "approved", "rejected"]),
    approvedAt: zod_1.z.coerce.date().nullable(),
    createdAt: zod_1.z.coerce.date(),
});
exports.customerProfileSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    phone: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    city: zod_1.z.string().nullable(),
    pinCode: zod_1.z.string().nullable(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.vendorUpdateSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Business name is required").optional(),
    description: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    phone: auth_1.phoneSchema.optional(),
    gstin: zod_1.z.string().optional(),
})
    .strict();
exports.authUserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    phone: zod_1.z.string().nullable(),
    role: zod_1.z.enum(["super_admin", "vendor", "customer"]),
    status: zod_1.z.enum(["active", "blocked"]),
    vendorId: zod_1.z.string().uuid().nullable(),
});
exports.loginResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: exports.authUserSchema,
});
