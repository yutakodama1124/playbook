import { env } from "@/lib/env";

export type Job = { type: "unit"; unitId: string } | { type: "game"; gameId: string };

export async function runJobInline(job: Job): Promise<void> {
  const { createLlmClient } = await import("@/lib/llm");
  const { getRepo } = await import("@/repo/supabase");
  const { runUnitPipeline, runGamePipeline } = await import("./run");
  const { createAssetResolver, supabaseUpload } = await import("@/assets/resolver");
  const llm = createLlmClient(), repo = getRepo();
  if (job.type === "unit") return runUnitPipeline({ llm, repo }, job.unitId);
  return runGamePipeline({ llm, repo, resolveAssets: createAssetResolver({ repo, llm, upload: supabaseUpload }) }, job.gameId);
}

async function startRenderTaskDefault(taskName: string, args: unknown[]) {
  const { Render } = await import("@renderinc/sdk");
  // Local dev: set RENDER_USE_LOCAL_DEV=true to target `render workflows dev` (localhost:8120).
  const client = new Render({ token: env.renderApiKey, useLocalDev: process.env.RENDER_USE_LOCAL_DEV === "true" });
  await client.workflows.startTask(`${env.renderWorkflowSlug}/${taskName}`, args);
}

export async function startJob(
  job: Job,
  deps: { mode?: "inline" | "render"; runInline?: (job: Job) => Promise<void>; startRenderTask?: (t: string, a: unknown[]) => Promise<void> } = {},
): Promise<void> {
  const mode = deps.mode ?? env.pipelineMode;
  if (mode === "inline") return (deps.runInline ?? runJobInline)(job);
  const start = deps.startRenderTask ?? startRenderTaskDefault;
  if (job.type === "unit") return start("ingestUnit", [job.unitId]);
  return start("generateGame", [job.gameId]);
}
