import type { ImpostorContent, ImpostorRound } from "./schema";

export type Player = { id: string; name: string; score: number };
export type Vote = { voterId: string; targetId: string };
export type Assignment = Record<string, { fact: string; impostor: boolean; shared?: boolean }>;
export type RoundResult = {
  round: number; ejectedIds: string[]; impostorIds: string[]; caught: boolean;
  counts: Record<string, number>; fake: string; correct_version: string; explanation: string;
};
export type RoomState = { phase: "lobby" | "discuss" | "vote" | "reveal" | "final"; round: number; assignment: Assignment; results: RoundResult[] };
export type Viewer = { kind: "host" } | { kind: "player"; id: string };

export const MIN_PLAYERS = 3, MAX_PLAYERS = 10;

function shuffle<T>(xs: T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function assignRoles(players: Player[], round: ImpostorRound, rng: () => number = Math.random): Assignment {
  const order = shuffle(players, rng);
  const impostors = players.length >= 7 ? 2 : 1;
  const facts = shuffle(round.true_facts, rng);
  const out: Assignment = {};
  const crew = order.slice(impostors);
  // Vouching pair: with 4+ crew, two crewmates secretly hold the same fact and can back each other up.
  const pair = crew.length >= 4;
  order.slice(0, impostors).forEach((p) => { out[p.id] = { fact: round.corrupted_fact, impostor: true }; });
  crew.forEach((p, i) => {
    const idx = pair && i === crew.length - 1 ? 0 : i; // last crewmate shares the first crewmate's fact
    out[p.id] = { fact: facts[idx % facts.length], impostor: false, shared: pair && (i === 0 || i === crew.length - 1) };
  });
  return out;
}

export function tally(votes: Vote[], assignment: Assignment) {
  const counts: Record<string, number> = {};
  for (const v of votes) counts[v.targetId] = (counts[v.targetId] ?? 0) + 1;
  const max = Math.max(0, ...Object.values(counts));
  const top = Object.keys(counts).filter((id) => counts[id] === max);
  const ejectedIds = max > 0 && top.length === 1 ? top : []; // ties eject nobody
  const impostorIds = Object.keys(assignment).filter((id) => assignment[id].impostor);
  const caught = ejectedIds.some((id) => assignment[id]?.impostor);
  const deltas: Record<string, number> = {};
  for (const v of votes) if (!assignment[v.voterId]?.impostor && assignment[v.targetId]?.impostor) deltas[v.voterId] = (deltas[v.voterId] ?? 0) + 1;
  const framed = ejectedIds.filter((id) => !assignment[id]?.impostor).length; // crewmates voted out
  for (const id of impostorIds) if (!ejectedIds.includes(id)) deltas[id] = (deltas[id] ?? 0) + 2 + framed;
  return { counts, ejectedIds, impostorIds, caught, deltas };
}

export function viewFor(state: RoomState, content: ImpostorContent, players: Player[], votes: Vote[], viewer: Viewer) {
  const inRound = state.phase === "discuss" || state.phase === "vote";
  const voted = new Set(votes.map((v) => v.voterId));
  const meId = viewer.kind === "player" ? viewer.id : null;
  const card = meId && inRound ? state.assignment[meId] : undefined;
  const showResult = state.phase === "reveal" || state.phase === "final";
  return {
    phase: state.phase,
    round: state.round + 1,
    totalRounds: content.rounds.length,
    topic: state.round >= 0 ? content.rounds[state.round]?.topic ?? null : null,
    players: players.map((p) => ({ id: p.id, name: p.name, score: p.score, voted: voted.has(p.id) })),
    me: meId ? { id: meId, fact: card?.fact ?? null, impostor: card?.impostor ?? false, shared: card?.shared ?? false, myVote: votes.find((v) => v.voterId === meId)?.targetId ?? null } : null,
    lastResult: showResult ? state.results[state.results.length - 1] ?? null : null,
  };
}
export type RoomView = ReturnType<typeof viewFor>;
