import { z } from "zod";
export declare const productSchema: z.ZodObject<{
    id: z.ZodString;
    vendorId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    sizeLiters: z.ZodString;
    pricePerJar: z.ZodNumber;
    depositPerJar: z.ZodNumber;
    availableStock: z.ZodNumber;
    active: z.ZodBoolean;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const productCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sizeLiters: z.ZodCoercedNumber<unknown>;
    pricePerJar: z.ZodCoercedNumber<unknown>;
    depositPerJar: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    availableStock: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strict>;
export declare const productUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sizeLiters: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pricePerJar: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    depositPerJar: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    availableStock: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
}, z.core.$strict>;
export declare const priceHistorySchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    oldPrice: z.ZodNumber;
    newPrice: z.ZodNumber;
    changedBy: z.ZodNullable<z.ZodString>;
    changedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const priceChangeSchema: z.ZodObject<{
    pricePerJar: z.ZodCoercedNumber<unknown>;
    depositPerJar: z.ZodCoercedNumber<unknown>;
}, z.core.$strict>;
export type Product = z.infer<typeof productSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type PriceHistory = z.infer<typeof priceHistorySchema>;
export type PriceChangeInput = z.infer<typeof priceChangeSchema>;
//# sourceMappingURL=product.d.ts.map