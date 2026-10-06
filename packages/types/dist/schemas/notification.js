"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markReadSchema = exports.pushTokenSchema = exports.unreadCountSchema = exports.notificationsResponseSchema = exports.notificationSchema = void 0;
const zod_1 = require("zod");
exports.notificationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    type: zod_1.z.string(),
    title: zod_1.z.string(),
    body: zod_1.z.string(),
    href: zod_1.z.string().nullable(),
    readAt: zod_1.z.coerce.date().nullable(),
    createdAt: zod_1.z.coerce.date(),
});
exports.notificationsResponseSchema = zod_1.z.object({
    notifications: zod_1.z.array(exports.notificationSchema),
    total: zod_1.z.number(),
    unread: zod_1.z.number(),
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
});
exports.unreadCountSchema = zod_1.z.object({
    unread: zod_1.z.number(),
});
/** Expo push token, e.g. `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`. */
exports.pushTokenSchema = zod_1.z
    .object({
    token: zod_1.z
        .string()
        .max(200)
        .regex(/^(ExponentPushToken\[.+\]|ExpoPushToken\[.+\])$/, "Invalid Expo push token"),
    platform: zod_1.z.enum(["ios", "android", "web"]).optional(),
})
    .strict();
exports.markReadSchema = zod_1.z
    .object({
    id: zod_1.z.string().uuid(),
})
    .strict()
    .or(zod_1.z.object({ all: zod_1.z.literal(true) }).strict())
    .optional();
