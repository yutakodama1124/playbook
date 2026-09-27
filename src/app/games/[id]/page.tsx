"use client";
import { use, useEffect, useState } from "react";
import { usePoll } from "@/app/components/usePoll";
import type { PublicGame } from "@/app/components/game/types";
import { CaseFilesGame } from "@/app/components/case/CaseFilesGame";
import { ImpostorStart } from "@/app/components/impostor/ImpostorStart";
import { CheckCard } from "@/app/components/game/CheckCard";
import type { PublicCaseContent } from "@/modes/case/redact";

const STEPS = ["Reading your Concept Map…", "Designing the puzzle around the concepts…", "Hiding the clues…", "Checking the case can be solved…", "Painting the scene…"];

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const game = usePoll<PublicGame>(`/api/games/${id}`, 3000);
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 12000); return () => clearInterval(t); }, []);

  if (!game || game.status === "queued" || game.status === "running")
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-100 p-8 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900" />
        <p className="text-lg font-medium">{STEPS[step]}</p>
        <p className="text-sm text-stone-500">Every game is built from your material and verified before you play. This takes about a minute.</p>
      </main>
    );
  if (game.status === "failed" || !game.spec) return <main className="p-8 text-rose-700">This game could not be built: {game.error ?? "unknown error"}</main>;

  if (game.mode === "case") return <CaseFilesGame game={game as PublicGame<PublicCaseContent>} />;
  if (game.mode === "impostor") return <ImpostorStart game={game} />;
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-bold">{game.spec.title}</h1>
      <p>{game.spec.intro}</p>
      {game.spec.checks.map((c) => <CheckCard key={c.id} gameId={game.id} check={c} />)}
    </main>
  );
}
