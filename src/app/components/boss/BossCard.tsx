"use client";
import { useState } from "react";
import { useBoss } from "./useBoss";
import { BossHeader } from "./BossHeader";

export function BossCard({ unitId }: { unitId: string }) {
  const { data, refresh } = useBoss(unitId);
  const [date, setDate] = useState("");
  if (!data) return null;
  const { boss, attack, unit } = data;

  async function saveDate() {
    await fetch(`/api/units/${unitId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ testDate: date }) });
    refresh();
  }

  return (
    <section className="space-y-3">
      <BossHeader data={data} />
      {!unit.testDate && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="testdate">When is your test?</label>
          <input id="testdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border p-1" />
          <button disabled={!date} onClick={saveDate} className="rounded bg-stone-900 px-3 py-1 text-white disabled:opacity-40">Set</button>
        </div>
      )}
      {boss.shields.length > 0 && (
        <p className="text-sm text-stone-600">Shields (your weak spots): {boss.shields.map((s) => <span key={s.id} className="mr-1 inline-block rounded bg-rose-100 px-2 py-0.5 text-rose-800">{s.name}</span>)}</p>
      )}
      {attack.length > 0
        ? <a href={`/units/${unitId}/boss`} className="block rounded-xl bg-rose-700 p-3 text-center font-bold text-white">Daily attack · {attack.length} question{attack.length === 1 ? "" : "s"} due</a>
        : <p className="text-sm text-stone-500">{boss.defeated ? "Every concept mastered. Keep reviewing before the test." : "Play a game below to deal damage. Review questions appear here when concepts are due."}</p>}
    </section>
  );
}
