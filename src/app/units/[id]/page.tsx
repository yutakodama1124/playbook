"use client";
import { use } from "react";
import type { ConceptMap } from "@/domain/concept-map";
import { ConceptMapView } from "@/app/components/ConceptMapView";
import { Arcade } from "@/app/components/Arcade";
import { usePoll } from "@/app/components/usePoll";

type UnitView = { id: string; title: string; course: string; status: string; error: string | null; conceptMap: ConceptMap | null };

export default function UnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const unit = usePoll<UnitView>(`/api/units/${id}`);
  if (!unit) return <main className="p-8">Loading…</main>;
  if (!unit.status) return <main className="p-8 text-red-600">Could not load this unit: {unit.error ?? "unknown error"}</main>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">{unit.title}</h1>
      <p className="text-neutral-600">{unit.course}</p>
      {(unit.status === "queued" || unit.status === "running") && <p className="mt-8 animate-pulse">Reading your material and mapping the key concepts…</p>}
      {unit.status === "failed" && <p className="mt-8 text-red-600">Something went wrong: {unit.error}</p>}
      {unit.status === "ready" && unit.conceptMap && (
        <>
          <h2 className="mt-8 text-xl font-semibold">Concept Map</h2>
          <ConceptMapView map={unit.conceptMap} />
          <h2 className="mt-10 text-xl font-semibold">Arcade</h2>
          <Arcade unitId={id} available={["case", "escape", "impostor"]} />
        </>
      )}
    </main>
  );
}
