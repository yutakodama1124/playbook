"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken } from "@/app/components/impostor/useRoom";

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
    <form onSubmit={join} className="space-y-4">
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={5} placeholder="CODE" autoCapitalize="characters"
        className="w-full rounded-xl border-2 p-4 text-center font-mono text-3xl tracking-widest" />
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Your name" className="w-full rounded-xl border-2 p-4 text-xl" />
      {error && <p className="text-rose-700">{error}</p>}
      <button disabled={busy || code.length !== 5 || !name.trim()} className="w-full rounded-xl bg-stone-900 p-4 text-xl font-bold text-white disabled:opacity-40">{busy ? "Joining…" : "Join"}</button>
    </form>
  );
}

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">Join Impostor</h1>
      <Suspense><JoinForm /></Suspense>
    </main>
  );
}
