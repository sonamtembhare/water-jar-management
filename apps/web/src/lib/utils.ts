import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://water-jar-management1-git-main-sonamtembhare01-4932s-projects.vercel.app/";

export const AUTH_STORAGE_KEY = "wjm.auth";