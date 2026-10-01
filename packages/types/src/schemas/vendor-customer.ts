import { z } from "zod"
import { emailSchema, passwordSchema, phoneSchema } from "./auth"

export const vendorCustomerCreateSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema.optional(),
    address: z.string().min(1, "Address is required").optional(),
  })
  .strict()

export const vendorCustomerUpdateSchema = z
  .object({
    name: z.string().min(2, "Name is required").optional(),
    phone: phoneSchema.optional(),
    address: z.string().min(1, "Address is required").optional(),
  })
  .strict()

export const vendorCustomerStatusUpdateSchema = z
  .object({
    status: z.enum(["running", "closed"]),
  })
  .strict()

export const vendorCustomerListItemSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  status: z.enum(["running", "closed"]),
  totalOrders: z.number(),
  deliveredOrders: z.number(),
  totalSpent: z.number(),
  lastOrderAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const vendorCustomerListResponseSchema = z.object({
  customers: z.array(vendorCustomerListItemSchema),
  total: z.number(),
})

export const vendorCustomerDetailSchema = vendorCustomerListItemSchema.extend({
  recentOrders: z.array(
    z.object({
      id: z.string().uuid(),
      orderNumber: z.string(),
      status: z.string(),
      grandTotal: z.number(),
      createdAt: z.coerce.date(),
    }),
  ),
})

export type VendorCustomerCreateInput = z.infer<typeof vendorCustomerCreateSchema>
export type VendorCustomerUpdateInput = z.infer<typeof vendorCustomerUpdateSchema>
export type VendorCustomerStatusUpdateInput = z.infer<
  typeof vendorCustomerStatusUpdateSchema
>
export type VendorCustomerListItem = z.infer<typeof vendorCustomerListItemSchema>
export type VendorCustomerListResponse = z.infer<typeof vendorCustomerListResponseSchema>
export type VendorCustomerDetail = z.infer<typeof vendorCustomerDetailSchema>