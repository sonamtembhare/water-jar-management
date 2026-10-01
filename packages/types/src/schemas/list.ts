import { z } from "zod"
import { orderSchema } from "./order"

export const orderListResponseSchema = z.object({
  items: z.array(orderSchema),
  total: z.number(),
})

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]).optional(),
})

export type OrderListResponse = z.infer<typeof orderListResponseSchema>