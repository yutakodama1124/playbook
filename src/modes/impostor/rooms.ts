import { customAlphabet } from "nanoid";
import type { Repo, RoomRow } from "@/repo/types";
import { assignRoles, MAX_PLAYERS, MIN_PLAYERS, tally, viewFor, type RoomState } from "./engine";
import type { ImpostorContent } from "./schema";

const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ", 5); // no I/O to avoid confusion
const makeToken = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 24);
export type HostAction = "next" | "vote" | "reveal";

async function load(repo: Repo, code: string) {
  const room = await repo.getRoomByCode(code.toUpperCase());
  if (!room) throw new Error("room not found");
  const game = await repo.getGame(room.gameId);
  if (!game?.spec) throw new Error("game missing");
  return { room, state: room.state as RoomState, content: game.spec.content as ImpostorContent };
}

export async function createRoom(repo: Repo, gameId: string) {
  const game = await repo.getGame(gameId);
  if (game?.mode !== "impostor" || game.status !== "ready") throw new Error("game is not a ready Impostor game");
  const hostToken = makeToken();
  const state: RoomState = { phase: "lobby", round: -1, assignment: {}, results: [] };
  for (let i = 0; i < 5; i++) {
    try { const r = await repo.createRoom({ code: makeCode(), gameId, hostToken, state }); return { code: r.code, hostToken }; }
    catch { /* code collision — retry */ }
  }
  throw new Error("could not create room");
}

export async function joinRoom(repo: Repo, code: string, rawName: string) {
  const { room, state } = await load(repo, code);
  if (state.phase !== "lobby") throw new Error("game already started");
  const name = rawName.trim().slice(0, 20);
  if (!name) throw new Error("name required");
  const players = await repo.listPlayers(room.id);
  if (players.length >= MAX_PLAYERS) throw new Error(`room is full (${MAX_PLAYERS} players)`);
  const token = makeToken();
  const p = await repo.addPlayer(room.id, name, token);
  return { playerId: p.id, token };
}

export async function roomView(repo: Repo, code: string, token?: string | null) {
  const { room, state, content } = await load(repo, code);
  const players = await repo.listPlayers(room.id);
  const votes = state.round >= 0 ? await repo.listVotes(room.id, state.round) : [];
  const isHost = !!token && token === room.hostToken;
  const me = token ? players.find((p) => p.token === token) : undefined;
  const view = viewFor(state, content, players.map(({ id, name, score }) => ({ id, name, score })), votes, me ? { kind: "player", id: me.id } : { kind: "host" });
  return { code: room.code, isHost, view };
}

async function requireHost(repo: Repo, code: string, token: string): Promise<{ room: RoomRow; state: RoomState; content: ImpostorContent }> {
  const l = await load(repo, code);
  if (token !== l.room.hostToken) throw new Error("only the host can do that");
  return l;
}

export async function hostAction(repo: Repo, code: string, token: string, action: HostAction) {
  const { room, state, content } = await requireHost(repo, code, token);
  const players = await repo.listPlayers(room.id);
  let next: RoomState = state;

  if (action === "next") {
    if (state.phase !== "lobby" && state.phase !== "reveal") throw new Error("finish the current round first");
    if (players.length < MIN_PLAYERS) throw new Error(`need at least ${MIN_PLAYERS} players`);
    const round = state.round + 1;
    next = round >= content.rounds.length
      ? { ...state, phase: "final" }
      : { ...state, phase: "discuss", round, assignment: assignRoles(players, content.rounds[round]) };
  } else if (action === "vote") {
    if (state.phase !== "discuss") throw new Error("not in discussion");
    next = { ...state, phase: "vote" };
  } else if (action === "reveal") {
    if (state.phase !== "vote") throw new Error("not voting");
    const votes = await repo.listVotes(room.id, state.round);
    const t = tally(votes, state.assignment);
    for (const p of players) if (t.deltas[p.id]) await repo.setScore(p.id, p.score + t.deltas[p.id]);
    const r = content.rounds[state.round];
    next = { ...state, phase: "reveal", results: [...state.results, {
      round: state.round, ejectedIds: t.ejectedIds, impostorIds: t.impostorIds, caught: t.caught, counts: t.counts,
      fake: r.corrupted_fact, correct_version: r.correct_version, explanation: r.explanation }] };
  }
  await repo.updateRoomState(room.id, next);
}

export async function castVote(repo: Repo, code: string, token: string, targetId: string) {
  const { room, state } = await load(repo, code);
  if (state.phase !== "vote") throw new Error("voting is not open");
  const players = await repo.listPlayers(room.id);
  const me = players.find((p) => p.token === token);
  if (!me) throw new Error("not a player in this room");
  if (targetId === me.id) throw new Error("you can't vote for yourself");
  if (!players.some((p) => p.id === targetId)) throw new Error("unknown player");
  await repo.castVote(room.id, state.round, me.id, targetId);
}
