import { Router } from "express"
import { and, count, desc, eq } from "drizzle-orm"
import { customerPrices, customers, db, orders, users } from "@repo/db"
import { createOrderSchema, updateProfileSchema } from "@repo/types"
import type { OrderStatus } from "@repo/types"
import { asyncHandler, badRequest, notFound } from "../middleware/error"
import { requireRole } from "../middleware/auth"
import { validateBody } from "../middleware/validate"
import { serializeCustomer, serializeOrder, serializeUser } from "../services/serialize"
import { createOrder, getCustomerByUserId, loadOrderDetail, transitionOrderStatus } from "../services/orderFlow"
import { paramStr } from "../utils/helpers"

export const customerRouter = Router()

customerRouter.use(requireRole("customer"))

customerRouter.get("/profile", asyncHandler(async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1)
  if (!user) throw notFound("User not found")
  const customer = await getCustomerByUserId(user.id)
  res.json({
    success: true,
    data: {
      user: serializeUser(user),
      customer: customer ? serializeCustomer(customer) : null,
    },
  })
}))

customerRouter.patch(
  "/profile",
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof updateProfileSchema.parse>
    const customer = await getCustomerByUserId(req.user!.id)

    const updateUser: Partial<typeof users.$inferInsert> = { updatedAt: new Date() }
    if (data.name !== undefined) updateUser.name = data.name
    if (data.phone !== undefined) updateUser.phone = data.phone ?? null

    await db.update(users).set(updateUser).where(eq(users.id, req.user!.id))

    if (customer) {
      const updateCustomer: Partial<typeof customers.$inferInsert> = { updatedAt: new Date() }
      if (data.phone !== undefined) updateCustomer.phone = data.phone ?? null
      if (data.address !== undefined) updateCustomer.address = data.address ?? null
      if (data.city !== undefined) updateCustomer.city = data.city ?? null
      if (data.pinCode !== undefined) updateCustomer.pinCode = data.pinCode ?? null
      await db.update(customers).set(updateCustomer).where(eq(customers.id, customer.id))
    }

    const [freshUser] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1)
    const freshCustomer = await getCustomerByUserId(req.user!.id)

    res.json({
      success: true,
      data: {
        user: serializeUser(freshUser!),
        customer: freshCustomer ? serializeCustomer(freshCustomer) : null,
      },
    })
  }),
)

customerRouter.get("/prices", asyncHandler(async (req, res) => {
  const customer = await getCustomerByUserId(req.user!.id)
  if (!customer) throw badRequest("Customer profile not found")
  const vendorId = typeof req.query.vendorId === "string" ? req.query.vendorId : undefined

  const rows = await db
    .select({
      productId: customerPrices.productId,
      pricePerJar: customerPrices.pricePerJar,
    })
    .from(customerPrices)
    .where(
      and(
        eq(customerPrices.customerId, customer.id),
        vendorId ? eq(customerPrices.vendorId, vendorId) : undefined,
      ),
    )

  res.json({
    success: true,
    data: { prices: rows },
  })
}))

customerRouter.get("/orders", asyncHandler(async (req, res) => {
  const customer = await getCustomerByUserId(req.user!.id)
  if (!customer) throw badRequest("Customer profile not found")

  const page = Math.max(Number(req.query.page ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 10), 1), 100)
  const status = typeof req.query.status === "string" ? req.query.status : undefined

  const whereClause = and(
    eq(orders.customerId, customer.id),
    status && status in ["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]
      ? eq(orders.status, status as OrderStatus)
      : undefined,
  )

  const [totalRes] = await db
    .select({ value: count() })
    .from(orders)
    .where(whereClause as NonNullable<typeof whereClause>)

  const rows = await db
    .select()
    .from(orders)
    .where(whereClause as NonNullable<typeof whereClause>)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  res.json({
    success: true,
    data: {
      items: rows.map(serializeOrder),
      total: totalRes?.value ?? 0,
    },
  })
}))

customerRouter.get("/orders/:id", asyncHandler(async (req, res) => {
  const detail = await loadOrderDetail(paramStr(req, "id"), { customerUserId: req.user!.id })
  res.json({ success: true, data: detail })
}))

customerRouter.post(
  "/orders",
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof createOrderSchema.parse>
    const orderId = await createOrder(req.user!.id, data)
    const detail = await loadOrderDetail(orderId, { customerUserId: req.user!.id })
    res.status(201).json({ success: true, data: detail })
  }),
)

customerRouter.post("/orders/:id/cancel", asyncHandler(async (req, res) => {
  const existing = await db
    .select()
    .from(orders)
    .where(eq(orders.id, paramStr(req, "id")))
    .limit(1)
    .then((r) => r[0])
  if (!existing) throw notFound("Order not found")

  const customer = await getCustomerByUserId(req.user!.id)
  if (!customer || existing.customerId !== customer.id) throw notFound("Order not found")
  if (existing.status !== "pending" && existing.status !== "accepted") {
    throw badRequest("This order can no longer be cancelled")
  }

  await transitionOrderStatus(existing.id, "cancelled", req.user!.id, "Cancelled by customer")
  const detail = await loadOrderDetail(existing.id, { customerUserId: req.user!.id })
  res.json({ success: true, data: detail })
}))
