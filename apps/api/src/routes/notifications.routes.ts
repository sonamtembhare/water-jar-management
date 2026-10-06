import { Router } from "express"
import { and, count, desc, eq, isNull } from "drizzle-orm"
import { db, notifications } from "@repo/db"
import { pushTokenSchema } from "@repo/types"
import { asyncHandler, notFound } from "../middleware/error"
import { requireAuth } from "../middleware/auth"
import { validateBody } from "../middleware/validate"
import { registerPushToken, unregisterPushToken } from "../services/push"
import { paramStr } from "../utils/helpers"

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)

notificationsRouter.get("/", asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const page = Math.max(Number(req.query.page ?? 1), 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 10), 1), 100)

  const [totalRow] = await db
    .select({ value: count() })
    .from(notifications)
    .where(eq(notifications.userId, userId))

  const [unreadRow] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  res.json({
    success: true,
    data: {
      notifications: rows.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        href: n.href,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      total: totalRow?.value ?? 0,
      unread: unreadRow?.value ?? 0,
      page,
      pageSize,
    },
  })
}))

notificationsRouter.get("/unread-count", asyncHandler(async (req, res) => {
  const [unreadRow] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, req.user!.id), isNull(notifications.readAt)))

  res.json({ success: true, data: { unread: unreadRow?.value ?? 0 } })
}))

notificationsRouter.patch("/:id/read", asyncHandler(async (req, res) => {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, paramStr(req, "id")), eq(notifications.userId, req.user!.id)))
    .returning()

  if (!updated) throw notFound("Notification not found")
  res.json({
    success: true,
    data: {
      id: updated.id,
      readAt: updated.readAt,
    },
  })
}))

notificationsRouter.patch("/read-all", asyncHandler(async (req, res) => {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, req.user!.id), isNull(notifications.readAt)))

  res.json({ success: true, data: { updated: true } })
}))

// ---- Expo push tokens (vendor mobile app) ----

notificationsRouter.post(
  "/push-token",
  validateBody(pushTokenSchema),
  asyncHandler(async (req, res) => {
    const { token, platform } = req.body as ReturnType<typeof pushTokenSchema.parse>
    await registerPushToken(req.user!.id, token, platform ?? null)
    res.status(201).json({ success: true, data: { token, registered: true } })
  }),
)

notificationsRouter.delete(
  "/push-token",
  validateBody(pushTokenSchema),
  asyncHandler(async (req, res) => {
    const { token } = req.body as ReturnType<typeof pushTokenSchema.parse>
    const removed = await unregisterPushToken(req.user!.id, token)
    res.json({ success: true, data: { token, removed } })
  }),
)
