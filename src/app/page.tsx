"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/units", { method: "POST", body: new FormData(e.currentTarget) });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setBusy(false); return; }
    router.push(`/units/${json.id}`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-4xl font-bold">Playbook</h1>
      <p className="mt-2 text-lg text-neutral-600">Turn any unit into a game you can only win by understanding it.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input name="title" required placeholder="Unit (e.g. Cellular Respiration)" className="w-full rounded border p-3" />
        <input name="course" required placeholder="Course (e.g. AP Biology)" className="w-full rounded border p-3" />
        <label className="block text-sm text-neutral-600">Test date (optional)
          <input name="testDate" type="date" className="mt-1 w-full rounded border p-3" />
        </label>
        <textarea name="notes" rows={5} placeholder="Paste notes (optional)" className="w-full rounded border p-3" />
        <input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.md,.txt" className="w-full" />
        {error && <p className="text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded bg-teal-700 p-3 font-semibold text-white disabled:opacity-50">
          {busy ? "Uploading…" : "Build my unit"}
        </button>
      </form>
    </main>
  );
}
