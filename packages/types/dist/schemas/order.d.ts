import { z } from "zod";
export declare const orderItemInputSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodCoercedNumber<unknown>;
}, z.core.$strict>;
export declare const createOrderSchema: z.ZodObject<{
    vendorId: z.ZodString;
    address: z.ZodString;
    city: z.ZodOptional<z.ZodString>;
    pinCode: z.ZodOptional<z.ZodString>;
    phone: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    scheduledFor: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    paymentMethod: z.ZodDefault<z.ZodEnum<{
        cash: "cash";
        online: "online";
    }>>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodCoercedNumber<unknown>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const orderStatusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<{
        pending: "pending";
        accepted: "accepted";
        out_for_delivery: "out_for_delivery";
        delivered: "delivered";
        cancelled: "cancelled";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const orderItemSchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodString;
    productId: z.ZodNullable<z.ZodString>;
    productName: z.ZodString;
    sizeLiters: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    unitDeposit: z.ZodNumber;
    total: z.ZodNumber;
    depositTotal: z.ZodNumber;
}, z.core.$strip>;
export declare const orderSchema: z.ZodObject<{
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
}, z.core.$strip>;
export declare const deliveryEventSchema: z.ZodObject<{
    id: z.ZodString;
    deliveryId: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        accepted: "accepted";
        out_for_delivery: "out_for_delivery";
        delivered: "delivered";
        cancelled: "cancelled";
    }>;
    note: z.ZodNullable<z.ZodString>;
    at: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const deliverySchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        accepted: "accepted";
        out_for_delivery: "out_for_delivery";
        delivered: "delivered";
        cancelled: "cancelled";
    }>;
    assignedAt: z.ZodNullable<z.ZodString>;
    outForDeliveryAt: z.ZodNullable<z.ZodString>;
    deliveredAt: z.ZodNullable<z.ZodString>;
    cancelledAt: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const orderDetailSchema: z.ZodObject<{
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
    customer: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        address: z.ZodNullable<z.ZodString>;
        city: z.ZodNullable<z.ZodString>;
        pinCode: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    vendor: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        orderId: z.ZodString;
        productId: z.ZodNullable<z.ZodString>;
        productName: z.ZodString;
        sizeLiters: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        unitDeposit: z.ZodNumber;
        total: z.ZodNumber;
        depositTotal: z.ZodNumber;
    }, z.core.$strip>>;
    delivery: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        orderId: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            accepted: "accepted";
            out_for_delivery: "out_for_delivery";
            delivered: "delivered";
            cancelled: "cancelled";
        }>;
        assignedAt: z.ZodNullable<z.ZodString>;
        outForDeliveryAt: z.ZodNullable<z.ZodString>;
        deliveredAt: z.ZodNullable<z.ZodString>;
        cancelledAt: z.ZodNullable<z.ZodString>;
        notes: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodCoercedDate<unknown>;
        updatedAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    deliveryEvents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        deliveryId: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            accepted: "accepted";
            out_for_delivery: "out_for_delivery";
            delivered: "delivered";
            cancelled: "cancelled";
        }>;
        note: z.ZodNullable<z.ZodString>;
        at: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    payments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        amount: z.ZodNumber;
        method: z.ZodEnum<{
            cash: "cash";
            online: "online";
        }>;
        status: z.ZodEnum<{
            created: "created";
            paid: "paid";
            failed: "failed";
            refunded: "refunded";
        }>;
        razorpayOrderId: z.ZodNullable<z.ZodString>;
        razorpayPaymentId: z.ZodNullable<z.ZodString>;
        receivedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
        createdAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Delivery = z.infer<typeof deliverySchema>;
export type DeliveryEvent = z.infer<typeof deliveryEventSchema>;
//# sourceMappingURL=order.d.ts.map