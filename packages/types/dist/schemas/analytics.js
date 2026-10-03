"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorAnalyticsSchema = exports.jarTrendPointSchema = exports.monthlySalesPointSchema = exports.dailySalesPointSchema = exports.adminAnalyticsSchema = exports.topVendorSchema = exports.analyticsOverviewSchema = exports.statusCountSchema = exports.trendPointSchema = void 0;
const zod_1 = require("zod");
exports.trendPointSchema = zod_1.z.object({
    label: zod_1.z.string(),
    revenue: zod_1.z.number(),
    orders: zod_1.z.number(),
});
exports.statusCountSchema = zod_1.z.object({
    status: zod_1.z.string(),
    count: zod_1.z.number(),
});
exports.analyticsOverviewSchema = zod_1.z.object({
    totalOrders: zod_1.z.number(),
    activeOrders: zod_1.z.number(),
    deliveredOrders: zod_1.z.number(),
    cancelledOrders: zod_1.z.number(),
    pendingOrders: zod_1.z.number(),
    totalRevenue: zod_1.z.number(),
    totalDeposits: zod_1.z.number(),
    totalCustomers: zod_1.z.number(),
    totalVendors: zod_1.z.number(),
    totalJarsDelivered: zod_1.z.number(),
    totalProducts: zod_1.z.number(),
    revenueTrend: zod_1.z.array(exports.trendPointSchema),
    statusBreakdown: zod_1.z.array(exports.statusCountSchema),
});
exports.topVendorSchema = zod_1.z.object({
    vendorId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    orders: zod_1.z.number(),
    revenue: zod_1.z.number(),
});
exports.adminAnalyticsSchema = exports.analyticsOverviewSchema.extend({
    pendingVendorApplications: zod_1.z.number(),
    activeVendors: zod_1.z.number(),
    blockedVendors: zod_1.z.number(),
    deliveriesToday: zod_1.z.number(),
    topVendors: zod_1.z.array(exports.topVendorSchema),
});
exports.dailySalesPointSchema = zod_1.z.object({
    label: zod_1.z.string(),
    revenue: zod_1.z.number(),
    orders: zod_1.z.number(),
});
exports.monthlySalesPointSchema = zod_1.z.object({
    label: zod_1.z.string(),
    revenue: zod_1.z.number(),
});
exports.jarTrendPointSchema = zod_1.z.object({
    label: zod_1.z.string(),
    jars: zod_1.z.number(),
});
exports.vendorAnalyticsSchema = exports.analyticsOverviewSchema.extend({
    deliveriesToday: zod_1.z.number(),
    incomeToday: zod_1.z.number(),
    monthlyIncome: zod_1.z.number(),
    activeCustomers: zod_1.z.number(),
    closedCustomers: zod_1.z.number(),
    newCustomersThisMonth: zod_1.z.number(),
    dailySales: zod_1.z.array(exports.dailySalesPointSchema),
    monthlySales: zod_1.z.array(exports.monthlySalesPointSchema),
    jarDeliveryTrend: zod_1.z.array(exports.jarTrendPointSchema),
});
