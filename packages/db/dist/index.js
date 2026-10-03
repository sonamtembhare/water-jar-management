"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.schema = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
// Must run before process.env.DATABASE_URL is read below. Consumers import
// @repo/db from many entrypoints (seed.ts, scripts) where this module is
// evaluated *before* their own dotenv import, so without this the pool would
// silently fall back to the localhost default and write to the wrong database.
require("dotenv/config");
const schema = __importStar(require("./schema"));
exports.schema = schema;
const relations = __importStar(require("./relations"));
__exportStar(require("./schema"), exports);
__exportStar(require("./relations"), exports);
const connectionString = process.env.DATABASE_URL ??
    "postgresql://postgres@localhost:5432/water_jar_management";
const isServerless = Boolean(process.env.VERCEL);
function createDb() {
    const pool = new pg_1.Pool({
        connectionString,
        // Serverless functions open a fresh pool per cold start, and Neon routes
        // through PgBouncer. A small pool keeps the total connection count well
        // under the Postgres limit; raise it only if you outgrow serverless.
        ...(isServerless ? { max: 2, idleTimeoutMillis: 5_000 } : {}),
    });
    // Lets Vercel close idle connections before a function is suspended, so the
    // pool survives warm invocations instead of leaking. Optional dependency —
    // absent locally, so it is loaded defensively.
    if (isServerless) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { attachDatabasePool } = require("@vercel/functions");
            attachDatabasePool(pool);
        }
        catch {
            console.warn("[db] @vercel/functions unavailable — pool will not be closed on suspend");
        }
    }
    return (0, node_postgres_1.drizzle)(pool, {
        schema: { ...schema, ...relations },
    });
}
const globalForDb = globalThis;
exports.db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") {
    globalForDb.db = exports.db;
}
