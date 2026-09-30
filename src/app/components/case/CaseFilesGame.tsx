"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { PublicCaseContent } from "@/modes/case/redact";
import type { PublicEvidence } from "@/modes/case/trial";
import type { PublicGame } from "../game/types";
import { Hud, Stamp, Typewriter, useFloatingPoints } from "../game/Juice";
import { deviceId } from "../device";
import { buttonClass } from "../ui";

const MAX_HEARTS = 5;
type Line = { who: string; text: string; tone?: "witness" | "mentor" | "system" };
type Verdict = {
  correct: boolean; proofCorrect: boolean; feedback: string | null;
  correctOptionId?: string; proofEvidenceId?: string; explanation?: string;
  contradictions?: { statement: string; explanation: string; conceptId: string }[];
};

export function CaseFilesGame({ game }: { game: PublicGame<PublicCaseContent> }) {
  const spec = game.spec!;
  // Cases generated before the trial update have a different shape and can't be played here.
  if (!spec.content.testimonies) return <Legacy unitId={game.unitId} />;
  return <Trial game={game} />;
}

function Trial({ game }: { game: PublicGame<PublicCaseContent> }) {
  const spec = game.spec!;
  const c = spec.content;
  const mentor = c.characters.find((x) => x.is_mentor);
  const [phase, setPhase] = useState<"briefing" | "testimony" | "finale" | "end">("briefing");
  const [ti, setTi] = useState(0);
  const [si, setSi] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [evidence, setEvidence] = useState<PublicEvidence[]>(c.evidence);
  const [fresh, setFresh] = useState<string[]>([]);
  const [pressed, setPressed] = useState<string[]>([]);
  const [line, setLine] = useState<Line | null>(null); // overrides the statement in the speech box
  const [drawer, setDrawer] = useState<null | "view" | "present" | "proof">(null);
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({});
  const [cleared, setCleared] = useState<{ explanation: string; breakthrough: string; conceptId: string } | null>(null);
  const [stamp, setStamp] = useState<{ text: string; tone: "red" | "green" | "white" } | null>(null);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [suspect, setSuspect] = useState<string | null>(null);
  const [result, setResult] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const floating = useFloatingPoints();
  const clearStamp = useCallback(() => setStamp(null), []);

  const t = c.testimonies[ti];
  const statement = t?.statements[si];
  const witness = c.characters.find((x) => x.id === t?.witness_id);
  const hints = hintsUsed[t?.id] ?? 0;
  const conceptName = (id: string) => c.field_guide.find((f) => f.concept_id === id)?.title ?? "the key idea";
  const portrait = (id?: string | null) => (id ? game.assets[`portrait:${id}`] : undefined);
  const scene = game.assets.scene;

  async function call(body: Record<string, unknown>) {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/games/${game.id}/trial`, { method: "POST", headers: { "content-type": "application/json", "x-device-id": deviceId() }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) throw new Error(json?.error ?? "error");
      return json;
    } catch {
      setError("Couldn't reach the court. Try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function loseHeart(mentorLine: string) {
    const left = hearts - 1;
    setHearts(left); setStreak(0); setShake((n) => n + 1);
    setLine({ who: mentor?.name ?? "Partner", text: mentorLine, tone: "mentor" });
    if (left <= 0) void finish(true);
  }

  async function doPress() {
    if (!statement) return;
    const r = await call({ action: "press", testimonyId: t.id, statementId: statement.id });
    if (!r) return;
    setPressed((p) => [...new Set([...p, statement.id])]);
    const added = (r.unlocked as PublicEvidence[]).filter((e) => !evidence.some((x) => x.id === e.id));
    if (added.length) {
      setEvidence((xs) => [...xs, ...added]);
      setFresh((f) => [...f, ...added.map((e) => e.id)]);
      setStamp({ text: "New evidence", tone: "white" });
    }
    setLine({ who: witness?.name ?? "Witness", text: r.reply, tone: "witness" });
  }

  async function doPresent(e: PublicEvidence) {
    setDrawer(null);
    const r = await call({ action: "present", testimonyId: t.id, statementId: statement.id, evidenceId: e.id });
    if (!r) return;
    if (r.correct) {
      const pts = Math.max(100, 300 - hints * 75) + streak * 50;
      setScore((s) => s + pts); setStreak((s) => s + 1); floating.show(pts);
      setStamp({ text: "Objection!", tone: "red" });
      const added = (r.unlocked as PublicEvidence[]).filter((x) => !evidence.some((y) => y.id === x.id));
      if (added.length) { setEvidence((xs) => [...xs, ...added]); setFresh((f) => [...f, ...added.map((x) => x.id)]); }
      setCleared({ explanation: r.explanation, breakthrough: r.breakthrough, conceptId: r.conceptId });
    } else {
      loseHeart(`"${e.title}" doesn't break that line. Ask yourself: if they were telling the truth, what would the evidence show?`);
    }
  }

  function nextTestimony() {
    setCleared(null); setLine(null); setSi(0);
    if (ti + 1 < c.testimonies.length) setTi(ti + 1);
    else setPhase("finale");
  }

  function hint() {
    const n = Math.min(3, hints + 1);
    setHintsUsed((h) => ({ ...h, [t.id]: n }));
    setLine({ who: mentor?.name ?? "Partner", text: t.hints[n - 1], tone: "mentor" });
  }

  async function accuse(e: PublicEvidence) {
    setDrawer(null);
    if (!suspect) return;
    const r: Verdict | null = await call({ action: "verdict", optionId: suspect, evidenceId: e.id });
    if (!r) return;
    if (r.correct && r.proofCorrect) {
      const pts = 500 + hearts * 100;
      setScore((s) => s + pts); floating.show(pts);
      setResult(r); setStamp({ text: "Case closed", tone: "green" });
      setTimeout(() => setPhase("end"), 1300);
    } else if (r.correct) {
      loseHeart(`You've got the right person, but "${e.title}" doesn't prove it. Which evidence ties them to it?`);
    } else {
      loseHeart(r.feedback ?? "That doesn't hold up. Look at the evidence again.");
      setSuspect(null);
    }
  }

  async function finish(outOfLives: boolean) {
    if (!outOfLives) return;
    const r = await call({ action: "verdict", optionId: c.finale.options[0].id, evidenceId: "", reveal: true });
    if (r) setResult({ ...r, correct: false, proofCorrect: false });
    setStamp({ text: "Out of lives", tone: "red" });
    setTimeout(() => setPhase("end"), 1300);
  }

  function restart() {
    setPhase("briefing"); setTi(0); setSi(0); setHearts(MAX_HEARTS); setScore(0); setStreak(0);
    setEvidence(c.evidence); setFresh([]); setPressed([]); setLine(null); setHintsUsed({}); setCleared(null); setSuspect(null); setResult(null);
  }

  const shell = (children: React.ReactNode, hud = true) => (
    <div className="relative min-h-dvh overflow-hidden bg-zinc-950 text-white">
      {scene && <img src={scene} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/80" />
      <div className="relative flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href={`/units/${game.unitId}`} className="text-sm font-semibold text-white/70 hover:text-white">Playbook</Link>
          {hud && <Hud hearts={hearts} maxHearts={MAX_HEARTS} score={score} streak={streak} />}
        </header>
        {children}
      </div>
      {stamp && <Stamp text={stamp.text} tone={stamp.tone} onDone={clearStamp} />}
      {floating.node}
    </div>
  );

  if (phase === "briefing")
    return shell(
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 pb-16">
        <p className="text-sm font-semibold text-amber-300">Case file · {c.setting}</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{spec.title}</h1>
        {spec.hook && <p className="mt-6 text-2xl font-semibold leading-snug">{spec.hook}</p>}
        <p className="mt-4 text-lg leading-relaxed text-white/80">{c.premise}</p>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-[15px] leading-relaxed text-white/80">
          <p className="font-semibold text-white">How to play</p>
          <p className="mt-1">Each witness gives testimony. One line is a lie. <b className="text-white">Press</b> lines to dig for details and new evidence. When you spot the lie, <b className="text-white">present</b> the evidence that proves it. Wrong calls cost a heart.</p>
        </div>
        <button className="mt-8 h-14 rounded-xl bg-amber-400 text-lg font-black text-zinc-950 transition hover:bg-amber-300" onClick={() => setPhase("testimony")}>Start the trial</button>
      </main>,
      false,
    );

  if (phase === "end") return shell(End());

  if (phase === "finale")
    return shell(
      <main key={shake} className={`mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-4 ${shake ? "pb-shake" : ""}`}>
        <p className="text-sm font-semibold text-amber-300">Final verdict</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight">{c.finale.question}</h2>
        <p className="mt-2 text-white/70">Pick who did it, then present the one piece of evidence that proves it.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {c.finale.options.map((o) => {
            const pic = portrait(o.character_id);
            const on = suspect === o.id;
            return (
              <button key={o.id} onClick={() => setSuspect(o.id)} aria-pressed={on}
                className={`overflow-hidden rounded-xl border-2 bg-black/40 text-left transition ${on ? "border-amber-400 ring-4 ring-amber-400/30" : "border-white/10 hover:border-white/40"}`}>
                {pic ? <img src={pic} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-white/5" />}
                <p className="p-3 text-sm font-semibold leading-tight">{o.label}</p>
              </button>
            );
          })}
        </div>
        {line && <Speech line={line} pic={portrait(mentor?.id)} />}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button disabled={!suspect || busy} onClick={() => setDrawer("proof")} className="h-14 flex-1 rounded-xl bg-red-600 text-lg font-black uppercase tracking-wide transition hover:bg-red-500 disabled:opacity-40">Present proof</button>
          <button onClick={() => setDrawer("view")} className="h-14 rounded-xl border border-white/20 px-5 font-semibold hover:bg-white/10">Evidence ({evidence.length})</button>
        </div>
        {drawer && <Drawer mode={drawer} items={evidence} fresh={fresh} onClose={() => setDrawer(null)} onPick={accuse} />}
      </main>,
    );

  // Testimony
  const speech: Line = line ?? { who: witness?.name ?? "Witness", text: statement.text, tone: "witness" };
  return shell(
    <main key={shake} className={`relative flex flex-1 flex-col ${shake ? "pb-shake" : ""}`}>
      <div className="px-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Testimony {ti + 1} of {c.testimonies.length}</p>
        <h2 className="text-xl font-black tracking-tight md:text-2xl">{t.title}</h2>
      </div>

      <div className="relative flex flex-1 items-end justify-center">
        {portrait(speech.tone === "mentor" ? mentor?.id : witness?.id)
          ? <img key={speech.tone} src={portrait(speech.tone === "mentor" ? mentor?.id : witness?.id)} alt="" className="pb-rise max-h-[34vh] w-auto rounded-t-2xl object-cover shadow-2xl md:max-h-[50vh]" />
          : <div className="h-48 w-40 rounded-t-2xl bg-white/5" />}
      </div>

      <div className="mx-auto w-full max-w-3xl px-3 pb-4">
        {cleared ? (
          <div className="pb-pop rounded-2xl border-2 border-emerald-400/60 bg-zinc-950/95 p-5">
            <p className="text-sm font-bold text-emerald-300">{witness?.name}</p>
            <p className="mt-1 text-lg font-semibold leading-snug">&ldquo;{cleared.breakthrough}&rdquo;</p>
            <div className="mt-4 rounded-xl bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Why it was a lie · {conceptName(cleared.conceptId)}</p>
              <p className="mt-1 leading-relaxed text-white/85">{cleared.explanation}</p>
            </div>
            <button onClick={nextTestimony} className="mt-4 h-12 w-full rounded-xl bg-emerald-400 font-black text-zinc-950 hover:bg-emerald-300">
              {ti + 1 < c.testimonies.length ? "Next witness" : "Go to the verdict"}
            </button>
          </div>
        ) : (
          <>
            <Speech line={speech} onClick={line ? () => setLine(null) : undefined} />
            <div className="mt-2 flex items-center justify-between">
              <button aria-label="Previous statement" disabled={si === 0} onClick={() => { setSi(si - 1); setLine(null); }} className="h-11 w-11 rounded-full border border-white/20 text-xl disabled:opacity-30">‹</button>
              <div className="flex gap-1.5" aria-label={`Statement ${si + 1} of ${t.statements.length}`}>
                {t.statements.map((s, i) => (
                  <button key={s.id} aria-label={`Statement ${i + 1}`} onClick={() => { setSi(i); setLine(null); }}
                    className={`h-2.5 rounded-full transition-all ${i === si ? "w-8 bg-amber-400" : pressed.includes(s.id) ? "w-2.5 bg-white/60" : "w-2.5 bg-white/25"}`} />
                ))}
              </div>
              <button aria-label="Next statement" disabled={si === t.statements.length - 1} onClick={() => { setSi(si + 1); setLine(null); }} className="h-11 w-11 rounded-full border border-white/20 text-xl disabled:opacity-30">›</button>
            </div>
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
              <button disabled={busy} onClick={doPress} className="h-14 rounded-xl bg-sky-500 text-lg font-black uppercase tracking-wide hover:bg-sky-400 disabled:opacity-50">Press</button>
              <button disabled={busy} onClick={() => setDrawer("present")} className="h-14 rounded-xl bg-red-600 text-lg font-black uppercase tracking-wide hover:bg-red-500 disabled:opacity-50">Present</button>
              <button onClick={() => { setDrawer("view"); setFresh([]); }} className="relative h-12 rounded-xl border border-white/20 px-4 font-semibold sm:h-14 hover:bg-white/10">
                Evidence{fresh.length > 0 && <span className="pb-pop absolute -right-1 -top-1 rounded-full bg-amber-400 px-1.5 text-xs font-black text-zinc-950">{fresh.length}</span>}
              </button>
              <button disabled={hints >= 3} onClick={hint} className="h-12 rounded-xl border border-white/20 px-4 font-semibold hover:bg-white/10 disabled:opacity-40 sm:h-14">Hint {hints}/3</button>
            </div>
          </>
        )}
      </div>
      {drawer && <Drawer mode={drawer} items={evidence} fresh={fresh} onClose={() => setDrawer(null)} onPick={doPresent} statement={drawer === "present" ? statement.text : undefined} />}
    </main>,
  );

  function End() {
    const won = !!result?.correct;
    const hintTotal = Object.values(hintsUsed).reduce((a, b) => a + b, 0);
    const grade = !won ? "–" : hearts === MAX_HEARTS && hintTotal === 0 ? "S" : hearts >= 4 ? "A" : hearts >= 2 ? "B" : "C";
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-6">
        <h1 className={`text-5xl font-black tracking-tight ${won ? "text-emerald-300" : "text-red-300"}`}>{won ? "Case closed" : "Case lost"}</h1>
        <p className="mt-4 text-lg leading-relaxed text-white/85">{won ? spec.outro_win : spec.outro_lose}</p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Stat label="Rank" value={grade} />
          <Stat label="Score" value={score.toLocaleString()} />
          <Stat label="Hints" value={String(hintTotal)} />
        </div>
        {result?.explanation && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold">What really happened</p>
            <p className="mt-1 leading-relaxed text-white/80">{result.explanation}</p>
          </div>
        )}
        {result?.contradictions && (
          <div className="mt-4 space-y-3">
            <p className="font-semibold">The lies, and the science that broke them</p>
            {result.contradictions.map((k, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm text-white/60 line-through decoration-red-400">&ldquo;{k.statement}&rdquo;</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-300">{conceptName(k.conceptId)}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-white/85">{k.explanation}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 flex gap-3">
          <button onClick={restart} className="h-12 flex-1 rounded-xl bg-amber-400 font-black text-zinc-950 hover:bg-amber-300">Play again</button>
          <Link href={`/units/${game.unitId}`} className="flex h-12 flex-1 items-center justify-center rounded-xl border border-white/20 font-semibold hover:bg-white/10">Back to unit</Link>
        </div>
      </main>
    );
  }
}

function Speech({ line, pic, onClick }: { line: Line; pic?: string; onClick?: () => void }) {
  const border = line.tone === "mentor" ? "border-sky-400/60" : "border-white/15";
  return (
    <div onClick={onClick} className={`mt-4 flex gap-3 rounded-2xl border-2 ${border} bg-zinc-950/90 p-4 backdrop-blur ${onClick ? "cursor-pointer" : ""}`}>
      {pic && <img src={pic} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0">
        <p className={`text-sm font-bold ${line.tone === "mentor" ? "text-sky-300" : "text-amber-300"}`}>{line.who}</p>
        <p className="mt-1 min-h-[3.5rem] text-lg font-medium leading-snug md:text-xl" aria-live="polite"><Typewriter key={line.text} text={line.text} /></p>
        {onClick && <p className="mt-1 text-xs text-white/40">Tap to go back to the testimony</p>}
      </div>
    </div>
  );
}

function Drawer({ mode, items, fresh, onClose, onPick, statement }: { mode: "view" | "present" | "proof"; items: PublicEvidence[]; fresh: string[]; onClose: () => void; onPick: (e: PublicEvidence) => void; statement?: string }) {
  const picking = mode !== "view";
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div role="dialog" aria-label="Evidence" onClick={(e) => e.stopPropagation()} className="pb-rise max-h-[85dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-white/10 bg-zinc-900 p-4 md:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black">{mode === "present" ? "Present evidence" : mode === "proof" ? "Present your proof" : "Evidence"}</p>
            {statement && <p className="mt-1 text-sm text-white/60">Against: &ldquo;{statement}&rdquo;</p>}
          </div>
          <button onClick={onClose} className="h-9 rounded-lg px-3 text-sm text-white/70 hover:bg-white/10">Close</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((e) => (
            <div key={e.id} className={`rounded-xl border bg-zinc-950 p-4 ${fresh.includes(e.id) ? "pb-pop border-amber-400" : "border-white/10"}`}>
              <p className="font-bold">{e.title}{fresh.includes(e.id) && <span className="ml-2 text-xs font-black text-amber-300">NEW</span>}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">{e.detail}</p>
              <p className="mt-2 rounded-md bg-amber-400/10 px-2 py-1 text-sm font-semibold text-amber-200">{e.key_fact}</p>
              {picking && <button onClick={() => onPick(e)} className="mt-3 h-10 w-full rounded-lg bg-red-600 text-sm font-black uppercase tracking-wide hover:bg-red-500">Present this</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Legacy({ unitId }: { unitId: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-white">
      <p className="text-2xl font-black">This case uses an old format.</p>
      <p className="max-w-md text-white/70">Case Files is now a courtroom game. Build a fresh case from your unit to play it.</p>
      <Link href={`/units/${unitId}`} className={buttonClass("secondary", "lg")}>Back to unit</Link>
    </main>
  );
}
