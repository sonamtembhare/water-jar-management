export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, message: string, code = "APP_ERROR", details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, message, "BAD_REQUEST", details)
export const unauthorized = (message = "Unauthorized") =>
  new ApiError(401, message, "UNAUTHORIZED")
export const forbidden = (message = "Forbidden") =>
  new ApiError(403, message, "FORBIDDEN")
export const notFound = (message = "Not found") =>
  new ApiError(404, message, "NOT_FOUND")
export const conflict = (message: string) => new ApiError(409, message, "CONFLICT")
export const unprocessable = (message = "Unprocessable entity", details?: unknown) =>
  new ApiError(422, message, "UNPROCESSABLE_ENTITY", details)

type AsyncHandler = (
  req: Parameters<import("express").RequestHandler>[0],
  res: Parameters<import("express").RequestHandler>[1],
  next: Parameters<import("express").RequestHandler>[2],
) => Promise<unknown>

export const asyncHandler =
  (fn: AsyncHandler): import("express").RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }