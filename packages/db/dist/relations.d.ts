export declare const usersRelations: import("drizzle-orm").Relations<"users", {
    vendor: import("drizzle-orm").One<"vendors", false>;
    customer: import("drizzle-orm").One<"customers", true>;
    notifications: import("drizzle-orm").Many<"notifications">;
}>;
export declare const vendorsRelations: import("drizzle-orm").Relations<"vendors", {
    owner: import("drizzle-orm").One<"users", false>;
    staff: import("drizzle-orm").Many<"users">;
    products: import("drizzle-orm").Many<"products">;
    orders: import("drizzle-orm").Many<"orders">;
}>;
export declare const customersRelations: import("drizzle-orm").Relations<"customers", {
    user: import("drizzle-orm").One<"users", true>;
    orders: import("drizzle-orm").Many<"orders">;
}>;
export declare const productsRelations: import("drizzle-orm").Relations<"products", {
    vendor: import("drizzle-orm").One<"vendors", true>;
    priceHistory: import("drizzle-orm").Many<"price_history">;
    orderItems: import("drizzle-orm").Many<"order_items">;
    inventoryLog: import("drizzle-orm").Many<"inventory_log">;
}>;
export declare const priceHistoryRelations: import("drizzle-orm").Relations<"price_history", {
    product: import("drizzle-orm").One<"products", true>;
    changedByUser: import("drizzle-orm").One<"users", false>;
}>;
export declare const ordersRelations: import("drizzle-orm").Relations<"orders", {
    customer: import("drizzle-orm").One<"customers", true>;
    vendor: import("drizzle-orm").One<"vendors", true>;
    items: import("drizzle-orm").Many<"order_items">;
    delivery: import("drizzle-orm").One<"deliveries", true>;
    payments: import("drizzle-orm").Many<"payments">;
}>;
export declare const orderItemsRelations: import("drizzle-orm").Relations<"order_items", {
    order: import("drizzle-orm").One<"orders", true>;
    product: import("drizzle-orm").One<"products", false>;
}>;
export declare const deliveriesRelations: import("drizzle-orm").Relations<"deliveries", {
    order: import("drizzle-orm").One<"orders", true>;
    events: import("drizzle-orm").Many<"delivery_events">;
}>;
export declare const deliveryEventsRelations: import("drizzle-orm").Relations<"delivery_events", {
    delivery: import("drizzle-orm").One<"deliveries", true>;
}>;
export declare const paymentsRelations: import("drizzle-orm").Relations<"payments", {
    order: import("drizzle-orm").One<"orders", true>;
}>;
export declare const inventoryLogRelations: import("drizzle-orm").Relations<"inventory_log", {
    product: import("drizzle-orm").One<"products", true>;
    order: import("drizzle-orm").One<"orders", false>;
}>;
export declare const notificationsRelations: import("drizzle-orm").Relations<"notifications", {
    user: import("drizzle-orm").One<"users", true>;
}>;
//# sourceMappingURL=relations.d.ts.map