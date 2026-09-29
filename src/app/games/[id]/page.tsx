"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePoll } from "@/app/components/usePoll";
import type { PublicGame } from "@/app/components/game/types";
import { CaseFilesGame } from "@/app/components/case/CaseFilesGame";
import { ImpostorStart } from "@/app/components/impostor/ImpostorStart";
import { EscapeRoomGame } from "@/app/components/escape/EscapeRoomGame";
import type { PublicEscapeContent } from "@/modes/escape/logic";
import type { PublicCaseContent } from "@/modes/case/redact";
import { Button, PageHeader, Spinner } from "@/app/components/ui";

const STEPS = ["Reading the concept map", "Designing puzzles around the concepts", "Writing clues and characters", "Checking that it can be solved", "Choosing artwork"];

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const game = usePoll<PublicGame>(`/api/games/${id}`, 3000);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [retrying, setRetrying] = useState(false);
  async function retry() {
    if (!game) return;
    setRetrying(true);
    const res = await fetch(`/api/units/${game.unitId}/games`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: game.mode }) });
    const json = await res.json();
    if (res.ok) router.push(`/games/${json.id}`); else setRetrying(false);
  }
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
          {game?.verifierReport && !game.verifierReport.ok && (
            <p className="mt-8 border-t border-zinc-200 pt-4 text-sm text-zinc-600">The playtester found {game.verifierReport.count} issue{game.verifierReport.count === 1 ? "" : "s"} in a draft. Fixing them before you play.</p>
          )}
        </main>
      </>
    );
  if (game.status === "failed" || !game.spec)
    return <><PageHeader /><main className="mx-auto max-w-md px-4 py-24"><h1 className="text-xl font-semibold">This game couldn&apos;t be built</h1><p className="mt-2 text-sm text-zinc-600">It didn&apos;t pass our quality checks, so we didn&apos;t show it to you. Building a new one usually works.</p><Button className="mt-6" disabled={retrying} onClick={retry}>{retrying ? "Starting…" : "Build a new one"}</Button></main></>;

  if (game.mode === "case") return <CaseFilesGame game={game as PublicGame<PublicCaseContent>} />;
  if (game.mode === "impostor") return <ImpostorStart game={game} />;
  if (game.mode === "escape") return <EscapeRoomGame game={game as PublicGame<PublicEscapeContent>} />;
  return <main className="p-8">Unknown game mode.</main>;
}
