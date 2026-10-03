import { z } from "zod";
export declare const customerPriceCreateSchema: z.ZodObject<{
    productId: z.ZodString;
    pricePerJar: z.ZodCoercedNumber<unknown>;
}, z.core.$strict>;
export declare const customerPriceUpdateSchema: z.ZodObject<{
    pricePerJar: z.ZodCoercedNumber<unknown>;
}, z.core.$strict>;
export declare const customerPriceSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    productName: z.ZodString;
    sizeLiters: z.ZodString;
    basePrice: z.ZodNumber;
    baseDeposit: z.ZodNumber;
    pricePerJar: z.ZodNumber;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const customerPriceListResponseSchema: z.ZodObject<{
    prices: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productId: z.ZodString;
        productName: z.ZodString;
        sizeLiters: z.ZodString;
        basePrice: z.ZodNumber;
        baseDeposit: z.ZodNumber;
        pricePerJar: z.ZodNumber;
        createdAt: z.ZodCoercedDate<unknown>;
        updatedAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export declare const customerPriceOverridesSchema: z.ZodObject<{
    prices: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        pricePerJar: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const vendorDeliveryItemSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodCoercedNumber<unknown>;
}, z.core.$strict>;
export declare const vendorDeliveryCreateSchema: z.ZodObject<{
    customerId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodCoercedNumber<unknown>;
    }, z.core.$strict>>;
    notes: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const vendorDeliveryListResponseSchema: z.ZodObject<{
    deliveries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        orderNumber: z.ZodString;
        status: z.ZodString;
        notes: z.ZodNullable<z.ZodString>;
        grandTotal: z.ZodNumber;
        createdAt: z.ZodCoercedDate<unknown>;
        customerId: z.ZodString;
        customerName: z.ZodString;
        customerPhone: z.ZodNullable<z.ZodString>;
        customerAddress: z.ZodNullable<z.ZodString>;
        items: z.ZodArray<z.ZodObject<{
            productId: z.ZodNullable<z.ZodString>;
            productName: z.ZodString;
            sizeLiters: z.ZodString;
            quantity: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type CustomerPriceCreateInput = z.infer<typeof customerPriceCreateSchema>;
export type CustomerPriceUpdateInput = z.infer<typeof customerPriceUpdateSchema>;
export type CustomerPrice = z.infer<typeof customerPriceSchema>;
export type CustomerPriceListResponse = z.infer<typeof customerPriceListResponseSchema>;
export type CustomerPriceOverrides = z.infer<typeof customerPriceOverridesSchema>;
export type VendorDeliveryCreateInput = z.infer<typeof vendorDeliveryCreateSchema>;
export type VendorDeliveryListResponse = z.infer<typeof vendorDeliveryListResponseSchema>;
//# sourceMappingURL=delivery.d.ts.map