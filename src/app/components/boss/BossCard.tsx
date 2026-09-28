"use client";
import { useState } from "react";
import { useBoss } from "./useBoss";
import { BossHeader } from "./BossHeader";
import { Button, Card, Label, buttonClass, inputClass } from "../ui";

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
    <Card className="space-y-5 p-5">
      <BossHeader data={data} />
      {!unit.testDate && (
        <div className="space-y-1.5">
          <Label>When is your test?</Label>
          <div className="flex gap-2"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} /><Button variant="secondary" disabled={!date} onClick={saveDate}>Set</Button></div>
        </div>
      )}
      <div>
        <Label>Mastery</Label>
        <ul className="mt-2 space-y-2">
          {boss.concepts.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="flex justify-between gap-3"><span className="truncate text-zinc-700">{c.name}</span><span className="tabular-nums text-zinc-500">{c.mastery}%</span></div>
              <div className="mt-1 h-1 rounded bg-zinc-100"><div className="h-full rounded bg-accent" style={{ width: `${c.mastery}%` }} /></div>
            </li>
          ))}
        </ul>
        {boss.shields.length > 0 && <p className="mt-3 text-xs text-zinc-500">Concepts under 40% act as shields: the boss can&apos;t fall until you raise them.</p>}
      </div>
      {attack.length > 0
        ? <a href={`/units/${unitId}/boss`} className={buttonClass("primary", "md", "w-full")}>Daily review · {attack.length} question{attack.length === 1 ? "" : "s"}</a>
        : <p className="text-sm text-zinc-500">{boss.defeated ? "Every concept is mastered. Keep reviewing until test day." : "Play a game to start dealing damage. Review questions appear here when concepts are due."}</p>}
    </Card>
  );
}
