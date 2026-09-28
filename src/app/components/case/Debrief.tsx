import Link from "next/link";
import { Card, buttonClass } from "../ui";

export type AccuseResult = {
  correct: boolean; feedback: string | null; coaching: string; correctOptionId: string;
  steps: { step: string; concept_id: string; covered: boolean }[];
  solution: { summary: string };
};

export function Debrief({ result, outro, conceptName, unitId }: { result: AccuseResult; outro: string; conceptName: (id: string) => string; unitId: string }) {
  const covered = result.steps.filter((s) => s.covered).length;
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className={`text-sm font-medium ${result.correct ? "text-emerald-700" : "text-red-700"}`}>{result.correct ? "Case closed" : "Not the right call"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{result.correct ? outro : "The evidence pointed somewhere else."}</h1>
        {result.feedback && <p className="mt-3 text-zinc-700">{result.feedback}</p>}
      </div>
      <Card className="p-6">
        <div className="flex items-baseline justify-between"><h2 className="font-semibold">The science behind the case</h2><p className="text-sm tabular-nums text-zinc-500">You explained {covered} of {result.steps.length} steps</p></div>
        <p className="mt-2 text-zinc-700">{result.solution.summary}</p>
        <ol className="mt-5 space-y-4">
          {result.steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[24px_1fr] gap-3">
              <span className={`text-sm tabular-nums ${s.covered ? "text-emerald-700" : "text-zinc-400"}`}>{s.covered ? "✓" : i + 1}</span>
              <div><p className="text-zinc-800">{s.step}</p><p className="mt-0.5 text-sm text-zinc-500">{conceptName(s.concept_id)} · {s.covered ? "you explained this" : "worth reviewing"}</p></div>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-zinc-100 pt-4 text-sm text-zinc-700">{result.coaching}</p>
      </Card>
      <Link href={`/units/${unitId}`} className={buttonClass("primary", "lg", "w-full")}>Back to the unit</Link>
    </div>
  );
}
