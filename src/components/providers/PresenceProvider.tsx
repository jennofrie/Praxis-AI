"use client";

import { useEffect } from "react";

/**
 * PresenceProvider — sends a heartbeat to /api/presence every 60 seconds.
 * Wrap inside the authenticated layout.
 */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const ping = () => {
      fetch("/api/presence", { method: "PATCH" }).catch(() => {});
    };

    // Ping immediately on mount
    ping();

    const interval = setInterval(ping, 60_000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
