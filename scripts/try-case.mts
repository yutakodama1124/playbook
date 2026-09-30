// Live check: generate a Case Files spec from an existing unit and run the verifier.
// Usage: npx tsx --env-file=.env.local scripts/try-case.mts <unitId>
import { createLlmClient } from "../src/lib/llm.ts";
import { createSupabaseRepo } from "../src/repo/supabase.ts";
import { generateCase } from "../src/modes/case/generate.ts";
import { verifyGame } from "../src/pipeline/verify.ts";
import type { CaseContent } from "../src/modes/case/schema.ts";

const unit = await createSupabaseRepo().getUnit(process.argv[2]);
if (!unit?.conceptMap) throw new Error("unit not found or not ready");
const t0 = Date.now();
const spec = await generateCase({ llm: createLlmClient(), map: unit.conceptMap, targetConceptIds: [], learnMode: true });
console.log(`generated in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(JSON.stringify(verifyGame(spec, unit.conceptMap)));
const c = spec.content as CaseContent;
console.log(spec.title, "|", c.theme, "|", c.premise);
console.log("people:", c.characters.map((x) => `${x.name} (${x.role}${x.is_mentor ? ", mentor" : ""})`).join("; "));
console.log("finale:", c.finale.options.map((o) => o.label).join(" / "), "| correct:", c.finale.correct_option_id);
for (const t of c.testimonies) console.log(`${t.title}: lie = "${t.statements.find((s) => s.id === t.contradiction.statement_id)?.text}" vs ${t.contradiction.evidence_id}`);
