"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.orderListResponseSchema = void 0;
const zod_1 = require("zod");
const order_1 = require("./order");
exports.orderListResponseSchema = zod_1.z.object({
    items: zod_1.z.array(order_1.orderSchema),
    total: zod_1.z.number(),
});
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    status: zod_1.z.enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"]).optional(),
});
