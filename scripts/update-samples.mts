// Re-verifies the sample games and updates the live ones in place (same ids, so landing-page links keep working).
// Usage: DEV_NO_IMAGES=1 npx tsx --env-file=.env.local scripts/update-samples.mts
import { createSupabaseRepo } from "../src/repo/supabase.ts";
import { createAssetResolver } from "../src/assets/resolver.ts";
import { verifyGame } from "../src/pipeline/verify.ts";
import type { LlmClient } from "../src/lib/llm.ts";
import { sampleGames } from "./check-samples.mts";
import { SAMPLES } from "../src/app/samples.ts";

const repo = createSupabaseRepo();
const resolve = createAssetResolver({ repo, llm: {} as LlmClient, upload: async () => { throw new Error("no uploads when seeding"); } });
const ids: Record<string, string> = { case: "Case Files", escape: "Escape Room", impostor: "Impostor" };
for (const { map, spec } of sampleGames().games) {
  const report = verifyGame(spec as never, map);
  if (!report.ok) throw new Error(`${spec.mode} sample fails verification: ${report.problems.join("; ")}`);
  const id = SAMPLES.find((s) => s.mode === ids[spec.mode])!.href.split("/").pop()!;
  const assets = await resolve(spec as never);
  await repo.updateGame(id, { status: "ready", spec: spec as never, assets, verifierReport: report });
  console.log(spec.mode, id, "updated");
}
