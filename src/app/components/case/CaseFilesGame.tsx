"use client";
import { useState } from "react";
import type { PublicCaseContent } from "@/modes/case/redact";
import type { PublicGame } from "../game/types";
import { CheckCard } from "../game/CheckCard";
import { ChatPanel } from "./ChatPanel";
import { Debrief, type AccuseResult } from "./Debrief";
import { deviceId } from "../device";

type Turn = { role: "student" | "character"; text: string };
const THEME_LABEL = { mystery: "Case File", patient: "Patient File", system: "Incident File" } as const;
const ACCUSE_LABEL = { mystery: "Make an accusation", patient: "Make a diagnosis", system: "Name the root cause" } as const;

export function CaseFilesGame({ game }: { game: PublicGame<PublicCaseContent> }) {
  const spec = game.spec!;
  const c = spec.content;
  const [phase, setPhase] = useState<"briefing" | "investigate" | "debrief">("briefing");
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string[]>([]);
  const [active, setActive] = useState(c.characters.find((x) => !x.is_mentor)?.id ?? c.characters[0].id);
  const [chats, setChats] = useState<Record<string, Turn[]>>({});
  const [tab, setTab] = useState<"deduce" | "guide">("deduce");
  const [solved, setSolved] = useState<string[]>([]);
  const [accusing, setAccusing] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AccuseResult | null>(null);
  const scene = game.assets.scene;
  const conceptName = (id: string) => c.field_guide.find((f) => f.concept_id === id)?.title ?? id;

  async function accuse() {
    if (!choice) return;
    setBusy(true);
    const res = await fetch(`/api/games/${game.id}/accuse`, { method: "POST", headers: { "content-type": "application/json", "x-device-id": deviceId() }, body: JSON.stringify({ optionId: choice, justification: reason }) });
    setBusy(false);
    if (res.ok) { setResult(await res.json()); setAccusing(false); setPhase("debrief"); }
  }

  if (phase === "briefing")
    return (
      <main className="min-h-screen bg-stone-100">
        <div className="relative h-72 w-full overflow-hidden bg-stone-800">
          {scene && <img src={scene} alt="" className="h-full w-full object-cover opacity-70" />}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900 to-transparent p-6 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">{THEME_LABEL[c.theme]} · {c.setting}</p>
            <h1 className="mt-1 text-3xl font-bold">{spec.title}</h1>
          </div>
        </div>
        <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
          <p className="text-lg">{spec.intro}</p>
          <div className="rounded-xl border-l-4 border-amber-500 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Briefing</p>
            <p className="mt-1">{spec.briefing}</p>
          </div>
          <button onClick={() => setPhase("investigate")} className="w-full rounded-xl bg-stone-900 p-4 text-lg font-semibold text-white">Open the file</button>
        </div>
      </main>
    );

  if (phase === "debrief" && result)
    return <main className="min-h-screen bg-stone-100 px-4 py-10"><Debrief result={result} outro={spec.outro_win} conceptName={conceptName} unitId={game.unitId} /></main>;

  const activeChar = c.characters.find((x) => x.id === active)!;
  return (
    <main className="min-h-screen bg-stone-100 pb-24">
      <header className="flex items-center gap-4 border-b border-stone-300 bg-white px-4 py-3">
        {scene && <img src={scene} alt="" className="h-12 w-20 rounded object-cover" />}
        <div className="flex-1"><p className="text-xs uppercase tracking-wide text-amber-700">{THEME_LABEL[c.theme]}</p><h1 className="font-bold">{spec.title}</h1></div>
        <p className="text-sm text-stone-500">{solved.length}/{spec.checks.length} deductions</p>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1fr_1.1fr_1fr]">
        <section className="space-y-3">
          <div className="rounded-xl bg-[#fbf7ec] p-4 shadow-sm"><p className="text-xs font-semibold uppercase text-stone-500">The case</p><p className="mt-1 text-sm">{c.premise}</p></div>
          <p className="text-xs font-semibold uppercase text-stone-500">Evidence</p>
          {c.evidence.map((e) => (
            <div key={e.id} className={`rounded-xl border-2 bg-[#fbf7ec] ${pinned.includes(e.id) ? "border-amber-500" : "border-transparent"}`}>
              <button onClick={() => setOpenEvidence(openEvidence === e.id ? null : e.id)} className="flex w-full items-center justify-between p-3 text-left">
                <span className="font-medium">📄 {e.title}</span><span className="text-stone-400">{openEvidence === e.id ? "−" : "+"}</span>
              </button>
              {openEvidence === e.id && (
                <div className="space-y-2 px-3 pb-3 text-sm">
                  <p className="whitespace-pre-line">{e.text}</p>
                  <button onClick={() => setPinned(pinned.includes(e.id) ? pinned.filter((x) => x !== e.id) : [...pinned, e.id])} className="text-xs font-semibold text-amber-700">{pinned.includes(e.id) ? "Unpin" : "📌 Pin as key evidence"}</button>
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase text-stone-500">People</p>
          <div className="grid grid-cols-4 gap-2">
            {c.characters.map((ch) => (
              <button key={ch.id} onClick={() => setActive(ch.id)} className={`rounded-xl border-2 p-1 text-center ${active === ch.id ? "border-stone-900 bg-white" : "border-transparent"}`}>
                {game.assets[`portrait:${ch.id}`] ? <img src={game.assets[`portrait:${ch.id}`]} alt="" className="mx-auto aspect-square w-full rounded-lg object-cover" /> : <div className="aspect-square rounded-lg bg-stone-300" />}
                <p className="mt-1 truncate text-xs font-medium">{ch.name}</p>
                <p className="truncate text-[10px] text-stone-500">{ch.is_mentor ? "Mentor" : ch.role}</p>
              </button>
            ))}
          </div>
          <ChatPanel key={active} gameId={game.id} character={activeChar} portrait={game.assets[`portrait:${active}`]}
            turns={chats[active] ?? []} setTurns={(t) => setChats({ ...chats, [active]: t })} />
        </section>

        <section className="space-y-3">
          <div className="flex gap-2">
            {(["deduce", "guide"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-stone-900 text-white" : "bg-white"}`}>{t === "deduce" ? "Deductions" : "Field Guide"}</button>
            ))}
          </div>
          {tab === "deduce"
            ? spec.checks.map((ch) => <CheckCard key={ch.id} gameId={game.id} check={ch} onSolved={(id) => setSolved((s) => (s.includes(id) ? s : [...s, id]))} />)
            : c.field_guide.map((f) => (
                <div key={f.concept_id} className="rounded-xl bg-white p-4">
                  <p className="font-semibold">{f.title}</p><p className="mt-1 text-sm text-stone-700">{f.explanation}</p>
                  {f.source_ref && <p className="mt-1 text-xs text-stone-400">From your notes: {f.source_ref}</p>}
                </div>
              ))}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-300 bg-white/95 p-3">
        <button onClick={() => setAccusing(true)} className="mx-auto block w-full max-w-md rounded-xl bg-rose-700 p-3 font-bold text-white">{ACCUSE_LABEL[c.theme]}</button>
      </div>

      {accusing && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4" onClick={() => setAccusing(false)}>
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{c.accusation.prompt}</h2>
            <div className="grid gap-2">
              {c.accusation.options.map((o) => (
                <button key={o.id} onClick={() => setChoice(o.id)} className={`rounded-lg border-2 p-3 text-left ${choice === o.id ? "border-rose-700 bg-rose-50" : "border-stone-200"}`}>{o.label}</button>
              ))}
            </div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={2000}
              placeholder="Explain your reasoning using the science. Which evidence proves it, and why?" className="w-full rounded-lg border p-3 text-sm" />
            <button disabled={!choice || reason.trim().length < 15 || busy} onClick={accuse} className="w-full rounded-xl bg-rose-700 p-3 font-bold text-white disabled:opacity-40">{busy ? "The file is being reviewed…" : "Submit"}</button>
          </div>
        </div>
      )}
    </main>
  );
}
