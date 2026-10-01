import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Turns a rejected RTK Query mutation into a message worth showing.
 *
 * A bare catch treats every failure as "wrong credentials", so a CORS block or
 * a dead API reports itself as a rejected login. Network-level failures arrive
 * with a string status, so they can be told apart from real HTTP responses.
 *
 * The API answers with `{ success: false, error: { code, message, details } }`;
 * zod validation failures carry their own `details: [{ path, message }]`.
 */
export function apiErrorMessage(
  error: unknown,
  options: { unauthorized?: string; fallback?: string } = {},
): string {
  const {
    unauthorized = "Invalid email or password",
    fallback = "Something went wrong. Please try again.",
  } = options;

  if (!error || typeof error !== "object") return fallback;

  const { status, data } = error as FetchBaseQueryError;

  if (typeof status === "string") {
    return "Cannot reach the server. Check that the API is running on port 5000.";
  }

  const envelope = data as
    | {
        message?: string;
        error?: {
          message?: string;
          details?: { path?: string; message?: string }[];
        };
      }
    | undefined;

  const validationMessage = envelope?.error?.details?.[0]?.message;
  const message =
    validationMessage ?? envelope?.error?.message ?? envelope?.message ?? undefined;

  if (status === 401) {
    return message === "Invalid email or password" ? unauthorized : (message ?? unauthorized);
  }

  if (message) return message;

  if (typeof status === "number") {
    return `Request failed (HTTP ${status}). Please try again.`;
  }

  return fallback;
}
