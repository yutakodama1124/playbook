"use client";
import { use } from "react";
import { useRoom } from "@/app/components/impostor/useRoom";
import { Reveal, Scoreboard } from "@/app/components/impostor/Reveal";

export default function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data, error, token, post } = useRoom(code, "player");
  if (!token && data) return <main className="p-8">You haven&apos;t joined this room on this device. <a className="underline" href={`/join?code=${code}`}>Join</a></main>;
  if (!data) return <main className="p-8">{error ?? "Loading…"}</main>;
  const v = data.view, me = v.me;
  if (!me) return <main className="p-8">You&apos;re not in this room. <a className="underline" href={`/join?code=${code}`}>Join</a></main>;
  const myName = v.players.find((p) => p.id === me.id)?.name;

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6">
      <header className="mb-6 flex justify-between text-sm text-stone-500"><span>{myName}</span>{v.phase !== "lobby" && <span>Round {Math.min(v.round, v.totalRounds)}/{v.totalRounds}</span>}</header>
      {error && <p className="mb-3 rounded bg-rose-100 p-2 text-rose-800">{error}</p>}

      {v.phase === "lobby" && <p className="mt-20 text-center text-2xl font-semibold">You&apos;re in!<br /><span className="text-lg font-normal text-stone-500">Waiting for the host to start…</span></p>}

      {v.phase === "discuss" && me.fact && (
        <div className="space-y-4">
          <p className="text-center text-sm uppercase tracking-widest text-stone-500">{v.topic}</p>
          <div className={`rounded-3xl p-6 shadow-lg ${me.impostor ? "bg-rose-700 text-white" : "bg-white"}`}>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">{me.impostor ? "You are the impostor — your fact is fake. Sell it." : "Your fact"}</p>
            <p className="mt-3 text-2xl font-semibold leading-snug">{me.fact}</p>
          </div>
          <p className="text-center text-stone-500">Explain it out loud. Listen for the fact that sounds off.</p>
        </div>
      )}

      {v.phase === "vote" && (
        <div className="space-y-3">
          <p className="text-center text-2xl font-bold">Who has the fake?</p>
          {v.players.filter((p) => p.id !== me.id).map((p) => (
            <button key={p.id} onClick={() => post("vote", { targetId: p.id })}
              className={`w-full rounded-xl border-2 p-4 text-left text-xl ${me.myVote === p.id ? "border-rose-700 bg-rose-50 font-bold" : "border-stone-300 bg-white"}`}>{p.name}</button>
          ))}
          {me.myVote && <p className="text-center text-sm text-stone-500">Vote saved — you can change it until the reveal.</p>}
        </div>
      )}

      {v.phase === "reveal" && <div className="space-y-4"><Reveal view={v} /><p className="text-center">Your score: <b>{v.players.find((p) => p.id === me.id)?.score}</b></p></div>}
      {v.phase === "final" && <div className="space-y-4"><p className="text-center text-2xl font-bold">Final scores</p><Scoreboard view={v} /></div>}
    </main>
  );
}
