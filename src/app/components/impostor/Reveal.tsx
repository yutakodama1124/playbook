import type { RoomView } from "@/modes/impostor/engine";

/** Works on both the dark projector screen (big) and the light phone view. */
export function Reveal({ view, big = false }: { view: RoomView; big?: boolean }) {
  const r = view.lastResult;
  if (!r) return null;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? "?";
  const muted = big ? "text-zinc-400" : "text-zinc-500";
  return (
    <div className="space-y-6">
      <div>
        <p className={`text-sm font-medium ${r.caught ? (big ? "text-emerald-400" : "text-emerald-700") : big ? "text-red-400" : "text-red-700"}`}>{r.caught ? "Impostor caught" : "The impostor got away"}</p>
        <p className={`mt-1 font-semibold tracking-tight ${big ? "text-4xl" : "text-2xl"}`}>
          {r.ejectedIds.length ? `${r.ejectedIds.map(name).join(", ")} was voted out` : "A tie. Nobody was voted out"}
        </p>
        <p className={`mt-1 ${muted}`}>The impostor was {r.impostorIds.map(name).join(" and ")}.</p>
      </div>
      <div className={`space-y-4 rounded-xl border p-5 ${big ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"}`}>
        <div><p className={`text-sm ${muted}`}>The fake fact</p><p className={`mt-1 ${big ? "text-xl" : ""}`}>{r.fake}</p></div>
        <div><p className={`text-sm ${muted}`}>What&apos;s actually true</p><p className={`mt-1 font-medium ${big ? "text-xl" : ""}`}>{r.correct_version}</p></div>
        <p className={muted}>{r.explanation}</p>
      </div>
    </div>
  );
}

export function Scoreboard({ view, dark = false }: { view: RoomView; dark?: boolean }) {
  const sorted = [...view.players].sort((a, b) => b.score - a.score);
  return (
    <ol className={`divide-y rounded-xl border ${dark ? "divide-zinc-800 border-zinc-800 bg-zinc-900" : "divide-zinc-200 border-zinc-200 bg-white"}`}>
      {sorted.map((p, i) => (
        <li key={p.id} className="flex items-center justify-between px-4 py-2.5">
          <span><span className={`mr-3 inline-block w-4 tabular-nums ${dark ? "text-zinc-500" : "text-zinc-400"}`}>{i + 1}</span>{p.name}</span>
          <span className="font-semibold tabular-nums">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
