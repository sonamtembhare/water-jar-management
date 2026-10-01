import jwt from "jsonwebtoken"
import { env } from "../config/env"
import type { AuthUser } from "../middleware/auth"

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    return decoded as AuthUser
  } catch {
    return null
  }
}