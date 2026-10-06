import { and, eq, inArray, sql } from "drizzle-orm"
import {
  customerPrices,
  customers,
  db,
  deliveryEvents,
  deliveries,
  inventoryLog,
  orderItems,
  orders,
  payments,
  products,
  users,
  vendorCustomers,
  vendors,
  type Database,
} from "@repo/db"
import type { CreateOrderInput, OrderStatus } from "@repo/types"
import { ORDER_STATUS_LABELS } from "@repo/types"
import { badRequest, conflict, forbidden, notFound } from "../middleware/error"
import { generateOrderNumber } from "../utils/helpers"
import { notify, orderStatusEmail } from "./notification"
import { serializeOrderDetail } from "./serialize"

type DbTx = Parameters<Parameters<Database["transaction"]>[0]>[0]

export interface OrderItemInput {
  productId: string
  quantity: number
}

export async function getCustomerByUserId(userId: string) {
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

async function loadProductsForVendor(productIds: string[], vendorId: string) {
  if (productIds.length === 0) return []
  const rows = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.vendorId, vendorId)))
  return rows
}

async function reserveStock(
  tx: DbTx,
  productId: string,
  quantity: number,
  refOrderId: string,
) {
  const updated = await tx
    .update(products)
    .set({
      availableStock: sql`${products.availableStock} - ${quantity}`,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), sql`${products.availableStock} >= ${quantity}`))
    .returning()

  if (updated.length === 0) {
    throw conflict("Insufficient jar stock for a product")
  }

  await tx.insert(inventoryLog).values({
    productId,
    change: -quantity,
    reason: "sale",
    refOrderId,
  })
}

async function releaseStock(
  tx: DbTx,
  productId: string,
  quantity: number,
  refOrderId: string,
) {
  await tx
    .update(products)
    .set({
      availableStock: sql`${products.availableStock} + ${quantity}`,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId))

  await tx.insert(inventoryLog).values({
    productId,
    change: quantity,
    reason: "refund",
    refOrderId,
  })
}

export interface CreateOrderForCustomerInput {
  customerId: string
  vendorId: string
  items: OrderItemInput[]
  address: string
  city?: string
  pinCode?: string
  phone: string
  notes?: string
  paymentMethod: "cash" | "online"
  scheduledFor?: Date
  source?: "customer_order" | "vendor_delivery"
}

export async function createOrderForCustomer(
  input: CreateOrderForCustomerInput,
): Promise<{ orderId: string; orderNumber: string; grandTotal: number }> {
  const vendorRow = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, input.vendorId))
    .limit(1)
    .then((r) => r[0])
  if (!vendorRow) throw notFound("Vendor not found")
  if (vendorRow.status !== "approved") {
    throw badRequest("This vendor is not approved yet")
  }

  const relation = await db
    .select({ status: vendorCustomers.status })
    .from(vendorCustomers)
    .where(
      and(
        eq(vendorCustomers.customerId, input.customerId),
        eq(vendorCustomers.vendorId, vendorRow.id),
      ),
    )
    .limit(1)
    .then((r) => r[0])
  if (relation?.status === "closed") {
    throw forbidden("Your account with this vendor is closed")
  }

  const productIds = input.items.map((i) => i.productId)
  const productRows = await loadProductsForVendor(productIds, input.vendorId)
  if (productRows.length !== new Set(productIds).size) {
    throw badRequest("One or more products are unavailable")
  }
  for (const row of productRows) {
    if (!row.active) throw badRequest(`Product "${row.name}" is inactive`)
  }

  const customPriceRows =
    productRows.length > 0
      ? await db
          .select({
            productId: customerPrices.productId,
            pricePerJar: customerPrices.pricePerJar,
          })
          .from(customerPrices)
          .where(
            and(
              eq(customerPrices.customerId, input.customerId),
              eq(customerPrices.vendorId, input.vendorId),
              inArray(customerPrices.productId, productRows.map((p) => p.id)),
            ),
          )
      : []
  const customPriceMap = new Map(customPriceRows.map((r) => [r.productId, r.pricePerJar]))

  const productMap = new Map(productRows.map((p) => [p.id, p]))

  let totalAmount = 0
  let depositAmount = 0
  const orderItemsToInsert = input.items.map((item) => {
    const product = productMap.get(item.productId)
    if (!product) throw badRequest("Product not found")
    const unitPrice = customPriceMap.get(product.id) ?? product.pricePerJar
    const lineTotal = item.quantity * unitPrice
    const depositTotal = item.quantity * product.depositPerJar
    totalAmount += lineTotal
    depositAmount += depositTotal
    return {
      productId: product.id,
      productName: product.name,
      sizeLiters: product.sizeLiters,
      quantity: item.quantity,
      unitPrice,
      unitDeposit: product.depositPerJar,
      total: lineTotal,
      depositTotal,
    }
  })

  const orderNumber = generateOrderNumber()

  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        customerId: input.customerId,
        vendorId: vendorRow.id,
        address: input.address,
        city: input.city ?? null,
        pinCode: input.pinCode ?? null,
        phone: input.phone,
        notes: input.notes ?? null,
        totalAmount: Math.round(totalAmount * 100) / 100,
        depositAmount: Math.round(depositAmount * 100) / 100,
        grandTotal: Math.round((totalAmount + depositAmount) * 100) / 100,
        status: "pending",
        source: input.source ?? "customer_order",
        paymentMethod: input.paymentMethod,
        paymentStatus: "created",
        scheduledFor: input.scheduledFor ?? null,
      })
      .returning()
    if (!order) throw badRequest("Failed to create order")

    await tx.insert(orderItems).values(
      orderItemsToInsert.map((item) => ({ ...item, orderId: order.id })),
    )

    await tx.insert(deliveries).values({
      orderId: order.id,
      status: "pending",
      notes: input.notes ?? null,
    })
    const [deliveryRow] = await tx
      .select()
      .from(deliveries)
      .where(eq(deliveries.orderId, order.id))
      .limit(1)
    if (!deliveryRow) throw badRequest("Failed to create delivery record")
    await tx.insert(deliveryEvents).values({
      deliveryId: deliveryRow.id,
      status: "pending",
    })

    await tx.insert(payments).values({
      orderId: order.id,
      amount: order.grandTotal,
      method: input.paymentMethod,
      status: "created",
    })

    for (const item of orderItemsToInsert) {
      await reserveStock(tx, item.productId, item.quantity, order.id)
    }

    return order.id
  })

  const vendorStaff = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.vendorId, vendorRow.id), eq(users.role, "vendor")))

  const isVendorDelivery = input.source === "vendor_delivery"
  for (const staff of vendorStaff) {
    await notify({
      userId: staff.id,
      type: isVendorDelivery ? "delivery_created" : "new_order",
      title: isVendorDelivery ? "New delivery recorded" : "New order received",
      body: `Order ${orderNumber} worth ₹${(totalAmount + depositAmount).toFixed(2)} received.`,
      href: `/vendor/orders/${orderId}`,
      emailRecipient: staff.email,
    })
  }

  return {
    orderId,
    orderNumber,
    grandTotal: Math.round((totalAmount + depositAmount) * 100) / 100,
  }
}

export async function createOrder(
  userId: string,
  input: CreateOrderInput,
): Promise<string> {
  const customerRow = await getCustomerByUserId(userId)
  if (!customerRow) throw badRequest("Customer profile not found")

  const { orderId } = await createOrderForCustomer({
    customerId: customerRow.id,
    vendorId: input.vendorId,
    items: input.items,
    address: input.address,
    city: input.city,
    pinCode: input.pinCode,
    phone: input.phone,
    notes: input.notes,
    paymentMethod: input.paymentMethod,
    scheduledFor: input.scheduledFor,
  })

  return orderId
}

export async function transitionOrderStatus(
  orderId: string,
  newStatus: Extract<OrderStatus, "accepted" | "out_for_delivery" | "delivered" | "cancelled">,
  actorUserId: string,
  note?: string,
) {
  const orderRow = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
    .then((r) => r[0])
  if (!orderRow) throw notFound("Order not found")

  const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending: ["accepted", "cancelled"],
    accepted: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  }
  const nextAllowed = allowed[orderRow.status] ?? []
  if (!nextAllowed.includes(newStatus)) {
    throw badRequest(`Cannot transition order from ${orderRow.status} to ${newStatus}`)
  }

  await db.transaction(async (tx) => {
    const now = new Date()
    const nowSql = new Date()

    const deliveryFields: Partial<typeof deliveries.$inferSelect> = {}
    if (newStatus === "accepted") deliveryFields.assignedAt = nowSql
    if (newStatus === "out_for_delivery") deliveryFields.outForDeliveryAt = nowSql
    if (newStatus === "delivered") deliveryFields.deliveredAt = nowSql
    if (newStatus === "cancelled") deliveryFields.cancelledAt = nowSql

    await tx
      .update(deliveries)
      .set({
        status: newStatus,
        ...deliveryFields,
        notes: note ?? null,
        updatedAt: nowSql,
      })
      .where(eq(deliveries.orderId, orderId))

    const orderUpdate: Partial<typeof orders.$inferSelect> = {
      status: newStatus,
      updatedAt: nowSql,
    }
    if (newStatus === "delivered") {
      orderUpdate.deliveredAt = nowSql
      const paymentRow = await tx
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1)
        .then((r) => r[0])
      if (paymentRow && paymentRow.method === "cash") {
        orderUpdate.paymentStatus = "paid"
        await tx
          .update(payments)
          .set({ status: "paid", receivedAt: nowSql })
          .where(eq(payments.id, paymentRow.id))
      }
    }
    if (newStatus === "cancelled") {
      orderUpdate.paymentStatus = "refunded"
      await tx
        .update(payments)
        .set({ status: "refunded" })
        .where(eq(payments.orderId, orderId))

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))
      for (const item of items) {
        if (item.productId) {
          await releaseStock(tx, item.productId, item.quantity, orderId)
        }
      }
    }

    await tx.update(orders).set(orderUpdate).where(eq(orders.id, orderId))
    const deliveryRow = await tx
      .select()
      .from(deliveries)
      .where(eq(deliveries.orderId, orderId))
      .limit(1)
      .then((r) => r[0])
    if (deliveryRow) {
      await tx.insert(deliveryEvents).values({
        deliveryId: deliveryRow.id,
        status: newStatus,
        note: note ?? null,
      })
    }
  })

  await notifyOrderParties(orderRow, newStatus, note)
}

export async function notifyOrderParties(
  orderRow: typeof orders.$inferSelect,
  newStatus: OrderStatus,
  note?: string,
) {
  const customerUser = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .innerJoin(customers, eq(customers.userId, users.id))
    .where(eq(customers.id, orderRow.customerId))
    .limit(1)
    .then((r) => r[0])

  const vendorUser = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.vendorId, orderRow.vendorId))
    .limit(1)
    .then((r) => r[0])

  const titleMap: Record<OrderStatus, string> = {
    pending: "Order pending",
    accepted: "Order accepted",
    out_for_delivery: "Out for delivery",
    delivered: "Order delivered",
    cancelled: "Order cancelled",
  }
  const typeMap: Record<OrderStatus, Parameters<typeof notify>[0]["type"]> = {
    pending: "order_placed",
    accepted: "order_accepted",
    out_for_delivery: "order_out_for_delivery",
    delivered: "order_delivered",
    cancelled: "order_cancelled",
  }

  if (customerUser) {
    await notify({
      userId: customerUser.id,
      type: typeMap[newStatus],
      title: titleMap[newStatus],
      body: `Your order ${orderRow.orderNumber} is now ${newStatus.replaceAll("_", " ")}.`,
      href: `/customer/orders/${orderRow.id}`,
      emailRecipient: customerUser.email,
      email: orderStatusEmail({
        recipientName: customerUser.name,
        orderNumber: orderRow.orderNumber,
        statusLabel: ORDER_STATUS_LABELS[newStatus],
        vendorName: await vendorDisplayName(orderRow.vendorId),
        note,
      }),
    })
  }
  if (vendorUser) {
    await notify({
      userId: vendorUser.id,
      type: typeMap[newStatus],
      title: titleMap[newStatus],
      body: `Order ${orderRow.orderNumber} is now ${newStatus.replaceAll("_", " ")}.${note ? ` Note: ${note}` : ""}`,
      href: `/vendor/orders/${orderRow.id}`,
      emailRecipient: vendorUser.email,
      email: orderStatusEmail({
        recipientName: vendorUser.name,
        orderNumber: orderRow.orderNumber,
        statusLabel: ORDER_STATUS_LABELS[newStatus],
        note,
      }),
    })
  }
}

async function vendorDisplayName(vendorId: string) {
  const row = await db
    .select({ name: vendors.name })
    .from(vendors)
    .where(eq(vendors.id, vendorId))
    .limit(1)
    .then((r) => r[0])
  return row?.name ?? null
}

export async function loadOrderDetail(
  orderId: string,
  scope?: { vendorId?: string; customerUserId?: string },
) {
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
    .then((r) => r[0])
  if (!order) throw notFound("Order not found")

  if (scope?.vendorId && order.vendorId !== scope.vendorId) throw forbidden()
  if (scope?.customerUserId) {
    const customerRow = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1)
      .then((r) => r[0])
    if (!customerRow || customerRow.userId !== scope.customerUserId) throw forbidden()
  }

  const [customerInfo] = await db
    .select({
      customerId: customers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      address: customers.address,
      city: customers.city,
      pinCode: customers.pinCode,
    })
    .from(customers)
    .innerJoin(users, eq(users.id, customers.userId))
    .where(eq(customers.id, order.customerId))
    .limit(1)

  const [vendorRow] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, order.vendorId))
    .limit(1)

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(orderItems.productName)

  const [deliveryRow] = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.orderId, order.id))
    .limit(1)

  const eventRows = deliveryRow
    ? await db
        .select()
        .from(deliveryEvents)
        .where(eq(deliveryEvents.deliveryId, deliveryRow.id))
        .orderBy(deliveryEvents.at)
    : []

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .orderBy(payments.createdAt)

  return serializeOrderDetail({
    order,
    customer: customerInfo
      ? {
          id: customerInfo.customerId,
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          pinCode: customerInfo.pinCode,
        }
      : null,
    vendor: vendorRow ? { id: vendorRow.id, name: vendorRow.name, phone: vendorRow.phone } : null,
    items,
    delivery: deliveryRow ?? null,
    deliveryEvents: eventRows.map((e) => ({
      id: e.id,
      deliveryId: e.deliveryId,
      status: e.status,
      note: e.note,
      at: e.at,
    })),
    payments: paymentRows,
  })
}