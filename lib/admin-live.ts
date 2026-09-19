"use client";

export const ADMIN_DATA_CHANGED = "sunlife:admin-data-changed";
export const ADMIN_CONNECTION_CHANGED = "sunlife:admin-connection-changed";
export const ADMIN_CHANNEL = "sunlife-admin-data";

const failures = new Map<string, string>();
let lastSynced: number | null = null;
let snapshot = { error: "", lastSynced } as { error: string; lastSynced: number | null };

export function getAdminConnection() { return snapshot; }

function report(key: string, error?: string) {
  if (error) failures.set(key, error);
  else { failures.delete(key); lastSynced = Date.now(); }
  snapshot = { error: Array.from(failures.values())[0] || "", lastSynced };
  window.dispatchEvent(new Event(ADMIN_CONNECTION_CHANGED));
}

export function refreshAdminData() {
  window.dispatchEvent(new Event(ADMIN_DATA_CHANGED));
}

/** Database reads must never reuse a browser/CDN snapshot. */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  const url = input instanceof Request ? input.url : String(input);
  const key = `${method} ${url}`;
  const controller = new AbortController();
  const parentSignal = init?.signal || (input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort();
  if (parentSignal?.aborted) abort();
  parentSignal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(abort, 20000);
  try {
    const response = await fetch(input, { ...init, cache: "no-store", signal: controller.signal });
    if (!response.ok) {
      const body = await response.clone().json().catch(() => null);
      const userMessage = response.status === 401
        ? "Your session expired. Please sign in again."
        : (body?.error && typeof body.error === "string" && !/database|prisma|sql|server|column|syntax|query|econnrefused/i.test(body.error)
            ? body.error
            : "Unable to complete the request right now. Please try again.");
      throw new Error(userMessage);
    }
    report(key);
    if (!["GET", "HEAD"].includes(method)) {
      refreshAdminData();
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel(ADMIN_CHANNEL);
        channel.postMessage("changed");
        channel.close();
      }
    }
    return response;
  } catch (error) {
    if (!parentSignal?.aborted) {
      report(key, "Unable to complete the request right now. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abort);
  }
}
