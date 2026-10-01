import type { Request } from "express"
import { nanoid } from "./nanoid"

export function paramStr(req: Request, name: string): string {
  const value = req.params[name]
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

export function generateOrderNumber(): string {
  return `ORD-${new Date().getFullYear()}${String(
    new Date().getMonth() + 1,
  ).padStart(2, "0")}-${nanoid(6).toUpperCase()}`
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}