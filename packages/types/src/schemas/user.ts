import { z } from "zod"
import { phoneSchema } from "./auth"

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(["super_admin", "vendor", "customer"]),
  status: z.enum(["active", "blocked"]),
  vendorId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const publicVendorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  gstin: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  approvedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})

export const customerProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  pinCode: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const vendorUpdateSchema = z
  .object({
    name: z.string().min(2, "Business name is required").optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    phone: phoneSchema.optional(),
    gstin: z.string().optional(),
  })
  .strict()

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(["super_admin", "vendor", "customer"]),
  status: z.enum(["active", "blocked"]),
  vendorId: z.string().uuid().nullable(),
})

export const loginResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
})

export type User = z.infer<typeof userSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type PublicVendor = z.infer<typeof publicVendorSchema>
export type CustomerProfile = z.infer<typeof customerProfileSchema>
export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>