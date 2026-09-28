"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GameMode } from "@/domain/game-spec";
import { Spinner } from "./ui";

const ART = "https://zyxnnfgoyosgjngoapsw.supabase.co/storage/v1/object/public/assets/library";
const MODES: { mode: GameMode; name: string; meta: string; blurb: string; img: string }[] = [
  { mode: "case", name: "Case Files", meta: "Solo · 15–20 min", blurb: "Question characters, read evidence, and make the call the science supports.", img: `${ART}/import-scene-detective-office.png` },
  { mode: "escape", name: "Escape Room", meta: "Solo · 20 min", blurb: "Two rooms of locks that open only when you apply a concept.", img: `${ART}/import-scene-chemistry-lab-night.png` },
  { mode: "impostor", name: "Impostor", meta: "3–10 players · 15 min", blurb: "One fact card is fake. Explain yours out loud and vote out the impostor.", img: `${ART}/import-scene-museum-gallery.png` },
];

export function Arcade({ unitId, available }: { unitId: string; available: GameMode[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<GameMode | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function start(mode: GameMode) {
    setPending(mode); setMsg(null);
    const res = await fetch(`/api/units/${unitId}/games`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode }) });
    const json = await res.json();
    if (res.ok) router.push(`/games/${json.id}`);
    else { setMsg(json.error); setPending(null); }
  }

  return (
    <div className="mt-3 space-y-3">
      {MODES.filter((m) => available.includes(m.mode)).map((m) => (
        <button key={m.mode} disabled={pending !== null} onClick={() => start(m.mode)}
          className="flex w-full items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-400 disabled:opacity-60">
          <img src={m.img} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-3"><p className="font-medium">{m.name}</p><p className="text-xs text-zinc-500">{m.meta}</p></div>
            <p className="mt-0.5 text-sm text-zinc-600">{m.blurb}</p>
          </div>
          {pending === m.mode && <Spinner />}
        </button>
      ))}
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      <p className="text-sm text-zinc-400">In development: Heist, Keep It Alive, Card Battler.</p>
    </div>
  );
}
