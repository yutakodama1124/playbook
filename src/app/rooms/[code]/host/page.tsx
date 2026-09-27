"use client";
import { use, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useRoom } from "@/app/components/impostor/useRoom";
import { Reveal, Scoreboard } from "@/app/components/impostor/Reveal";

const DISCUSS_SECONDS = 90;

export default function HostPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data, error, post } = useRoom(code, "host");
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => { QRCode.toDataURL(`${location.origin}/join?code=${code}`, { width: 360, margin: 1 }).then(setQr); }, [code]);

  if (!data) return <main className="p-8">{error ?? "Loading…"}</main>;
  if (!data.isHost) return <main className="p-8">This screen is for the host device that created the room.</main>;
  const v = data.view;
  const btn = "rounded-2xl bg-amber-400 px-8 py-4 text-2xl font-bold text-stone-900 disabled:opacity-40";

  return (
    <main className="min-h-screen bg-stone-900 p-8 text-white">
      <header className="mb-8 flex items-center justify-between">
        <p className="text-2xl font-bold">Impostor</p>
        {v.phase !== "lobby" && <p className="text-xl text-stone-400">Round {Math.min(v.round, v.totalRounds)} / {v.totalRounds}</p>}
        <p className="text-xl">Code <span className="font-mono text-3xl font-bold tracking-widest text-amber-300">{data.code}</span></p>
      </header>
      {error && <p className="mb-4 rounded bg-rose-900 p-3">{error}</p>}

      {v.phase === "lobby" && (
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-4 text-center">
            <p className="text-2xl">Join on your phone</p>
            {qr && <img src={qr} alt={`QR code to join room ${data.code}`} className="mx-auto rounded-2xl bg-white p-3" />}
            <p className="text-lg text-stone-300">or go to <span className="font-mono">/join</span> and enter <span className="font-mono font-bold text-amber-300">{data.code}</span></p>
          </div>
          <div className="space-y-4">
            <p className="text-2xl">{v.players.length} / 10 players</p>
            <ul className="grid grid-cols-2 gap-2">{v.players.map((p) => <li key={p.id} className="rounded-xl bg-stone-800 px-4 py-3 text-xl">{p.name}</li>)}</ul>
            <button className={btn} disabled={v.players.length < 3} onClick={() => post("action", { action: "next" })}>{v.players.length < 3 ? "Need 3 players" : "Start game"}</button>
          </div>
        </div>
      )}

      {v.phase === "discuss" && (
        <div className="space-y-8 text-center">
          <p className="text-xl uppercase tracking-widest text-stone-400">Topic</p>
          <p className="text-5xl font-bold">{v.topic}</p>
          <p className="mx-auto max-w-3xl text-2xl text-stone-300">Everyone: read your card and explain your fact out loud in one sentence. One of you has a fake. Who sounds off?</p>
          <Countdown key={v.round} seconds={DISCUSS_SECONDS} />
          <button className={btn} onClick={() => post("action", { action: "vote" })}>Open voting</button>
        </div>
      )}

      {v.phase === "vote" && (
        <div className="space-y-8 text-center">
          <p className="text-5xl font-bold">Vote on your phones</p>
          <ul className="mx-auto grid max-w-3xl grid-cols-2 gap-3">
            {v.players.map((p) => <li key={p.id} className={`rounded-xl px-4 py-3 text-xl ${p.voted ? "bg-teal-700" : "bg-stone-800"}`}>{p.name} {p.voted ? "✓" : "…"}</li>)}
          </ul>
          <button className={btn} onClick={() => post("action", { action: "reveal" })}>Reveal ({v.players.filter((p) => p.voted).length}/{v.players.length} voted)</button>
        </div>
      )}

      {v.phase === "reveal" && (
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[2fr_1fr]">
          <Reveal view={v} big />
          <div className="space-y-4"><p className="text-xl">Scores</p><Scoreboard view={v} />
            <button className={btn} onClick={() => post("action", { action: "next" })}>{v.round >= v.totalRounds ? "Final results" : "Next round"}</button></div>
        </div>
      )}

      {v.phase === "final" && (
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <p className="text-5xl font-bold">Final scores</p>
          <Scoreboard view={v} />
        </div>
      )}
    </main>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  return <p className={`font-mono text-7xl font-bold ${left <= 10 ? "text-rose-400" : "text-amber-300"}`}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</p>;
}
