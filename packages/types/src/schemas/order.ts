import { z } from "zod"

export const orderItemInputSchema = z
  .object({
    productId: z.string().uuid("Select a product"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  })
  .strict()

export const createOrderSchema = z
  .object({
    vendorId: z.string().uuid("Select a vendor"),
    address: z.string().min(5, "Delivery address is required"),
    city: z.string().optional(),
    pinCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code").optional(),
    phone: z.string().regex(/^[0-9+\-\s()]{8,15}$/, "Enter a valid phone number"),
    notes: z.string().optional(),
    scheduledFor: z.coerce.date().optional(),
    paymentMethod: z.enum(["cash", "online"]).default("cash"),
    items: z.array(orderItemInputSchema).min(1, "Add at least one item"),
  })
  .strict()

export const orderStatusUpdateSchema = z
  .object({
    status: z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]),
    note: z.string().optional(),
  })
  .strict()

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  productName: z.string(),
  sizeLiters: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  unitDeposit: z.number(),
  total: z.number(),
  depositTotal: z.number(),
})

export const orderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  customerId: z.string().uuid(),
  vendorId: z.string().uuid(),
  address: z.string(),
  city: z.string().nullable(),
  pinCode: z.string().nullable(),
  phone: z.string(),
  notes: z.string().nullable(),
  totalAmount: z.number(),
  depositAmount: z.number(),
  grandTotal: z.number(),
  status: z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]),
  source: z.enum(["customer_order", "vendor_delivery"]),
  paymentMethod: z.enum(["cash", "online"]),
  paymentStatus: z.enum(["created", "paid", "failed", "refunded"]),
  scheduledFor: z.coerce.date().nullable(),
  deliveredAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const deliveryEventSchema = z.object({
  id: z.string().uuid(),
  deliveryId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]),
  note: z.string().nullable(),
  at: z.coerce.date(),
})

export const deliverySchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]),
  assignedAt: z.string().nullable(),
  outForDeliveryAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const orderDetailSchema = orderSchema.extend({
  customer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
      phone: z.string().nullable(),
      address: z.string().nullable(),
      city: z.string().nullable(),
      pinCode: z.string().nullable(),
    })
    .nullable(),
  vendor: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      phone: z.string().nullable(),
    })
    .nullable(),
  items: z.array(orderItemSchema),
  delivery: deliverySchema.nullable(),
  deliveryEvents: z.array(deliveryEventSchema),
  payments: z.array(
    z.object({
      id: z.string().uuid(),
      amount: z.number(),
      method: z.enum(["cash", "online"]),
      status: z.enum(["created", "paid", "failed", "refunded"]),
      razorpayOrderId: z.string().nullable(),
      razorpayPaymentId: z.string().nullable(),
      receivedAt: z.coerce.date().nullable(),
      createdAt: z.coerce.date(),
    }),
  ),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderDetail = z.infer<typeof orderDetailSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type Delivery = z.infer<typeof deliverySchema>
export type DeliveryEvent = z.infer<typeof deliveryEventSchema>