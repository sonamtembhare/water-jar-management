import { Router } from "express"
import { and, count, desc, eq, inArray } from "drizzle-orm"
import { customers, db, orderItems, orders, products, users, vendorCustomers } from "@repo/db"
import { vendorDeliveryCreateSchema, formatINR, formatDate, ORDER_STATUS_LABELS } from "@repo/types"
import { asyncHandler, badRequest, notFound } from "../middleware/error"
import { requireVendorUser } from "../middleware/auth"
import { validateBody } from "../middleware/validate"
import { createOrderForCustomer, loadOrderDetail } from "../services/orderFlow"
import { notify, deliveryConfirmationEmail } from "../services/notification"
import { paramStr } from "../utils/helpers"

export const vendorDeliveryRouter = Router()

vendorDeliveryRouter.use(requireVendorUser)

vendorDeliveryRouter.get("/deliveries", asyncHandler(async (req, res) => {
  const vendorId = req.user!.vendorId!
  const page = Math.max(Number(req.query.page ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100)

  const whereClause = and(
    eq(orders.vendorId, vendorId),
    eq(orders.source, "vendor_delivery"),
  )

  const [totalRow] = await db
    .select({ value: count() })
    .from(orders)
    .where(whereClause)

  const rows = await db
    .select({
      order: orders,
      customerName: users.name,
      customerPhone: users.phone,
      customerAddress: customers.address,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .innerJoin(users, eq(users.id, customers.userId))
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const orderIds = rows.map((r) => r.order.id)
  const itemRows =
    orderIds.length > 0
      ? await db
          .select({
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: orderItems.productName,
            sizeLiters: orderItems.sizeLiters,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : []
  const itemMap = new Map<string, typeof itemRows>()
  for (const item of itemRows) {
    const list = itemMap.get(item.orderId) ?? []
    list.push(item)
    itemMap.set(item.orderId, list)
  }

  res.json({
    success: true,
    data: {
      deliveries: rows.map(({ order, customerName, customerPhone, customerAddress }) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        notes: order.notes,
        grandTotal: order.grandTotal,
        createdAt: order.createdAt,
        customerId: order.customerId,
        customerName,
        customerPhone,
        customerAddress,
        items: (itemMap.get(order.id) ?? []).map((i) => ({
          productId: i.productId,
          productName: i.productName,
          sizeLiters: i.sizeLiters,
          quantity: i.quantity,
        })),
      })),
      total: Number(totalRow?.value ?? 0),
    },
  })
}))

vendorDeliveryRouter.post(
  "/deliveries",
  validateBody(vendorDeliveryCreateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof vendorDeliveryCreateSchema.parse>
    const vendorId = req.user!.vendorId!

    const relation = await db
      .select({
        customer: customers,
        user: users,
        status: vendorCustomers.status,
      })
      .from(vendorCustomers)
      .innerJoin(customers, eq(customers.id, vendorCustomers.customerId))
      .innerJoin(users, eq(users.id, customers.userId))
      .where(
        and(
          eq(vendorCustomers.vendorId, vendorId),
          eq(vendorCustomers.customerId, data.customerId),
        ),
      )
      .limit(1)
      .then((r) => r[0])
    if (!relation) throw notFound("Customer not found for this business")
    if (relation.status !== "running") throw badRequest("This customer account is closed")
    if (relation.user.status === "blocked") {
      throw badRequest("This customer account is blocked")
    }

    const address = data.address ?? relation.customer.address
    const phone = data.phone ?? relation.user.phone
    if (!address) throw badRequest("Customer has no delivery address — add one first")
    if (!phone) throw badRequest("Customer has no phone number — add one first")

    const productIds = data.items.map((i) => i.productId)
    const productRows = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.vendorId, vendorId), inArray(products.id, productIds)))
    if (productRows.length !== new Set(productIds).size) {
      throw badRequest("One or more jar sizes are unavailable")
    }

    const { orderId } = await createOrderForCustomer({
      customerId: data.customerId,
      vendorId,
      items: data.items,
      address,
      city: relation.customer.city ?? undefined,
      pinCode: relation.customer.pinCode ?? undefined,
      phone,
      notes: data.notes,
      paymentMethod: "cash",
      source: "vendor_delivery",
    })

    const detail = await loadOrderDetail(orderId, { vendorId })

    const itemSummary = detail.items
      .map((item) => `${item.quantity} x ${item.productName} (${item.sizeLiters}L)`)
      .join(", ")

    // The order is fully committed in PostgreSQL before any email is sent, so a
    // customer only ever receives a confirmation once the delivery is saved.
    // notify() inserts the in-app notification, fires the Expo push, and sends
    // the SMTP email to the customer; it reports whether the email actually went out.
    const emailSent = await notify({
      userId: relation.user.id,
      type: "delivery_created",
      title: "Delivery recorded",
      body: `${itemSummary} delivery recorded. Order ${detail.orderNumber}. Total ${formatINR(detail.grandTotal)}.${data.notes ? ` Note: ${data.notes}` : ""}`,
      href: `/customer/orders/${detail.id}`,
      emailRecipient: relation.user.email,
      email: deliveryConfirmationEmail({
        recipientName: relation.user.name,
        orderNumber: detail.orderNumber,
        date: formatDate(detail.createdAt),
        jarCount: detail.items.reduce((sum, item) => sum + item.quantity, 0),
        statusLabel: ORDER_STATUS_LABELS[detail.status],
        vendorName: detail.vendor?.name,
        note: data.notes,
      }),
    })

    res.status(201).json({ success: true, data: { ...detail, emailSent } })
  }),
)