import { z } from "zod";
export declare const baseEntitySchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<{
        super_admin: "super_admin";
        vendor: "vendor";
        customer: "customer";
    }>;
    status: z.ZodEnum<{
        active: "active";
        blocked: "blocked";
    }>;
    vendorId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const publicVendorSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    gstin: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
    }>;
    approvedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const customerProfileSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    city: z.ZodNullable<z.ZodString>;
    pinCode: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const vendorUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    gstin: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const authUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<{
        super_admin: "super_admin";
        vendor: "vendor";
        customer: "customer";
    }>;
    status: z.ZodEnum<{
        active: "active";
        blocked: "blocked";
    }>;
    vendorId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const loginResponseSchema: z.ZodObject<{
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        role: z.ZodEnum<{
            super_admin: "super_admin";
            vendor: "vendor";
            customer: "customer";
        }>;
        status: z.ZodEnum<{
            active: "active";
            blocked: "blocked";
        }>;
        vendorId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type User = z.infer<typeof userSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type PublicVendor = z.infer<typeof publicVendorSchema>;
export type CustomerProfile = z.infer<typeof customerProfileSchema>;
export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
//# sourceMappingURL=user.d.ts.map