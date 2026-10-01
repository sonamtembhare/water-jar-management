import { z } from "zod"

export const productSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  sizeLiters: z.string(),
  pricePerJar: z.number(),
  depositPerJar: z.number(),
  availableStock: z.number(),
  active: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const productCreateSchema = z
  .object({
    name: z.string().min(2, "Product name is required"),
    description: z.string().optional(),
    sizeLiters: z.coerce.number().positive("Size must be positive"),
    pricePerJar: z.coerce
      .number()
      .nonnegative("Price must be non-negative"),
    depositPerJar: z.coerce.number().nonnegative("Deposit must be non-negative").default(0),
    availableStock: z.coerce.number().int().nonnegative("Stock must be non-negative").default(0),
  })
  .strict()

export const productUpdateSchema = productCreateSchema.partial().strict()

export const priceHistorySchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  oldPrice: z.number(),
  newPrice: z.number(),
  changedBy: z.string().uuid().nullable(),
  changedAt: z.coerce.date(),
})

export const priceChangeSchema = z
  .object({
    pricePerJar: z.coerce.number().nonnegative("Price must be non-negative"),
    depositPerJar: z.coerce.number().nonnegative("Deposit must be non-negative"),
  })
  .strict()

export type Product = z.infer<typeof productSchema>
export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type PriceHistory = z.infer<typeof priceHistorySchema>
export type PriceChangeInput = z.infer<typeof priceChangeSchema>