import { z } from "zod"

export const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.number(),
  method: z.enum(["cash", "online"]),
  status: z.enum(["created", "paid", "failed", "refunded"]),
  razorpayOrderId: z.string().nullable(),
  razorpayPaymentId: z.string().nullable(),
  razorpaySignature: z.string().nullable(),
  receivedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})

export const createRazorpayOrderSchema = z
  .object({
    orderId: z.string().uuid(),
  })
  .strict()

export const verifyPaymentSchema = z
  .object({
    orderId: z.string().uuid(),
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
  })
  .strict()

export const razorpayOrderResponseSchema = z.object({
  razorpayOrderId: z.string(),
  keyId: z.string(),
  amount: z.number(),
  currency: z.string(),
  orderId: z.string().uuid(),
})

export type Payment = z.infer<typeof paymentSchema>
export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
export type RazorpayOrderResponse = z.infer<typeof razorpayOrderResponseSchema>