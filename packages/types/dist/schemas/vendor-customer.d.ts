import { z } from "zod";
export declare const vendorCustomerCreateSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    address: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const vendorCustomerUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    address: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const vendorCustomerStatusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<{
        running: "running";
        closed: "closed";
    }>;
}, z.core.$strict>;
export declare const vendorCustomerListItemSchema: z.ZodObject<{
    id: z.ZodString;
    customerId: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        running: "running";
        closed: "closed";
    }>;
    totalOrders: z.ZodNumber;
    deliveredOrders: z.ZodNumber;
    totalSpent: z.ZodNumber;
    lastOrderAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const vendorCustomerListResponseSchema: z.ZodObject<{
    customers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        customerId: z.ZodString;
        userId: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        address: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            running: "running";
            closed: "closed";
        }>;
        totalOrders: z.ZodNumber;
        deliveredOrders: z.ZodNumber;
        totalSpent: z.ZodNumber;
        lastOrderAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
        createdAt: z.ZodCoercedDate<unknown>;
        updatedAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export declare const vendorCustomerDetailSchema: z.ZodObject<{
    id: z.ZodString;
    customerId: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        running: "running";
        closed: "closed";
    }>;
    totalOrders: z.ZodNumber;
    deliveredOrders: z.ZodNumber;
    totalSpent: z.ZodNumber;
    lastOrderAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    recentOrders: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        orderNumber: z.ZodString;
        status: z.ZodString;
        grandTotal: z.ZodNumber;
        createdAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type VendorCustomerCreateInput = z.infer<typeof vendorCustomerCreateSchema>;
export type VendorCustomerUpdateInput = z.infer<typeof vendorCustomerUpdateSchema>;
export type VendorCustomerStatusUpdateInput = z.infer<typeof vendorCustomerStatusUpdateSchema>;
export type VendorCustomerListItem = z.infer<typeof vendorCustomerListItemSchema>;
export type VendorCustomerListResponse = z.infer<typeof vendorCustomerListResponseSchema>;
export type VendorCustomerDetail = z.infer<typeof vendorCustomerDetailSchema>;
//# sourceMappingURL=vendor-customer.d.ts.map