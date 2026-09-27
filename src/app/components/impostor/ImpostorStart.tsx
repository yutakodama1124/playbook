"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicGame } from "../game/types";
import { CheckCard } from "../game/CheckCard";
import { saveToken } from "./useRoom";

export function ImpostorStart({ game }: { game: PublicGame }) {
  const router = useRouter();
  const [solo, setSolo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spec = game.spec!;

  async function host() {
    const res = await fetch("/api/rooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gameId: game.id }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    saveToken(json.code, "host", json.hostToken);
    router.push(`/rooms/${json.code}/host`);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Impostor</p>
      <h1 className="text-3xl font-bold">{spec.title}</h1>
      <p className="text-lg">{spec.briefing}</p>
      {error && <p className="text-rose-700">{error}</p>}
      {!solo ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={host} className="rounded-2xl bg-stone-900 p-5 text-left text-white"><p className="text-xl font-bold">Host a room</p><p className="text-sm opacity-70">3–10 players on phones. Put this screen on a projector.</p></button>
          <button onClick={() => setSolo(true)} className="rounded-2xl border-2 border-stone-300 p-5 text-left"><p className="text-xl font-bold">Practice solo</p><p className="text-sm text-stone-600">Spot the fake fact in each round.</p></button>
        </div>
      ) : (
        spec.checks.map((c) => <CheckCard key={c.id} gameId={game.id} check={c} />)
      )}
    </main>
  );
}
