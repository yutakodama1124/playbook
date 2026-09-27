import { supabaseAdmin } from "@/lib/supabase-admin";
import { createMemoryRepo } from "./memory";
import type { AssetRow, GameRow, Repo, UnitRow } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const unitFrom = (r: any): UnitRow => ({ id: r.id, title: r.title, course: r.course, testDate: r.test_date, status: r.status,
  error: r.error, conceptMap: r.concept_map, input: r.input, createdAt: r.created_at });
const gameFrom = (r: any): GameRow => ({ id: r.id, unitId: r.unit_id, mode: r.mode, status: r.status, error: r.error,
  spec: r.spec, assets: r.assets, verifierReport: r.verifier_report, createdAt: r.created_at });
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
      must(await db.from("units").update({ status: p.status, error: p.error, concept_map: p.conceptMap }).eq("id", id));
    },
    async createGame(unitId, mode) {
      return gameFrom(must(await db.from("games").insert({ unit_id: unitId, mode }).select().single()));
    },
    async getGame(id) {
      const r = must(await db.from("games").select().eq("id", id).maybeSingle());
      return r ? gameFrom(r) : null;
    },
    async updateGame(id, p) {
      must(await db.from("games").update({ status: p.status, error: p.error, spec: p.spec, assets: p.assets, verifier_report: p.verifierReport }).eq("id", id));
    },
    async listAssets() { return (must(await db.from("assets").select()) ?? []).map(assetFrom); },
    async addAsset(a) {
      return assetFrom(must(await db.from("assets").insert({ url: a.url, kind: a.kind, tags: a.tags, mood: a.mood, positions: a.positions, style_version: a.styleVersion }).select().single()));
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
