"use client";
import { use } from "react";
import type { ConceptMap } from "@/domain/concept-map";
import { ConceptMapView } from "@/app/components/ConceptMapView";
import { Arcade } from "@/app/components/Arcade";
import { usePoll } from "@/app/components/usePoll";
import { BossCard } from "@/app/components/boss/BossCard";
import { PageHeader, Spinner } from "@/app/components/ui";

type UnitView = { id: string; title: string; course: string; status: string; error: string | null; conceptMap: ConceptMap | null };

export default function UnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const unit = usePoll<UnitView>(`/api/units/${id}`);
  return (
    <>
      <PageHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10">
        {!unit ? <Spinner /> : !unit.status ? <p className="text-red-700">Could not load this unit: {unit.error ?? "unknown error"}</p> : (
          <>
            <p className="text-sm text-zinc-500">{unit.course}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{unit.title}</h1>
            {(unit.status === "queued" || unit.status === "running") && (
              <div className="mt-10 flex items-center gap-3 text-zinc-600"><Spinner />Reading your material and mapping the key concepts. This takes about a minute.</div>
            )}
            {unit.status === "failed" && <p className="mt-10 text-red-700">Something went wrong: {unit.error}</p>}
            {unit.status === "ready" && unit.conceptMap && (
              <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-10">
                  <section><h2 className="text-lg font-semibold">Play</h2><Arcade unitId={id} available={["case", "escape", "impostor"]} /></section>
                  <section><h2 className="text-lg font-semibold">Concept map</h2><ConceptMapView map={unit.conceptMap} /></section>
                </div>
                <aside className="lg:sticky lg:top-6 lg:self-start"><BossCard unitId={id} /></aside>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
