"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicGame } from "../game/types";
import { CheckCard } from "../game/CheckCard";
import { saveToken } from "./useRoom";
import { Button, Card, PageHeader } from "../ui";

export function ImpostorStart({ game }: { game: PublicGame }) {
  const router = useRouter();
  const [solo, setSolo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const spec = game.spec!;

  async function host() {
    setBusy(true);
    const res = await fetch("/api/rooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gameId: game.id }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setBusy(false); return; }
    saveToken(json.code, "host", json.hostToken);
    router.push(`/rooms/${json.code}/host`);
  }

  return (
    <>
      <PageHeader />
      <main className="mx-auto max-w-2xl space-y-8 px-4 pb-24 pt-10">
        <div>
          <p className="text-sm text-zinc-500">Impostor · 5 rounds</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{spec.title}</h1>
          <p className="mt-4 leading-relaxed text-zinc-700">{spec.briefing}</p>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {!solo ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="flex flex-col p-5">
              <p className="font-semibold">Host a room</p>
              <p className="mt-1 flex-1 text-sm text-zinc-600">3–10 players join on their phones. Put this screen on a projector or shared display.</p>
              <Button className="mt-4" disabled={busy} onClick={host}>{busy ? "Creating room…" : "Create room"}</Button>
            </Card>
            <Card className="flex flex-col p-5">
              <p className="font-semibold">Practice alone</p>
              <p className="mt-1 flex-1 text-sm text-zinc-600">Five rounds of spotting the fake fact among true ones.</p>
              <Button variant="secondary" className="mt-4" onClick={() => setSolo(true)}>Start practice</Button>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">{spec.checks.map((c) => <CheckCard key={c.id} gameId={game.id} check={c} />)}</div>
        )}
      </main>
    </>
  );
}
