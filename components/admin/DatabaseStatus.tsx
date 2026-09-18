"use client";

import { useEffect, useState } from "react";
import { ADMIN_CONNECTION_CHANGED, getAdminConnection, refreshAdminData } from "@/lib/admin-live";

export function DatabaseStatus() {
  const [connection, setConnection] = useState(getAdminConnection);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => { setConnection(getAdminConnection()); setOffline(!navigator.onLine); };
    update();
    window.addEventListener(ADMIN_CONNECTION_CHANGED, update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener(ADMIN_CONNECTION_CHANGED, update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const error = offline ? "You are offline. Showing the last loaded data." : connection.error;
  return (
    <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2 text-xs ${error ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-500"}`} role={error ? "alert" : "status"}>
      <span>{error || (connection.lastSynced ? `Database connected · Auto-refresh every 5s · Last synced ${new Date(connection.lastSynced).toLocaleTimeString()}` : "Connecting to database…")}</span>
      {error && <button type="button" className="font-semibold underline" onClick={refreshAdminData}>Retry refresh</button>}
    </div>
  );
}
