"use client";
import { use } from "react";
import { useRoom } from "@/app/components/impostor/useRoom";
import { Reveal, Scoreboard } from "@/app/components/impostor/Reveal";

export default function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data, error, token, post } = useRoom(code, "player");
  const joinLink = <a className="underline" href={`/join?code=${code}`}>Join this room</a>;
  if (!token && data) return <main className="p-6 text-zinc-700">You haven&apos;t joined on this device. {joinLink}</main>;
  if (!data) return <main className="p-6 text-zinc-500">{error ?? "Loading…"}</main>;
  const v = data.view, me = v.me;
  if (!me) return <main className="p-6 text-zinc-700">You&apos;re not in this room. {joinLink}</main>;
  const myName = v.players.find((p) => p.id === me.id)?.name;

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-5">
      <header className="mb-8 flex justify-between border-b border-zinc-200 pb-3 text-sm text-zinc-500">
        <span className="font-medium text-zinc-900">{myName}</span>
        {v.phase !== "lobby" && v.phase !== "final" && <span className="tabular-nums">Round {Math.min(v.round, v.totalRounds)} of {v.totalRounds}</span>}
      </header>
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {v.phase === "lobby" && <div className="mt-24 text-center"><p className="text-2xl font-semibold tracking-tight">You&apos;re in</p><p className="mt-2 text-zinc-500">Waiting for the host to start.</p></div>}

      {v.phase === "discuss" && me.fact && (
        <div className="space-y-5">
          <p className="text-center text-sm text-zinc-500">{v.topic}</p>
          <div className={`rounded-xl p-6 ${me.impostor ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white"}`}>
            <p className={`text-sm font-medium ${me.impostor ? "text-red-400" : "text-zinc-500"}`}>{me.impostor ? "You're the impostor. This fact is fake." : "Your fact"}</p>
            <p className="mt-3 text-2xl font-medium leading-snug">{me.fact}</p>
          </div>
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
            <p className="font-medium text-zinc-900">Your turn to speak</p>
            <p>{me.impostor
              ? "Read your fact, then give a convincing reason why it's true. Sound as sure as everyone else."
              : "Read your fact, then explain in one sentence why it's true. The impostor will have to make up a reason."}</p>
            {me.shared && <p className="text-accent">Someone else holds this exact fact. Listen for it — you can vouch for each other.</p>}
          </div>
        </div>
      )}

      {v.phase === "vote" && (
        <div className="space-y-3">
          <p className="mb-4 text-center text-2xl font-semibold tracking-tight">Who has the fake?</p>
          {v.players.filter((p) => p.id !== me.id).map((p) => (
            <button key={p.id} onClick={() => post("vote", { targetId: p.id })} aria-pressed={me.myVote === p.id}
              className={`h-14 w-full rounded-lg border px-4 text-left text-lg ${me.myVote === p.id ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white"}`}>{p.name}</button>
          ))}
          {me.myVote && <p className="text-center text-sm text-zinc-500">Vote saved. You can change it until the reveal.</p>}
        </div>
      )}

      {v.phase === "reveal" && <div className="space-y-6"><Reveal view={v} /><p className="text-center text-zinc-600">Your score: <span className="font-semibold tabular-nums text-zinc-900">{v.players.find((p) => p.id === me.id)?.score}</span></p></div>}
      {v.phase === "final" && <div className="space-y-6"><p className="text-center text-2xl font-semibold tracking-tight">Final scores</p><Scoreboard view={v} /></div>}
    </main>
  );
}
