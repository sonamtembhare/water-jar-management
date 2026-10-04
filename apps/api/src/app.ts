import express from "express"
import cors from "cors"
import helmet from "helmet"
import { env } from "./config/env"
import { ApiError } from "./middleware/error"
import { authenticate, errorHandler, notFoundHandler, requireAuth } from "./middleware/auth"
import { authRouter } from "./routes/auth.routes"
import { publicVendorsRouter, vendorProtectedRouter } from "./routes/vendors.routes"
import { vendorCustomerRouter } from "./routes/vendorCustomers.routes"
import { vendorDeliveryRouter } from "./routes/vendorDeliveries.routes"
import { customerRouter } from "./routes/customers.routes"
import { paymentsRouter, webhookRouter } from "./routes/payments.routes"
import { notificationsRouter } from "./routes/notifications.routes"
import { analyticsRouter } from "./routes/analytics.routes"
import { adminRouter } from "./routes/admin.routes"

export const app = express()
export default app

app.disable("x-powered-by")
app.use(helmet())

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean)

// Outside production the browser may reach the dev server on a loopback
// address, a private LAN address, or a non-default port, and CORS silently
// blocks the response when that origin is not listed. Allow any local origin
// in development; production stays restricted to CORS_ORIGIN.
function isLocalOrigin(origin: string) {
  let host: string
  try {
    host = new URL(origin).hostname
  } catch {
    return false
  }
  if (host === "localhost") return true
  if (host === "127.0.0.1" || host === "[::1]" || host === "::1") return true
  return /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
}

/**
 * Matches one CORS_ORIGIN entry against a browser origin. An entry may use `*`
 * as a whole segment (e.g. `https://*.vercel.app`) so preview deployments of the
 * web app can be allowed without listing every generated hostname.
 */
function matchesOrigin(origin: string, allowed: string) {
  if (allowed === "*") return true
  if (!allowed.includes("*")) return allowed === origin
  const pattern = allowed
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^\\s]*")
  return new RegExp(`^${pattern}$`).test(origin)
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (allowedOrigins.some((allowed) => matchesOrigin(origin, allowed))) {
        return callback(null, true)
      }
      if (env.NODE_ENV !== "production" && isLocalOrigin(origin)) return callback(null, true)
      // 403, not a generic 500: an origin that is not in CORS_ORIGIN can never
      // read the response, so rejecting it outright avoids running the route
      // (and its DB writes) for a request the browser will throw away.
      return callback(
        new ApiError(
          403,
          `Origin not allowed: ${origin}. Add it to CORS_ORIGIN on the API deployment.`,
          "CORS_ORIGIN_REJECTED"
        )
      )
    },
  }),
)

// Razorpay webhook needs the raw body for HMAC verification.
app.use("/api/v1/webhooks", express.raw({ type: "application/json" }))
app.use("/api/v1/webhooks", webhookRouter)

app.use(express.json({ limit: "1mb" }))

const api = express.Router()
api.use(authenticate)
api.use("/auth", authRouter)
api.use("/vendors", publicVendorsRouter)
api.use("/vendor", requireAuth, vendorProtectedRouter)
api.use("/vendor", vendorCustomerRouter)
api.use("/vendor", vendorDeliveryRouter)
api.use("/customers", customerRouter)
api.use("/payments", paymentsRouter)
api.use("/notifications", notificationsRouter)
api.use("/analytics", analyticsRouter)
api.use("/admin", adminRouter)
app.use("/api/v1", api)

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Water Jar Management API",
    status: "running",
    time: new Date().toISOString(),
    health: "/health",
    base: "/api/v1",
    routes: [
      "/api/v1/auth",
      "/api/v1/vendors",
      "/api/v1/vendor",
      "/api/v1/customers",
      "/api/v1/payments",
      "/api/v1/notifications",
      "/api/v1/analytics",
      "/api/v1/admin",
      "/api/v1/webhooks",
    ],
  })
})

app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() })
})

app.use(notFoundHandler)
app.use(errorHandler)
