"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken } from "@/app/components/impostor/useRoom";
import { Button, Label, inputClass } from "@/app/components/ui";

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const c = code.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${c}/join`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setError(json.error); return; }
    saveToken(c, "player", json.token);
    router.push(`/rooms/${c}/play`);
  }

  return (
    <form onSubmit={join} className="space-y-5">
      <div className="space-y-1.5"><Label>Room code</Label>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={5} placeholder="ABCDE" autoCapitalize="characters" autoComplete="off"
          className={`${inputClass} h-14 text-center font-mono text-2xl tracking-[0.3em]`} /></div>
      <div className="space-y-1.5"><Label>Your name</Label><input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} className={`${inputClass} h-12 text-base`} /></div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 5 || !name.trim()}>{busy ? "Joining…" : "Join game"}</Button>
    </form>
  );
}

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <p className="text-sm font-semibold tracking-tight">Playbook</p>
      <h1 className="mb-8 mt-6 text-2xl font-semibold tracking-tight">Join Impostor</h1>
      <Suspense><JoinForm /></Suspense>
    </main>
  );
}
