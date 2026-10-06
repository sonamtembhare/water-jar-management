import { Router } from "express"
import { eq } from "drizzle-orm"
import { customers, db, users, vendors } from "@repo/db"
import {
  loginSchema,
  registerCustomerSchema,
  registerVendorSchema,
} from "@repo/types"
import { asyncHandler } from "../middleware/error"
import { requireAuth } from "../middleware/auth"
import { validateBody } from "../middleware/validate"
import { hashPassword, comparePassword } from "../utils/password"
import { signToken } from "../utils/jwt"
import { serializeUser } from "../services/serialize"
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../middleware/error"
import { notify } from "../services/notification"

export const authRouter = Router()

authRouter.post(
  "/register/customer",
  validateBody(registerCustomerSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof registerCustomerSchema.parse>

    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
    if (existing[0]) throw conflict("An account with this email already exists")

    const passwordHash = await hashPassword(data.password)
    const user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          email: data.email,
          passwordHash,
          name: data.name,
          phone: data.phone ?? null,
          role: "customer",
          status: "active",
        })
        .returning()
      if (!created) throw badRequest("Failed to register")

      await tx.insert(customers).values({
        userId: created.id,
        phone: data.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        pinCode: data.pinCode ?? null,
      })

      return created
    })

    const token = signToken({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      vendorId: user.vendorId,
    })

    res.status(201).json({ token, user: serializeUser(user) })
  }),
)

authRouter.post(
  "/register/vendor",
  validateBody(registerVendorSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof registerVendorSchema.parse>

    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
    if (existing[0]) throw conflict("An account with this email already exists")

    const passwordHash = await hashPassword(data.password)
    const user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          email: data.email,
          passwordHash,
          name: data.name,
          phone: data.phone ?? null,
          role: "vendor",
          status: "active",
        })
        .returning()
      if (!created) throw badRequest("Failed to register")

      const [vendorRow] = await tx
        .insert(vendors)
        .values({
          name: data.businessName,
          ownerId: created.id,
          address: data.address ?? null,
          phone: data.phone ?? null,
          gstin: data.gstin ?? null,
          status: "pending",
        })
        .returning()
      if (!vendorRow) throw badRequest("Failed to create vendor business")

      await tx
        .update(users)
        .set({ vendorId: vendorRow.id })
        .where(eq(users.id, created.id))

      return { ...created, vendorId: vendorRow.id }
    })

    const superAdmins = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.role, "super_admin"))
    for (const admin of superAdmins) {
      await notify({
        userId: admin.id,
        type: "vendor_application_submitted",
        title: "New vendor application",
        body: `${data.name} applied to onboard "${data.businessName}".`,
        href: "/admin/vendors",
        emailRecipient: admin.email,
      })
    }

    const token = signToken({
      id: user.id,
      role: "vendor",
      name: user.name,
      email: user.email,
      vendorId: user.vendorId,
    })

    res.status(201).json({ token, user: serializeUser(user) })
  }),
)

/**
 * Shared credential check for both login endpoints. Returns the user row once
 * the password is verified and the account is usable.
 */
async function authenticateCredentials(email: string, password: string) {
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0])
  if (!user) throw unauthorized("Invalid email or password")

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) throw unauthorized("Invalid email or password")
  if (user.status === "blocked") throw forbidden("Your account has been blocked")

  if (user.role === "vendor" && user.vendorId) {
    const vendorRow = await db
      .select({ blocked: vendors.blocked })
      .from(vendors)
      .where(eq(vendors.id, user.vendorId))
      .limit(1)
      .then((r) => r[0])
    if (vendorRow?.blocked) {
      throw forbidden("Your vendor account has been blocked")
    }
  }

  return user
}

function issueSession(res: import("express").Response, user: typeof users.$inferSelect) {
  const token = signToken({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    vendorId: user.vendorId,
  })
  res.json({ token, user: serializeUser(user) })
}

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof loginSchema.parse>
    const user = await authenticateCredentials(data.email, data.password)
    issueSession(res, user)
  }),
)

// Vendor-only login used by the mobile app. The mobile client is a Vendor
// surface, so the role check lives on the backend rather than trusting the
// client to hide the super admin dashboard.
authRouter.post(
  "/vendor/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as ReturnType<typeof loginSchema.parse>
    const user = await authenticateCredentials(data.email, data.password)

    if (user.role === "super_admin" || user.role === "admin") {
      throw forbidden("Super Admin access is available only through the web application.")
    }
    if (user.role !== "vendor") {
      throw forbidden("This application is for vendor accounts only.")
    }

    issueSession(res, user)
  }),
)

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1)
      .then(r => r[0])
    if (!user) throw notFound("User not found")
    if (user.status === "blocked") throw forbidden("Your account has been blocked")

    res.json({ success: true, data: { user: serializeUser(user) } })
  }),
)