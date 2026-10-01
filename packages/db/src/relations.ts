import { relations } from "drizzle-orm"
import {
  customers,
  deliveryEvents,
  deliveries,
  inventoryLog,
  notifications,
  orderItems,
  orders,
  payments,
  priceHistory,
  products,
  users,
  vendors,
} from "./schema"

export const usersRelations = relations(users, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [users.vendorId],
    references: [vendors.id],
  }),
  customer: one(customers, {
    fields: [users.id],
    references: [customers.userId],
  }),
  notifications: many(notifications),
}))

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  owner: one(users, {
    fields: [vendors.ownerId],
    references: [users.id],
  }),
  staff: many(users),
  products: many(products),
  orders: many(orders),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  orders: many(orders),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  priceHistory: many(priceHistory),
  orderItems: many(orderItems),
  inventoryLog: many(inventoryLog),
}))

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, {
    fields: [priceHistory.productId],
    references: [products.id],
  }),
  changedByUser: one(users, {
    fields: [priceHistory.changedBy],
    references: [users.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  vendor: one(vendors, {
    fields: [orders.vendorId],
    references: [vendors.id],
  }),
  items: many(orderItems),
  delivery: one(deliveries, {
    fields: [orders.id],
    references: [deliveries.orderId],
  }),
  payments: many(payments),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  events: many(deliveryEvents),
}))

export const deliveryEventsRelations = relations(deliveryEvents, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [deliveryEvents.deliveryId],
    references: [deliveries.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}))

export const inventoryLogRelations = relations(inventoryLog, ({ one }) => ({
  product: one(products, {
    fields: [inventoryLog.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [inventoryLog.refOrderId],
    references: [orders.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))