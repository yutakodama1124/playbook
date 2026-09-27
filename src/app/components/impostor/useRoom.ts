"use client";
import { useCallback, useEffect, useState } from "react";
import type { RoomView } from "@/modes/impostor/engine";

export type RoomResponse = { code: string; isHost: boolean; view: RoomView };
const key = (code: string, role: "host" | "player") => `room:${code.toUpperCase()}:${role}`;

export function saveToken(code: string, role: "host" | "player", token: string) {
  try { localStorage.setItem(key(code, role), token); } catch { /* storage blocked */ }
}
export function loadToken(code: string, role: "host" | "player") {
  try { return localStorage.getItem(key(code, role)); } catch { return null; }
}

/** Polls room state every 1.5s with this device's token. */
export function useRoom(code: string, role: "host" | "player") {
  const [data, setData] = useState<RoomResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token] = useState<string | null>(() => (typeof window === "undefined" ? null : loadToken(code, role)));

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`, { headers: token ? { "x-room-token": token } : {}, cache: "no-store" });
    const json = await res.json();
    if (res.ok) { setData(json); setError(null); } else setError(json.error);
  }, [code, token]);

  useEffect(() => {
    const first = setTimeout(refresh, 0); // async kick-off (state updates happen after fetch)
    const t = setInterval(refresh, 1500);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [refresh]);

  const post = useCallback(async (path: string, body: object) => {
    const res = await fetch(`/api/rooms/${code}/${path}`, { method: "POST", headers: { "content-type": "application/json", ...(token ? { "x-room-token": token } : {}) }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) setError(json.error); else refresh();
    return res.ok;
  }, [code, token, refresh]);

  return { data, error, token, post };
}
