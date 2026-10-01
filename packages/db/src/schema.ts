import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "vendor",
  "customer",
])

export const userStatusEnum = pgEnum("user_status", ["active", "blocked"])

export const vendorStatusEnum = pgEnum("vendor_status", [
  "pending",
  "approved",
  "rejected",
])

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "out_for_delivery",
  "delivered",
  "cancelled",
])

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "online"])

export const orderSourceEnum = pgEnum("order_source", [
  "customer_order",
  "vendor_delivery",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "paid",
  "failed",
  "refunded",
])

export const inventoryReasonEnum = pgEnum("inventory_reason", [
  "sale",
  "refund",
  "restock",
  "lost",
  "damaged",
])

export const customerRelationStatusEnum = pgEnum("customer_relation_status", [
  "running",
  "closed",
])

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    role: userRoleEnum("role").notNull().default("customer"),
    status: userStatusEnum("status").notNull().default("active"),
    vendorId: uuid("vendor_id").references(() => vendors.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_vendor_idx").on(table.vendorId),
  ],
)

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id"),
    description: text("description"),
    address: text("address"),
    phone: text("phone"),
    gstin: text("gstin"),
    status: vendorStatusEnum("status").notNull().default("pending"),
    approvedAt: timestamp("approved_at"),
    blocked: boolean("blocked").notNull().default(false),
    blockedAt: timestamp("blocked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("vendors_status_idx").on(table.status),
    index("vendors_owner_idx").on(table.ownerId),
    index("vendors_blocked_idx").on(table.blocked),
  ],
)

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    pinCode: text("pin_code"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("customers_user_idx").on(table.userId)],
)

export const vendorCustomers = pgTable(
  "vendor_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    status: customerRelationStatusEnum("status").notNull().default("running"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("vendor_customers_pair_idx").on(table.vendorId, table.customerId),
    index("vendor_customers_vendor_idx").on(table.vendorId),
    index("vendor_customers_customer_idx").on(table.customerId),
  ],
)

export const customerPrices = pgTable(
  "customer_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    pricePerJar: numeric("price_per_jar", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_prices_pair_idx").on(table.customerId, table.productId),
    index("customer_prices_vendor_idx").on(table.vendorId),
    index("customer_prices_customer_idx").on(table.customerId),
  ],
)

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sizeLiters: numeric("size_liters", { precision: 6, scale: 2 }).notNull(),
    pricePerJar: numeric("price_per_jar", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    depositPerJar: numeric("deposit_per_jar", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull()
      .default(0),
    availableStock: integer("available_stock").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("products_vendor_idx").on(table.vendorId),
    index("products_active_idx").on(table.active),
  ],
)

export const priceHistory = pgTable(
  "price_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    oldPrice: numeric("old_price", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    newPrice: numeric("new_price", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    changedBy: uuid("changed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    changedAt: timestamp("changed_at").notNull().defaultNow(),
  },
  (table) => [index("price_history_product_idx").on(table.productId)],
)

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    city: text("city"),
    pinCode: text("pin_code"),
    phone: text("phone").notNull(),
    notes: text("notes"),
    totalAmount: numeric("total_amount", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    depositAmount: numeric("deposit_amount", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull()
      .default(0),
    grandTotal: numeric("grand_total", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    source: orderSourceEnum("source").notNull().default("customer_order"),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("created"),
    scheduledFor: timestamp("scheduled_for"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_number_idx").on(table.orderNumber),
    index("orders_customer_idx").on(table.customerId),
    index("orders_vendor_idx").on(table.vendorId),
    index("orders_status_idx").on(table.status),
    index("orders_source_idx").on(table.source),
  ],
)

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    sizeLiters: numeric("size_liters", { precision: 6, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    unitDeposit: numeric("unit_deposit", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull()
      .default(0),
    total: numeric("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
    depositTotal: numeric("deposit_total", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull()
      .default(0),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
)

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    assignedAt: timestamp("assigned_at"),
    outForDeliveryAt: timestamp("out_for_delivery_at"),
    deliveredAt: timestamp("delivered_at"),
    cancelledAt: timestamp("cancelled_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("deliveries_order_idx").on(table.orderId),
    index("deliveries_status_idx").on(table.status),
  ],
)

export const deliveryEvents = pgTable(
  "delivery_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => deliveries.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    note: text("note"),
    at: timestamp("at").notNull().defaultNow(),
  },
  (table) => [index("delivery_events_delivery_idx").on(table.deliveryId)],
)

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
    method: paymentMethodEnum("method").notNull().default("cash"),
    status: paymentStatusEnum("status").notNull().default("created"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignature: text("razorpay_signature"),
    receivedAt: timestamp("received_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("payments_order_idx").on(table.orderId)],
)

export const inventoryLog = pgTable(
  "inventory_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    change: integer("change").notNull(),
    reason: inventoryReasonEnum("reason").notNull(),
    refOrderId: uuid("ref_order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("inventory_log_product_idx").on(table.productId),
    index("inventory_log_order_idx").on(table.refOrderId),
  ],
)

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_user_read_idx").on(table.userId, table.readAt),
  ],
)