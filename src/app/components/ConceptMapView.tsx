import type { ConceptMap } from "@/domain/concept-map";

export function ConceptMapView({ map }: { map: ConceptMap }) {
  return (
    <section>
      <p className="text-sm text-neutral-500">{map.source_coverage}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {map.concepts.map((c) => (
          <li key={c.id} className="rounded-lg border p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{c.name}</h3>
              <span className="text-xs text-neutral-500">{c.source_ref ?? "general knowledge"}</span>
            </div>
            <p className="mt-1 text-sm">{c.summary}</p>
            {c.misconceptions[0] && <p className="mt-2 text-xs text-amber-700">Common mistake: {c.misconceptions[0].wrong}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
