"use client";
import { use, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useRoom } from "@/app/components/impostor/useRoom";
import { Reveal, Scoreboard } from "@/app/components/impostor/Reveal";

const DISCUSS_SECONDS = 90;
const btn = "inline-flex h-14 items-center justify-center rounded-lg bg-white px-8 text-lg font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-40";

export default function HostPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data, error, post } = useRoom(code, "host");
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => { QRCode.toDataURL(`${location.origin}/join?code=${code}`, { width: 360, margin: 1 }).then(setQr); }, [code]);

  if (!data) return <main className="min-h-screen bg-zinc-950 p-8 text-zinc-400">{error ?? "Loading…"}</main>;
  if (!data.isHost) return <main className="min-h-screen bg-zinc-950 p-8 text-zinc-300">This screen belongs to the device that created the room.</main>;
  const v = data.view;

  return (
    <main className="min-h-screen bg-zinc-950 px-10 py-8 text-white">
      <header className="mb-12 flex items-center justify-between border-b border-zinc-800 pb-6">
        <p className="text-lg font-semibold tracking-tight">Playbook · Impostor</p>
        {v.phase !== "lobby" && v.phase !== "final" && <p className="tabular-nums text-zinc-400">Round {Math.min(v.round, v.totalRounds)} of {v.totalRounds}</p>}
        <p className="text-zinc-400">Room <span className="ml-2 font-mono text-2xl font-semibold tracking-[0.2em] text-white">{data.code}</span></p>
      </header>
      {error && <p className="mb-6 text-red-400">{error}</p>}

      {v.phase === "lobby" && (
        <div className="grid items-start gap-16 md:grid-cols-[auto_1fr]">
          <div className="text-center">
            {qr && <img src={qr} alt={`QR code to join room ${data.code}`} className="rounded-xl bg-white p-3" />}
            <p className="mt-4 text-zinc-400">Scan, or open <span className="font-mono text-white">/join</span> and enter <span className="font-mono text-white">{data.code}</span></p>
          </div>
          <div className="space-y-6">
            <p className="text-3xl font-semibold tracking-tight">{v.players.length} {v.players.length === 1 ? "player" : "players"} joined</p>
            <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">{v.players.map((p) => <li key={p.id} className="rounded-lg border border-zinc-800 px-4 py-3 text-lg">{p.name}</li>)}</ul>
            <button className={btn} disabled={v.players.length < 3} onClick={() => post("action", { action: "next" })}>{v.players.length < 3 ? `Waiting for ${3 - v.players.length} more` : "Start the game"}</button>
          </div>
        </div>
      )}

      {v.phase === "discuss" && (
        <div className="mx-auto max-w-4xl space-y-10 text-center">
          <div><p className="text-zinc-400">This round</p><p className="mt-2 text-5xl font-semibold tracking-tight">{v.topic}</p></div>
          <p className="text-2xl leading-relaxed text-zinc-300">Read your card, then explain your fact out loud in one sentence. One card is fake. Listen for what doesn&apos;t fit.</p>
          <Countdown key={v.round} seconds={DISCUSS_SECONDS} />
          <button className={btn} onClick={() => post("action", { action: "vote" })}>Open voting</button>
        </div>
      )}

      {v.phase === "vote" && (
        <div className="mx-auto max-w-4xl space-y-10 text-center">
          <p className="text-5xl font-semibold tracking-tight">Vote on your phones</p>
          <ul className="grid grid-cols-2 gap-2 text-left lg:grid-cols-3">
            {v.players.map((p) => <li key={p.id} className={`flex justify-between rounded-lg border px-4 py-3 text-lg ${p.voted ? "border-accent/60 text-white" : "border-zinc-800 text-zinc-500"}`}>{p.name}<span className="text-sm">{p.voted ? "Voted" : "Waiting"}</span></li>)}
          </ul>
          <button className={btn} onClick={() => post("action", { action: "reveal" })}>Reveal · {v.players.filter((p) => p.voted).length} of {v.players.length} voted</button>
        </div>
      )}

      {v.phase === "reveal" && (
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[2fr_1fr]">
          <Reveal view={v} big />
          <div className="space-y-4"><p className="text-zinc-400">Scores</p><Scoreboard view={v} dark />
            <button className={`${btn} w-full`} onClick={() => post("action", { action: "next" })}>{v.round >= v.totalRounds ? "Final results" : "Next round"}</button></div>
        </div>
      )}

      {v.phase === "final" && (
        <div className="mx-auto max-w-xl space-y-8">
          <p className="text-center text-5xl font-semibold tracking-tight">Final scores</p>
          <Scoreboard view={v} dark />
        </div>
      )}
    </main>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  return <p className={`text-7xl font-semibold tabular-nums ${left <= 10 ? "text-red-400" : "text-white"}`}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</p>;
}
