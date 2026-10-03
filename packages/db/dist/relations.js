"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRelations = exports.inventoryLogRelations = exports.paymentsRelations = exports.deliveryEventsRelations = exports.deliveriesRelations = exports.orderItemsRelations = exports.ordersRelations = exports.priceHistoryRelations = exports.productsRelations = exports.customersRelations = exports.vendorsRelations = exports.usersRelations = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("./schema");
exports.usersRelations = (0, drizzle_orm_1.relations)(schema_1.users, ({ one, many }) => ({
    vendor: one(schema_1.vendors, {
        fields: [schema_1.users.vendorId],
        references: [schema_1.vendors.id],
    }),
    customer: one(schema_1.customers, {
        fields: [schema_1.users.id],
        references: [schema_1.customers.userId],
    }),
    notifications: many(schema_1.notifications),
}));
exports.vendorsRelations = (0, drizzle_orm_1.relations)(schema_1.vendors, ({ one, many }) => ({
    owner: one(schema_1.users, {
        fields: [schema_1.vendors.ownerId],
        references: [schema_1.users.id],
    }),
    staff: many(schema_1.users),
    products: many(schema_1.products),
    orders: many(schema_1.orders),
}));
exports.customersRelations = (0, drizzle_orm_1.relations)(schema_1.customers, ({ one, many }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.customers.userId],
        references: [schema_1.users.id],
    }),
    orders: many(schema_1.orders),
}));
exports.productsRelations = (0, drizzle_orm_1.relations)(schema_1.products, ({ one, many }) => ({
    vendor: one(schema_1.vendors, {
        fields: [schema_1.products.vendorId],
        references: [schema_1.vendors.id],
    }),
    priceHistory: many(schema_1.priceHistory),
    orderItems: many(schema_1.orderItems),
    inventoryLog: many(schema_1.inventoryLog),
}));
exports.priceHistoryRelations = (0, drizzle_orm_1.relations)(schema_1.priceHistory, ({ one }) => ({
    product: one(schema_1.products, {
        fields: [schema_1.priceHistory.productId],
        references: [schema_1.products.id],
    }),
    changedByUser: one(schema_1.users, {
        fields: [schema_1.priceHistory.changedBy],
        references: [schema_1.users.id],
    }),
}));
exports.ordersRelations = (0, drizzle_orm_1.relations)(schema_1.orders, ({ one, many }) => ({
    customer: one(schema_1.customers, {
        fields: [schema_1.orders.customerId],
        references: [schema_1.customers.id],
    }),
    vendor: one(schema_1.vendors, {
        fields: [schema_1.orders.vendorId],
        references: [schema_1.vendors.id],
    }),
    items: many(schema_1.orderItems),
    delivery: one(schema_1.deliveries, {
        fields: [schema_1.orders.id],
        references: [schema_1.deliveries.orderId],
    }),
    payments: many(schema_1.payments),
}));
exports.orderItemsRelations = (0, drizzle_orm_1.relations)(schema_1.orderItems, ({ one }) => ({
    order: one(schema_1.orders, {
        fields: [schema_1.orderItems.orderId],
        references: [schema_1.orders.id],
    }),
    product: one(schema_1.products, {
        fields: [schema_1.orderItems.productId],
        references: [schema_1.products.id],
    }),
}));
exports.deliveriesRelations = (0, drizzle_orm_1.relations)(schema_1.deliveries, ({ one, many }) => ({
    order: one(schema_1.orders, {
        fields: [schema_1.deliveries.orderId],
        references: [schema_1.orders.id],
    }),
    events: many(schema_1.deliveryEvents),
}));
exports.deliveryEventsRelations = (0, drizzle_orm_1.relations)(schema_1.deliveryEvents, ({ one }) => ({
    delivery: one(schema_1.deliveries, {
        fields: [schema_1.deliveryEvents.deliveryId],
        references: [schema_1.deliveries.id],
    }),
}));
exports.paymentsRelations = (0, drizzle_orm_1.relations)(schema_1.payments, ({ one }) => ({
    order: one(schema_1.orders, {
        fields: [schema_1.payments.orderId],
        references: [schema_1.orders.id],
    }),
}));
exports.inventoryLogRelations = (0, drizzle_orm_1.relations)(schema_1.inventoryLog, ({ one }) => ({
    product: one(schema_1.products, {
        fields: [schema_1.inventoryLog.productId],
        references: [schema_1.products.id],
    }),
    order: one(schema_1.orders, {
        fields: [schema_1.inventoryLog.refOrderId],
        references: [schema_1.orders.id],
    }),
}));
exports.notificationsRelations = (0, drizzle_orm_1.relations)(schema_1.notifications, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.notifications.userId],
        references: [schema_1.users.id],
    }),
}));
