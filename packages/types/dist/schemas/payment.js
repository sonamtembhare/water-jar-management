"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayOrderResponseSchema = exports.verifyPaymentSchema = exports.createRazorpayOrderSchema = exports.paymentSchema = void 0;
const zod_1 = require("zod");
exports.paymentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderId: zod_1.z.string().uuid(),
    amount: zod_1.z.number(),
    method: zod_1.z.enum(["cash", "online"]),
    status: zod_1.z.enum(["created", "paid", "failed", "refunded"]),
    razorpayOrderId: zod_1.z.string().nullable(),
    razorpayPaymentId: zod_1.z.string().nullable(),
    razorpaySignature: zod_1.z.string().nullable(),
    receivedAt: zod_1.z.coerce.date().nullable(),
    createdAt: zod_1.z.coerce.date(),
});
exports.createRazorpayOrderSchema = zod_1.z
    .object({
    orderId: zod_1.z.string().uuid(),
})
    .strict();
exports.verifyPaymentSchema = zod_1.z
    .object({
    orderId: zod_1.z.string().uuid(),
    razorpayOrderId: zod_1.z.string(),
    razorpayPaymentId: zod_1.z.string(),
    razorpaySignature: zod_1.z.string(),
})
    .strict();
exports.razorpayOrderResponseSchema = zod_1.z.object({
    razorpayOrderId: zod_1.z.string(),
    keyId: zod_1.z.string(),
    amount: zod_1.z.number(),
    currency: zod_1.z.string(),
    orderId: zod_1.z.string().uuid(),
});
