import type { GameSpec } from "@/domain/game-spec";
import type { LlmClient } from "@/lib/llm";
import type { Repo } from "@/repo/types";
import { InvalidSpecError } from "@/domain/llm-check";
import { generators, type Generator } from "./generators";
import { ingestUnit } from "./ingest";
import { verifyGame } from "./verify";

export type AssetResolver = (spec: GameSpec) => Promise<Record<string, string>>;
const MAX_REPAIRS = 2;
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function runUnitPipeline({ llm, repo }: { llm: LlmClient; repo: Repo }, unitId: string) {
  const unit = await repo.getUnit(unitId);
  if (!unit) throw new Error(`unit ${unitId} not found`);
  await repo.updateUnit(unitId, { status: "running" });
  try {
    const conceptMap = await ingestUnit(llm, unit.input);
    await repo.updateUnit(unitId, { status: "ready", conceptMap, error: null });
  } catch (e) {
    await repo.updateUnit(unitId, { status: "failed", error: msg(e) });
  }
}

export async function runGamePipeline(
  { llm, repo, resolveAssets }: { llm: LlmClient; repo: Repo; resolveAssets: AssetResolver },
  gameId: string,
) {
  const game = await repo.getGame(gameId);
  if (!game) throw new Error(`game ${gameId} not found`);
  const unit = await repo.getUnit(game.unitId);
  if (!unit?.conceptMap) throw new Error(`unit ${game.unitId} has no concept map`);
  const gen: Generator | undefined = generators[game.mode];
  await repo.updateGame(gameId, { status: "running" });
  try {
    if (!gen) throw new Error(`mode ${game.mode} is not implemented yet`);
    const map = unit.conceptMap;
    // Feed verifier problems back into the next attempt so it fixes them.
    let problems: string[] = [];
    for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
      const repairLlm: LlmClient = problems.length
        ? { parseStructured: (a) => llm.parseStructured({ ...a, content: [...a.content, { type: "text", text: `Your previous attempt failed verification. Fix these problems:\n- ${problems.join("\n- ")}` }] }) }
        : llm;
      let spec: GameSpec;
      try {
        spec = await gen({ llm: repairLlm, map, targetConceptIds: [], learnMode: true });
      } catch (e) {
        if (!(e instanceof InvalidSpecError)) throw e;
        problems = [e.message];
        continue;
      }
      const report = verifyGame(spec, map);
      if (report.ok) {
        const assets = await resolveAssets(spec);
        await repo.updateGame(gameId, { status: "ready", spec, assets, verifierReport: report, error: null });
        return;
      }
      problems = report.problems;
      await repo.updateGame(gameId, { verifierReport: report });
    }
    throw new Error(`verification failed after ${MAX_REPAIRS} repairs: ${problems.join("; ")}`);
  } catch (e) {
    await repo.updateGame(gameId, { status: "failed", error: msg(e) });
  }
}
