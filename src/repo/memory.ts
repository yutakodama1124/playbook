import { nanoid } from "nanoid";
import type { AssetRow, GameRow, Repo, RoomPlayerRow, RoomRow, UnitRow } from "./types";

export function createMemoryRepo(): Repo {
  const units = new Map<string, UnitRow>();
  const games = new Map<string, GameRow>();
  const assets: AssetRow[] = [];
  const rooms = new Map<string, RoomRow>();
  const players: RoomPlayerRow[] = [];
  const votes = new Map<string, { roomId: string; round: number; voterId: string; targetId: string }>();
  const now = () => new Date().toISOString();
  return {
    async createUnit(input, testDate) {
      const row: UnitRow = { id: nanoid(), title: input.title, course: input.course, testDate, status: "queued",
        error: null, conceptMap: null, input, createdAt: now() };
      units.set(row.id, row);
      return row;
    },
    async getUnit(id) { return units.get(id) ?? null; },
    async updateUnit(id, patch) { const u = units.get(id); if (u) units.set(id, { ...u, ...patch }); },
    async createGame(unitId, mode) {
      const row: GameRow = { id: nanoid(), unitId, mode, status: "queued", error: null, spec: null, assets: {},
        verifierReport: null, createdAt: now() };
      games.set(row.id, row);
      return row;
    },
    async getGame(id) { return games.get(id) ?? null; },
    async updateGame(id, patch) { const g = games.get(id); if (g) games.set(id, { ...g, ...patch }); },
    async listAssets() { return [...assets]; },
    async addAsset(a) { const row = { ...a, id: nanoid() }; assets.push(row); return row; },
    async createRoom(r) { if ([...rooms.values()].some((x) => x.code === r.code)) throw new Error("duplicate code"); const row = { ...r, id: nanoid() }; rooms.set(row.id, row); return row; },
    async getRoomByCode(code) { return [...rooms.values()].find((r) => r.code === code) ?? null; },
    async updateRoomState(id, state) { const r = rooms.get(id); if (r) rooms.set(id, { ...r, state }); },
    async addPlayer(roomId, name, token) { const row = { id: nanoid(), roomId, name, token, score: 0 }; players.push(row); return row; },
    async listPlayers(roomId) { return players.filter((p) => p.roomId === roomId).map((p) => ({ ...p })); },
    async setScore(playerId, score) { const p = players.find((x) => x.id === playerId); if (p) p.score = score; },
    async castVote(roomId, round, voterId, targetId) { votes.set(`${roomId}:${round}:${voterId}`, { roomId, round, voterId, targetId }); },
    async listVotes(roomId, round) { return [...votes.values()].filter((v) => v.roomId === roomId && v.round === round).map(({ voterId, targetId }) => ({ voterId, targetId })); },
  };
}
