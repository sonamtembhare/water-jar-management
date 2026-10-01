import crypto from "crypto"
import Razorpay from "razorpay"
import { env } from "../config/env"
import { conflict, unprocessable } from "../middleware/error"

let clientCache: Razorpay | null = null

function getClient(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw conflict("Razorpay is not configured on the server")
  }
  clientCache ??= new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  })
  return clientCache
}

export interface CreateRazorpayOrderResult {
  id: string
  amount: number
  currency: string
}

export async function createRazorpayOrder(
  amount: number,
  receipt: string,
): Promise<CreateRazorpayOrderResult> {
  const order = await getClient().orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt,
    notes: { app: "water-jar-management" },
  })
  return {
    id: order.id,
    amount: Number(order.amount) / 100,
    currency: order.currency,
  }
}

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET ?? "")
    .update(body)
    .digest("hex")
  return expected === razorpaySignature
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
): void {
  const secret = env.RAZORPAY_WEBHOOK_SECRET

  const expected = crypto
    .createHmac("sha256", secret ?? "")
    .update(body)
    .digest("hex")

  const safeEqual = (a: string, b: string) => {
    const ba = Buffer.from(a)
    const bb = Buffer.from(b)
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
  }

  if (!secret || !safeEqual(expected, signature)) {
    throw unprocessable("Invalid webhook signature")
  }
}