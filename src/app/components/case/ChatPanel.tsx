"use client";
import { useState } from "react";

export type Character = { id: string; name: string; role: string; bio: string; is_mentor: boolean };
type Turn = { role: "student" | "character"; text: string };

export function ChatPanel({ gameId, character, portrait, turns, setTurns }: {
  gameId: string; character: Character; portrait?: string; turns: Turn[]; setTurns: (t: Turn[]) => void;
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    const next = [...turns, { role: "student" as const, text: question }];
    setTurns(next); setQ(""); setBusy(true); setError(null);
    const res = await fetch(`/api/games/${gameId}/chat`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ characterId: character.id, history: turns, question }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setError(json.error); return; }
    setTurns([...next, { role: "character", text: json.reply }]);
  }

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-stone-300 bg-white">
      <div className="flex items-center gap-3 border-b p-3">
        {portrait && <img src={portrait} alt="" className="h-12 w-12 rounded-full object-cover" />}
        <div>
          <p className="font-semibold">{character.name} {character.is_mentor && <span className="ml-1 rounded bg-teal-100 px-1.5 text-xs text-teal-800">Mentor</span>}</p>
          <p className="text-xs text-stone-500">{character.role}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" style={{ minHeight: 220, maxHeight: 360 }}>
        {turns.length === 0 && <p className="text-stone-500">{character.bio}<br /><br />{character.is_mentor ? "Ask me to explain any concept you're stuck on." : "Ask specific questions — people only share what you ask about."}</p>}
        {turns.map((t, i) => (
          <p key={i} className={t.role === "student" ? "ml-8 rounded-lg bg-stone-900 p-2 text-white" : "mr-8 rounded-lg bg-amber-50 p-2"}>{t.text}</p>
        ))}
        {busy && <p className="mr-8 animate-pulse rounded-lg bg-amber-50 p-2 text-stone-500">…</p>}
        {error && <p className="text-rose-700">{error}</p>}
      </div>
      <form onSubmit={ask} className="flex gap-2 border-t p-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder={`Ask ${character.name.split(" ")[0]}…`} className="flex-1 rounded-lg border p-2 text-sm" />
        <button disabled={busy || !q.trim()} className="rounded-lg bg-stone-900 px-3 text-sm font-semibold text-white disabled:opacity-40">Ask</button>
      </form>
    </div>
  );
}
