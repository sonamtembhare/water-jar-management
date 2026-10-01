import { z } from "zod"

export const customerPriceCreateSchema = z
  .object({
    productId: z.string().uuid("Select a jar size"),
    pricePerJar: z.coerce.number().positive("Price must be greater than 0"),
  })
  .strict()

export const customerPriceUpdateSchema = z
  .object({
    pricePerJar: z.coerce.number().positive("Price must be greater than 0"),
  })
  .strict()

export const customerPriceSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  sizeLiters: z.string(),
  basePrice: z.number(),
  baseDeposit: z.number(),
  pricePerJar: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const customerPriceListResponseSchema = z.object({
  prices: z.array(customerPriceSchema),
  total: z.number(),
})

export const customerPriceOverridesSchema = z.object({
  prices: z.array(
    z.object({
      productId: z.string().uuid(),
      pricePerJar: z.number(),
    }),
  ),
})

export const vendorDeliveryItemSchema = z
  .object({
    productId: z.string().uuid("Select a jar size"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  })
  .strict()

export const vendorDeliveryCreateSchema = z
  .object({
    customerId: z.string().uuid("Select a customer"),
    items: z.array(vendorDeliveryItemSchema).min(1, "Add at least one jar"),
    notes: z.string().optional(),
    address: z.string().min(5, "Delivery address is required").optional(),
    phone: z
      .string()
      .regex(/^[0-9+\-\s()]{8,15}$/, "Enter a valid phone number")
      .optional(),
  })
  .strict()

export const vendorDeliveryListResponseSchema = z.object({
  deliveries: z.array(
    z.object({
      id: z.string().uuid(),
      orderNumber: z.string(),
      status: z.string(),
      notes: z.string().nullable(),
      grandTotal: z.number(),
      createdAt: z.coerce.date(),
      customerId: z.string().uuid(),
      customerName: z.string(),
      customerPhone: z.string().nullable(),
      customerAddress: z.string().nullable(),
      items: z.array(
        z.object({
          productId: z.string().uuid().nullable(),
          productName: z.string(),
          sizeLiters: z.string(),
          quantity: z.number(),
        }),
      ),
    }),
  ),
  total: z.number(),
})

export type CustomerPriceCreateInput = z.infer<typeof customerPriceCreateSchema>
export type CustomerPriceUpdateInput = z.infer<typeof customerPriceUpdateSchema>
export type CustomerPrice = z.infer<typeof customerPriceSchema>
export type CustomerPriceListResponse = z.infer<typeof customerPriceListResponseSchema>
export type CustomerPriceOverrides = z.infer<typeof customerPriceOverridesSchema>
export type VendorDeliveryCreateInput = z.infer<typeof vendorDeliveryCreateSchema>
export type VendorDeliveryListResponse = z.infer<typeof vendorDeliveryListResponseSchema>