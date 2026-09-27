import type { RoomView } from "@/modes/impostor/engine";

export function Reveal({ view, big = false }: { view: RoomView; big?: boolean }) {
  const r = view.lastResult;
  if (!r) return null;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? "?";
  return (
    <div className={`space-y-4 ${big ? "text-xl" : ""}`}>
      <div className={`rounded-2xl p-5 ${r.caught ? "bg-teal-700 text-white" : "bg-rose-700 text-white"}`}>
        <p className="text-sm uppercase tracking-widest opacity-80">{r.caught ? "Impostor caught" : "The impostor escaped"}</p>
        <p className={`${big ? "text-4xl" : "text-2xl"} font-bold`}>
          {r.ejectedIds.length ? `${r.ejectedIds.map(name).join(", ")} was voted out` : "Tie — nobody was voted out"}
        </p>
        <p className="mt-1">Impostor: {r.impostorIds.map(name).join(" & ")}</p>
      </div>
      <div className="rounded-2xl bg-white p-5 text-stone-900">
        <p className="text-sm font-semibold uppercase text-rose-700">The fake fact</p>
        <p className="line-through decoration-rose-600 decoration-2">{r.fake}</p>
        <p className="mt-3 text-sm font-semibold uppercase text-teal-700">What&apos;s actually true</p>
        <p>{r.correct_version}</p>
        <p className="mt-3 text-stone-600">{r.explanation}</p>
      </div>
    </div>
  );
}

export function Scoreboard({ view }: { view: RoomView }) {
  const sorted = [...view.players].sort((a, b) => b.score - a.score);
  return (
    <ol className="space-y-2">
      {sorted.map((p, i) => (
        <li key={p.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2 text-stone-900">
          <span><span className="mr-3 font-bold text-stone-400">{i + 1}</span>{p.name}</span><span className="font-bold">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
