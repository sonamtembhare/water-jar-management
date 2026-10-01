import { Router } from "express"
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm"
import { customers, db, notifications, orders, products, users, vendors } from "@repo/db"
import {
  broadcastNotificationSchema,
  userStatusUpdateSchema,
  vendorBlockSchema,
  vendorStatusUpdateSchema,
} from "@repo/types"
import { asyncHandler, conflict, notFound, forbidden, badRequest } from "../middleware/error"
import { requireRole } from "../middleware/auth"
import { validateBody } from "../middleware/validate"
import { notify } from "../services/notification"
import { paramStr } from "../utils/helpers"

export const adminRouter = Router()

adminRouter.use(requireRole("super_admin"))

adminRouter.get("/vendors", asyncHandler(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined
  const page = Math.max(Number(req.query.page ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100)
  const search =
    typeof req.query.search === "string" && req.query.search.trim()
      ? req.query.search.trim()
      : undefined
  const searchPat = `%${search}%`

  const whereClause = and(
    status && ["pending", "approved", "rejected"].includes(status)
      ? eq(vendors.status, status as never)
      : undefined,
    search
      ? or(
          ilike(vendors.name, searchPat),
          ilike(vendors.address, searchPat),
          sql`exists(select 1 from users u where u.id = ${vendors.ownerId} and (u.name ilike ${searchPat} or u.email ilike ${searchPat}))`,
        )
      : undefined,
  )

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::text` })
    .from(vendors)
    .where(whereClause as NonNullable<typeof whereClause>)

  const rows = await db
    .select()
    .from(vendors)
    .where(whereClause as NonNullable<typeof whereClause>)
    .orderBy(vendors.createdAt)
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const ownerIds = rows.map((v) => v.ownerId).filter((x): x is string => Boolean(x))
  const ownerRows =
    ownerIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
          .from(users)
          .where(inArray(users.id, ownerIds))
      : []
  const ownerMap = new Map(ownerRows.map((o) => [o.id, o]))

  const vendorIds = rows.map((v) => v.id)
  const staffCounts =
    vendorIds.length > 0
      ? await db
          .select({ vendorId: users.vendorId, value: sql<number>`count(*)::text` })
          .from(users)
          .where(inArray(users.vendorId, vendorIds as string[]))
          .groupBy(users.vendorId)
      : []
  const staffCountMap = new Map(staffCounts.map((s) => [s.vendorId, Number(s.value ?? 0)]))

  res.json({
    success: true,
    data: {
      vendors: rows.map((v) => {
        const owner = ownerMap.get(v.ownerId ?? "")
        return {
id: v.id,
          name: v.name,
          description: v.description,
          address: v.address,
          phone: v.phone,
          gstin: v.gstin,
          status: v.status,
          approvedAt: v.approvedAt,
          createdAt: v.createdAt,
          blocked: v.blocked,
          blockedAt: v.blockedAt,
          ownerName: owner?.name ?? null,
          ownerEmail: owner?.email ?? null,
          ownerPhone: owner?.phone ?? null,
          staffCount: staffCountMap.get(v.id) ?? 0,
        }
      }),
total: Number(totalRow?.value ?? 0),
    },
  })
}))

adminRouter.get("/vendors/:id", asyncHandler(async (req, res) => {
  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, paramStr(req, "id")))
    .limit(1)
    .then((r) => r[0])
  if (!vendor) throw notFound("Vendor not found")

  const owner = vendor.ownerId
    ? await db
        .select({ name: users.name, email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.id, vendor.ownerId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null

  const staff = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.vendorId, vendor.id))
    .orderBy(asc(users.name))

  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, vendor.id))
    .orderBy(desc(products.createdAt))

  const statusRows = await db
    .select({ status: orders.status, value: count() })
    .from(orders)
    .where(eq(orders.vendorId, vendor.id))
    .groupBy(orders.status)
  const statusMap = new Map(statusRows.map((r) => [r.status, Number(r.value ?? 0)]))
  const totalOrders = [...statusMap.values()].reduce((a, b) => a + b, 0)

  const [revRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text` })
    .from(orders)
    .where(and(eq(orders.vendorId, vendor.id), ne(orders.status, "cancelled")))

  res.json({
    success: true,
    data: {
      id: vendor.id,
      name: vendor.name,
      description: vendor.description,
      address: vendor.address,
      phone: vendor.phone,
      gstin: vendor.gstin,
      status: vendor.status,
      approvedAt: vendor.approvedAt,
      blocked: vendor.blocked,
      blockedAt: vendor.blockedAt,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      ownerName: owner?.name ?? null,
      ownerEmail: owner?.email ?? null,
      ownerPhone: owner?.phone ?? null,
      staff,
      productCount: productRows.length,
      activeProductCount: productRows.filter((p) => p.active).length,
      totalOrders,
      deliveredOrders: statusMap.get("delivered") ?? 0,
      pendingOrders: (statusMap.get("pending") ?? 0) + (statusMap.get("accepted") ?? 0),
      revenue: Number(revRow?.value ?? 0),
    },
  })
}))

adminRouter.patch(
  "/vendors/:id/block",
  validateBody(vendorBlockSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof vendorBlockSchema.parse>
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, paramStr(req, "id")))
      .limit(1)
      .then((r) => r[0])
    if (!vendor) throw notFound("Vendor not found")

    const [updated] = await db
      .update(vendors)
      .set({
        blocked: data.blocked,
        blockedAt: data.blocked ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendor.id))
      .returning()

    if (vendor.ownerId) {
      const owner = await db
        .select()
        .from(users)
        .where(eq(users.id, vendor.ownerId))
        .limit(1)
        .then((r) => r[0])
      if (owner) {
        await notify({
          userId: owner.id,
          type: data.blocked ? "vendor_blocked" : "vendor_unblocked",
          title: data.blocked ? "Vendor account blocked" : "Vendor account unblocked",
          body: data.blocked
            ? `Your business "${vendor.name}" has been blocked. Contact support for details.`
            : `Your business "${vendor.name}" has been unblocked.`,
          href: "/vendor",
          emailRecipient: owner.email,
        })
      }
    }

    res.json({
      success: true,
      data: { id: updated!.id, blocked: updated!.blocked, blockedAt: updated!.blockedAt },
    })
  }),
)

adminRouter.get("/customers", asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100)
  const search =
    typeof req.query.search === "string" && req.query.search.trim()
      ? req.query.search.trim()
      : undefined
  const searchPat = `%${search}%`
  const vendorId = typeof req.query.vendorId === "string" && req.query.vendorId ? req.query.vendorId : undefined

  const whereClause = and(
    eq(users.role, "customer"),
    search
      ? or(
          ilike(users.name, searchPat),
          ilike(users.email, searchPat),
          ilike(users.phone, searchPat),
          ilike(customers.city, searchPat),
          ilike(customers.address, searchPat),
        )
      : undefined,
    vendorId
      ? sql`exists(select 1 from orders o where o.customer_id = ${customers.id} and o.vendor_id = ${vendorId})`
      : undefined,
  )

  const [totalRow] = await db
    .select({ value: count() })
    .from(customers)
    .innerJoin(users, eq(users.id, customers.userId))
    .where(whereClause as NonNullable<typeof whereClause>)

  const rows = await db
    .select()
    .from(customers)
    .innerJoin(users, eq(users.id, customers.userId))
    .where(whereClause as NonNullable<typeof whereClause>)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const customerIds = rows.map((r) => r.customers.id)

  const aggRows =
    customerIds.length > 0
      ? await db
          .select({
            customerId: orders.customerId,
            status: orders.status,
            value: count(),
            spent: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text`,
          })
          .from(orders)
          .where(inArray(orders.customerId, customerIds))
          .groupBy(orders.customerId, orders.status)
      : []
  const aggMap = new Map<string, Map<string, { value: number; spent: number }>>()
  for (const row of aggRows) {
    const inner = aggMap.get(row.customerId) ?? new Map()
    inner.set(row.status, { value: Number(row.value ?? 0), spent: Number(row.spent ?? 0) })
    aggMap.set(row.customerId, inner)
  }

  const vendorRows =
    customerIds.length > 0
      ? await db
          .select({
            customerId: orders.customerId,
            vendorId: vendors.id,
            name: vendors.name,
          })
          .from(orders)
          .innerJoin(vendors, eq(vendors.id, orders.vendorId))
          .where(inArray(orders.customerId, customerIds))
          .groupBy(orders.customerId, vendors.id, vendors.name)
          .orderBy(asc(vendors.name))
      : []
  const vendorMap = new Map<string, Array<{ vendorId: string; name: string }>>()
  for (const row of vendorRows) {
    const list = vendorMap.get(row.customerId) ?? []
    list.push({ vendorId: row.vendorId, name: row.name })
    vendorMap.set(row.customerId, list)
  }

  res.json({
    success: true,
    data: {
      total: Number(totalRow?.value ?? 0),
      customers: rows.map(({ customers: c, users: u }) => {
        const counts = aggMap.get(c.id) ?? new Map()
        let totalOrders = 0
        let deliveredOrders = 0
        let totalSpent = 0
        for (const [status, v] of counts) {
          totalOrders += v.value
          if (status === "delivered") deliveredOrders += v.value
          if (status !== "cancelled") totalSpent += v.spent
        }
        return {
          id: c.id,
          userId: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          status: u.status,
          address: c.address,
          city: c.city,
          pinCode: c.pinCode,
          totalOrders,
          deliveredOrders,
          totalSpent,
          vendorsOrderedFrom: vendorMap.get(c.id) ?? [],
          createdAt: u.createdAt,
        }
      }),
    },
  })
}))

adminRouter.patch(
  "/vendors/:id/status",
  validateBody(vendorStatusUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof vendorStatusUpdateSchema.parse>
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, paramStr(req, "id")))
      .limit(1)
      .then((r) => r[0])
    if (!vendor) throw notFound("Vendor not found")

    const [updated] = await db
      .update(vendors)
      .set({
        status: data.status,
        approvedAt: data.status === "approved" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendor.id))
      .returning()

    if (vendor.ownerId) {
      const owner = await db
        .select()
        .from(users)
        .where(eq(users.id, vendor.ownerId))
        .limit(1)
        .then((r) => r[0])
      if (owner) {
        await notify({
          userId: owner.id,
          type: data.status === "approved" ? "vendor_approved" : "vendor_rejected",
          title: data.status === "approved" ? "Vendor application approved" : "Vendor application rejected",
          body:
            data.status === "approved"
              ? `Your business "${vendor.name}" has been approved. You can now manage products and orders.`
              : `Your business "${vendor.name}" was not approved.`,
          href: "/vendor",
          emailRecipient: owner.email,
        })
      }
    }

    res.json({
      success: true,
      data: { status: updated!.status, approvedAt: updated!.approvedAt },
    })
  }),
)

adminRouter.get("/users", asyncHandler(async (req, res) => {
  const role = typeof req.query.role === "string" ? req.query.role : undefined
  const page = Math.max(Number(req.query.page ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100)

  const whereClause = and(
    role && ["super_admin", "vendor", "customer"].includes(role)
      ? eq(users.role, role as never)
      : undefined,
  )

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::text` })
    .from(users)
    .where(whereClause as NonNullable<typeof whereClause>)

  const rows = await db
    .select()
    .from(users)
    .where(whereClause as NonNullable<typeof whereClause>)
    .orderBy(users.createdAt)
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  res.json({
    success: true,
    data: {
      users: rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        status: u.status,
        vendorId: u.vendorId,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      total: Number(totalRow?.value ?? 0),
    },
  })
}))

adminRouter.patch(
  "/users/:id/status",
  validateBody(userStatusUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof userStatusUpdateSchema.parse>
    if (paramStr(req, "id") === req.user!.id) throw badRequest("You cannot change your own account status")

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, paramStr(req, "id")))
      .limit(1)
      .then((r) => r[0])
    if (!user) throw notFound("User not found")
    if (user.role === "super_admin" && data.status === "blocked") throw forbidden("Cannot block a super admin")

    const [updated] = await db
      .update(users)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning()

    res.json({
      success: true,
      data: { id: updated!.id, status: updated!.status },
    })
  }),
)

adminRouter.post(
  "/notifications/broadcast",
  validateBody(broadcastNotificationSchema),
asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof broadcastNotificationSchema.parse>

    if (data.userIds && data.userIds.length > 0) {
      const targetRows = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, data.userIds))
      if (targetRows.length === 0) throw conflict("No users match the broadcast audience")
      await db.insert(notifications).values(
        targetRows.map((t) => ({
          userId: t.id,
          type: "general",
          title: data.title,
          body: data.body,
          href: null,
        })),
      )
      return res.json({ success: true, data: { sent: targetRows.length } })
    }

    const audience = data.role
      ? await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.role, data.role))
      : await db.select({ id: users.id, email: users.email }).from(users)

    if (audience.length === 0) throw conflict("No users match the broadcast audience")

await db.insert(notifications).values(
      audience.map((t) => ({
        userId: t.id,
        type: "general",
        title: data.title,
        body: data.body,
        href: null,
      })),
    )

    res.json({
      success: true,
      data: { sent: audience.length },
    })
  }),
)
