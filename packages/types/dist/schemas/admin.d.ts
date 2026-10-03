import { z } from "zod";
export declare const adminVendorSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    gstin: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
    }>;
    approvedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
    ownerName: z.ZodNullable<z.ZodString>;
    ownerEmail: z.ZodNullable<z.ZodString>;
    ownerPhone: z.ZodNullable<z.ZodString>;
    staffCount: z.ZodNumber;
    blocked: z.ZodBoolean;
    blockedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const adminVendorListResponseSchema: z.ZodObject<{
    vendors: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        address: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        gstin: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            pending: "pending";
            approved: "approved";
            rejected: "rejected";
        }>;
        approvedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
        createdAt: z.ZodCoercedDate<unknown>;
        ownerName: z.ZodNullable<z.ZodString>;
        ownerEmail: z.ZodNullable<z.ZodString>;
        ownerPhone: z.ZodNullable<z.ZodString>;
        staffCount: z.ZodNumber;
        blocked: z.ZodBoolean;
        blockedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export declare const vendorBlockSchema: z.ZodObject<{
    blocked: z.ZodBoolean;
}, z.core.$strict>;
export declare const staffSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<{
        super_admin: "super_admin";
        vendor: "vendor";
        customer: "customer";
    }>;
    status: z.ZodEnum<{
        active: "active";
        blocked: "blocked";
    }>;
}, z.core.$strip>;
export declare const adminVendorDetailSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    gstin: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
    }>;
    approvedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    blocked: z.ZodBoolean;
    blockedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    ownerName: z.ZodNullable<z.ZodString>;
    ownerEmail: z.ZodNullable<z.ZodString>;
    ownerPhone: z.ZodNullable<z.ZodString>;
    staff: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        role: z.ZodEnum<{
            super_admin: "super_admin";
            vendor: "vendor";
            customer: "customer";
        }>;
        status: z.ZodEnum<{
            active: "active";
            blocked: "blocked";
        }>;
    }, z.core.$strip>>;
    productCount: z.ZodNumber;
    activeProductCount: z.ZodNumber;
    totalOrders: z.ZodNumber;
    deliveredOrders: z.ZodNumber;
    pendingOrders: z.ZodNumber;
    revenue: z.ZodNumber;
}, z.core.$strip>;
export declare const adminCustomerSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        active: "active";
        blocked: "blocked";
    }>;
    address: z.ZodNullable<z.ZodString>;
    city: z.ZodNullable<z.ZodString>;
    pinCode: z.ZodNullable<z.ZodString>;
    totalOrders: z.ZodNumber;
    deliveredOrders: z.ZodNumber;
    totalSpent: z.ZodNumber;
    vendorsOrderedFrom: z.ZodArray<z.ZodObject<{
        vendorId: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>;
    createdAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const adminCustomerListResponseSchema: z.ZodObject<{
    customers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            active: "active";
            blocked: "blocked";
        }>;
        address: z.ZodNullable<z.ZodString>;
        city: z.ZodNullable<z.ZodString>;
        pinCode: z.ZodNullable<z.ZodString>;
        totalOrders: z.ZodNumber;
        deliveredOrders: z.ZodNumber;
        totalSpent: z.ZodNumber;
        vendorsOrderedFrom: z.ZodArray<z.ZodObject<{
            vendorId: z.ZodString;
            name: z.ZodString;
        }, z.core.$strip>>;
        createdAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export declare const userListResponseSchema: z.ZodObject<{
    users: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        role: z.ZodEnum<{
            super_admin: "super_admin";
            vendor: "vendor";
            customer: "customer";
        }>;
        status: z.ZodEnum<{
            active: "active";
            blocked: "blocked";
        }>;
        vendorId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodCoercedDate<unknown>;
        updatedAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export declare const vendorStatusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<{
        approved: "approved";
        rejected: "rejected";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const userStatusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<{
        active: "active";
        blocked: "blocked";
    }>;
}, z.core.$strict>;
export declare const broadcastNotificationSchema: z.ZodObject<{
    userIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    role: z.ZodOptional<z.ZodEnum<{
        super_admin: "super_admin";
        vendor: "vendor";
        customer: "customer";
    }>>;
    title: z.ZodString;
    body: z.ZodString;
}, z.core.$strict>;
export declare const staffListResponseSchema: z.ZodObject<{
    staff: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
        role: z.ZodEnum<{
            super_admin: "super_admin";
            vendor: "vendor";
            customer: "customer";
        }>;
        status: z.ZodEnum<{
            active: "active";
            blocked: "blocked";
        }>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type AdminVendor = z.infer<typeof adminVendorSchema>;
export type AdminVendorListResponse = z.infer<typeof adminVendorListResponseSchema>;
export type VendorBlockInput = z.infer<typeof vendorBlockSchema>;
export type AdminVendorDetail = z.infer<typeof adminVendorDetailSchema>;
export type AdminCustomer = z.infer<typeof adminCustomerSchema>;
export type AdminCustomerListResponse = z.infer<typeof adminCustomerListResponseSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
export type VendorStatusUpdateInput = z.infer<typeof vendorStatusUpdateSchema>;
export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
export type Staff = z.infer<typeof staffSchema>;
export type StaffListResponse = z.infer<typeof staffListResponseSchema>;
//# sourceMappingURL=admin.d.ts.map