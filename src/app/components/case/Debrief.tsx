export type AccuseResult = {
  correct: boolean; feedback: string | null; coaching: string; correctOptionId: string;
  steps: { step: string; concept_id: string; covered: boolean }[];
  solution: { summary: string };
};

export function Debrief({ result, outro, conceptName, unitId }: { result: AccuseResult; outro: string; conceptName: (id: string) => string; unitId: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className={`rounded-2xl p-6 ${result.correct ? "bg-teal-700 text-white" : "bg-rose-100 text-rose-900"}`}>
        <p className="text-sm uppercase tracking-wide opacity-80">{result.correct ? "Case closed" : "Wrong call"}</p>
        <p className="mt-1 text-2xl font-bold">{result.correct ? outro : "The real answer was elsewhere."}</p>
        {result.feedback && <p className="mt-3">{result.feedback}</p>}
      </div>
      <section className="rounded-2xl border-2 border-stone-300 bg-white p-6">
        <h2 className="text-lg font-bold">The science behind the case</h2>
        <p className="mt-2 text-stone-700">{result.solution.summary}</p>
        <ol className="mt-4 space-y-3">
          {result.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.covered ? "bg-teal-600 text-white" : "bg-stone-200 text-stone-600"}`}>{s.covered ? "✓" : i + 1}</span>
              <div><p>{s.step}</p><p className="text-xs text-stone-500">{conceptName(s.concept_id)}{s.covered ? " — you explained this" : " — review this"}</p></div>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm">{result.coaching}</p>
      </section>
      <a href={`/units/${unitId}`} className="block rounded-xl bg-stone-900 p-3 text-center font-semibold text-white">Back to the Arcade</a>
    </div>
  );
}
