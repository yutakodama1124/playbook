import type { ConceptMap } from "@/domain/concept-map";

export function ConceptMapView({ map }: { map: ConceptMap }) {
  return (
    <div className="mt-3">
      <p className="text-sm text-zinc-500">{map.source_coverage}</p>
      <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {map.concepts.map((c) => (
          <li key={c.id} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-medium">{c.name}</p>
              <p className="shrink-0 text-xs text-zinc-400">{c.source_ref ?? "General knowledge"}</p>
            </div>
            <p className="mt-1 text-sm text-zinc-600">{c.summary}</p>
            {c.misconceptions[0] && <p className="mt-1.5 text-sm text-zinc-500"><span className="font-medium text-zinc-700">Common mistake:</span> {c.misconceptions[0].wrong}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
