"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorDeliveryListResponseSchema = exports.vendorDeliveryCreateSchema = exports.vendorDeliveryItemSchema = exports.customerPriceOverridesSchema = exports.customerPriceListResponseSchema = exports.customerPriceSchema = exports.customerPriceUpdateSchema = exports.customerPriceCreateSchema = void 0;
const zod_1 = require("zod");
exports.customerPriceCreateSchema = zod_1.z
    .object({
    productId: zod_1.z.string().uuid("Select a jar size"),
    pricePerJar: zod_1.z.coerce.number().positive("Price must be greater than 0"),
})
    .strict();
exports.customerPriceUpdateSchema = zod_1.z
    .object({
    pricePerJar: zod_1.z.coerce.number().positive("Price must be greater than 0"),
})
    .strict();
exports.customerPriceSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    productName: zod_1.z.string(),
    sizeLiters: zod_1.z.string(),
    basePrice: zod_1.z.number(),
    baseDeposit: zod_1.z.number(),
    pricePerJar: zod_1.z.number(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
});
exports.customerPriceListResponseSchema = zod_1.z.object({
    prices: zod_1.z.array(exports.customerPriceSchema),
    total: zod_1.z.number(),
});
exports.customerPriceOverridesSchema = zod_1.z.object({
    prices: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        pricePerJar: zod_1.z.number(),
    })),
});
exports.vendorDeliveryItemSchema = zod_1.z
    .object({
    productId: zod_1.z.string().uuid("Select a jar size"),
    quantity: zod_1.z.coerce.number().int().min(1, "Quantity must be at least 1"),
})
    .strict();
exports.vendorDeliveryCreateSchema = zod_1.z
    .object({
    customerId: zod_1.z.string().uuid("Select a customer"),
    items: zod_1.z.array(exports.vendorDeliveryItemSchema).min(1, "Add at least one jar"),
    notes: zod_1.z.string().optional(),
    address: zod_1.z.string().min(5, "Delivery address is required").optional(),
    phone: zod_1.z
        .string()
        .regex(/^[0-9+\-\s()]{8,15}$/, "Enter a valid phone number")
        .optional(),
})
    .strict();
exports.vendorDeliveryListResponseSchema = zod_1.z.object({
    deliveries: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        orderNumber: zod_1.z.string(),
        status: zod_1.z.string(),
        notes: zod_1.z.string().nullable(),
        grandTotal: zod_1.z.number(),
        createdAt: zod_1.z.coerce.date(),
        customerId: zod_1.z.string().uuid(),
        customerName: zod_1.z.string(),
        customerPhone: zod_1.z.string().nullable(),
        customerAddress: zod_1.z.string().nullable(),
        items: zod_1.z.array(zod_1.z.object({
            productId: zod_1.z.string().uuid().nullable(),
            productName: zod_1.z.string(),
            sizeLiters: zod_1.z.string(),
            quantity: zod_1.z.number(),
        })),
    })),
    total: zod_1.z.number(),
});
