import { z } from "zod"

export const trendPointSchema = z.object({
  label: z.string(),
  revenue: z.number(),
  orders: z.number(),
})

export const statusCountSchema = z.object({
  status: z.string(),
  count: z.number(),
})

export const analyticsOverviewSchema = z.object({
  totalOrders: z.number(),
  activeOrders: z.number(),
  deliveredOrders: z.number(),
  cancelledOrders: z.number(),
  pendingOrders: z.number(),
  totalRevenue: z.number(),
  totalDeposits: z.number(),
  totalCustomers: z.number(),
  totalVendors: z.number(),
  totalJarsDelivered: z.number(),
  totalProducts: z.number(),
  revenueTrend: z.array(trendPointSchema),
  statusBreakdown: z.array(statusCountSchema),
})

export const topVendorSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string(),
  orders: z.number(),
  revenue: z.number(),
})

export const adminAnalyticsSchema = analyticsOverviewSchema.extend({
  pendingVendorApplications: z.number(),
  activeVendors: z.number(),
  blockedVendors: z.number(),
  deliveriesToday: z.number(),
  topVendors: z.array(topVendorSchema),
})

export const dailySalesPointSchema = z.object({
  label: z.string(),
  revenue: z.number(),
  orders: z.number(),
})

export const monthlySalesPointSchema = z.object({
  label: z.string(),
  revenue: z.number(),
})

export const jarTrendPointSchema = z.object({
  label: z.string(),
  jars: z.number(),
})

export const vendorAnalyticsSchema = analyticsOverviewSchema.extend({
  todaysOrders: z.number(),
  todaysDelivered: z.number(),
  todaysPending: z.number(),
  deliveriesToday: z.number(),
  incomeToday: z.number(),
  monthlyIncome: z.number(),
  activeCustomers: z.number(),
  closedCustomers: z.number(),
  newCustomersThisMonth: z.number(),
  dailySales: z.array(dailySalesPointSchema),
  monthlySales: z.array(monthlySalesPointSchema),
  jarDeliveryTrend: z.array(jarTrendPointSchema),
})

export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>
export type VendorAnalytics = z.infer<typeof vendorAnalyticsSchema>
export type TrendPoint = z.infer<typeof trendPointSchema>
export type StatusCount = z.infer<typeof statusCountSchema>
export type TopVendor = z.infer<typeof topVendorSchema>
export type DailySalesPoint = z.infer<typeof dailySalesPointSchema>
export type MonthlySalesPoint = z.infer<typeof monthlySalesPointSchema>
export type JarTrendPoint = z.infer<typeof jarTrendPointSchema>