import { z } from "zod";
export declare const passwordSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const phoneSchema: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>;
export declare const registerCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    pinCode: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const registerVendorSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    businessName: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    gstin: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strict>;
export declare const inviteStaffSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
}, z.core.$strict>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    pinCode: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type RegisterVendorInput = z.infer<typeof registerVendorSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
//# sourceMappingURL=auth.d.ts.map