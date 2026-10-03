import { z } from "zod";
export declare const paymentSchema: z.ZodObject<{
    id: z.ZodString;
    orderId: z.ZodString;
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
    razorpaySignature: z.ZodNullable<z.ZodString>;
    receivedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const createRazorpayOrderSchema: z.ZodObject<{
    orderId: z.ZodString;
}, z.core.$strict>;
export declare const verifyPaymentSchema: z.ZodObject<{
    orderId: z.ZodString;
    razorpayOrderId: z.ZodString;
    razorpayPaymentId: z.ZodString;
    razorpaySignature: z.ZodString;
}, z.core.$strict>;
export declare const razorpayOrderResponseSchema: z.ZodObject<{
    razorpayOrderId: z.ZodString;
    keyId: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodString;
    orderId: z.ZodString;
}, z.core.$strip>;
export type Payment = z.infer<typeof paymentSchema>;
export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RazorpayOrderResponse = z.infer<typeof razorpayOrderResponseSchema>;
//# sourceMappingURL=payment.d.ts.map