"use client";
import { useEffect, useState } from "react";

const MAX_WAIT_MS = 12 * 60_000;

/** Polls while status is queued/running; survives network hiccups (backoff) and gives up after 12 minutes. */
export function usePoll<T extends { status?: string; error?: string | null }>(url: string, intervalMs = 2000) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let stop = false;
    const started = Date.now();
    let failures = 0;
    const tick = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as T;
        if (stop) return;
        setData(json);
        failures = 0;
        if (json.status !== "queued" && json.status !== "running") return;
      } catch {
        failures++;
      }
      if (stop) return;
      if (Date.now() - started > MAX_WAIT_MS) {
        setData((d) => ({ ...(d ?? ({} as T)), status: "failed", error: "This is taking much longer than usual. Try again." }));
        return;
      }
      setTimeout(tick, intervalMs * Math.min(2 ** failures, 8));
    };
    tick();
    return () => { stop = true; };
  }, [url, intervalMs]);
  return data;
}
