"use client";
import { useState } from "react";
import type { PublicCaseContent } from "@/modes/case/redact";
import type { PublicGame } from "../game/types";
import { ChatPanel, type Evidence } from "./ChatPanel";
import { CaseBoard } from "./CaseBoard";
import { CheckCard } from "../game/CheckCard";
import { Debrief, type AccuseResult } from "./Debrief";
import { deviceId } from "../device";
import { Button, Card, Label, PageHeader, inputClass } from "../ui";

type Turn = { role: "student" | "character" | "system"; text: string };
const FILE_LABEL = { mystery: "Case file", patient: "Patient file", system: "Incident report" } as const;
const ACCUSE_LABEL = { mystery: "Make an accusation", patient: "Make a diagnosis", system: "Name the root cause" } as const;

export function CaseFilesGame({ game }: { game: PublicGame<PublicCaseContent> }) {
  const spec = game.spec!;
  // Games generated before the case-board update have no board/leads: fall back to deduction cards.
  const c = { ...spec.content, board: spec.content.board ?? [], leads: spec.content.leads ?? [] };
  const legacy = c.board.length === 0;
  const [phase, setPhase] = useState<"briefing" | "investigate" | "debrief">("briefing");
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string[]>([]);
  const [active, setActive] = useState(c.characters.find((x) => !x.is_mentor)?.id ?? c.characters[0].id);
  const [chats, setChats] = useState<Record<string, Turn[]>>({});
  const [tab, setTab] = useState<"board" | "guide">("board");
  const [pane, setPane] = useState<"evidence" | "people" | "board">("evidence"); // phone layout: one pane at a time
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [found, setFound] = useState<Evidence[]>([]);
  const [accusing, setAccusing] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AccuseResult | null>(null);
  const [accuseError, setAccuseError] = useState<string | null>(null);
  const scene = game.assets.scene;
  const conceptName = (id: string) => c.field_guide.find((f) => f.concept_id === id)?.title ?? id;
  const evidence = [...c.evidence, ...found.filter((f) => !c.evidence.some((e) => e.id === f.id))];
  const evidenceTitle = (id: string) => evidence.find((e) => e.id === id)?.title ?? null;
  const openLeads = c.leads.filter((l) => !found.some((f) => f.id === l.evidence_id));
  const charName = (id: string) => c.characters.find((x) => x.id === id)?.name ?? "someone";
  const boardDone = legacy || confirmed.length === c.board.length; // the accusation is the payoff of a solved board

  async function accuse() {
    if (!choice) return;
    setBusy(true); setAccuseError(null);
    try {
      const res = await fetch(`/api/games/${game.id}/accuse`, { method: "POST", headers: { "content-type": "application/json", "x-device-id": deviceId() }, body: JSON.stringify({ optionId: choice, justification: reason }) });
      const json = await res.json().catch(() => null);
      if (res.ok && json) { setResult(json); setAccusing(false); setPhase("debrief"); }
      else setAccuseError(json?.error ?? "Your reasoning couldn't be reviewed. Try again.");
    } catch {
      setAccuseError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "briefing")
    return (
      <>
        <PageHeader />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
          {scene && <img src={scene} alt={c.setting} className="aspect-[21/9] w-full rounded-xl border border-zinc-200 object-cover" />}
          <p className="mt-8 text-sm text-zinc-500">{FILE_LABEL[c.theme]} · {c.setting}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{spec.title}</h1>
          {spec.hook && <p className="mt-6 text-2xl font-medium leading-snug text-zinc-900">{spec.hook}</p>}
          <p className="mt-4 text-lg leading-relaxed text-zinc-700">{spec.intro}</p>
          <div className="mt-8 border-t border-zinc-200 pt-6"><Label>Briefing</Label><p className="mt-2 leading-relaxed text-zinc-700">{spec.briefing}</p></div>
          <Button size="lg" className="mt-8 w-full" onClick={() => setPhase("investigate")}>Open the file</Button>
        </main>
      </>
    );

  if (phase === "debrief" && result)
    return <><PageHeader /><main className="px-4 pb-24 pt-10"><Debrief result={result} outro={spec.outro_win} conceptName={conceptName} unitId={game.unitId} /></main></>;

  const activeChar = c.characters.find((x) => x.id === active)!;
  return (
    <>
      <PageHeader>
        <span className="hidden text-sm tabular-nums text-zinc-500 sm:inline">{legacy ? `${evidence.length} evidence` : `${confirmed.length} of ${c.board.length} confirmed · ${evidence.length} evidence`}</span>
        <Button variant="danger" size="sm" disabled={!boardDone} title={boardDone ? undefined : "Confirm the case board first"} onClick={() => setAccusing(true)}>{ACCUSE_LABEL[c.theme]}</Button>
      </PageHeader>
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6">
        <div className="flex items-center gap-4">
          {scene && <img src={scene} alt="" className="hidden h-14 w-24 rounded-lg border border-zinc-200 object-cover sm:block" />}
          <div><p className="text-sm text-zinc-500">{FILE_LABEL[c.theme]}</p><h1 className="text-xl font-semibold tracking-tight">{spec.title}</h1></div>
        </div>

        <div className="mt-5 grid grid-cols-3 rounded-lg border border-zinc-200 bg-white p-0.5 lg:hidden" role="tablist">
          {(["evidence", "people", "board"] as const).map((p) => (
            <button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={`rounded-md py-2 text-sm font-medium capitalize ${pane === p ? "bg-zinc-950 text-white" : "text-zinc-600"}`}>{p}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr_1fr]">
          <section className={`space-y-4 ${pane === "evidence" ? "" : "hidden"} lg:block`}>
            <Card className="p-4"><Label>Summary</Label><p className="mt-1.5 text-sm leading-relaxed text-zinc-700">{c.premise}</p></Card>
            <div>
              <Label>Evidence</Label>
              <ul className="mt-2 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
                {evidence.map((e) => (
                  <li key={e.id}>
                    <button onClick={() => setOpenEvidence(openEvidence === e.id ? null : e.id)} aria-expanded={openEvidence === e.id} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm">
                      <span className="font-medium">{e.title}</span>
                      <span className="shrink-0 text-xs text-zinc-400">{pinned.includes(e.id) ? "Key evidence" : openEvidence === e.id ? "Close" : "Read"}</span>
                    </button>
                    {openEvidence === e.id && (
                      <div className="space-y-3 px-4 pb-4 text-sm">
                        <p className="whitespace-pre-line leading-relaxed text-zinc-700">{e.text}</p>
                        <Button variant="secondary" size="sm" onClick={() => setPinned(pinned.includes(e.id) ? pinned.filter((x) => x !== e.id) : [...pinned, e.id])}>{pinned.includes(e.id) ? "Unmark" : "Mark as key evidence"}</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {openLeads.length > 0 && (
              <div>
                <Label>Leads</Label>
                <ul className="mt-2 space-y-1.5 text-sm text-zinc-600">
                  {/* Who, not what: the student has to work out the right question. */}
                  {[...new Set(openLeads.map((l) => l.character_id))].map((cid) => <li key={cid}><button onClick={() => { setActive(cid); setPane("people"); }} className="text-left hover:text-zinc-900"><span className="font-medium text-zinc-900">{charName(cid)}</span> knows more than they&apos;ve said. Ask the right question.</button></li>)}
                </ul>
              </div>
            )}
          </section>

          <section className={`space-y-4 ${pane === "people" ? "" : "hidden"} lg:block`}>
            <Label>People</Label>
            <div className="grid grid-cols-4 gap-2">
              {c.characters.map((ch) => (
                <button key={ch.id} onClick={() => setActive(ch.id)} aria-pressed={active === ch.id} className={`rounded-lg border p-1.5 text-left transition-colors ${active === ch.id ? "border-zinc-900 bg-white" : "border-transparent hover:border-zinc-200"}`}>
                  {game.assets[`portrait:${ch.id}`] ? <img src={game.assets[`portrait:${ch.id}`]} alt={`Portrait of ${ch.name}`} className="aspect-square w-full rounded-md object-cover" /> : <div className="aspect-square rounded-md bg-zinc-100" />}
                  <p className="mt-1.5 truncate text-xs font-medium">{ch.name}</p>
                  <p className="truncate text-[11px] text-zinc-500">{ch.is_mentor ? "Mentor" : ch.role}</p>
                </button>
              ))}
            </div>
            <ChatPanel key={active} gameId={game.id} character={activeChar} portrait={game.assets[`portrait:${active}`]}
              turns={chats[active] ?? []} setTurns={(t) => setChats((prev) => ({ ...prev, [active]: t }))}
              onUnlocked={(ev) => setFound((prev) => [...prev, ...ev.filter((e) => !prev.some((p) => p.id === e.id))])} />
          </section>

          <section className={`space-y-4 ${pane === "board" ? "" : "hidden"} lg:block`}>
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5" role="tablist">
              {(["board", "guide"] as const).map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-900"}`}>{t === "board" ? "Case board" : "Field guide"}</button>
              ))}
            </div>
            {tab === "board" && legacy
              ? spec.checks.map((ch) => <CheckCard key={ch.id} gameId={game.id} check={ch} />)
              : tab === "board"
              ? <CaseBoard gameId={game.id} board={c.board} checks={spec.checks} evidenceTitle={evidenceTitle} confirmed={confirmed} setConfirmed={setConfirmed} />
              : <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">{c.field_guide.map((f) => (
                  <li key={f.concept_id} className="p-4"><p className="font-medium">{f.title}</p><p className="mt-1 text-sm leading-relaxed text-zinc-600">{f.explanation}</p>
                    {f.source_ref && <p className="mt-1.5 text-xs text-zinc-400">From your notes: {f.source_ref}</p>}</li>))}</ul>}
          </section>
        </div>
      </main>

      {accusing && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-zinc-950/40 p-4" onClick={() => setAccusing(false)}>
          <Card className="w-full max-w-lg space-y-5 p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="accuse-title">
            <h2 id="accuse-title" className="text-lg font-semibold">{c.accusation.prompt}</h2>
            <div className="space-y-2">
              {c.accusation.options.map((o) => (
                <button key={o.id} onClick={() => setChoice(o.id)} aria-pressed={choice === o.id} className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${choice === o.id ? "border-zinc-900 bg-zinc-50 font-medium" : "border-zinc-200 hover:border-zinc-300"}`}>{o.label}</button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Your reasoning</Label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={2000}
                placeholder="Which evidence proves it, and what concept explains why?" className={inputClass} />
            </div>
            {accuseError && <p className="text-sm text-red-700">{accuseError}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setAccusing(false)}>Keep investigating</Button>
              <Button className="flex-1" disabled={!choice || reason.trim().length < 15 || busy} onClick={accuse}>{busy ? "Reviewing your reasoning…" : "Submit"}</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
