import { Router } from "express"
import { and, asc, count, desc, eq } from "drizzle-orm"
import {
  db,
  inventoryLog,
  orders,
  priceHistory,
  products,
  users,
  vendors,
} from "@repo/db"
import {
  inviteStaffSchema,
  orderStatusUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  priceChangeSchema,
  vendorUpdateSchema,
} from "@repo/types"
import type { OrderStatus } from "@repo/types"
import { asyncHandler, badRequest, conflict, forbidden, notFound } from "../middleware/error"
import { requireVendorUser } from "../middleware/auth"
import { validateBody } from "../middleware/validate"
import { serializeProduct, serializeVendor } from "../services/serialize"
import { hashPassword } from "../utils/password"
import { notify } from "../services/notification"
import { loadOrderDetail, transitionOrderStatus } from "../services/orderFlow"
import { paramStr } from "../utils/helpers"
import { z } from "zod"

export const publicVendorsRouter = Router()
export const vendorProtectedRouter = Router()

const idParamsSchema = z.object({ id: z.string().uuid() })
const orderIdParamsSchema = z.object({ id: z.string().uuid() })

// ---- Public catalog ----
publicVendorsRouter.get("/", async (_req, res) => {
  const rows = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.status, "approved"), eq(vendors.blocked, false)))
    .orderBy(asc(vendors.name))
  res.json({ success: true, data: rows.map(serializeVendor) })
})

publicVendorsRouter.get("/:id", async (req, res) => {
  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, paramStr(req, "id")))
    .limit(1)
    .then((r) => r[0])
  if (!vendor || vendor.blocked) throw notFound("Vendor not found")

  const productRows = await db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, vendor.id), eq(products.active, true)))
    .orderBy(asc(products.name))

  res.json({
    success: true,
    data: {
      vendor: serializeVendor(vendor),
      products: productRows.map(serializeProduct),
    },
  })
})

publicVendorsRouter.get("/:id/products", async (req, res) => {
  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, paramStr(req, "id")))
    .limit(1)
    .then((r) => r[0])
if (!vendor || vendor.blocked) throw notFound("Vendor not found")

  const productRows = await db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, vendor.id), eq(products.active, true)))
    .orderBy(asc(products.name))

  res.json({ success: true, data: productRows.map(serializeProduct) })
})

// ---- Protected vendor routes ----
vendorProtectedRouter.use(requireVendorUser)

vendorProtectedRouter.get("/profile", async (req, res) => {
  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, req.user!.vendorId!))
    .limit(1)
    .then((r) => r[0])
  if (!vendor) throw notFound("Vendor not found")
  res.json({ success: true, data: serializeVendor(vendor) })
})

vendorProtectedRouter.patch(
  "/profile",
  validateBody(vendorUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof vendorUpdateSchema.parse>
    const [updated] = await db
      .update(vendors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vendors.id, req.user!.vendorId!))
      .returning()
    res.json({ success: true, data: serializeVendor(updated!) })
  }),
)

vendorProtectedRouter.get("/staff", async (req, res) => {
  const staff = await db
    .select()
    .from(users)
    .where(eq(users.vendorId, req.user!.vendorId!))
    .orderBy(asc(users.name))
  res.json({
    success: true,
    data: {
      staff: staff.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
      })),
      total: staff.length,
    },
  })
})

vendorProtectedRouter.post(
  "/staff",
  validateBody(inviteStaffSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof inviteStaffSchema.parse>

    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
    if (existing[0]) throw conflict("An account with this email already exists")

    const passwordHash = await hashPassword(data.password)
    const [staff] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone ?? null,
        role: "vendor",
        status: "active",
        vendorId: req.user!.vendorId!,
      })
      .returning()

    await notify({
      userId: staff!.id,
      type: "general",
      title: "Welcome to the team",
      body: "You have been added to the vendor team.",
      href: "/vendor",
      emailRecipient: staff!.email,
    })

    res.status(201).json({
      success: true,
      data: { id: staff!.id, name: staff!.name, email: staff!.email },
    })
  }),
)

vendorProtectedRouter.delete("/staff/:id", async (req, res) => {
  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, req.user!.vendorId!))
    .limit(1)
    .then((r) => r[0])
  if (!vendor) throw notFound("Vendor not found")
  if (vendor.ownerId === paramStr(req, "id")) throw badRequest("Cannot remove the vendor owner")

  await db.update(users).set({ vendorId: null }).where(eq(users.id, paramStr(req, "id")))
  res.json({ success: true, data: { id: paramStr(req, "id"), removed: true } })
})

// ---- Products ----
vendorProtectedRouter.get("/products", async (req, res) => {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, req.user!.vendorId!))
    .orderBy(desc(products.createdAt))
  res.json({ success: true, data: { products: rows.map(serializeProduct), total: rows.length } })
})

vendorProtectedRouter.post(
  "/products",
  validateBody(productCreateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof productCreateSchema.parse>
    const [created] = await db
      .insert(products)
      .values({
        vendorId: req.user!.vendorId!,
        name: data.name,
        description: data.description ?? null,
        sizeLiters: String(data.sizeLiters),
        pricePerJar: data.pricePerJar,
        depositPerJar: data.depositPerJar,
        availableStock: data.availableStock,
        active: true,
      })
      .returning()
    res.status(201).json({ success: true, data: serializeProduct(created!) })
  }),
)

vendorProtectedRouter.patch(
  "/products/:id",
  validateBody(productUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof productUpdateSchema.parse>
    const product = await findMyProduct(paramStr(req, "id"), req.user!.vendorId!)
    if (!product) throw notFound("Product not found")

    const updateData: Partial<typeof products.$inferInsert> = { updatedAt: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.sizeLiters !== undefined) updateData.sizeLiters = String(data.sizeLiters)
    if (data.availableStock !== undefined) updateData.availableStock = data.availableStock

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, product.id))
      .returning()
    res.json({ success: true, data: serializeProduct(updated!) })
  }),
)

vendorProtectedRouter.patch(
  "/products/:id/price",
  validateBody(priceChangeSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof priceChangeSchema.parse>
    const product = await findMyProduct(paramStr(req, "id"), req.user!.vendorId!)
    if (!product) throw notFound("Product not found")

    const [updated] = await db
      .update(products)
      .set({
        pricePerJar: data.pricePerJar,
        depositPerJar: data.depositPerJar,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id))
      .returning()

    if (product.pricePerJar !== data.pricePerJar) {
      await db.insert(priceHistory).values({
        productId: product.id,
        oldPrice: product.pricePerJar,
        newPrice: data.pricePerJar,
        changedBy: req.user!.id,
        changedAt: new Date(),
      })
    }

    res.json({ success: true, data: serializeProduct(updated!) })
  }),
)

vendorProtectedRouter.post("/products/:id/toggle", asyncHandler(async (req, res) => {
  const product = await findMyProduct(paramStr(req, "id"), req.user!.vendorId!)
  if (!product) throw notFound("Product not found")

  const [updated] = await db
    .update(products)
    .set({ active: !product.active, updatedAt: new Date() })
    .where(eq(products.id, product.id))
    .returning()
  res.json({ success: true, data: serializeProduct(updated!) })
}))

// ---- Inventory ----
vendorProtectedRouter.get("/inventory", async (req, res) => {
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, req.user!.vendorId!))
    .orderBy(asc(products.name))

  const log = await db
    .select({
      id: inventoryLog.id,
      productId: inventoryLog.productId,
      productName: products.name,
      change: inventoryLog.change,
      reason: inventoryLog.reason,
      refOrderId: inventoryLog.refOrderId,
      createdAt: inventoryLog.createdAt,
    })
    .from(inventoryLog)
    .innerJoin(products, eq(inventoryLog.productId, products.id))
    .where(eq(products.vendorId, req.user!.vendorId!))
    .orderBy(desc(inventoryLog.createdAt))
    .limit(50)

  res.json({ success: true, data: { products: productRows.map(serializeProduct), log } })
})

const restockSchema = z
  .object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
  })
  .strict()

vendorProtectedRouter.post(
  "/inventory/restock",
  validateBody(restockSchema),
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body
    const product = await findMyProduct(productId, req.user!.vendorId!)
    if (!product) throw notFound("Product not found")

    await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({ availableStock: product.availableStock + quantity, updatedAt: new Date() })
        .where(eq(products.id, product.id))
      await tx.insert(inventoryLog).values({ productId: product.id, change: quantity, reason: "restock" })
    })

    res.json({
      success: true,
      data: serializeProduct({ ...product, availableStock: product.availableStock + quantity }),
    })
  }),
)

// ---- Orders ----
vendorProtectedRouter.get("/orders", async (req, res) => {
  const page = Math.max(Number(req.query.page ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 10), 1), 100)
  const status = typeof req.query.status === "string" ? req.query.status : undefined

  const whereClause = and(
    eq(orders.vendorId, req.user!.vendorId!),
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

  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, req.user!.vendorId!))
    .limit(1)
    .then((r) => r[0])

  res.json({
    success: true,
    data: {
      items: rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        source: o.source,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        grandTotal: o.grandTotal,
        address: o.address,
        city: o.city,
        phone: o.phone,
        scheduledFor: o.scheduledFor,
        createdAt: o.createdAt,
        vendorName: vendor?.name ?? null,
      })),
      total: totalRes?.value ?? 0,
    },
  })
})

vendorProtectedRouter.get("/orders/:id", async (req, res) => {
  const detail = await loadOrderDetail(paramStr(req, "id"), { vendorId: req.user!.vendorId! })
  res.json({ success: true, data: detail })
})

vendorProtectedRouter.patch(
  "/orders/:id/status",
  validateBody(orderStatusUpdateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as ReturnType<typeof orderStatusUpdateSchema.parse>
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, paramStr(req, "id")), eq(orders.vendorId, req.user!.vendorId!)))
      .limit(1)
      .then((r) => r[0])
if (!order) throw notFound("Order not found")

    if (body.status === "pending") {
      throw badRequest("Orders cannot be moved back to pending")
    }

    await transitionOrderStatus(order.id, body.status, req.user!.id, body.note)

    const detail = await loadOrderDetail(order.id, { vendorId: req.user!.vendorId! })
    res.json({ success: true, data: detail })
  }),
)

async function findMyProduct(productId: string, vendorId: string) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, vendorId)))
    .limit(1)
    .then((r) => r[0] ?? null)
}

export { idParamsSchema, orderIdParamsSchema }
