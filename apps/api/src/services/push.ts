import { and, eq, inArray } from "drizzle-orm"
import { db, pushTokens } from "@repo/db"
import { env } from "../config/env"

/**
 * Expo Push Notification Service (https://exp.host/--/api/v2/push/send).
 *
 * Push delivery is best-effort: a network hiccup, an unconfigured access token
 * or a revoked device token must never fail the API request that produced the
 * notification. Every failure here is logged and swallowed.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

export interface PushMessage {
  title: string
  body: string
  data?: Record<string, unknown>
  /** Suppresses the OS alert — used when the app is already foregrounded. */
  silent?: boolean
}

interface ExpoTicket {
  status: "ok" | "error"
  id?: string
  message?: string
  details?: { error?: string }
}

function isExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(token)
}

async function deliver(token: string, message: PushMessage): Promise<boolean> {
  const ticket = await postTicket(token, message)
  if (ticket.status === "ok") return true

  // A token the push service no longer knows about is dead weight; drop the row
  // so future notifications skip it.
  if (ticket.details?.error === "DeviceNotRegistered") {
    await db.delete(pushTokens).where(eq(pushTokens.token, token)).catch((err) => {
      console.error("[PushError] failed to prune dead token", err)
    })
    return false
  }

  console.error(`[PushError] ${ticket.details?.error ?? ticket.message ?? "unknown"}`)
  return false
}

async function postTicket(token: string, message: PushMessage): Promise<ExpoTicket> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  // Only required for branded push projects; harmless to omit otherwise.
  if (env.EXPO_PUSH_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${env.EXPO_PUSH_ACCESS_TOKEN}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        to: token,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: "default",
        priority: "high",
        channelId: env.EXPO_PUSH_ANDROID_CHANNEL,
        ...(message.silent ? { _contentAvailable: false } : {}),
      }),
    })

    if (!res.ok) {
      console.error(`[PushError] push service responded ${res.status}`)
      return { status: "error", message: `HTTP ${res.status}` }
    }

    const payload = (await res.json()) as { data?: ExpoTicket | ExpoTicket[] }
    const first = Array.isArray(payload.data) ? payload.data[0] : payload.data
    return first ?? { status: "error", message: "Empty push response" }
  } catch (err) {
    console.error("[PushError] push request failed", err)
    return { status: "error", message: String(err) }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Delivers a push message to every device the user registered. Returns the
 * number of devices the push service accepted.
 */
export async function pushToUser(
  userId: string,
  message: PushMessage,
): Promise<number> {
  if (!env.PUSH_NOTIFICATIONS_ENABLED) return 0

  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId))

  const tokens = rows.map((r) => r.token).filter(isExpoPushToken)
  if (tokens.length === 0) return 0

  const results = await Promise.all(tokens.map((token) => deliver(token, message)))

  // Successful delivery proves the device is alive; refresh lastSeenAt so stale
  // rows are easy to spot.
  const delivered = tokens.filter((_, i) => results[i])
  if (delivered.length > 0) {
    await db
      .update(pushTokens)
      .set({ lastSeenAt: new Date() })
      .where(
        and(
          eq(pushTokens.userId, userId),
          inArray(pushTokens.token, delivered),
        ),
      )
      .catch((err) => console.error("[PushError] failed to refresh lastSeenAt", err))
  }

  return delivered.length
}

/**
 * Registers (or re-owns) a device token. Tokens are globally unique, so a phone
 * that signs in with a different account moves the existing row to that user
 * rather than creating a duplicate.
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform?: string | null,
): Promise<void> {
  const existing = await db
    .select({ id: pushTokens.id, userId: pushTokens.userId })
    .from(pushTokens)
    .where(eq(pushTokens.token, token))
    .limit(1)

  if (existing[0]) {
    await db
      .update(pushTokens)
      .set({ userId, platform: platform ?? null, lastSeenAt: new Date() })
      .where(eq(pushTokens.id, existing[0].id))
    return
  }

  await db.insert(pushTokens).values({ userId, token, platform: platform ?? null })
}

export async function unregisterPushToken(userId: string, token: string): Promise<boolean> {
  const removed = await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)))
    .returning({ id: pushTokens.id })
  return removed.length > 0
}