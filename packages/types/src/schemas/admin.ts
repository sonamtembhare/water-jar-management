import { z } from "zod"
import { publicVendorSchema, userSchema } from "./user"

export const adminVendorSchema = publicVendorSchema.extend({
  ownerName: z.string().nullable(),
  ownerEmail: z.string().nullable(),
  ownerPhone: z.string().nullable(),
  staffCount: z.number(),
  blocked: z.boolean(),
  blockedAt: z.coerce.date().nullable(),
})

export const adminVendorListResponseSchema = z.object({
  vendors: z.array(adminVendorSchema),
  total: z.number(),
})

export const vendorBlockSchema = z
  .object({
    blocked: z.boolean(),
  })
  .strict()

export const staffSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z.enum(["super_admin", "vendor", "customer"]),
  status: z.enum(["active", "blocked"]),
})

export const adminVendorDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  gstin: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  approvedAt: z.coerce.date().nullable(),
  blocked: z.boolean(),
  blockedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ownerName: z.string().nullable(),
  ownerEmail: z.string().nullable(),
  ownerPhone: z.string().nullable(),
  staff: z.array(staffSchema),
  productCount: z.number(),
  activeProductCount: z.number(),
  totalOrders: z.number(),
  deliveredOrders: z.number(),
  pendingOrders: z.number(),
  revenue: z.number(),
})

export const adminCustomerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  status: z.enum(["active", "blocked"]),
  address: z.string().nullable(),
  city: z.string().nullable(),
  pinCode: z.string().nullable(),
  totalOrders: z.number(),
  deliveredOrders: z.number(),
  totalSpent: z.number(),
  vendorsOrderedFrom: z.array(z.object({ vendorId: z.string().uuid(), name: z.string() })),
  createdAt: z.coerce.date(),
})

export const adminCustomerListResponseSchema = z.object({
  customers: z.array(adminCustomerSchema),
  total: z.number(),
})

export const userListResponseSchema = z.object({
  users: z.array(userSchema),
  total: z.number(),
})

export const vendorStatusUpdateSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    note: z.string().optional(),
  })
  .strict()

export const userStatusUpdateSchema = z
  .object({
    status: z.enum(["active", "blocked"]),
  })
  .strict()

export const broadcastNotificationSchema = z
  .object({
    userIds: z.array(z.string().uuid()).optional(),
    role: z.enum(["super_admin", "vendor", "customer"]).optional(),
    title: z.string().min(2, "Title is required"),
    body: z.string().min(2, "Message is required"),
  })
  .strict()

export const staffListResponseSchema = z.object({
  staff: z.array(staffSchema),
  total: z.number(),
})

export type AdminVendor = z.infer<typeof adminVendorSchema>
export type AdminVendorListResponse = z.infer<typeof adminVendorListResponseSchema>
export type VendorBlockInput = z.infer<typeof vendorBlockSchema>
export type AdminVendorDetail = z.infer<typeof adminVendorDetailSchema>
export type AdminCustomer = z.infer<typeof adminCustomerSchema>
export type AdminCustomerListResponse = z.infer<typeof adminCustomerListResponseSchema>
export type UserListResponse = z.infer<typeof userListResponseSchema>
export type VendorStatusUpdateInput = z.infer<typeof vendorStatusUpdateSchema>
export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>
export type Staff = z.infer<typeof staffSchema>
export type StaffListResponse = z.infer<typeof staffListResponseSchema>