"use client";
import { useEffect, useState } from "react";

export function usePoll<T extends { status?: string }>(url: string, intervalMs = 2000) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as T;
      if (stop) return;
      setData(json);
      if (json.status === "queued" || json.status === "running") setTimeout(tick, intervalMs);
    };
    tick();
    return () => { stop = true; };
  }, [url, intervalMs]);
  return data;
}
