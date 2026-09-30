// Seeds the pre-verified sample units + games so judges can play instantly (no AI calls; library art only).
// Usage: DEV_NO_IMAGES=1 npx tsx --env-file=.env.local scripts/seed-samples.mts
import { readFileSync } from "node:fs";
import { createSupabaseRepo } from "../src/repo/supabase.ts";
import { createAssetResolver } from "../src/assets/resolver.ts";
import { verifyGame } from "../src/pipeline/verify.ts";
import type { LlmClient } from "../src/lib/llm.ts";
import { sampleGames } from "./check-samples.mts";

const repo = createSupabaseRepo();
const resolve = createAssetResolver({ repo, llm: {} as LlmClient, upload: async () => { throw new Error("no uploads when seeding"); } });
const notes = readFileSync("fixtures/sample-notes.md", "utf8");
const { resp, photo, games } = sampleGames();

const units = new Map<unknown, string>();
for (const [map, title] of [[resp, "Cellular Respiration"], [photo, "Photosynthesis"]] as const) {
  const u = await repo.createUnit({ title, course: "AP Biology", sources: [{ kind: "text", text: title === "Cellular Respiration" ? notes : "AP Biology photosynthesis unit (sample)." }] }, null);
  await repo.updateUnit(u.id, { status: "ready", conceptMap: map });
  units.set(map, u.id);
}
const out: Record<string, string> = {};
for (const { map, spec } of games) {
  const report = verifyGame(spec as never, map);
  if (!report.ok) throw new Error(`${spec.mode} sample fails verification: ${report.problems.join("; ")}`);
  const g = await repo.createGame(units.get(map)!, spec.mode as never);
  const assets = await resolve(spec as never);
  await repo.updateGame(g.id, { status: "ready", spec: spec as never, assets, verifierReport: report });
  out[spec.mode] = g.id;
}
console.log(JSON.stringify({ units: { respiration: units.get(resp), photosynthesis: units.get(photo) }, games: out }, null, 2));
