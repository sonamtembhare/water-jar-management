import { z } from "zod";
export declare const notificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    href: z.ZodNullable<z.ZodString>;
    readAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
}, z.core.$strip>;
export declare const notificationsResponseSchema: z.ZodObject<{
    notifications: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        body: z.ZodString;
        href: z.ZodNullable<z.ZodString>;
        readAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
        createdAt: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
    unread: z.ZodNumber;
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
}, z.core.$strip>;
export declare const unreadCountSchema: z.ZodObject<{
    unread: z.ZodNumber;
}, z.core.$strip>;
/** Expo push token, e.g. `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`. */
export declare const pushTokenSchema: z.ZodObject<{
    token: z.ZodString;
    platform: z.ZodOptional<z.ZodEnum<{
        ios: "ios";
        android: "android";
        web: "web";
    }>>;
}, z.core.$strict>;
export declare const markReadSchema: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
    id: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    all: z.ZodLiteral<true>;
}, z.core.$strict>]>>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
export type UnreadCount = z.infer<typeof unreadCountSchema>;
export type PushTokenInput = z.infer<typeof pushTokenSchema>;
//# sourceMappingURL=notification.d.ts.map