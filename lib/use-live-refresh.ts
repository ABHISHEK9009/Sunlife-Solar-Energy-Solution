"use client";

import { useEffect, useRef } from "react";
import { ADMIN_CHANNEL, ADMIN_DATA_CHANGED } from "@/lib/admin-live";

/** Near-real-time refresh, also covering writes made by another device or API. */
export function useLiveRefresh(refresh: () => Promise<unknown>, enabled = true) {
  const latest = useRef({ refresh, enabled });
  useEffect(() => { latest.current = { refresh, enabled }; });

  useEffect(() => {
    let stopped = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      if (stopped || running) return;
      clearTimeout(timer);
      if (latest.current.enabled && document.visibilityState !== "hidden" && navigator.onLine) {
        running = true;
        try { await latest.current.refresh(); }
        catch { /* The request helper exposes errors in the shared status banner. */ }
        finally { running = false; }
      }
      if (!stopped) timer = setTimeout(run, 5000);
    };
    const onChange = () => { void run(); };
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(ADMIN_CHANNEL);
    channel?.addEventListener("message", onChange);
    window.addEventListener(ADMIN_DATA_CHANGED, onChange);
    window.addEventListener("focus", onChange);
    window.addEventListener("online", onChange);
    document.addEventListener("visibilitychange", onChange);
    timer = setTimeout(run, 5000);
    return () => {
      stopped = true;
      clearTimeout(timer);
      channel?.close();
      window.removeEventListener(ADMIN_DATA_CHANGED, onChange);
      window.removeEventListener("focus", onChange);
      window.removeEventListener("online", onChange);
      document.removeEventListener("visibilitychange", onChange);
    };
  }, []);
}
