import type { GameSpec } from "@/domain/game-spec";
import { ParseError, type LlmClient } from "@/lib/llm";
import type { Repo } from "@/repo/types";
import { InvalidSpecError } from "@/domain/llm-check";
import { generators, type Generator } from "./generators";
import { ingestUnit } from "./ingest";
import { verifyGame } from "./verify";
import type { Reviewer } from "./review";

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
  { llm, repo, resolveAssets, review }: { llm: LlmClient; repo: Repo; resolveAssets: AssetResolver; review?: Reviewer },
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
    // Keep repair feedback local to this run. Each retry starts from the original client
    // and adds only the latest verifier report, avoiding stale instructions from older attempts.
    let problems: string[] = [];
    for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
      const repairLlm: LlmClient = problems.length
        ? { parseStructured: (a) => llm.parseStructured({ ...a, content: [...a.content, { type: "text", text: `Your previous attempt failed quality review. Fix every one of these problems, keeping everything else that worked:\n- ${problems.join("\n- ")}` }] }) }
        : llm;
      let spec: GameSpec;
      try {
        spec = await gen({ llm: repairLlm, map, targetConceptIds: [], learnMode: true });
      } catch (e) {
        if (!(e instanceof InvalidSpecError) && !(e instanceof ParseError)) throw e;
        problems = [e.message];
        continue;
      }
      const report = verifyGame(spec, map);
      if (report.ok && review) {
        // Run subjective review only after deterministic checks pass. This saves a remote call
        // when schema, answer-key, or mode rules already prove the game invalid.
        const reviewProblems = await review(spec, map);
        if (reviewProblems.length) {
          problems = reviewProblems;
          await repo.updateGame(gameId, { verifierReport: { ok: false, problems: reviewProblems } });
          continue;
        }
      }
      if (report.ok) {
        const assets = await resolveAssets(spec);
        await repo.updateGame(gameId, { status: "ready", spec, assets, verifierReport: report, error: null });
        return;
      }
      problems = report.problems;
      await repo.updateGame(gameId, { verifierReport: report });
    }
    throw new Error(`quality checks failed after ${MAX_REPAIRS} repairs: ${problems.join("; ")}`);
  } catch (e) {
    await repo.updateGame(gameId, { status: "failed", error: msg(e) });
  }
}
