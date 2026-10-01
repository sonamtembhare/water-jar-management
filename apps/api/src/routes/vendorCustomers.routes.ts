import { Router } from "express"
import { and, asc, count, desc, eq, ilike, inArray, max, ne, or, sql } from "drizzle-orm"
import { customerPrices, customers, db, orders, products, users, vendorCustomers } from "@repo/db"
import {
  customerPriceCreateSchema,
  customerPriceUpdateSchema,
  vendorCustomerCreateSchema,
  vendorCustomerStatusUpdateSchema,
  vendorCustomerUpdateSchema,
} from "@repo/types"
import { asyncHandler, badRequest, conflict, notFound } from "../middleware/error"
import { requireVendorUser } from "../middleware/auth"
import { validateBody } from "../middleware/validate"
import { hashPassword } from "../utils/password"
import { notify } from "../services/notification"
import { paramStr } from "../utils/helpers"

export const vendorCustomerRouter = Router()

vendorCustomerRouter.use(requireVendorUser)

async function findRelation(id: string, vendorId: string) {
  return db
    .select({
      relation: vendorCustomers,
      customer: customers,
      user: users,
    })
    .from(vendorCustomers)
    .innerJoin(customers, eq(customers.id, vendorCustomers.customerId))
    .innerJoin(users, eq(users.id, customers.userId))
    .where(and(eq(vendorCustomers.id, id), eq(vendorCustomers.vendorId, vendorId)))
    .limit(1)
    .then((r) => r[0] ?? null)
}

function buildAggregates(customerIds: string[], vendorId: string) {
  return Promise.all([
    db
      .select({
        customerId: orders.customerId,
        status: orders.status,
        value: count(),
        spent: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text`,
      })
      .from(orders)
      .where(and(inArray(orders.customerId, customerIds), eq(orders.vendorId, vendorId)))
      .groupBy(orders.customerId, orders.status),
    db
      .select({
        customerId: orders.customerId,
        last: max(orders.createdAt),
      })
      .from(orders)
      .where(and(inArray(orders.customerId, customerIds), eq(orders.vendorId, vendorId)))
      .groupBy(orders.customerId),
  ]).then(([orderRows, lastRows]) => {
    const lastMap = new Map(lastRows.map((r) => [r.customerId, r.last]))
    const statusMap = new Map<string, Map<string, number>>()
    const spentMap = new Map<string, number>()
    for (const row of orderRows) {
      const inner = statusMap.get(row.customerId) ?? new Map()
      inner.set(row.status, Number(row.value ?? 0))
      statusMap.set(row.customerId, inner)
      spentMap.set(
        row.customerId,
        (spentMap.get(row.customerId) ?? 0) + (row.status !== "cancelled" ? Number(row.spent ?? 0) : 0),
      )
    }
    return { statusMap, spentMap, lastMap }
  })
}

function serializeCustomerItem(options: {
  relation: (typeof vendorCustomers.$inferSelect)
  customer: (typeof customers.$inferSelect)
  user: (typeof users.$inferSelect)
  statusMap: Map<string, Map<string, number>>
  spentMap: Map<string, number>
  lastMap: Map<string, Date | null>
}) {
  const { relation, customer, user, statusMap, spentMap, lastMap } = options
  const counts = statusMap.get(customer.id) ?? new Map()
  let totalOrders = 0
  let deliveredOrders = 0
  for (const [status, value] of counts) {
    totalOrders += value
    if (status === "delivered") deliveredOrders += value
  }
  return {
    id: relation.id,
    customerId: customer.id,
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: customer.address,
    status: relation.status,
    totalOrders,
    deliveredOrders,
    totalSpent: Math.round((spentMap.get(customer.id) ?? 0) * 100) / 100,
    lastOrderAt: lastMap.get(customer.id) ?? null,
    createdAt: relation.createdAt,
    updatedAt: relation.updatedAt,
  }
}

vendorCustomerRouter.get("/customers", asyncHandler(async (req, res) => {
  const vendorId = req.user!.vendorId!
  const page = Math.max(Number(req.query.page ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100)
  const search =
    typeof req.query.search === "string" && req.query.search.trim()
      ? req.query.search.trim()
      : undefined
  const searchPat = `%${search}%`

  const whereClause = and(
    eq(vendorCustomers.vendorId, vendorId),
    search
      ? or(
          ilike(users.name, searchPat),
          ilike(users.email, searchPat),
          ilike(users.phone, searchPat),
        )
      : undefined,
  )

  const [totalRow] = await db
    .select({ value: count() })
    .from(vendorCustomers)
    .innerJoin(customers, eq(customers.id, vendorCustomers.customerId))
    .innerJoin(users, eq(users.id, customers.userId))
    .where(whereClause as NonNullable<typeof whereClause>)

  const rows = await db
    .select({ relation: vendorCustomers, customer: customers, user: users })
    .from(vendorCustomers)
    .innerJoin(customers, eq(customers.id, vendorCustomers.customerId))
    .innerJoin(users, eq(users.id, customers.userId))
    .where(whereClause as NonNullable<typeof whereClause>)
    .orderBy(desc(vendorCustomers.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const customerIds = rows.map((r) => r.customer.id)
  const { statusMap, spentMap, lastMap } =
    customerIds.length > 0 ? await buildAggregates(customerIds, vendorId) : {
      statusMap: new Map(),
      spentMap: new Map(),
      lastMap: new Map(),
    }

  res.json({
    success: true,
    data: {
      customers: rows.map((row) =>
        serializeCustomerItem({ ...row, statusMap, spentMap, lastMap }),
      ),
      total: Number(totalRow?.value ?? 0),
    },
  })
}))

vendorCustomerRouter.post(
  "/customers",
  validateBody(vendorCustomerCreateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof vendorCustomerCreateSchema.parse>
    const vendorId = req.user!.vendorId!

    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
    if (existing[0]) throw conflict("An account with this email already exists")

    const passwordHash = await hashPassword(data.password)

    const created = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: data.email,
          passwordHash,
          name: data.name,
          phone: data.phone ?? null,
          role: "customer",
          status: "active",
        })
        .returning()
      if (!user) throw badRequest("Failed to create account")

      const [customerRow] = await tx
        .insert(customers)
        .values({
          userId: user.id,
          phone: data.phone ?? null,
          address: data.address ?? null,
        })
        .returning()
      if (!customerRow) throw badRequest("Failed to create customer profile")

      const [relation] = await tx
        .insert(vendorCustomers)
        .values({
          vendorId,
          customerId: customerRow.id,
          status: "running",
        })
        .returning()
      if (!relation) throw badRequest("Failed to link customer")

      return { user, customer: customerRow, relation }
    })

    await notify({
      userId: created.user.id,
      type: "customer_added",
      title: "Account created",
      body: `You have been added as a customer by a vendor. You can now browse and order from the catalog.`,
      href: "/catalog",
      emailRecipient: created.user.email,
    })

    res.status(201).json({
      success: true,
      data: {
        id: created.relation.id,
        customerId: created.customer.id,
        userId: created.user.id,
        name: created.user.name,
        email: created.user.email,
        phone: created.user.phone,
        address: created.customer.address,
        status: created.relation.status,
        totalOrders: 0,
        deliveredOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
        createdAt: created.relation.createdAt,
        updatedAt: created.relation.updatedAt,
      },
    })
  }),
)

vendorCustomerRouter.get("/customers/:id", asyncHandler(async (req, res) => {
  const row = await findRelation(paramStr(req, "id"), req.user!.vendorId!)
  if (!row) throw notFound("Customer not found")

  const { statusMap, spentMap, lastMap } = await buildAggregates(
    [row.customer.id],
    req.user!.vendorId!,
  )
  const item = serializeCustomerItem({ ...row, statusMap, spentMap, lastMap })

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      grandTotal: orders.grandTotal,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.customerId, row.customer.id),
        eq(orders.vendorId, req.user!.vendorId!),
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(10)

  res.json({
    success: true,
    data: { ...item, recentOrders },
  })
}))

vendorCustomerRouter.patch(
  "/customers/:id",
  validateBody(vendorCustomerUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof vendorCustomerUpdateSchema.parse>
    const row = await findRelation(paramStr(req, "id"), req.user!.vendorId!)
    if (!row) throw notFound("Customer not found")

    const now = new Date()
    const userUpdate: Partial<typeof users.$inferInsert> = { updatedAt: now }
    if (data.name !== undefined) userUpdate.name = data.name
    if (data.phone !== undefined) userUpdate.phone = data.phone ?? null
    await db.update(users).set(userUpdate).where(eq(users.id, row.user.id))

    const customerUpdate: Partial<typeof customers.$inferInsert> = { updatedAt: now }
    if (data.phone !== undefined) customerUpdate.phone = data.phone ?? null
    if (data.address !== undefined) customerUpdate.address = data.address ?? null
    await db.update(customers).set(customerUpdate).where(eq(customers.id, row.customer.id))

    await db
      .update(vendorCustomers)
      .set({ updatedAt: now })
      .where(eq(vendorCustomers.id, row.relation.id))

    const fresh = await findRelation(paramStr(req, "id"), req.user!.vendorId!)
    const { statusMap, spentMap, lastMap } = await buildAggregates(
      [row.customer.id],
      req.user!.vendorId!,
    )
    res.json({
      success: true,
      data: serializeCustomerItem({ ...fresh!, statusMap, spentMap, lastMap }),
    })
  }),
)

vendorCustomerRouter.patch(
  "/customers/:id/status",
  validateBody(vendorCustomerStatusUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof vendorCustomerStatusUpdateSchema.parse>
    const row = await findRelation(paramStr(req, "id"), req.user!.vendorId!)
    if (!row) throw notFound("Customer not found")

    const [updated] = await db
      .update(vendorCustomers)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(vendorCustomers.id, row.relation.id))
      .returning()

    await notify({
      userId: row.user.id,
      type: data.status === "closed" ? "customer_closed" : "customer_reopened",
      title: data.status === "closed" ? "Vendor closed your account" : "Account reopened",
      body:
        data.status === "closed"
          ? `A vendor has closed your account. You cannot place new orders with them until it is reopened.`
          : `A vendor has reopened your account. You can place orders again.`,
      href: "/catalog",
      emailRecipient: row.user.email,
    })

    res.json({
      success: true,
      data: { id: updated!.id, status: updated!.status, updatedAt: updated!.updatedAt },
    })
  }),
)

// ---- Per-customer jar pricing ----

vendorCustomerRouter.get("/customers/:id/prices", asyncHandler(async (req, res) => {
  const row = await findRelation(paramStr(req, "id"), req.user!.vendorId!)
  if (!row) throw notFound("Customer not found")

  const rows = await db
    .select({
      price: customerPrices,
      product: products,
    })
    .from(customerPrices)
    .innerJoin(products, eq(products.id, customerPrices.productId))
    .where(eq(customerPrices.customerId, row.customer.id))
    .orderBy(asc(products.sizeLiters))

  res.json({
    success: true,
    data: {
      prices: rows.map(({ price, product }) => ({
        id: price.id,
        productId: product.id,
        productName: product.name,
        sizeLiters: product.sizeLiters,
        basePrice: product.pricePerJar,
        baseDeposit: product.depositPerJar,
        pricePerJar: price.pricePerJar,
        createdAt: price.createdAt,
        updatedAt: price.updatedAt,
      })),
      total: rows.length,
    },
  })
}))

vendorCustomerRouter.post(
  "/customers/:id/prices",
  validateBody(customerPriceCreateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof customerPriceCreateSchema.parse>
    const row = await findRelation(paramStr(req, "id"), req.user!.vendorId!)
    if (!row) throw notFound("Customer not found")

    const product = await db
      .select()
      .from(products)
      .where(and(eq(products.id, data.productId), eq(products.vendorId, req.user!.vendorId!)))
      .limit(1)
      .then((r) => r[0])
    if (!product) throw notFound("Jar size not found")

    const existing = await db
      .select()
      .from(customerPrices)
      .where(
        and(
          eq(customerPrices.customerId, row.customer.id),
          eq(customerPrices.productId, product.id),
        ),
      )
      .limit(1)
      .then((r) => r[0])
    if (existing) throw conflict("A price is already set for this jar size")

    const [created] = await db
      .insert(customerPrices)
      .values({
        vendorId: req.user!.vendorId!,
        customerId: row.customer.id,
        productId: product.id,
        pricePerJar: data.pricePerJar,
      })
      .returning()

    res.status(201).json({
      success: true,
      data: {
        id: created!.id,
        productId: product.id,
        productName: product.name,
        sizeLiters: product.sizeLiters,
        basePrice: product.pricePerJar,
        baseDeposit: product.depositPerJar,
        pricePerJar: created!.pricePerJar,
        createdAt: created!.createdAt,
        updatedAt: created!.updatedAt,
      },
    })
  }),
)

vendorCustomerRouter.patch(
  "/customers/:cid/prices/:priceId",
  validateBody(customerPriceUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof customerPriceUpdateSchema.parse>
    const row = await findRelation(paramStr(req, "cid"), req.user!.vendorId!)
    if (!row) throw notFound("Customer not found")

    const [updated] = await db
      .update(customerPrices)
      .set({ pricePerJar: data.pricePerJar, updatedAt: new Date() })
      .where(
        and(
          eq(customerPrices.id, paramStr(req, "priceId")),
          eq(customerPrices.customerId, row.customer.id),
        ),
      )
      .returning()
    if (!updated) throw notFound("Price not found")

    res.json({
      success: true,
      data: { id: updated.id, pricePerJar: updated.pricePerJar, updatedAt: updated.updatedAt },
    })
  }),
)

vendorCustomerRouter.delete("/customers/:cid/prices/:priceId", asyncHandler(async (req, res) => {
  const row = await findRelation(paramStr(req, "cid"), req.user!.vendorId!)
  if (!row) throw notFound("Customer not found")

  const deleted = await db
    .delete(customerPrices)
    .where(
      and(
        eq(customerPrices.id, paramStr(req, "priceId")),
        eq(customerPrices.customerId, row.customer.id),
      ),
    )
    .returning()
  if (deleted.length === 0) throw notFound("Price not found")

  res.json({ success: true, data: { id: paramStr(req, "priceId"), removed: true } })
}))