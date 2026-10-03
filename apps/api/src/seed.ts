import "./config/env"
import { eq } from "drizzle-orm"
import { customers, db, products, users, vendors } from "@repo/db"
import { hashPassword } from "./utils/password"

async function upsertUser(values: {
  email: string
  password: string
  name: string
  role: "super_admin" | "vendor" | "customer"
  vendorId?: string | null
}) {
  const existing = await db.select().from(users).where(eq(users.email, values.email)).limit(1)
  if (existing[0]) {
    console.log(`[seed] user exists: ${values.email}`)
    return existing[0]
  }
  const passwordHash = await hashPassword(values.password)
  const [created] = await db
    .insert(users)
    .values({
      email: values.email,
      passwordHash,
      name: values.name,
      role: values.role,
      status: "active",
      vendorId: values.vendorId ?? null,
    })
    .returning()
  console.log(`[seed] created user: ${values.email} (${values.role})`)
  return created!
}

async function seedSuperAdmin() {
  const isProduction = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production"
  const password = process.env.SEED_ADMIN_PASSWORD
  // On Vercel the handler seeds on every cold start, so falling back to the local
  // default would publish a super admin with a well-known password. Refuse to
  // seed instead; locally the default keeps `npm run seed` frictionless.
  if (isProduction && (!password || password.length < 16)) {
    console.warn(
      "[seed] SEED_ADMIN_PASSWORD missing or shorter than 16 chars - skipping super admin seed",
    )
    return
  }
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@waterjar.com"
  await upsertUser({
    email,
    password: password ?? "admin12345",
    name: "Super Admin",
    role: "super_admin",
  })
}

async function seedDemoData() {
  if (process.env.SEED_DEMO_DATA !== "true") return

  const vendorUser = await upsertUser({
    email: "vendor@waterjar.com",
    password: "vendor12345",
    name: "Vendor Owner",
    role: "vendor",
  })

  let [vendor] = await db.select().from(vendors).where(eq(vendors.ownerId, vendorUser.id)).limit(1)
  if (!vendor) {
    const [created] = await db
      .insert(vendors)
      .values({
        name: "AquaPure Water Solutions",
        ownerId: vendorUser.id,
        description: "Fresh purified drinking water delivered to your doorstep.",
        address: "12, Industrial Area, Pune",
        phone: "9876543210",
        gstin: "27ABCDE1234F1Z5",
        status: "approved",
        approvedAt: new Date(),
      })
      .returning()
    vendor = created!
    await db.update(users).set({ vendorId: vendor.id }).where(eq(users.id, vendorUser.id))
    console.log(`[seed] created demo vendor: ${vendor.name}`)
  } else if (vendor.status !== "approved") {
    await db
      .update(vendors)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(vendors.id, vendor.id))
  }

  const existingProducts = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, vendor.id))
    .limit(1)
  if (existingProducts.length === 0) {
    await db.insert(products).values([
      {
        vendorId: vendor.id,
        name: "20L Water Bottle",
        description: "Standard 20 litre reusable water jar",
        sizeLiters: "20.00",
        pricePerJar: 60,
        depositPerJar: 50,
        availableStock: 100,
        active: true,
      },
      {
        vendorId: vendor.id,
        name: "10L Water Bottle",
        description: "Compact 10 litre reusable water jar",
        sizeLiters: "10.00",
        pricePerJar: 35,
        depositPerJar: 40,
        availableStock: 80,
        active: true,
      },
      {
        vendorId: vendor.id,
        name: "1L Pack (6)",
        description: "Pack of six 1 litre bottles",
        sizeLiters: "1.00",
        pricePerJar: 90,
        depositPerJar: 0,
        availableStock: 200,
        active: true,
      },
    ])
    console.log("[seed] created demo products")
  }

  const customer = await upsertUser({
    email: "customer@waterjar.com",
    password: "customer12345",
    name: "Demo Customer",
    role: "customer",
  })
  const existingCustomer = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, customer.id))
    .limit(1)
  if (existingCustomer.length === 0 && customer.role === "customer") {
    await db.insert(customers).values({
      userId: customer.id,
      phone: "9123456780",
      address: "B-402, Sunshine Apartments, FC Road",
      city: "Pune",
      pinCode: "411005",
    })
    console.log("[seed] created demo customer profile")
  }
}

export async function seed() {
  await seedSuperAdmin()
  await seedDemoData()
  console.log("[seed] done")
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] failed", err)
      process.exit(1)
    })
}