"use client";
import { useState } from "react";
import type { PublicCheck } from "@/domain/public-spec";
import type { PublicCaseContent } from "@/modes/case/redact";
import { deviceId } from "../device";
import { Button, inputClass } from "../ui";

/** Obra Dinn-style board: answers are only confirmed when enough of them are right at once. */
export function CaseBoard({ gameId, board, checks, evidenceTitle, confirmed, setConfirmed }: {
  gameId: string; board: PublicCaseContent["board"]; checks: PublicCheck[]; evidenceTitle: (id: string) => string | null;
  confirmed: string[]; setConfirmed: (ids: string[]) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hintsShown, setHintsShown] = useState<Record<string, number>>({});

  async function check() {
    setBusy(true);
    const pending = Object.fromEntries(Object.entries(answers).filter(([k, v]) => v !== "" && !confirmed.includes(k)));
    try {
      const res = await fetch(`/api/games/${gameId}/board`, { method: "POST", headers: { "content-type": "application/json", "x-device-id": deviceId() }, body: JSON.stringify({ answers: pending, confirmed }) });
      const json = await res.json().catch(() => ({ error: "Something went wrong. Try again." }));
      setMessage(json.message ?? json.error);
      if (json.confirmed?.length) setConfirmed([...confirmed, ...json.confirmed]);
    } catch {
      setMessage("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const filled = board.filter((r) => !confirmed.includes(r.id) && (answers[r.id] ?? "") !== "").length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">Answer these to build your case. Answers are only confirmed when at least two new ones are right, so reason it out rather than guessing.</p>
      <ol className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {board.map((row, i) => {
          const k = checks.find((c) => c.id === row.check_id);
          const done = confirmed.includes(row.id);
          const cites = row.evidence_ids.map(evidenceTitle).filter(Boolean);
          const missing = row.evidence_ids.length - cites.length;
          return (
            <li key={row.id} className="space-y-2 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium"><span className="mr-2 tabular-nums text-zinc-400">{i + 1}</span>{row.question}</p>
                {done && <span className="shrink-0 text-xs font-medium text-accent">Confirmed</span>}
              </div>
              {(cites.length > 0 || missing > 0) && (
                <p className="text-xs text-zinc-500">
                  {cites.length > 0 && <>Look at: {cites.join(", ")}</>}
                  {missing > 0 && <>{cites.length > 0 ? " · " : ""}needs {missing === 1 ? "a piece of evidence" : `${missing} pieces of evidence`} you haven&apos;t found yet</>}
                </p>
              )}
              {!done && k && (hintsShown[row.id] ?? 0) > 0 && (
                <ol className="space-y-1 text-sm text-zinc-700">{k.hints.slice(0, hintsShown[row.id]).map((h, j) => <li key={j}><span className="font-medium text-zinc-500">Hint {j + 1}.</span> {h}</li>)}</ol>
              )}
              {!done && k && (hintsShown[row.id] ?? 0) < 3 && (
                <button onClick={() => setHintsShown({ ...hintsShown, [row.id]: (hintsShown[row.id] ?? 0) + 1 })} className="block text-xs font-medium text-zinc-500 hover:text-zinc-900">{(hintsShown[row.id] ?? 0) === 0 ? "Get a hint" : "Another hint"}</button>
              )}
              {k?.kind === "choice" ? (
                <select disabled={done} value={answers[row.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [row.id]: e.target.value })} className={inputClass} aria-label={row.question}>
                  <option value="">Choose…</option>{k.options!.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input disabled={done} type="number" inputMode="decimal" value={answers[row.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [row.id]: e.target.value })} placeholder="Your answer" className={`${inputClass} max-w-40`} aria-label={row.question} />
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex items-center gap-3">
        <Button onClick={check} disabled={busy || filled === 0}>{busy ? "Checking…" : "Check board"}</Button>
        <p className="text-sm tabular-nums text-zinc-500">{confirmed.length} of {board.length} confirmed</p>
      </div>
      {message && <p className="text-sm text-zinc-700" aria-live="polite">{message}</p>}
    </div>
  );
}
