import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")

export const phoneSchema = z
  .string()
  .regex(/^[0-9+\-\s()]{8,15}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal("").transform(() => undefined))

export const registerCustomerSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema.optional(),
    address: z.string().min(5, "Address is required").optional(),
    city: z.string().optional(),
    pinCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code").optional(),
  })
  .strict()

export const registerVendorSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema.optional(),
    businessName: z.string().min(2, "Business name is required"),
    address: z.string().optional(),
    gstin: z.string().optional(),
  })
  .strict()

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  })
  .strict()

export const inviteStaffSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema.optional(),
  })
  .strict()

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, "Name is required").optional(),
    phone: phoneSchema.optional(),
    address: z.string().min(5, "Address is required").optional(),
    city: z.string().optional(),
    pinCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code").optional(),
  })
  .strict()

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>
export type RegisterVendorInput = z.infer<typeof registerVendorSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>