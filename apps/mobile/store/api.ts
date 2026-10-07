import {
    createApi,
    fetchBaseQuery,
    type BaseQueryFn,
    type FetchArgs,
    type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import type {
    OrderDetail,
    Product,
    VendorAnalytics,
    VendorCustomerCreateInput,
    VendorCustomerDetail,
    VendorCustomerListItem,
    VendorCustomerListResponse,
    VendorCustomerUpdateInput,
    VendorDeliveryCreateInput,
} from "@repo/types";

import type { RootState } from "./store";

type LoginRequest = {
    email: string;
    password: string;
};

type LoginResponse = {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        vendorId?: string | null;
    };
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1`,

    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return headers;
    },
});

// The API answers most requests with an envelope: { success: true, data: ... }.
// Unwrap it once here (the web client does the same) so screens read the real
// payload. Login answers with { token, user } and passes through untouched.
const baseQuery: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, apiOptions, extraOptions) => {
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

/**
 * Turns an RTK Query error into a message that is safe to show in the UI.
 * Never exposes stack traces or raw server internals.
 */
export function getApiErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again.",
): string {
    const err = error as
        | { data?: { error?: { message?: string }; message?: string } }
        | undefined;
    return err?.data?.error?.message || err?.data?.message || fallback;
}

export const api = createApi({
    reducerPath: "api",
    baseQuery,

    tagTypes: [
        "Vendor",
        "Customer",
        "Delivery",
        "Notification",
    ],

    endpoints: (builder) => ({
        vendorLogin: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/auth/vendor/login",
                method: "POST",
                body: credentials,
            }),
        }),

        // ---- Dashboard (stats are scoped to the JWT vendor on the server) ----
        vendorOverview: builder.query<VendorAnalytics, void>({
            query: () => "/analytics/overview",
            providesTags: ["Vendor"],
        }),

        // ---- Jar sizes for the Add Order form ----
        vendorProducts: builder.query<{ products: Product[]; total: number }, void>({
            query: () => "/vendor/products",
            providesTags: ["Vendor"],
        }),

        // ---- Vendor customers ----
        vendorCustomers: builder.query<
            VendorCustomerListResponse,
            { search?: string; page?: number; pageSize?: number }
        >({
            query: (params) => ({ url: "/vendor/customers", params }),
            providesTags: ["Customer"],
        }),

        vendorCustomerDetail: builder.query<VendorCustomerDetail, string>({
            query: (id) => `/vendor/customers/${id}`,
            providesTags: ["Customer"],
        }),

        createVendorCustomer: builder.mutation<
            VendorCustomerListItem,
            VendorCustomerCreateInput
        >({
            query: (body) => ({ url: "/vendor/customers", method: "POST", body }),
            invalidatesTags: ["Customer", "Vendor"],
        }),

        updateVendorCustomer: builder.mutation<
            VendorCustomerListItem,
            { id: string; body: VendorCustomerUpdateInput }
        >({
            query: ({ id, body }) => ({
                url: `/vendor/customers/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Customer", "Vendor"],
        }),

        // ---- Deliveries (orders recorded by the vendor) ----
        createVendorDelivery: builder.mutation<OrderDetail, VendorDeliveryCreateInput>({
            query: (body) => ({ url: "/vendor/deliveries", method: "POST", body }),
            invalidatesTags: ["Delivery", "Vendor", "Customer"],
        }),
    }),
});

export const {
    useVendorLoginMutation,
    useVendorOverviewQuery,
    useVendorProductsQuery,
    useVendorCustomersQuery,
    useVendorCustomerDetailQuery,
    useCreateVendorCustomerMutation,
    useUpdateVendorCustomerMutation,
    useCreateVendorDeliveryMutation,
} = api;
