import { supabaseAdmin } from "@/lib/supabase-admin";
import { createMemoryRepo } from "./memory";
import type { AssetRow, GameRow, Repo, RoomPlayerRow, RoomRow, UnitRow } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const unitFrom = (r: any): UnitRow => ({ id: r.id, title: r.title, course: r.course, testDate: r.test_date, status: r.status,
  error: r.error, conceptMap: r.concept_map, input: r.input, createdAt: r.created_at });
const gameFrom = (r: any): GameRow => ({ id: r.id, unitId: r.unit_id, mode: r.mode, status: r.status, error: r.error,
  spec: r.spec, assets: r.assets, verifierReport: r.verifier_report, createdAt: r.created_at });
const roomFrom = (r: any): RoomRow => ({ id: r.id, code: r.code, gameId: r.game_id, hostToken: r.host_token, state: r.state });
const playerFrom = (r: any): RoomPlayerRow => ({ id: r.id, roomId: r.room_id, name: r.name, token: r.token, score: r.score });
const assetFrom = (r: any): AssetRow => ({ id: r.id, url: r.url, kind: r.kind, tags: r.tags, mood: r.mood,
  positions: r.positions, styleVersion: r.style_version });

function must<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function createSupabaseRepo(): Repo {
  const db = supabaseAdmin();
  return {
    async createUnit(input, testDate) {
      return unitFrom(must(await db.from("units").insert({ title: input.title, course: input.course, test_date: testDate, input }).select().single()));
    },
    async getUnit(id) {
      const r = must(await db.from("units").select().eq("id", id).maybeSingle());
      return r ? unitFrom(r) : null;
    },
    async updateUnit(id, p) {
      must(await db.from("units").update({ status: p.status, error: p.error, concept_map: p.conceptMap, test_date: p.testDate }).eq("id", id));
    },
    async createGame(unitId, mode) {
      return gameFrom(must(await db.from("games").insert({ unit_id: unitId, mode }).select().single()));
    },
    async getGame(id) {
      const r = must(await db.from("games").select().eq("id", id).maybeSingle());
      return r ? gameFrom(r) : null;
    },
    async countCreatedSince(table, sinceIso) {
      const { count, error } = await db.from(table).select("id", { count: "exact", head: true }).gte("created_at", sinceIso);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    async updateRoomStateIf(id, expect, state) {
      // Compare-and-set on the phase/round so concurrent host clicks can't double-apply a transition.
      const data = must(await db.from("rooms").update({ state }).eq("id", id)
        .eq("state->>phase", expect.phase).eq("state->>round", String(expect.round)).select("id"));
      return (data ?? []).length > 0;
    },
    async listGames(unitId) {
      return (must(await db.from("games").select().eq("unit_id", unitId).order("created_at")) ?? []).map(gameFrom);
    },
    async addMasteryEvent(e) {
      must(await db.from("mastery_events").insert({ device_id: e.deviceId, unit_id: e.unitId, game_id: e.gameId, concept_ids: e.conceptIds, correct: e.correct }));
    },
    async listMasteryEvents(deviceId, unitId) {
      return (must(await db.from("mastery_events").select().eq("device_id", deviceId).eq("unit_id", unitId)) ?? [])
        .map((r: any) => ({ deviceId: r.device_id, unitId: r.unit_id, gameId: r.game_id, conceptIds: r.concept_ids, correct: r.correct, createdAt: r.created_at }));
    },
    async updateGame(id, p) {
      must(await db.from("games").update({ status: p.status, error: p.error, spec: p.spec, assets: p.assets, verifier_report: p.verifierReport }).eq("id", id));
    },
    async listAssets() { return (must(await db.from("assets").select()) ?? []).map(assetFrom); },
    async addAsset(a) {
      return assetFrom(must(await db.from("assets").insert({ url: a.url, kind: a.kind, tags: a.tags, mood: a.mood, positions: a.positions, style_version: a.styleVersion }).select().single()));
    },
    async createRoom(r) {
      return roomFrom(must(await db.from("rooms").insert({ code: r.code, game_id: r.gameId, host_token: r.hostToken, state: r.state }).select().single()));
    },
    async getRoomByCode(code) {
      const r = must(await db.from("rooms").select().eq("code", code).maybeSingle());
      return r ? roomFrom(r) : null;
    },
    async updateRoomState(id, state) { must(await db.from("rooms").update({ state }).eq("id", id)); },
    async addPlayer(roomId, name, token) {
      return playerFrom(must(await db.from("room_players").insert({ room_id: roomId, name, token }).select().single()));
    },
    async listPlayers(roomId) {
      return (must(await db.from("room_players").select().eq("room_id", roomId).order("joined_at")) ?? []).map(playerFrom);
    },
    async setScore(playerId, score) { must(await db.from("room_players").update({ score }).eq("id", playerId)); },
    async castVote(roomId, round, voterId, targetId) {
      must(await db.from("room_votes").upsert({ room_id: roomId, round, voter_id: voterId, target_id: targetId }));
    },
    async listVotes(roomId, round) {
      return (must(await db.from("room_votes").select().eq("room_id", roomId).eq("round", round)) ?? []).map((v: any) => ({ voterId: v.voter_id, targetId: v.target_id }));
    },
  };
}

let singleton: Repo | null = null;
export function getRepo(): Repo {
  if (!singleton) {
    if (process.env.SUPABASE_URL) singleton = createSupabaseRepo();
    // Memory repo loses data across serverless instances, so it is only allowed outside production.
    else if (process.env.NODE_ENV === "production") throw new Error("SUPABASE_URL is not set in this deployment");
    else singleton = createMemoryRepo();
  }
  return singleton;
}
