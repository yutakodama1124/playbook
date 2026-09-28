"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GameMode } from "@/domain/game-spec";

const MODES: { mode: GameMode | null; name: string; blurb: string }[] = [
  { mode: "case", name: "Case Files", blurb: "Interrogate suspects. The science cracks the case." },
  { mode: "escape", name: "Escape Room", blurb: "Every lock needs a concept to open." },
  { mode: "impostor", name: "Impostor", blurb: "One fact is fake. Find who's lying." },
  { mode: null, name: "Heist", blurb: "Coming soon" },
  { mode: null, name: "Keep It Alive", blurb: "Coming soon" },
  { mode: null, name: "Card Battler", blurb: "Coming soon" },
];

export function Arcade({ unitId, available }: { unitId: string; available: GameMode[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  async function start(mode: GameMode) {
    const res = await fetch(`/api/units/${unitId}/games`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode }) });
    const json = await res.json();
    if (res.ok) router.push(`/games/${json.id}`);
    else setMsg(json.error);
  }
  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map(({ mode, name, blurb }) => {
          const enabled = mode !== null && available.includes(mode);
          return (
            <button key={name} disabled={!enabled} onClick={() => mode && start(mode)}
              className="rounded-lg border p-4 text-left enabled:hover:border-teal-700 disabled:opacity-40">
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-neutral-600">{blurb}</p>
            </button>
          );
        })}
      </div>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </section>
  );
}
