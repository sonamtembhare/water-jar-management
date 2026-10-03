import { z } from "zod";
export declare const trendPointSchema: z.ZodObject<{
    label: z.ZodString;
    revenue: z.ZodNumber;
    orders: z.ZodNumber;
}, z.core.$strip>;
export declare const statusCountSchema: z.ZodObject<{
    status: z.ZodString;
    count: z.ZodNumber;
}, z.core.$strip>;
export declare const analyticsOverviewSchema: z.ZodObject<{
    totalOrders: z.ZodNumber;
    activeOrders: z.ZodNumber;
    deliveredOrders: z.ZodNumber;
    cancelledOrders: z.ZodNumber;
    pendingOrders: z.ZodNumber;
    totalRevenue: z.ZodNumber;
    totalDeposits: z.ZodNumber;
    totalCustomers: z.ZodNumber;
    totalVendors: z.ZodNumber;
    totalJarsDelivered: z.ZodNumber;
    totalProducts: z.ZodNumber;
    revenueTrend: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        revenue: z.ZodNumber;
        orders: z.ZodNumber;
    }, z.core.$strip>>;
    statusBreakdown: z.ZodArray<z.ZodObject<{
        status: z.ZodString;
        count: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const topVendorSchema: z.ZodObject<{
    vendorId: z.ZodString;
    name: z.ZodString;
    orders: z.ZodNumber;
    revenue: z.ZodNumber;
}, z.core.$strip>;
export declare const adminAnalyticsSchema: z.ZodObject<{
    totalOrders: z.ZodNumber;
    activeOrders: z.ZodNumber;
    deliveredOrders: z.ZodNumber;
    cancelledOrders: z.ZodNumber;
    pendingOrders: z.ZodNumber;
    totalRevenue: z.ZodNumber;
    totalDeposits: z.ZodNumber;
    totalCustomers: z.ZodNumber;
    totalVendors: z.ZodNumber;
    totalJarsDelivered: z.ZodNumber;
    totalProducts: z.ZodNumber;
    revenueTrend: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        revenue: z.ZodNumber;
        orders: z.ZodNumber;
    }, z.core.$strip>>;
    statusBreakdown: z.ZodArray<z.ZodObject<{
        status: z.ZodString;
        count: z.ZodNumber;
    }, z.core.$strip>>;
    pendingVendorApplications: z.ZodNumber;
    activeVendors: z.ZodNumber;
    blockedVendors: z.ZodNumber;
    deliveriesToday: z.ZodNumber;
    topVendors: z.ZodArray<z.ZodObject<{
        vendorId: z.ZodString;
        name: z.ZodString;
        orders: z.ZodNumber;
        revenue: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const dailySalesPointSchema: z.ZodObject<{
    label: z.ZodString;
    revenue: z.ZodNumber;
    orders: z.ZodNumber;
}, z.core.$strip>;
export declare const monthlySalesPointSchema: z.ZodObject<{
    label: z.ZodString;
    revenue: z.ZodNumber;
}, z.core.$strip>;
export declare const jarTrendPointSchema: z.ZodObject<{
    label: z.ZodString;
    jars: z.ZodNumber;
}, z.core.$strip>;
export declare const vendorAnalyticsSchema: z.ZodObject<{
    totalOrders: z.ZodNumber;
    activeOrders: z.ZodNumber;
    deliveredOrders: z.ZodNumber;
    cancelledOrders: z.ZodNumber;
    pendingOrders: z.ZodNumber;
    totalRevenue: z.ZodNumber;
    totalDeposits: z.ZodNumber;
    totalCustomers: z.ZodNumber;
    totalVendors: z.ZodNumber;
    totalJarsDelivered: z.ZodNumber;
    totalProducts: z.ZodNumber;
    revenueTrend: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        revenue: z.ZodNumber;
        orders: z.ZodNumber;
    }, z.core.$strip>>;
    statusBreakdown: z.ZodArray<z.ZodObject<{
        status: z.ZodString;
        count: z.ZodNumber;
    }, z.core.$strip>>;
    deliveriesToday: z.ZodNumber;
    incomeToday: z.ZodNumber;
    monthlyIncome: z.ZodNumber;
    activeCustomers: z.ZodNumber;
    closedCustomers: z.ZodNumber;
    newCustomersThisMonth: z.ZodNumber;
    dailySales: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        revenue: z.ZodNumber;
        orders: z.ZodNumber;
    }, z.core.$strip>>;
    monthlySales: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        revenue: z.ZodNumber;
    }, z.core.$strip>>;
    jarDeliveryTrend: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        jars: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;
export type VendorAnalytics = z.infer<typeof vendorAnalyticsSchema>;
export type TrendPoint = z.infer<typeof trendPointSchema>;
export type StatusCount = z.infer<typeof statusCountSchema>;
export type TopVendor = z.infer<typeof topVendorSchema>;
export type DailySalesPoint = z.infer<typeof dailySalesPointSchema>;
export type MonthlySalesPoint = z.infer<typeof monthlySalesPointSchema>;
export type JarTrendPoint = z.infer<typeof jarTrendPointSchema>;
//# sourceMappingURL=analytics.d.ts.map