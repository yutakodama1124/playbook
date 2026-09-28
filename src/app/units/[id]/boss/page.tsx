"use client";
import { use, useState } from "react";
import { useBoss } from "@/app/components/boss/useBoss";
import { BossHeader } from "@/app/components/boss/BossHeader";
import { CheckCard } from "@/app/components/game/CheckCard";

export default function BossAttackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, refresh } = useBoss(id);
  const [attack, setAttack] = useState<NonNullable<typeof data>["attack"] | null>(null);
  if (!data) return <main className="p-8">{error ?? "Loading…"}</main>;
  const questions = attack ?? data.attack; // freeze the list for this session so answered cards stay visible
  if (!attack && data.attack.length) setAttack(data.attack);

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <BossHeader data={data} />
      <p className="text-stone-600">Each correct answer damages the boss. Missed concepts come back sooner — that&apos;s spaced repetition.</p>
      {questions.length === 0 && <p>Nothing due right now. Play a game to find new weak spots.</p>}
      {questions.map((q) => <CheckCard key={`${q.gameId}:${q.check.id}`} gameId={q.gameId} check={q.check} onAnswered={() => refresh()} />)}
      <a href={`/units/${id}`} className="block rounded-xl bg-stone-900 p-3 text-center font-semibold text-white">Back to the unit</a>
    </main>
  );
}
