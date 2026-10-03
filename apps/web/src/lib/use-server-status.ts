"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ServerStatus = "checking" | "online" | "offline" | "degraded";

const HEALTH_URL = "/api/health";
const POLL_INTERVAL_MS = 30_000; // re-check every 30 seconds
const TIMEOUT_MS = 8_000;

async function pingHealth(): Promise<ServerStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(HEALTH_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.ok) {
      // Optionally parse the JSON body to confirm it has { status: "ok" }
      try {
        const body = await res.json();
        if (body?.status === "ok") return "online";
        return "degraded"; // server replied but not the expected shape
      } catch {
        return "degraded";
      }
    }

    // 4xx/5xx means server is reachable but unhealthy
    return "degraded";
  } catch (err) {
    clearTimeout(timer);
    // AbortError = timeout; TypeError = no network
    return "offline";
  }
}

/**
 * Polls the API /health endpoint and exposes the server status.
 *
 * Returns:
 *  - "checking"  – first check is in flight
 *  - "online"    – server replied { status: "ok" }
 *  - "degraded"  – server is reachable but gave unexpected/error response
 *  - "offline"   – could not reach the server at all (network or timeout)
 */
export function useServerStatus(): {
  status: ServerStatus;
  lastChecked: Date | null;
  recheck: () => void;
} {
  const [status, setStatus] = useState<ServerStatus>("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const result = await pingHealth();
    setStatus(result);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    // kick off immediately
    check();

    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [check]);

  return { status, lastChecked, recheck: check };
}
