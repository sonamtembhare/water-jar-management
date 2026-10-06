import { db, notifications } from "@repo/db"
import { APP_URL } from "../config/env"
import type { NotificationType } from "@repo/types"
import { sendEmail } from "./email"
import { pushToUser } from "./push"

export interface NotifyEmail {
  subject: string
  text: string
}

export interface NotifyInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  href?: string
  emailRecipient?: string
  /**
   * Overrides the plain-text email copy. The in-app notification keeps the
   * short `title`/`body` pair; the email gets the fuller message callers send.
   */
  email?: NotifyEmail
}

/**
 * Creates the in-app notification, triggers the Expo push, and (when an SMTP
 * host is configured) sends the email. Returns whether the email went out, so
 * callers can report email status without breaking the primary flow — the
 * database write must already be committed before this is called.
 */
export async function notify({
  userId,
  type,
  title,
  body,
  href,
  emailRecipient,
  email,
}: NotifyInput): Promise<boolean> {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    body,
    href: href ?? null,
  })

  // Expo push for the vendor mobile app. `pushToUser` never throws, so a
  // failing push cannot break the request that triggered the notification.
  await pushToUser(userId, { title, body, data: { type, href: href ?? null } })

  if (!emailRecipient || !process.env.SMTP_HOST) return false
  try {
    await sendEmail({
      to: emailRecipient,
      subject: email?.subject ?? title,
      text: email?.text ?? body,
    })
    return true
  } catch (err) {
    console.error("[EmailError]", err)
    return false
  }
}

/** Builds the order-status email both the customer and the vendor receive. */
export function orderStatusEmail(options: {
  recipientName: string
  orderNumber: string
  statusLabel: string
  vendorName?: string | null
  note?: string
}) {
  const { recipientName, orderNumber, statusLabel, vendorName, note } = options
  return {
    subject: "Your Water Jar Order Status Has Been Updated",
    text: [
      `Hello ${recipientName},`,
      "",
      `Your water jar order #${orderNumber} has been updated.`,
      vendorName ? `Vendor: ${vendorName}` : null,
      "",
      "New status:",
      statusLabel,
      note ? `Note: ${note}` : null,
      "",
      `Track your orders: ${APP_URL}/customer/orders`,
      "",
      "Thank you,",
      "Water Jar Management",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  } satisfies NotifyEmail
}

/**
 * Builds the confirmation email a customer receives when a vendor records a
 * delivery/order. Only existing fields are used: order number, order date,
 * total jar count, the real order/delivery status, and the vendor's name.
 */
export function deliveryConfirmationEmail(options: {
  recipientName: string
  orderNumber: string
  date: string
  jarCount: number
  statusLabel: string
  vendorName?: string | null
  note?: string
}) {
  const { recipientName, orderNumber, date, jarCount, statusLabel, vendorName, note } =
    options
  return {
    subject: "Your Water Jar Order is Confirmed",
    text: [
      `Hello ${recipientName},`,
      "",
      "Your water jar order has been confirmed successfully.",
      "",
      "Order/delivery details:",
      `  • Order/delivery ID: ${orderNumber}`,
      `  • Date: ${date}`,
      `  • Number of jars: ${jarCount}`,
      `  • Delivery status: ${statusLabel}`,
      vendorName ? `  • Vendor/Business name: ${vendorName}` : null,
      note ? `  • Note: ${note}` : null,
      "",
      "Thank you for choosing our service.",
      "",
      "Water Jar Management",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  } satisfies NotifyEmail
}