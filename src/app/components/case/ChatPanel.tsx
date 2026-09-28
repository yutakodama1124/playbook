"use client";
import { useState } from "react";
import { Button, Card, inputClass } from "../ui";

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
    <Card className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-200 p-4">
        {portrait && <img src={portrait} alt="" className="h-11 w-11 rounded-lg object-cover" />}
        <div>
          <p className="font-medium">{character.name}</p>
          <p className="text-sm text-zinc-500">{character.is_mentor ? `${character.role} · mentor` : character.role}</p>
        </div>
      </div>
      <div className="max-h-[380px] min-h-[240px] flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
        {turns.length === 0 && (
          <div className="space-y-2 text-zinc-600">
            <p>{character.bio}</p>
            <p className="text-zinc-500">{character.is_mentor ? "Ask about any concept you're unsure of. The mentor explains, but won't name the answer." : "People only share what you specifically ask about."}</p>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={t.role === "student" ? "flex justify-end" : ""}>
            <p className={`max-w-[85%] rounded-lg px-3 py-2 leading-relaxed ${t.role === "student" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-800"}`}>{t.text}</p>
          </div>
        ))}
        {busy && <p className="text-zinc-400">{character.name.split(" ")[0]} is answering…</p>}
        {error && <p className="text-red-700">{error}</p>}
      </div>
      <form onSubmit={ask} className="flex gap-2 border-t border-zinc-200 p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder={`Ask ${character.name.split(" ")[0]} a question`} className={inputClass} />
        <Button type="submit" disabled={busy || !q.trim()}>Ask</Button>
      </form>
    </Card>
  );
}
