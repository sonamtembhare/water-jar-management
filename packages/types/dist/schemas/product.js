"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceChangeSchema = exports.priceHistorySchema = exports.productUpdateSchema = exports.productCreateSchema = exports.productSchema = void 0;
const zod_1 = require("zod");
exports.productSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    vendorId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    sizeLiters: zod_1.z.string(),
    pricePerJar: zod_1.z.number(),
    depositPerJar: zod_1.z.number(),
    availableStock: zod_1.z.number(),
    active: zod_1.z.boolean(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.productCreateSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Product name is required"),
    description: zod_1.z.string().optional(),
    sizeLiters: zod_1.z.coerce.number().positive("Size must be positive"),
    pricePerJar: zod_1.z.coerce
        .number()
        .nonnegative("Price must be non-negative"),
    depositPerJar: zod_1.z.coerce.number().nonnegative("Deposit must be non-negative").default(0),
    availableStock: zod_1.z.coerce.number().int().nonnegative("Stock must be non-negative").default(0),
})
    .strict();
exports.productUpdateSchema = exports.productCreateSchema.partial().strict();
exports.priceHistorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    oldPrice: zod_1.z.number(),
    newPrice: zod_1.z.number(),
    changedBy: zod_1.z.string().uuid().nullable(),
    changedAt: zod_1.z.coerce.date(),
});
exports.priceChangeSchema = zod_1.z
    .object({
    pricePerJar: zod_1.z.coerce.number().nonnegative("Price must be non-negative"),
    depositPerJar: zod_1.z.coerce.number().nonnegative("Deposit must be non-negative"),
})
    .strict();
