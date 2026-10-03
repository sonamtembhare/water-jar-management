"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = exports.inventoryLog = exports.payments = exports.deliveryEvents = exports.deliveries = exports.orderItems = exports.orders = exports.priceHistory = exports.products = exports.customerPrices = exports.vendorCustomers = exports.customers = exports.vendors = exports.users = exports.customerRelationStatusEnum = exports.inventoryReasonEnum = exports.paymentStatusEnum = exports.orderSourceEnum = exports.paymentMethodEnum = exports.orderStatusEnum = exports.vendorStatusEnum = exports.userStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.userRoleEnum = (0, pg_core_1.pgEnum)("user_role", [
    "super_admin",
    "admin",
    "vendor",
    "customer",
]);
exports.userStatusEnum = (0, pg_core_1.pgEnum)("user_status", ["active", "blocked"]);
exports.vendorStatusEnum = (0, pg_core_1.pgEnum)("vendor_status", [
    "pending",
    "approved",
    "rejected",
]);
exports.orderStatusEnum = (0, pg_core_1.pgEnum)("order_status", [
    "pending",
    "accepted",
    "out_for_delivery",
    "delivered",
    "cancelled",
]);
exports.paymentMethodEnum = (0, pg_core_1.pgEnum)("payment_method", ["cash", "online"]);
exports.orderSourceEnum = (0, pg_core_1.pgEnum)("order_source", [
    "customer_order",
    "vendor_delivery",
]);
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)("payment_status", [
    "created",
    "paid",
    "failed",
    "refunded",
]);
exports.inventoryReasonEnum = (0, pg_core_1.pgEnum)("inventory_reason", [
    "sale",
    "refund",
    "restock",
    "lost",
    "damaged",
]);
exports.customerRelationStatusEnum = (0, pg_core_1.pgEnum)("customer_relation_status", [
    "running",
    "closed",
]);
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    email: (0, pg_core_1.text)("email").notNull(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    phone: (0, pg_core_1.text)("phone"),
    role: (0, exports.userRoleEnum)("role").notNull().default("customer"),
    status: (0, exports.userStatusEnum)("status").notNull().default("active"),
    vendorId: (0, pg_core_1.uuid)("vendor_id").references(() => exports.vendors.id, {
        onDelete: "set null",
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("users_email_idx").on(table.email),
    (0, pg_core_1.index)("users_role_idx").on(table.role),
    (0, pg_core_1.index)("users_vendor_idx").on(table.vendorId),
]);
exports.vendors = (0, pg_core_1.pgTable)("vendors", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)("name").notNull(),
    ownerId: (0, pg_core_1.uuid)("owner_id"),
    description: (0, pg_core_1.text)("description"),
    address: (0, pg_core_1.text)("address"),
    phone: (0, pg_core_1.text)("phone"),
    gstin: (0, pg_core_1.text)("gstin"),
    status: (0, exports.vendorStatusEnum)("status").notNull().default("pending"),
    approvedAt: (0, pg_core_1.timestamp)("approved_at"),
    blocked: (0, pg_core_1.boolean)("blocked").notNull().default(false),
    blockedAt: (0, pg_core_1.timestamp)("blocked_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("vendors_status_idx").on(table.status),
    (0, pg_core_1.index)("vendors_owner_idx").on(table.ownerId),
    (0, pg_core_1.index)("vendors_blocked_idx").on(table.blocked),
]);
exports.customers = (0, pg_core_1.pgTable)("customers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    phone: (0, pg_core_1.text)("phone"),
    address: (0, pg_core_1.text)("address"),
    city: (0, pg_core_1.text)("city"),
    pinCode: (0, pg_core_1.text)("pin_code"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
}, (table) => [(0, pg_core_1.uniqueIndex)("customers_user_idx").on(table.userId)]);
exports.vendorCustomers = (0, pg_core_1.pgTable)("vendor_customers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    vendorId: (0, pg_core_1.uuid)("vendor_id")
        .notNull()
        .references(() => exports.vendors.id, { onDelete: "cascade" }),
    customerId: (0, pg_core_1.uuid)("customer_id")
        .notNull()
        .references(() => exports.customers.id, { onDelete: "cascade" }),
    status: (0, exports.customerRelationStatusEnum)("status").notNull().default("running"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("vendor_customers_pair_idx").on(table.vendorId, table.customerId),
    (0, pg_core_1.index)("vendor_customers_vendor_idx").on(table.vendorId),
    (0, pg_core_1.index)("vendor_customers_customer_idx").on(table.customerId),
]);
exports.customerPrices = (0, pg_core_1.pgTable)("customer_prices", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    vendorId: (0, pg_core_1.uuid)("vendor_id")
        .notNull()
        .references(() => exports.vendors.id, { onDelete: "cascade" }),
    customerId: (0, pg_core_1.uuid)("customer_id")
        .notNull()
        .references(() => exports.customers.id, { onDelete: "cascade" }),
    productId: (0, pg_core_1.uuid)("product_id")
        .notNull()
        .references(() => exports.products.id, { onDelete: "cascade" }),
    pricePerJar: (0, pg_core_1.numeric)("price_per_jar", {
        precision: 10,
        scale: 2,
        mode: "number",
    }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("customer_prices_pair_idx").on(table.customerId, table.productId),
    (0, pg_core_1.index)("customer_prices_vendor_idx").on(table.vendorId),
    (0, pg_core_1.index)("customer_prices_customer_idx").on(table.customerId),
]);
exports.products = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    vendorId: (0, pg_core_1.uuid)("vendor_id")
        .notNull()
        .references(() => exports.vendors.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    sizeLiters: (0, pg_core_1.numeric)("size_liters", { precision: 6, scale: 2 }).notNull(),
    pricePerJar: (0, pg_core_1.numeric)("price_per_jar", {
        precision: 10,
        scale: 2,
        mode: "number",
    }).notNull(),
    depositPerJar: (0, pg_core_1.numeric)("deposit_per_jar", {
        precision: 10,
        scale: 2,
        mode: "number",
    }).notNull()
        .default(0),
    availableStock: (0, pg_core_1.integer)("available_stock").notNull().default(0),
    active: (0, pg_core_1.boolean)("active").notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("products_vendor_idx").on(table.vendorId),
    (0, pg_core_1.index)("products_active_idx").on(table.active),
]);
exports.priceHistory = (0, pg_core_1.pgTable)("price_history", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    productId: (0, pg_core_1.uuid)("product_id")
        .notNull()
        .references(() => exports.products.id, { onDelete: "cascade" }),
    oldPrice: (0, pg_core_1.numeric)("old_price", {
        precision: 10,
        scale: 2,
        mode: "number",
    }).notNull(),
    newPrice: (0, pg_core_1.numeric)("new_price", {
        precision: 10,
        scale: 2,
        mode: "number",
    }).notNull(),
    changedBy: (0, pg_core_1.uuid)("changed_by").references(() => exports.users.id, {
        onDelete: "set null",
    }),
    changedAt: (0, pg_core_1.timestamp)("changed_at").notNull().defaultNow(),
}, (table) => [(0, pg_core_1.index)("price_history_product_idx").on(table.productId)]);
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    orderNumber: (0, pg_core_1.text)("order_number").notNull(),
    customerId: (0, pg_core_1.uuid)("customer_id")
        .notNull()
        .references(() => exports.customers.id, { onDelete: "cascade" }),
    vendorId: (0, pg_core_1.uuid)("vendor_id")
        .notNull()
        .references(() => exports.vendors.id, { onDelete: "cascade" }),
    address: (0, pg_core_1.text)("address").notNull(),
    city: (0, pg_core_1.text)("city"),
    pinCode: (0, pg_core_1.text)("pin_code"),
    phone: (0, pg_core_1.text)("phone").notNull(),
    notes: (0, pg_core_1.text)("notes"),
    totalAmount: (0, pg_core_1.numeric)("total_amount", {
        precision: 12,
        scale: 2,
        mode: "number",
    }).notNull(),
    depositAmount: (0, pg_core_1.numeric)("deposit_amount", {
        precision: 12,
        scale: 2,
        mode: "number",
    }).notNull()
        .default(0),
    grandTotal: (0, pg_core_1.numeric)("grand_total", {
        precision: 12,
        scale: 2,
        mode: "number",
    }).notNull(),
    status: (0, exports.orderStatusEnum)("status").notNull().default("pending"),
    source: (0, exports.orderSourceEnum)("source").notNull().default("customer_order"),
    paymentMethod: (0, exports.paymentMethodEnum)("payment_method").notNull().default("cash"),
    paymentStatus: (0, exports.paymentStatusEnum)("payment_status")
        .notNull()
        .default("created"),
    scheduledFor: (0, pg_core_1.timestamp)("scheduled_for"),
    deliveredAt: (0, pg_core_1.timestamp)("delivered_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("orders_number_idx").on(table.orderNumber),
    (0, pg_core_1.index)("orders_customer_idx").on(table.customerId),
    (0, pg_core_1.index)("orders_vendor_idx").on(table.vendorId),
    (0, pg_core_1.index)("orders_status_idx").on(table.status),
    (0, pg_core_1.index)("orders_source_idx").on(table.source),
]);
exports.orderItems = (0, pg_core_1.pgTable)("order_items", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)("order_id")
        .notNull()
        .references(() => exports.orders.id, { onDelete: "cascade" }),
    productId: (0, pg_core_1.uuid)("product_id").references(() => exports.products.id, {
        onDelete: "set null",
    }),
    productName: (0, pg_core_1.text)("product_name").notNull(),
    sizeLiters: (0, pg_core_1.numeric)("size_liters", { precision: 6, scale: 2 }).notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    unitPrice: (0, pg_core_1.numeric)("unit_price", {
        precision: 10,
        scale: 2,
        mode: "number",
    }).notNull(),
    unitDeposit: (0, pg_core_1.numeric)("unit_deposit", {
        precision: 10,
        scale: 2,
        mode: "number",
    }).notNull()
        .default(0),
    total: (0, pg_core_1.numeric)("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
    depositTotal: (0, pg_core_1.numeric)("deposit_total", {
        precision: 12,
        scale: 2,
        mode: "number",
    }).notNull()
        .default(0),
}, (table) => [(0, pg_core_1.index)("order_items_order_idx").on(table.orderId)]);
exports.deliveries = (0, pg_core_1.pgTable)("deliveries", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)("order_id")
        .notNull()
        .references(() => exports.orders.id, { onDelete: "cascade" }),
    status: (0, exports.orderStatusEnum)("status").notNull().default("pending"),
    assignedAt: (0, pg_core_1.timestamp)("assigned_at"),
    outForDeliveryAt: (0, pg_core_1.timestamp)("out_for_delivery_at"),
    deliveredAt: (0, pg_core_1.timestamp)("delivered_at"),
    cancelledAt: (0, pg_core_1.timestamp)("cancelled_at"),
    notes: (0, pg_core_1.text)("notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("deliveries_order_idx").on(table.orderId),
    (0, pg_core_1.index)("deliveries_status_idx").on(table.status),
]);
exports.deliveryEvents = (0, pg_core_1.pgTable)("delivery_events", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    deliveryId: (0, pg_core_1.uuid)("delivery_id")
        .notNull()
        .references(() => exports.deliveries.id, { onDelete: "cascade" }),
    status: (0, exports.orderStatusEnum)("status").notNull(),
    note: (0, pg_core_1.text)("note"),
    at: (0, pg_core_1.timestamp)("at").notNull().defaultNow(),
}, (table) => [(0, pg_core_1.index)("delivery_events_delivery_idx").on(table.deliveryId)]);
exports.payments = (0, pg_core_1.pgTable)("payments", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)("order_id")
        .notNull()
        .references(() => exports.orders.id, { onDelete: "cascade" }),
    amount: (0, pg_core_1.numeric)("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
    method: (0, exports.paymentMethodEnum)("method").notNull().default("cash"),
    status: (0, exports.paymentStatusEnum)("status").notNull().default("created"),
    razorpayOrderId: (0, pg_core_1.text)("razorpay_order_id"),
    razorpayPaymentId: (0, pg_core_1.text)("razorpay_payment_id"),
    razorpaySignature: (0, pg_core_1.text)("razorpay_signature"),
    receivedAt: (0, pg_core_1.timestamp)("received_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
}, (table) => [(0, pg_core_1.index)("payments_order_idx").on(table.orderId)]);
exports.inventoryLog = (0, pg_core_1.pgTable)("inventory_log", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    productId: (0, pg_core_1.uuid)("product_id")
        .notNull()
        .references(() => exports.products.id, { onDelete: "cascade" }),
    change: (0, pg_core_1.integer)("change").notNull(),
    reason: (0, exports.inventoryReasonEnum)("reason").notNull(),
    refOrderId: (0, pg_core_1.uuid)("ref_order_id").references(() => exports.orders.id, {
        onDelete: "set null",
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("inventory_log_product_idx").on(table.productId),
    (0, pg_core_1.index)("inventory_log_order_idx").on(table.refOrderId),
]);
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    type: (0, pg_core_1.text)("type").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    body: (0, pg_core_1.text)("body").notNull(),
    href: (0, pg_core_1.text)("href"),
    readAt: (0, pg_core_1.timestamp)("read_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("notifications_user_idx").on(table.userId),
    (0, pg_core_1.index)("notifications_user_read_idx").on(table.userId, table.readAt),
]);
