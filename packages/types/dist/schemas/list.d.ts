import { z } from "zod";
export declare const orderListResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        orderNumber: z.ZodString;
        customerId: z.ZodString;
        vendorId: z.ZodString;
        address: z.ZodString;
        city: z.ZodNullable<z.ZodString>;
        pinCode: z.ZodNullable<z.ZodString>;
        phone: z.ZodString;
        notes: z.ZodNullable<z.ZodString>;
        totalAmount: z.ZodNumber;
        depositAmount: z.ZodNumber;
        grandTotal: z.ZodNumber;
        status: z.ZodEnum<{
            pending: "pending";
            accepted: "accepted";
            out_for_delivery: "out_for_delivery";
            delivered: "delivered";
            cancelled: "cancelled";
        }>;
        source: z.ZodEnum<{
            customer_order: "customer_order";
            vendor_delivery: "vendor_delivery";
        }>;
        paymentMethod: z.ZodEnum<{
            cash: "cash";
            online: "online";
        }>;
        paymentStatus: z.ZodEnum<{
            created: "created";
            paid: "paid";
            failed: "failed";
            refunded: "refunded";
        }>;
        scheduledFor: z.ZodNullable<z.ZodCoercedDate<unknown>>;
        deliveredAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
        createdAt: z.ZodCoercedDate<unknown>;
        updatedAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        accepted: "accepted";
        out_for_delivery: "out_for_delivery";
        delivered: "delivered";
        cancelled: "cancelled";
    }>>;
}, z.core.$strip>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
//# sourceMappingURL=list.d.ts.map