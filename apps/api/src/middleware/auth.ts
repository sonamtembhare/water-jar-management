import type { NextFunction, Request, Response } from "express"
import { eq } from "drizzle-orm"
import { db, vendors } from "@repo/db"
import { ApiError, forbidden, unauthorized } from "./error"
import { verifyToken } from "../utils/jwt"

export interface AuthUser {
  id: string
  role: "super_admin" | "vendor" | "customer" | "admin"
  name: string
  email: string
  vendorId: string | null
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header && header.startsWith("Bearer ")) {
    const user = verifyToken(header.slice("Bearer ".length))
    if (user) {
      // Older sessions were signed with the retired "admin" role name; the DB
      // and the router both call it super_admin now.
      if (user.role === "admin") user.role = "super_admin"
      req.user = user
    }
  }
  next()
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(unauthorized())
  }
  next()
}

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized())
    if (!roles.includes(req.user.role)) {
      return next(forbidden("You do not have permission to perform this action"))
    }
    next()
  }
}

export async function requireVendorUser(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(unauthorized())
    if (req.user.role !== "vendor" || !req.user.vendorId) {
      return next(forbidden("Vendor account required"))
    }
    const vendor = await db
      .select({ blocked: vendors.blocked })
      .from(vendors)
      .where(eq(vendors.id, req.user.vendorId))
      .limit(1)
      .then((r) => r[0])
    if (!vendor || vendor.blocked) {
      return next(forbidden("Your vendor account has been blocked"))
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    })
  }

  console.error("[UnhandledError]", err)
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  })
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      hint: "Check GET / for the list of available routes",
    },
  })
}