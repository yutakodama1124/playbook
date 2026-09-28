"use client";
import { use, useEffect, useState } from "react";
import { usePoll } from "@/app/components/usePoll";
import type { PublicGame } from "@/app/components/game/types";
import { CaseFilesGame } from "@/app/components/case/CaseFilesGame";
import { ImpostorStart } from "@/app/components/impostor/ImpostorStart";
import { EscapeRoomGame } from "@/app/components/escape/EscapeRoomGame";
import type { PublicEscapeContent } from "@/modes/escape/logic";
import type { PublicCaseContent } from "@/modes/case/redact";
import { PageHeader, Spinner } from "@/app/components/ui";

const STEPS = ["Reading the concept map", "Designing puzzles around the concepts", "Writing clues and characters", "Checking that it can be solved", "Choosing artwork"];

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const game = usePoll<PublicGame>(`/api/games/${id}`, 3000);
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 15000); return () => clearInterval(t); }, []);

  if (!game || game.status === "queued" || game.status === "running")
    return (
      <>
        <PageHeader />
        <main className="mx-auto max-w-md px-4 py-24">
          <h1 className="text-xl font-semibold">Building your game</h1>
          <p className="mt-1 text-sm text-zinc-500">Every game is generated from your material and verified before you play. This usually takes one to three minutes.</p>
          <ol className="mt-8 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 text-sm ${i < step ? "text-zinc-400" : i === step ? "font-medium text-zinc-900" : "text-zinc-300"}`}>
                {i === step ? <Spinner /> : <span className="inline-block h-4 w-4 text-center text-xs">{i < step ? "✓" : ""}</span>}{s}
              </li>
            ))}
          </ol>
        </main>
      </>
    );
  if (game.status === "failed" || !game.spec)
    return <><PageHeader /><main className="mx-auto max-w-md px-4 py-24"><h1 className="text-xl font-semibold">This game couldn&apos;t be built</h1><p className="mt-2 text-sm text-zinc-600">{game.error ?? "Unknown error"}</p></main></>;

  if (game.mode === "case") return <CaseFilesGame game={game as PublicGame<PublicCaseContent>} />;
  if (game.mode === "impostor") return <ImpostorStart game={game} />;
  if (game.mode === "escape") return <EscapeRoomGame game={game as PublicGame<PublicEscapeContent>} />;
  return <main className="p-8">Unknown game mode.</main>;
}
