"use client";

import { AlertCircle, CheckCircle2, Loader2, RefreshCw, WifiOff, AlertTriangle } from "lucide-react";
import { useServerStatus, type ServerStatus } from "@/lib/use-server-status";
import { cn } from "@/lib/utils";

interface StatusConfig {
  icon: React.ReactNode;
  label: string;
  description: string;
  bar: string; // tailwind colour classes for the banner strip
  dot: string; // indicator dot colour
  pulse: boolean;
}

function getConfig(status: ServerStatus): StatusConfig {
  switch (status) {
    case "checking":
      return {
        icon: <Loader2 className="size-3.5 animate-spin" />,
        label: "Checking server…",
        description: "Connecting to the API server.",
        bar: "bg-muted/80 text-muted-foreground border-b border-border",
        dot: "bg-zinc-400",
        pulse: false,
      };
    case "online":
      return {
        icon: <CheckCircle2 className="size-3.5" />,
        label: "Server online",
        description: "All systems operational.",
        bar: "bg-emerald-950/80 text-emerald-300 border-b border-emerald-800/50",
        dot: "bg-emerald-400",
        pulse: true,
      };
    case "degraded":
      return {
        icon: <AlertTriangle className="size-3.5" />,
        label: "Server degraded",
        description: "The server replied with an unexpected response. Some features may not work.",
        bar: "bg-amber-950/80 text-amber-300 border-b border-amber-800/50",
        dot: "bg-amber-400",
        pulse: true,
      };
    case "offline":
      return {
        icon: <WifiOff className="size-3.5" />,
        label: "Server unreachable",
        description: "Cannot reach the API server. Check your connection or Vercel deployment status.",
        bar: "bg-red-950/80 text-red-300 border-b border-red-800/50",
        dot: "bg-red-500",
        pulse: false,
      };
  }
}

/**
 * A slim top-of-page banner that tells the user whether the Vercel API server
 * is reachable.  It only occupies vertical space when status ≠ "online".
 * When online it shows a small unobtrusive pill in the header instead.
 */
export function ServerStatusBanner({ compact = false }: { compact?: boolean }) {
  const { status, lastChecked, recheck } = useServerStatus();
  const cfg = getConfig(status);

  // Time formatting helper
  const timeLabel = lastChecked
    ? lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  // ── Compact pill variant (shown in header when online) ──────────────────
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
          status === "online"
            ? "bg-emerald-950/60 text-emerald-400 ring-1 ring-emerald-700/40"
            : status === "offline"
              ? "bg-red-950/60 text-red-400 ring-1 ring-red-700/40"
              : status === "degraded"
                ? "bg-amber-950/60 text-amber-400 ring-1 ring-amber-700/40"
                : "bg-muted text-muted-foreground",
        )}
        title={`API server ${status}${timeLabel ? ` — last checked ${timeLabel}` : ""}`}
      >
        <span
          className={cn(
            "size-2 rounded-full",
            cfg.dot,
            cfg.pulse && "animate-pulse",
          )}
        />
        <span className="hidden sm:inline">
          {status === "checking" ? "Checking…" : status === "online" ? "API online" : cfg.label}
        </span>
        {status !== "checking" && (
          <button
            onClick={recheck}
            aria-label="Re-check server status"
            className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <RefreshCw className="size-3" />
          </button>
        )}
      </div>
    );
  }

  // ── Full banner (shown only when NOT online) ────────────────────────────
  if (status === "online") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex w-full items-center justify-between gap-3 px-4 py-2 text-xs transition-all",
        cfg.bar,
      )}
    >
      <div className="flex items-center gap-2">
        {/* animated dot */}
        <span className="relative flex size-2 shrink-0">
          {cfg.pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                cfg.dot,
              )}
            />
          )}
          <span className={cn("relative inline-flex size-2 rounded-full", cfg.dot)} />
        </span>

        {/* icon + label */}
        <span className="flex items-center gap-1.5 font-semibold">
          {cfg.icon}
          {cfg.label}
        </span>

        {/* longer description — hidden on very small screens */}
        <span className="hidden sm:inline opacity-80">— {cfg.description}</span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {timeLabel && (
          <span className="hidden md:inline opacity-60">Last checked {timeLabel}</span>
        )}
        <button
          onClick={recheck}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
            "hover:bg-white/10 active:scale-95",
          )}
          aria-label="Retry server connection"
        >
          <RefreshCw className="size-3" />
          <span className="hidden sm:inline">Retry</span>
        </button>
      </div>
    </div>
  );
}
