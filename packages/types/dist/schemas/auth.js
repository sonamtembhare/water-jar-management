"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.inviteStaffSchema = exports.loginSchema = exports.registerVendorSchema = exports.registerCustomerSchema = exports.phoneSchema = exports.emailSchema = exports.passwordSchema = void 0;
const zod_1 = require("zod");
exports.passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters");
exports.emailSchema = zod_1.z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address");
exports.phoneSchema = zod_1.z
    .string()
    .regex(/^[0-9+\-\s()]{8,15}$/, "Enter a valid phone number")
    .optional()
    .or(zod_1.z.literal("").transform(() => undefined));
exports.registerCustomerSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Name is required"),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    phone: exports.phoneSchema.optional(),
    address: zod_1.z.string().min(5, "Address is required").optional(),
    city: zod_1.z.string().optional(),
    pinCode: zod_1.z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code").optional(),
})
    .strict();
exports.registerVendorSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Name is required"),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    phone: exports.phoneSchema.optional(),
    businessName: zod_1.z.string().min(2, "Business name is required"),
    address: zod_1.z.string().optional(),
    gstin: zod_1.z.string().optional(),
})
    .strict();
exports.loginSchema = zod_1.z
    .object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, "Password is required"),
})
    .strict();
exports.inviteStaffSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Name is required"),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    phone: exports.phoneSchema.optional(),
})
    .strict();
exports.updateProfileSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Name is required").optional(),
    phone: exports.phoneSchema.optional(),
    address: zod_1.z.string().min(5, "Address is required").optional(),
    city: zod_1.z.string().optional(),
    pinCode: zod_1.z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code").optional(),
})
    .strict();
