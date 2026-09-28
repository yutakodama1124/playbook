"use client";
import { useCallback, useEffect, useState } from "react";
import type { BossState } from "@/modes/boss/mastery";
import type { PublicCheck } from "@/domain/public-spec";
import { deviceId } from "../device";

export type BossResponse = {
  unit: { id: string; title: string; course: string; testDate: string | null };
  boss: BossState; art: string | null;
  attack: { gameId: string; conceptId: string; check: PublicCheck }[];
};

export function useBoss(unitId: string) {
  const [data, setData] = useState<BossResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    const res = await fetch(`/api/units/${unitId}/boss`, { headers: { "x-device-id": deviceId() }, cache: "no-store" });
    const json = await res.json();
    if (res.ok) setData(json); else setError(json.error);
  }, [unitId]);
  useEffect(() => { const t = setTimeout(refresh, 0); return () => clearTimeout(t); }, [refresh]);
  return { data, error, refresh };
}
