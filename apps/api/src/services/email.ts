import nodemailer from "nodemailer"
import { env } from "../config/env"

export interface EmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail({ to, subject, text, html }: EmailInput): Promise<void> {
  const host = env.SMTP_HOST
  if (!host) {
    console.log(`[Email skipped — SMTP not configured] to=${to} subject=${subject}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  })

  await transporter.sendMail({
    from: env.SMTP_FROM ?? "Water Jar Management <noreply@waterjar.local>",
    to,
    subject,
    text,
    html,
  })
}