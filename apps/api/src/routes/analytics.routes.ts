import { Router } from "express"
import { and, asc, count, desc, eq, gte, min, ne, sql } from "drizzle-orm"
import { customers, db, orderItems, orders, products, vendors, vendorCustomers } from "@repo/db"
import { asyncHandler } from "../middleware/error"
import { requireAuth } from "../middleware/auth"
import { getCustomerByUserId } from "../services/orderFlow"

export const analyticsRouter = Router()

analyticsRouter.use(requireAuth)

analyticsRouter.get("/overview", asyncHandler(async (req, res) => {
  const role = req.user!.role
  const vendorId = req.user!.vendorId
  const customer = role === "customer" ? await getCustomerByUserId(req.user!.id) : null

  const scopeCond =
    role === "vendor" && vendorId
      ? eq(orders.vendorId, vendorId)
      : role === "customer"
        ? customer
          ? eq(orders.customerId, customer.id)
          : // No customer profile yet — scope matches nothing so the overview reads as zeros.
            sql`false`
        : undefined

  const [revRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text` })
    .from(orders)
    .where(and(...(scopeCond ? [scopeCond] : []), ne(orders.status, "cancelled")))

  const [depRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orders.depositAmount})::numeric, 0)::text` })
    .from(orders)
    .where(and(...(scopeCond ? [scopeCond] : []), ne(orders.status, "cancelled")))

  const [jarsRow] = await db
    .select({ value: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::text` })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(...(scopeCond ? [scopeCond] : []), eq(orders.status, "delivered")))

  const totalCustomers =
    role === "vendor" && vendorId
      // The dashboard shows every customer linked to this business, not just
      // the ones who already placed an order — count vendorCustomers for the JWT vendor.
      ? await db
          .select({ value: count() })
          .from(vendorCustomers)
          .where(eq(vendorCustomers.vendorId, vendorId))
          .then((r) => Number(r[0]?.value ?? 0))
      : role === "customer"
        ? 0
        : await db.select({ value: count() }).from(customers).then((r) => Number(r[0]?.value ?? 0))

  const totalProducts =
    role === "vendor" && vendorId
      ? await db
          .select({ value: count() })
          .from(products)
          .where(eq(products.vendorId, vendorId))
          .then((r) => Number(r[0]?.value ?? 0))
      : await db.select({ value: count() }).from(products).then((r) => Number(r[0]?.value ?? 0))

  const totalVendors =
    role === "super_admin"
      ? await db.select({ value: count() }).from(vendors).then((r) => Number(r[0]?.value ?? 0))
      : 0

  const statusRows = await db
    .select({ status: orders.status, value: count() })
    .from(orders)
    .where(scopeCond ?? sql`true`)
    .groupBy(orders.status)

  const statusMap = new Map(statusRows.map((r) => [r.status, Number(r.value ?? 0)]))
  const deliveredOrders = statusMap.get("delivered") ?? 0
  const cancelledOrders = statusMap.get("cancelled") ?? 0
  const pendingOrders = statusMap.get("pending") ?? 0
  const activeOrders = (statusMap.get("accepted") ?? 0) + (statusMap.get("out_for_delivery") ?? 0)
  const totalOrders = [...statusMap.values()].reduce((a, b) => a + b, 0)

  const since = new Date()
  since.setDate(since.getDate() - 6)
  since.setHours(0, 0, 0, 0)
  const dayExpr = sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`
  const trendRows = await db
    .select({
      day: dayExpr,
      revenue: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text`,
      orderCount: sql<number>`count(*)::text`,
    })
    .from(orders)
    .where(and(...(scopeCond ? [scopeCond] : []), gte(orders.createdAt, since), ne(orders.status, "cancelled")))
    .groupBy(dayExpr)
    .orderBy(asc(dayExpr))

  const trendMap = new Map(trendRows.map((r) => [r.day, r]))
  const revenueTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    const key = d.toISOString().slice(0, 10)
    const row = trendMap.get(key)
    return {
      label,
      revenue: row ? Number(row.revenue) : 0,
      orders: row ? Number(row.orderCount) : 0,
    }
  })

  const statusBreakdown = ["pending", "accepted", "out_for_delivery", "delivered", "cancelled"].map(
    (s) => ({ status: s, count: statusMap.get(s as never) ?? 0 }),
  )

  // One shape for every role: admin/vendor sections default to neutral values
  // and each branch overrides only what applies to it. Consumers read fields
  // like `topVendors` unconditionally, so a missing key crashes the dashboard.
  const overview = {
    totalOrders,
    activeOrders,
    deliveredOrders,
    cancelledOrders,
    pendingOrders,
    totalRevenue: Number(revRow?.value ?? 0),
    totalDeposits: Number(depRow?.value ?? 0),
    totalCustomers: Number(totalCustomers),
    totalVendors,
    totalJarsDelivered: Number(jarsRow?.value ?? 0),
    totalProducts,
    revenueTrend,
    statusBreakdown,
    pendingVendorApplications: 0,
    activeVendors: 0,
    blockedVendors: 0,
    deliveriesToday: 0,
    topVendors: [] as {
      vendorId: string
      name: string
      orders: number
      revenue: number
    }[],
    incomeToday: 0,
    monthlyIncome: 0,
    activeCustomers: 0,
    closedCustomers: 0,
    newCustomersThisMonth: 0,
    dailySales: [] as { label: string; revenue: number; orders: number }[],
    monthlySales: [] as { label: string; revenue: number }[],
    jarDeliveryTrend: [] as { label: string; jars: number }[],
  }

  if (role === "super_admin") {
    const [pendingVendors] = await db
      .select({ value: count() })
      .from(vendors)
      .where(eq(vendors.status, "pending"))

    const [activeVendors] = await db
      .select({ value: count() })
      .from(vendors)
      .where(and(eq(vendors.status, "approved"), eq(vendors.blocked, false)))

    const [blockedVendors] = await db
      .select({ value: count() })
      .from(vendors)
      .where(eq(vendors.blocked, true))

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const [deliveriesToday] = await db
      .select({ value: count() })
      .from(orders)
      .where(and(eq(orders.status, "delivered"), gte(orders.deliveredAt, todayStart)))

    const topRows = await db
      .select({
        vendorId: orders.vendorId,
        name: vendors.name,
        orderCount: sql<number>`count(*)::text`,
        revenue: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text`,
      })
      .from(orders)
      .innerJoin(vendors, eq(vendors.id, orders.vendorId))
      .where(ne(orders.status, "cancelled"))
      .groupBy(orders.vendorId, vendors.name)
      .orderBy(desc(sql`sum(${orders.grandTotal})`))
      .limit(5)

    res.json({
      success: true,
      data: {
        ...overview,
        pendingVendorApplications: Number(pendingVendors?.value ?? 0),
        activeVendors: Number(activeVendors?.value ?? 0),
        blockedVendors: Number(blockedVendors?.value ?? 0),
        deliveriesToday: Number(deliveriesToday?.value ?? 0),
        topVendors: topRows.map((r) => ({
          vendorId: r.vendorId,
          name: r.name,
          orders: Number(r.orderCount),
          revenue: Number(r.revenue),
        })),
      },
    })
    return
  }

  if (role === "vendor" && vendorId) {
    const vCond = eq(orders.vendorId, vendorId)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const localKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

    const [dtRow] = await db
      .select({ value: count() })
      .from(orders)
      .where(and(vCond, eq(orders.status, "delivered"), gte(orders.deliveredAt, todayStart)))

    // "Today's summary": every order created today plus the delivered/pending
    // split, all scoped to the authenticated vendor's own orders.
    const todayStatusRows = await db
      .select({ status: orders.status, value: count() })
      .from(orders)
      .where(and(vCond, gte(orders.createdAt, todayStart)))
      .groupBy(orders.status)
    const todayStatusMap = new Map(todayStatusRows.map((r) => [r.status, Number(r.value ?? 0)]))
    const todaysOrders = [...todayStatusMap.values()].reduce((a, b) => a + b, 0)
    const todaysPending = todayStatusMap.get("pending") ?? 0
    const todaysDelivered = Number(dtRow?.value ?? 0)

    const [incToday] = await db
      .select({ value: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text` })
      .from(orders)
      .where(and(vCond, eq(orders.status, "delivered"), gte(orders.deliveredAt, todayStart)))

    const [incMonth] = await db
      .select({ value: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text` })
      .from(orders)
      .where(and(vCond, eq(orders.status, "delivered"), gte(orders.deliveredAt, monthStart)))

    const [activeRow] = await db
      .select({ value: sql<number>`count(distinct ${orders.customerId})::text` })
      .from(orders)
      .where(and(vCond, ne(orders.status, "cancelled"), gte(orders.createdAt, thirtyDaysAgo)))

    const [everRow] = await db
      .select({ value: sql<number>`count(distinct ${orders.customerId})::text` })
      .from(orders)
      .where(and(vCond, ne(orders.status, "cancelled")))

    const firstOrders = db
      .select({ customerId: orders.customerId, firstAt: min(orders.createdAt).as("first_at") })
      .from(orders)
      .where(vCond)
      .groupBy(orders.customerId)
      .as("first_orders")
    const [newRow] = await db
      .select({ value: count() })
      .from(firstOrders)
      .where(gte(firstOrders.firstAt, monthStart))

    // ---- Daily sales (last 30 days) ----
    const dayExpr = sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`
    const dailyRows = await db
      .select({
        day: dayExpr,
        revenue: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text`,
        orderCount: sql<number>`count(*)::text`,
      })
      .from(orders)
      .where(and(vCond, gte(orders.createdAt, thirtyDaysAgo), ne(orders.status, "cancelled")))
      .groupBy(dayExpr)
      .orderBy(asc(dayExpr))
    const dailyMap = new Map(dailyRows.map((r) => [r.day, r]))
    const dailySales = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo)
      d.setDate(thirtyDaysAgo.getDate() + i)
      const key = localKey(d)
      const row = dailyMap.get(key)
      return {
        label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        revenue: row ? Number(row.revenue) : 0,
        orders: row ? Number(row.orderCount) : 0,
      }
    })

    // ---- Monthly sales (last 12 months) ----
    const monthExpr = sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM')`
    const monthRows = await db
      .select({
        month: monthExpr,
        revenue: sql<number>`coalesce(sum(${orders.grandTotal})::numeric, 0)::text`,
      })
      .from(orders)
      .where(and(vCond, ne(orders.status, "cancelled")))
      .groupBy(monthExpr)
      .orderBy(asc(monthExpr))
    const monthMap = new Map(monthRows.map((r) => [r.month, Number(r.revenue)]))
    const monthlySales = Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - (11 - i))
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      return {
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        revenue: monthMap.get(key) ?? 0,
      }
    })

    // ---- Jar delivery trend (last 30 days) ----
    const jarDayExpr = sql<string>`to_char(date_trunc('day', ${orders.deliveredAt}), 'YYYY-MM-DD')`
    const jarRows = await db
      .select({ day: jarDayExpr, jars: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::text` })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(vCond, eq(orders.status, "delivered"), gte(orders.deliveredAt, thirtyDaysAgo)))
      .groupBy(jarDayExpr)
      .orderBy(asc(jarDayExpr))
    const jarMap = new Map(jarRows.map((r) => [r.day, Number(r.jars)]))
    const jarDeliveryTrend = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo)
      d.setDate(thirtyDaysAgo.getDate() + i)
      const key = localKey(d)
      return {
        label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        jars: jarMap.get(key) ?? 0,
      }
    })

    res.json({
      success: true,
      data: {
        ...overview,
        totalCustomers,
        todaysOrders,
        todaysDelivered,
        todaysPending,
        deliveriesToday: Number(dtRow?.value ?? 0),
        incomeToday: Number(incToday?.value ?? 0),
        monthlyIncome: Number(incMonth?.value ?? 0),
        activeCustomers: Number(activeRow?.value ?? 0),
        closedCustomers: Math.max(Number(everRow?.value ?? 0) - Number(activeRow?.value ?? 0), 0),
        newCustomersThisMonth: Number(newRow?.value ?? 0),
        dailySales,
        monthlySales,
        jarDeliveryTrend,
      },
    })
    return
  }

  res.json({ success: true, data: overview })
}))

analyticsRouter.get("/orders-by-status", asyncHandler(async (req, res) => {
  const role = req.user!.role
  const vendorId = req.user!.vendorId
  const customer = role === "customer" ? await getCustomerByUserId(req.user!.id) : null

  const scopeCond =
    role === "vendor" && vendorId
      ? eq(orders.vendorId, vendorId)
      : role === "customer" && customer
        ? eq(orders.customerId, customer.id)
        : undefined

  const rows = await db
    .select({ status: orders.status, value: count() })
    .from(orders)
    .where(scopeCond ?? sql`true`)
    .groupBy(orders.status)

  res.json({
    success: true,
    data: rows.map((r) => ({ status: r.status, count: Number(r.value ?? 0) })),
  })
}))