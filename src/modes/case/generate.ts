import type { GameSpec } from "@/domain/game-spec";
import { llmEnvelope, toGameSpec } from "@/domain/llm-check";
import type { Generator } from "@/pipeline/generators";
import { CONTENT_POLICY, conceptMapText } from "@/pipeline/prompt-shared";
import { CaseContentSchema, type CaseContent } from "./schema";

const CaseSpecSchema = llmEnvelope("case", CaseContentSchema);

export function caseAssetRequests(c: CaseContent): GameSpec["asset_requests"] {
  return [
    { role: "scene", tags: c.setting_tags },
    ...c.characters.map((ch) => ({ role: `portrait:${ch.id}`, tags: [...ch.portrait_tags, ch.role] })),
  ];
}

const SYSTEM = `You design "Case Files": a courtroom-detective game in the style of Ace Attorney, built from a student's Concept Map. Witnesses testify, the player PRESSES statements for detail and PRESENTS evidence to expose the one statement per testimony that the evidence disproves. It must feel like a game a teenager would choose to play, not a worksheet. ${CONTENT_POLICY}

CORE RULE (intrinsic integration): every contradiction is only visible if you APPLY a concept. The evidence never says "this statement is false"; the player has to reason "if X were true, the data would show Y, but it shows Z." Motive, tone, or trivia recall alone must never expose a lie.

STYLE (very important)
- 8th-grade reading level. Short sentences. Plain words; only use the unit's own terms.
- Witnesses have distinct, fun personalities (nervous, smug, overly cheerful, grumpy) and talk like real people. A little humor is good.
- Word limits (hard): statement ≤ 22 words, press_reply ≤ 30, evidence detail ≤ 30, key_fact ≤ 12 (the one line the player must notice), bio ≤ 20, premise ≤ 60, breakthrough ≤ 35, contradiction explanation ≤ 50, finale explanation ≤ 55.

THEME — pick what fits the subject: "mystery" (sabotage, theft, or a staged accident — never a killing), "patient" (options = diagnoses), or "system" (something failing; options = root causes).

STRUCTURE
- hook: one intriguing question specific to THIS case that creates a knowledge gap without giving the answer away.
- characters: exactly 1 mentor (is_mentor=true; the player's partner who gives hints; never a witness or an option) + 3–4 others. The culprit must NOT be the most obvious by role or motive.
- evidence (5–8 items), written as in-world items (probe logs, lab sheets, receipts, texts) with real data. 2–4 start in the file (starts_in_file=true). Every other item is unlocked by PRESSING exactly one statement (press_unlocks_evidence_id), and that press_reply should naturally mention handing it over.
- testimonies: exactly 3, escalating. 1 = WHAT happened, 2 = HOW (which step or mechanism failed), 3 = WHO. Each: a witness (not the mentor), a short title, 4–5 statements, exactly one contradiction {statement_id, evidence_id, concept_id, explanation}. The contradicting evidence must be in the file by then (starting, or unlocked by a press in this or an earlier testimony). At least one press in testimonies 1–2 unlocks evidence needed later. breakthrough = what the witness blurts out after being caught; it should feel like a reveal that moves the case forward.
- Make wrong presents tempting: at least one other statement per testimony should sound suspicious (built from a real misconception) but be TRUE.
- hints: exactly 3 per testimony, from the mentor: a nudge toward which data matters → the concept explained simply → nearly there. Never name the exact statement and evidence pair.
- finale: question (e.g. "Who sabotaged the lab?"), 3–4 options (non-mentor characters, character_id set), correct_option_id, proof_evidence_id (the one item that proves it), wrong_option_feedback for EVERY wrong option correcting the misconception behind it, and an explanation that ties the science together.
- field_guide: one entry per concept used, student-level, source_ref copied from the concept.

QUALITY BAR
- One defensible contradiction per testimony and one defensible verdict. Numbers realistic and consistent.
- The title, hook, intro, premise, and briefing must not hint at the culprit.
- NEVER write concept ids (like c_something) in any text a student reads — use concept names.
- checks: [] (this mode grades testimonies, not checks).
briefing: 2–3 short in-world sentences naming the concepts the player will need as tools. setting_tags: 3–5 plain tags describing the location; portrait_tags: 2–4 plain tags per character (age, look, job).
IDs: characters "ch_…", evidence "e_…", testimonies "t_…", statements "s_…", options "opt_…". Never start a non-concept id with "c_".`;

export const generateCase: Generator = async ({ llm, map, targetConceptIds }) => {
  const out = await llm.parseStructured({
    schema: CaseSpecSchema,
    system: SYSTEM,
    effort: "medium", // high took ~190s; medium keeps generation inside serverless time limits
    maxTokens: 32000,
    mode: "json", // case schema exceeds structured-output grammar limits
    content: [{ type: "text", text: `Concept Map:\n${conceptMapText(map)}\n\nFocus concepts: ${targetConceptIds.join(", ") || "choose the most testable"}` }],
  });
  const spec = toGameSpec<CaseContent>(out as never);
  return { ...spec, mode: "case", asset_requests: caseAssetRequests(spec.content) };
};
