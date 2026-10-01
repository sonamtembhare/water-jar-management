import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  AdminAnalytics,
  AdminCustomerListResponse,
  AdminVendor,
  AdminVendorDetail,
  AdminVendorListResponse,
  AnalyticsOverview,
  AuthUser,
  BroadcastNotificationInput,
  CreateOrderInput,
  CreateRazorpayOrderInput,
  CustomerPrice,
  CustomerPriceCreateInput,
  CustomerPriceListResponse,
  CustomerPriceOverrides,
  CustomerPriceUpdateInput,
  CustomerProfile,
  InviteStaffInput,
  LoginInput,
  LoginResponse,
  NotificationsResponse,
  Order,
  OrderDetail,
  OrderStatusUpdateInput,
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  PublicVendor,
  RazorpayOrderResponse,
  RegisterCustomerInput,
  RegisterVendorInput,
  StaffListResponse,
  UnreadCount,
  UpdateProfileInput,
  User,
  UserListResponse,
  UserStatusUpdateInput,
  VendorAnalytics,
  VendorBlockInput,
  VendorCustomerCreateInput,
  VendorCustomerDetail,
  VendorCustomerListItem,
  VendorCustomerListResponse,
  VendorCustomerStatusUpdateInput,
  VendorCustomerUpdateInput,
  VendorDeliveryCreateInput,
  VendorDeliveryListResponse,
  VendorStatusUpdateInput,
  VerifyPaymentInput,
} from "@repo/types";

import type { RootState } from "@/lib/store";
import { API_URL } from "@/lib/utils";

export const TAG_TYPES = [
  "Auth",
  "Vendors",
  "VendorProfile",
  "Products",
  "Inventory",
  "Orders",
  "Notifications",
  "Analytics",
  "Users",
  "Customers",
  "CustomerProfile",
  "CustomerPrices",
  "Deliveries",
] as const;

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: Order["status"];
  source: Order["source"];
  paymentMethod: Order["paymentMethod"];
  paymentStatus: Order["paymentStatus"];
  grandTotal: number;
  address: string;
  city: string | null;
  phone: string;
  scheduledFor: string | null;
  createdAt: string;
  vendorName: string | null;
} & Partial<Pick<Order, "customerId" | "vendorId">>;

export type CustomerOrderListItem = Pick<
  Order,
  | "id"
  | "orderNumber"
  | "customerId"
  | "vendorId"
  | "address"
  | "city"
  | "pinCode"
  | "phone"
  | "grandTotal"
  | "status"
  | "paymentMethod"
  | "paymentStatus"
  | "scheduledFor"
  | "createdAt"
> & {
  vendorName?: string | null;
};

export interface VendorCatalog {
  vendor: PublicVendor;
  products: Product[];
}

export type InventoryLogItem = {
  id: string;
  productId: string;
  productName: string;
  change: number;
  reason: string;
  refOrderId: string | null;
  createdAt: string;
};

export interface InventoryView {
  products: Product[];
  log: InventoryLogItem[];
}

export interface RazorpayKeyResponse {
  keyId: string;
  orderId: string;
  /** Amount in minor currency units (paise for INR). */
  amount: number;
  currency: string;
}

export type MarkReadResponse = { id: string; readAt: string | null };
export type MarkAllReadResponse = { updated: boolean };
export type CustomerProfileResponse = {
  user: AuthUser;
  customer: CustomerProfile | null;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api/v1`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  apiOptions,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, apiOptions, extraOptions);
  if (result.error) return result;
  const body = result.data;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const envelope = body as { success?: unknown; data?: unknown };
    if (envelope.success === true && "data" in envelope) {
      return { data: envelope.data };
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: TAG_TYPES,
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // ---- Auth ----
    login: builder.mutation<LoginResponse, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    registerCustomer: builder.mutation<LoginResponse, RegisterCustomerInput>({
      query: (body) => ({ url: "/auth/register/customer", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    registerVendor: builder.mutation<LoginResponse, RegisterVendorInput>({
      query: (body) => ({ url: "/auth/register/vendor", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    me: builder.query<AuthUser, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),

    // ---- Public vendors ----
    publicVendors: builder.query<PublicVendor[], void>({
      query: () => "/vendors",
      providesTags: ["Vendors"],
    }),
    vendorCatalog: builder.query<VendorCatalog, string>({
      query: (id) => `/vendors/${id}`,
      providesTags: ["Vendors", "Products"],
    }),

    // ---- Vendor (protected) ----
    vendorProfile: builder.query<PublicVendor, void>({
      query: () => "/vendor/profile",
      providesTags: ["VendorProfile"],
    }),
    updateVendorProfile: builder.mutation<PublicVendor, Partial<PublicVendor>>({
      query: (body) => ({ url: "/vendor/profile", method: "PATCH", body }),
      invalidatesTags: ["VendorProfile", "Vendors"],
    }),
    vendorStaff: builder.query<StaffListResponse, void>({
      query: () => "/vendor/staff",
      providesTags: (result) =>
        result ? result.staff.map((s) => ({ type: "Users" as const, id: s.id })) : ["Users"],
    }),
    inviteStaff: builder.mutation<{ id: string; name: string; email: string }, InviteStaffInput>({
      query: (body) => ({ url: "/vendor/staff", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    removeStaff: builder.mutation<{ id: string; removed: boolean }, string>({
      query: (id) => ({ url: `/vendor/staff/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    vendorProducts: builder.query<{ products: Product[]; total: number }, void>({
      query: () => "/vendor/products",
      providesTags: ["Products"],
    }),
    createProduct: builder.mutation<Product, ProductCreateInput>({
      query: (body) => ({ url: "/vendor/products", method: "POST", body }),
      invalidatesTags: ["Products", "Inventory"],
    }),
    updateProduct: builder.mutation<
      Product,
      { id: string; body: ProductUpdateInput }
    >({
      query: ({ id, body }) => ({ url: `/vendor/products/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Products", "Inventory"],
    }),
    changeProductPrice: builder.mutation<
      Product,
      { id: string; pricePerJar: number; depositPerJar: number }
    >({
      query: ({ id, ...body }) => ({ url: `/vendor/products/${id}/price`, method: "PATCH", body }),
      invalidatesTags: ["Products"],
    }),
    toggleProduct: builder.mutation<Product, string>({
      query: (id) => ({ url: `/vendor/products/${id}/toggle`, method: "POST" }),
      invalidatesTags: ["Products"],
    }),
    inventory: builder.query<InventoryView, void>({
      query: () => "/vendor/inventory",
      providesTags: ["Inventory"],
    }),
    restock: builder.mutation<Product, { productId: string; quantity: number }>({
      query: (body) => ({ url: "/vendor/inventory/restock", method: "POST", body }),
      invalidatesTags: ["Inventory", "Products"],
    }),
    vendorOrders: builder.query<
      { items: OrderListItem[]; total: number },
      { page?: number; pageSize?: number; status?: Order["status"] }
    >({
      query: (params) => ({ url: "/vendor/orders", params }),
      providesTags: ["Orders"],
    }),
    vendorOrderDetail: builder.query<OrderDetail, string>({
      query: (id) => `/vendor/orders/${id}`,
      providesTags: (result, _e, id) =>
        result ? [{ type: "Orders" as const, id }] : [{ type: "Orders" as const, id }],
    }),
    transitionOrder: builder.mutation<OrderDetail, { id: string; status: Order["status"] }>({
      query: ({ id, status }) => ({
        url: `/vendor/orders/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Orders", "Analytics", "Notifications", "Customers"],
    }),

    // ---- Vendor customers ----
    vendorCustomers: builder.query<
      VendorCustomerListResponse,
      { search?: string; page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/vendor/customers", params }),
      providesTags: ["Customers"],
    }),
    vendorCustomerDetail: builder.query<VendorCustomerDetail, string>({
      query: (id) => `/vendor/customers/${id}`,
      providesTags: (result, _e, id) =>
        result ? [{ type: "Customers" as const, id }] : [{ type: "Customers" as const, id }],
    }),
    createVendorCustomer: builder.mutation<VendorCustomerListItem, VendorCustomerCreateInput>({
      query: (body) => ({ url: "/vendor/customers", method: "POST", body }),
      invalidatesTags: ["Customers", "Users", "Notifications"],
    }),
    updateVendorCustomer: builder.mutation<
      VendorCustomerListItem,
      { id: string; body: VendorCustomerUpdateInput }
    >({
      query: ({ id, body }) => ({ url: `/vendor/customers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Customers"],
    }),
    updateVendorCustomerStatus: builder.mutation<
      { id: string; status: string; updatedAt: string | null },
      { id: string; status: VendorCustomerStatusUpdateInput["status"] }
    >({
      query: ({ id, status }) => ({
        url: `/vendor/customers/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Customers", "Notifications"],
    }),

    // ---- Vendor customer pricing ----
    customerPrices: builder.query<CustomerPriceListResponse, string>({
      query: (customerId) => `/vendor/customers/${customerId}/prices`,
      providesTags: (result, _e, customerId) => [
        { type: "CustomerPrices" as const, id: customerId },
      ],
    }),
    createCustomerPrice: builder.mutation<
      CustomerPrice,
      { customerId: string; body: CustomerPriceCreateInput }
    >({
      query: ({ customerId, body }) => ({
        url: `/vendor/customers/${customerId}/prices`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, _e, { customerId }) => [
        { type: "CustomerPrices" as const, id: customerId },
        "Customers",
      ],
    }),
    updateCustomerPrice: builder.mutation<
      { id: string; pricePerJar: number; updatedAt: string },
      { customerId: string; priceId: string; body: CustomerPriceUpdateInput }
    >({
      query: ({ customerId, priceId, body }) => ({
        url: `/vendor/customers/${customerId}/prices/${priceId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, _e, { customerId }) => [
        { type: "CustomerPrices" as const, id: customerId },
        "Customers",
      ],
    }),
    deleteCustomerPrice: builder.mutation<
      { id: string; removed: boolean },
      { customerId: string; priceId: string }
    >({
      query: ({ customerId, priceId }) => ({
        url: `/vendor/customers/${customerId}/prices/${priceId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, _e, { customerId }) => [
        { type: "CustomerPrices" as const, id: customerId },
        "Customers",
      ],
    }),

    // ---- Vendor deliveries ----
    vendorDeliveries: builder.query<
      VendorDeliveryListResponse,
      { page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/vendor/deliveries", params }),
      providesTags: ["Deliveries"],
    }),
    createVendorDelivery: builder.mutation<OrderDetail, VendorDeliveryCreateInput>({
      query: (body) => ({ url: "/vendor/deliveries", method: "POST", body }),
      invalidatesTags: [
        "Deliveries",
        "Orders",
        "Inventory",
        "Products",
        "Analytics",
        "Notifications",
        "Customers",
      ],
    }),

    // ---- Customer (protected) ----
    customerProfile: builder.query<CustomerProfileResponse, void>({
      query: () => "/customers/profile",
      providesTags: ["CustomerProfile"],
    }),
    updateCustomerProfile: builder.mutation<CustomerProfileResponse, UpdateProfileInput>({
      query: (body) => ({ url: "/customers/profile", method: "PATCH", body }),
      invalidatesTags: ["CustomerProfile", "Auth"],
    }),
    customerOrders: builder.query<
      { items: CustomerOrderListItem[]; total: number },
      { page?: number; pageSize?: number; status?: Order["status"] }
    >({
      query: (params) => ({ url: "/customers/orders", params }),
      providesTags: ["Orders"],
    }),
    customerPriceOverrides: builder.query<CustomerPriceOverrides, { vendorId?: string }>({
      query: (params) => ({ url: "/customers/prices", params }),
      providesTags: ["CustomerPrices"],
    }),
    createOrder: builder.mutation<OrderDetail, CreateOrderInput>({
      query: (body) => ({ url: "/customers/orders", method: "POST", body }),
      invalidatesTags: ["Orders", "Analytics", "Notifications", "Inventory", "Products", "Customers"],
    }),
    customerOrderDetail: builder.query<OrderDetail, string>({
      query: (id) => `/customers/orders/${id}`,
      providesTags: (result, _e, id) => [{ type: "Orders" as const, id }],
    }),
    cancelOrder: builder.mutation<OrderDetail, string>({
      query: (id) => ({ url: `/customers/orders/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["Orders", "Analytics", "Notifications", "Inventory", "Products", "Customers"],
    }),

    // ---- Payments ----
    razorpayKey: builder.query<RazorpayKeyResponse, string>({
      query: (orderId) => `/payments/order/${orderId}/razorpay-key`,
    }),
    createRazorpayOrder: builder.mutation<RazorpayOrderResponse, CreateRazorpayOrderInput>({
      query: (body) => ({
        url: `/payments/order/${body.orderId}/razorpay`,
        method: "POST",
        body,
      }),
    }),
    verifyPayment: builder.mutation<
      { order?: OrderDetail; alreadyProcessed?: boolean },
      VerifyPaymentInput
    >({
      query: (body) => ({
        url: `/payments/order/${body.orderId}/verify`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Notifications"],
    }),
    cashPaid: builder.mutation<
      { paymentStatus: string; orderStatus: string },
      string
    >({
      query: (orderId) => ({
        url: `/payments/order/${orderId}/cash-paid`,
        method: "POST",
      }),
      invalidatesTags: ["Orders", "Notifications"],
    }),

    // ---- Notifications ----
    notifications: builder.query<
      NotificationsResponse,
      { page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/notifications", params }),
      providesTags: ["Notifications"],
    }),
    unreadCount: builder.query<UnreadCount, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<MarkReadResponse, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<MarkAllReadResponse, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),

    // ---- Analytics ----
    analyticsOverview: builder.query<AdminAnalytics, void>({
      query: () => "/analytics/overview",
      providesTags: ["Analytics"],
    }),
    vendorAnalytics: builder.query<VendorAnalytics, void>({
      query: () => "/analytics/overview",
      providesTags: ["Analytics"],
    }),

    // ---- Admin ----
    adminVendors: builder.query<
      AdminVendorListResponse,
      { search?: string; status?: string; page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/admin/vendors", params }),
      providesTags: ["Vendors"],
    }),
    adminVendorDetail: builder.query<AdminVendorDetail, string>({
      query: (id) => `/admin/vendors/${id}`,
      providesTags: (result, _e, id) =>
        result ? [{ type: "Vendors" as const, id }] : [{ type: "Vendors" as const, id }],
    }),
    adminBlockVendor: builder.mutation<
      { id: string; blocked: boolean; blockedAt: string | null },
      { id: string; body: VendorBlockInput }
    >({
      query: ({ id, body }) => ({ url: `/admin/vendors/${id}/block`, method: "PATCH", body }),
      invalidatesTags: ["Vendors", "Users", "Notifications", "Analytics"],
    }),
    updateVendorStatus: builder.mutation<
      { status: string; approvedAt: string | null },
      { id: string; body: VendorStatusUpdateInput }
    >({
      query: ({ id, body }) => ({ url: `/admin/vendors/${id}/status`, method: "PATCH", body }),
      invalidatesTags: ["Vendors", "Users", "Notifications", "Analytics"],
    }),
    adminCustomers: builder.query<
      AdminCustomerListResponse,
      { search?: string; vendorId?: string; page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/admin/customers", params }),
      providesTags: ["Customers", "Users"],
    }),
    adminUsers: builder.query<UserListResponse, { role?: User["role"] }>({
      query: (params) => ({ url: "/admin/users", params }),
      providesTags: ["Users"],
    }),
    updateUserStatus: builder.mutation<
      { id: string; status: string },
      { id: string; body: UserStatusUpdateInput }
    >({
      query: ({ id, body }) => ({ url: `/admin/users/${id}/status`, method: "PATCH", body }),
      invalidatesTags: ["Users", "Customers", "Auth"],
    }),
    broadcastNotification: builder.mutation<{ sent: number }, BroadcastNotificationInput>({
      query: (body) => ({ url: "/admin/notifications/broadcast", method: "POST", body }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterCustomerMutation,
  useRegisterVendorMutation,
  useMeQuery,
  usePublicVendorsQuery,
  useVendorCatalogQuery,
  useVendorProfileQuery,
  useUpdateVendorProfileMutation,
  useVendorStaffQuery,
  useInviteStaffMutation,
  useRemoveStaffMutation,
  useVendorProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useChangeProductPriceMutation,
  useToggleProductMutation,
  useInventoryQuery,
  useRestockMutation,
  useVendorOrdersQuery,
  useVendorOrderDetailQuery,
  useTransitionOrderMutation,
  useVendorCustomersQuery,
  useVendorCustomerDetailQuery,
  useCreateVendorCustomerMutation,
  useUpdateVendorCustomerMutation,
  useUpdateVendorCustomerStatusMutation,
  useCustomerPricesQuery,
  useCreateCustomerPriceMutation,
  useUpdateCustomerPriceMutation,
  useDeleteCustomerPriceMutation,
  useVendorDeliveriesQuery,
  useCreateVendorDeliveryMutation,
  useCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
  useCustomerOrdersQuery,
  useCustomerPriceOverridesQuery,
  useCreateOrderMutation,
  useCustomerOrderDetailQuery,
  useCancelOrderMutation,
  useRazorpayKeyQuery,
  useLazyRazorpayKeyQuery,
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useCashPaidMutation,
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useAnalyticsOverviewQuery,
  useVendorAnalyticsQuery,
  useAdminVendorsQuery,
  useAdminVendorDetailQuery,
  useAdminBlockVendorMutation,
  useUpdateVendorStatusMutation,
  useAdminCustomersQuery,
  useAdminUsersQuery,
  useUpdateUserStatusMutation,
  useBroadcastNotificationMutation,
} = api;

export { api as baseApi };
export type { AdminAnalytics, AnalyticsOverview, Order, OrderDetail, Product };