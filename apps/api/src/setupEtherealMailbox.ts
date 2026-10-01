import fs from "node:fs"
import path from "node:path"
import nodemailer from "nodemailer"

const envPath = path.resolve(process.cwd(), ".env")

function readEnvFile(): string {
  if (!fs.existsSync(envPath)) return ""
  return fs.readFileSync(envPath, "utf8")
}

function upsertEnv(contents: string, key: string, value: string): string {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, "m")
  if (re.test(contents)) {
    return contents.replace(re, line)
  }
  const separator = contents.endsWith("\n") || contents === "" ? "" : "\n"
  return `${contents}${separator}${line}\n`
}

async function setupEthereal() {
  const force = process.argv.includes("--force")
  const existing = readEnvFile()
  const alreadyConfigured = /^SMTP_HOST=\S+/m.test(existing)

  if (alreadyConfigured && !force) {
    console.log("[smtp] SMTP_HOST already set in .env — pass --force to replace it")
    return
  }

  console.log("[smtp] creating an Ethereal test mailbox...")
  const account = await nodemailer.createTestAccount()

  let contents = existing
  contents = upsertEnv(contents, "SMTP_HOST", account.smtp.host)
  contents = upsertEnv(contents, "SMTP_PORT", String(account.smtp.port))
  contents = upsertEnv(contents, "SMTP_USER", account.user)
  contents = upsertEnv(contents, "SMTP_PASS", account.pass)
  contents = upsertEnv(contents, "SMTP_FROM", "Water Jar Management <noreply@ethereal.email>")

  fs.writeFileSync(envPath, contents, "utf8")
  console.log(`[smtp] wrote SMTP_* settings to ${envPath}`)

  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  })

  const info = await transporter.sendMail({
    from: "Water Jar Management <noreply@ethereal.email>",
    to: "dev@waterjar.local",
    subject: "SMTP is working",
    text: "If you can read this, real email delivery is configured for dev.",
  })

  const previewUrl = nodemailer.getTestMessageUrl(info)
  console.log("[smtp] test message sent.")
  if (account.webmail) console.log(`[smtp] inbox:  ${account.webmail}`)
  if (previewUrl) console.log(`[smtp] test message: ${previewUrl}`)
  console.log("[smtp] done — restart the API to pick up the new .env values.")
}

if (require.main === module) {
  setupEthereal()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[smtp] failed", err)
      process.exit(1)
    })
}
