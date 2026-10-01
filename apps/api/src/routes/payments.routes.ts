import { Router } from "express"
import type { Request } from "express"
import { eq } from "drizzle-orm"
import { customers, db, orders, payments, users, vendors } from "@repo/db"
import { verifyPaymentSchema } from "@repo/types"
import { asyncHandler, badRequest, conflict, forbidden, notFound, unauthorized } from "../middleware/error"
import { requireAuth } from "../middleware/auth"
import { validateBody } from "../middleware/validate"
import { createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } from "../services/payment"
import { notify } from "../services/notification"
import { loadOrderDetail } from "../services/orderFlow"
import { env } from "../config/env"
import { paramStr } from "../utils/helpers"

export const paymentsRouter = Router()
export const webhookRouter = Router()

/** Loads an order and asserts the caller is the customer who owns it. */
async function requireCustomerOrder(req: Request, orderId: string) {
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
    .then((r) => r[0])
  if (!order) throw notFound("Order not found")

  const customer = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, req.user!.id))
    .limit(1)
    .then((r) => r[0])
  if (!customer || customer.id !== order.customerId) {
    throw forbidden("You do not have access to this order")
  }

  return order
}

paymentsRouter.get(
  "/order/:orderId/razorpay-key",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await requireCustomerOrder(req, paramStr(req, "orderId"))
    if (order.paymentMethod !== "online") throw badRequest("This order is not an online payment order")

    if (!env.RAZORPAY_KEY_ID) throw conflict("Razorpay is not configured on the server")

    res.json({
      success: true,
      data: {
        keyId: env.RAZORPAY_KEY_ID,
        orderId: order.id,
        // Checkout expects the smallest currency unit (paise for INR).
        amount: Math.round(order.grandTotal * 100),
        currency: "INR",
      },
    })
  }),
)

paymentsRouter.post(
  "/order/:orderId/razorpay",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await requireCustomerOrder(req, paramStr(req, "orderId"))
    if (order.paymentMethod !== "online") throw badRequest("This order is not an online payment order")

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw conflict("Razorpay is not configured on the server")
    }

    const rzpOrder = await createRazorpayOrder(order.grandTotal, order.orderNumber)

    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .limit(1)
      .then((r) => r[0])
    if (!payment) throw notFound("Payment record not found")

    await db
      .update(payments)
      .set({ razorpayOrderId: rzpOrder.id })
      .where(eq(payments.id, payment.id))

    res.json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        keyId: env.RAZORPAY_KEY_ID,
        orderId: order.id,
        // Checkout expects the smallest currency unit (paise for INR) — must
        // match the amount the Razorpay order was created with.
        amount: Math.round(order.grandTotal * 100),
        currency: "INR",
      },
    })
  }),
)

paymentsRouter.post(
  "/order/:orderId/verify",
  requireAuth,
  validateBody(verifyPaymentSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof verifyPaymentSchema.parse>

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, data.orderId))
      .limit(1)
      .then((r) => r[0])
    if (!order) throw notFound("Order not found")

    const customerUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .innerJoin(customers, eq(customers.userId, users.id))
      .innerJoin(orders, eq(orders.customerId, customers.id))
      .where(eq(orders.id, order.id))
      .limit(1)
      .then((r) => r[0])
    if (!customerUser || customerUser.id !== req.user!.id) {
      throw forbidden("You do not have access to this order")
    }


    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .limit(1)
      .then((r) => r[0])
    if (!payment) throw notFound("Payment record not found")
    if (payment.status === "paid") {
      return res.json({ success: true, data: { alreadyProcessed: true } })
    }

    if (data.razorpayOrderId !== payment.razorpayOrderId) {
      throw badRequest("Razorpay order mismatch")
    }

    const valid = verifyPaymentSignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature,
    )
    if (!valid) throw unauthorized("Payment signature verification failed")

    await db.update(payments).set({
      status: "paid",
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      receivedAt: new Date(),
    }).where(eq(payments.id, payment.id))

    await db.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, order.id))

    if (customerUser) {
      await notify({
        userId: customerUser.id,
        type: "payment_received",
        title: "Payment received",
        body: `Payment of â‚¹${order.grandTotal.toFixed(2)} for order ${order.orderNumber} received.`,
        href: `/customer/orders/${order.id}`,
        emailRecipient: customerUser.email,
      })
    }

    const detail = await loadOrderDetail(order.id, { customerUserId: req.user!.id })
    res.json({ success: true, data: { order: detail } })
  }),
)

paymentsRouter.post(
  "/order/:orderId/cash-paid",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role === "vendor") {
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, paramStr(req, "orderId")))
        .limit(1)
        .then((r) => r[0])
      if (!order) throw notFound("Order not found")
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, req.user!.vendorId!))
        .limit(1)
        .then((r) => r[0])
      if (!vendor || order.vendorId !== vendor.id) throw forbidden()
      if (order.paymentMethod !== "cash") throw badRequest("Not a cash order")

      await db.update(payments).set({ status: "paid", receivedAt: new Date() }).where(eq(payments.orderId, order.id))
      await db.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, order.id))
      return res.json({ success: true, data: serializePaymentStatus(order.id) })
    }

    if (req.user!.role === "super_admin") {
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, paramStr(req, "orderId")))
        .limit(1)
        .then((r) => r[0])
      if (!order) throw notFound("Order not found")
      await db.update(payments).set({ status: "paid", receivedAt: new Date() }).where(eq(payments.orderId, order.id))
      await db.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, order.id))
      return res.json({ success: true, data: serializePaymentStatus(order.id) })
    }

    throw forbidden()
  }),
)

async function serializePaymentStatus(orderId: string) {
  const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1)
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  return {
    paymentStatus: payment?.status ?? null,
    orderStatus: order?.paymentStatus ?? null,
  }
}

// ---- Razorpay Webhook ----
interface RazorpayWebhookEvent {
  event: string
  payload: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string } }
    refund?: { entity?: { id?: string; payment_id?: string; status?: string } }
  }
}

webhookRouter.post(
  "/razorpay",
  asyncHandler(async (req, res) => {
const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(req.body ?? "")
    const signature = req.headers["x-razorpay-signature"] as string | undefined
    const secret = env.RAZORPAY_WEBHOOK_SECRET

    if (!secret || !signature) {
      // signature not configured â€” reject silently
      return res.status(200).json({ success: true, ignored: true })
    }
    verifyWebhookSignature(rawBody.toString("utf8"), signature)

    const event = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhookEvent

    if (event.event === "payment.captured" || event.event === "payment.paid" || event.event === "order.paid") {
      const entity = event.payload.payment?.entity
      if (entity?.order_id) {
        const payment = await db
          .select()
          .from(payments)
          .where(eq(payments.razorpayOrderId, entity.order_id))
          .limit(1)
          .then((r) => r[0])

        if (payment && payment.status !== "paid") {
          await db
            .update(payments)
            .set({ status: "paid", razorpayPaymentId: entity.id ?? null, receivedAt: new Date() })
            .where(eq(payments.id, payment.id))
          await db
            .update(orders)
            .set({ paymentStatus: "paid", updatedAt: new Date() })
            .where(eq(orders.id, payment.orderId))
        }
      }
    }

    if (event.event === "payment.failed") {
      const entity = event.payload.payment?.entity
      if (entity?.order_id) {
        await db
          .update(payments)
          .set({ status: "failed" })
          .where(eq(payments.razorpayOrderId, entity.order_id))
      }
    }

    if (event.event === "refund.processed") {
      const entity = event.payload.refund?.entity
      if (entity?.payment_id) {
        await db
          .update(payments)
          .set({ status: "refunded" })
          .where(eq(payments.razorpayPaymentId, entity.payment_id))
      }
    }

    res.json({ success: true, received: true })
  }),
)
