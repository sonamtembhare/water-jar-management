import { db, notifications } from "@repo/db"
import type { NotificationType } from "@repo/types"
import { sendEmail } from "./email"

export interface NotifyInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  href?: string
  emailRecipient?: string
}

export async function notify({
  userId,
  type,
  title,
  body,
  href,
  emailRecipient,
}: NotifyInput): Promise<void> {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    body,
    href: href ?? null,
  })

  if (emailRecipient && process.env.SMTP_HOST) {
    try {
      await sendEmail({
        to: emailRecipient,
        subject: title,
        text: body,
      })
    } catch (err) {
      console.error("[EmailError]", err)
    }
  }
}