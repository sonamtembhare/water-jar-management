import {
  customers,
  deliveries,
  orderItems,
  orders,
  payments,
  products,
  users,
  vendors,
} from "@repo/db"

type UserRow = typeof users.$inferSelect
type VendorRow = typeof vendors.$inferSelect
type CustomerRow = typeof customers.$inferSelect
type ProductRow = typeof products.$inferSelect
type OrderRow = typeof orders.$inferSelect
type OrderItemRow = typeof orderItems.$inferSelect
type DeliveryRow = typeof deliveries.$inferSelect
type PaymentRow = typeof payments.$inferSelect

export function serializeUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    vendorId: user.vendorId,
  }
}

export function serializeCustomer(customerRow: CustomerRow) {
  return {
    id: customerRow.id,
    userId: customerRow.userId,
    phone: customerRow.phone,
    address: customerRow.address,
    city: customerRow.city,
    pinCode: customerRow.pinCode,
    createdAt: customerRow.createdAt,
    updatedAt: customerRow.updatedAt,
  }
}

export function serializeVendor(vendor: VendorRow) {
  return {
    id: vendor.id,
    name: vendor.name,
    description: vendor.description,
    address: vendor.address,
    phone: vendor.phone,
    gstin: vendor.gstin,
    status: vendor.status,
    approvedAt: vendor.approvedAt,
    createdAt: vendor.createdAt,
  }
}

export function serializeProduct(product: ProductRow) {
  return {
    id: product.id,
    vendorId: product.vendorId,
    name: product.name,
    description: product.description,
    sizeLiters: product.sizeLiters,
    pricePerJar: product.pricePerJar,
    depositPerJar: product.depositPerJar,
    availableStock: product.availableStock,
    active: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export function serializeOrderItem(item: OrderItemRow) {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    productName: item.productName,
    sizeLiters: item.sizeLiters,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    unitDeposit: item.unitDeposit,
    total: item.total,
    depositTotal: item.depositTotal,
  }
}

export function serializeOrder(order: OrderRow) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    vendorId: order.vendorId,
    address: order.address,
    city: order.city,
    pinCode: order.pinCode,
    phone: order.phone,
    notes: order.notes,
    totalAmount: order.totalAmount,
    depositAmount: order.depositAmount,
    grandTotal: order.grandTotal,
    status: order.status,
    source: order.source,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    scheduledFor: order.scheduledFor,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export function serializeDelivery(delivery: DeliveryRow) {
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    status: delivery.status,
    assignedAt: delivery.assignedAt,
    outForDeliveryAt: delivery.outForDeliveryAt,
    deliveredAt: delivery.deliveredAt,
    cancelledAt: delivery.cancelledAt,
    notes: delivery.notes,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  }
}

export function serializePayment(payment: PaymentRow) {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    razorpaySignature: payment.razorpaySignature,
    receivedAt: payment.receivedAt,
    createdAt: payment.createdAt,
  }
}

export interface OrderCustomerInfo {
  id: string
  userId?: string | null
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  pinCode: string | null
}

export interface OrderVendorInfo {
  id: string
  name: string
  phone: string | null
}

export function serializeOrderRow({
  order,
  customer,
  vendor,
}: {
  order: OrderRow
  customer?: OrderCustomerInfo | null
  vendor?: OrderVendorInfo | null
}) {
  return {
    ...serializeOrder(order),
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          pinCode: customer.pinCode,
        }
      : null,
    vendor: vendor
      ? { id: vendor.id, name: vendor.name, phone: vendor.phone }
      : null,
  }
}

export function serializeOrderDetail(input: {
  order: OrderRow
  customer?: OrderCustomerInfo | null
  vendor?: OrderVendorInfo | null
  items: OrderItemRow[]
  delivery?: DeliveryRow | null
  deliveryEvents?: { id: string; deliveryId: string; status: string; note: string | null; at: Date }[]
  payments: PaymentRow[]
}) {
  return {
    ...serializeOrderRow(input),
    items: input.items.map(serializeOrderItem),
    delivery: input.delivery ? serializeDelivery(input.delivery) : null,
    deliveryEvents: input.deliveryEvents ?? [],
    payments: input.payments.map(serializePayment),
  }
}