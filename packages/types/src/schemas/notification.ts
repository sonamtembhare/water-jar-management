import { z } from "zod"

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  href: z.string().nullable(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  total: z.number(),
  unread: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const unreadCountSchema = z.object({
  unread: z.number(),
})

/** Expo push token, e.g. `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`. */
export const pushTokenSchema = z
  .object({
    token: z
      .string()
      .max(200)
      .regex(/^(ExponentPushToken\[.+\]|ExpoPushToken\[.+\])$/, "Invalid Expo push token"),
    platform: z.enum(["ios", "android", "web"]).optional(),
  })
  .strict()

export const markReadSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict()
  .or(z.object({ all: z.literal(true) }).strict())
  .optional()

export type Notification = z.infer<typeof notificationSchema>
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>
export type UnreadCount = z.infer<typeof unreadCountSchema>
export type PushTokenInput = z.infer<typeof pushTokenSchema>