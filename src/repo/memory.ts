import { nanoid } from "nanoid";
import type { AssetRow, GameRow, Repo, UnitRow } from "./types";

export function createMemoryRepo(): Repo {
  const units = new Map<string, UnitRow>();
  const games = new Map<string, GameRow>();
  const assets: AssetRow[] = [];
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
  };
}
