// Validates the hand-checked sample games against the current rules (no API calls).
import { readFileSync } from "node:fs";
import { ConceptMapSchema } from "../src/domain/concept-map.ts";
import { llmEnvelope, toGameSpec } from "../src/domain/llm-check.ts";
import { CaseContentSchema } from "../src/modes/case/schema.ts";
import { EscapeContentSchema } from "../src/modes/escape/schema.ts";
import { ImpostorContentSchema } from "../src/modes/impostor/schema.ts";
import { impostorChecks } from "../src/modes/impostor/validate.ts";
import { verifyGame } from "../src/pipeline/verify.ts";
import { caseAssetRequests } from "../src/modes/case/generate.ts";
import { escapeAssetRequests } from "../src/modes/escape/logic.ts";

const load = (f: string) => JSON.parse(readFileSync(`fixtures/samples/${f}`, "utf8"));
export function sampleGames() {
  const resp = ConceptMapSchema.parse(load("respiration.map.json"));
  const photo = ConceptMapSchema.parse(load("photosynthesis.map.json"));
  const kase = toGameSpec(llmEnvelope("case", CaseContentSchema).parse(load("respiration.case.json")) as never);
  const escape = toGameSpec(llmEnvelope("escape", EscapeContentSchema).parse(load("photosynthesis.escape.json")) as never);
  const imp = toGameSpec(llmEnvelope("impostor", ImpostorContentSchema).parse(load("photosynthesis.impostor.json")) as never);
  return { resp, photo, games: [
    // Same post-processing the generators apply (asset requests are derived in code, not by the model).
    { map: resp, spec: { ...kase, asset_requests: caseAssetRequests(kase.content as never) } },
    { map: photo, spec: { ...escape, asset_requests: escapeAssetRequests(escape.content as never) } },
    { map: photo, spec: { ...imp, checks: impostorChecks(imp.content as never) } },
  ] };
}

if (process.argv[1]?.endsWith("check-samples.mts")) {
  for (const { map, spec } of sampleGames().games) {
    const r = verifyGame(spec as never, map);
    console.log(spec.mode, r.ok ? "OK" : "FAIL"); for (const p of r.problems) console.log("  -", p);
  }
}
