"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useBoss } from "@/app/components/boss/useBoss";
import { BossHeader } from "@/app/components/boss/BossHeader";
import { CheckCard } from "@/app/components/game/CheckCard";
import { Card, PageHeader, Spinner, buttonClass } from "@/app/components/ui";

export default function BossAttackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, refresh } = useBoss(id);
  const [attack, setAttack] = useState<NonNullable<typeof data>["attack"] | null>(null);
  if (data && !attack && data.attack.length) setAttack(data.attack); // freeze this session's questions so answered cards stay
  const questions = attack ?? data?.attack ?? [];

  return (
    <>
      <PageHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-24 pt-10">
        {!data ? (error ? <p className="text-red-700">{error}</p> : <Spinner />) : (
          <>
            <Card className="p-5"><BossHeader data={data} /></Card>
            <div><h1 className="text-2xl font-semibold tracking-tight">Daily review</h1>
              <p className="mt-1 text-zinc-600">Correct answers damage the boss. Concepts you miss come back sooner.</p></div>
            {questions.length === 0 && <p className="text-zinc-600">Nothing is due right now. Play a game to find new weak spots.</p>}
            {questions.map((q) => <CheckCard key={`${q.gameId}:${q.check.id}`} gameId={q.gameId} check={q.check} onAnswered={() => refresh()} />)}
            <Link href={`/units/${id}`} className={buttonClass("secondary", "md", "w-full")}>Back to the unit</Link>
          </>
        )}
      </main>
    </>
  );
}
