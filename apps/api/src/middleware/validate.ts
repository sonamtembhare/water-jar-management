import type { NextFunction, Request, Response } from "express"
import { z } from "zod"
import { badRequest } from "./error"

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(badRequest("Invalid request body", firstIssue(result.error)))
    }
    req.body = result.data
    next()
  }
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      return next(badRequest("Invalid query parameters", firstIssue(result.error)))
    }
    req.query = result.data as unknown as typeof req.query
    next()
  }
}

export function validateParams<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      return next(badRequest("Invalid path parameters", firstIssue(result.error)))
    }
    req.params = result.data as unknown as typeof req.params
    next()
  }
}

function firstIssue(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }))
}