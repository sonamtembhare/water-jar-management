import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000";

// Endpoints are appended as `${API_URL}/api/v1/...`, so a trailing slash in
// NEXT_PUBLIC_API_URL would produce a double slash and a 404/redirect from the
// server. Strip every trailing slash once, here.
export const API_URL = RAW_API_URL.replace(/\/+$/, "");

export const AUTH_STORAGE_KEY = "wjm.auth";