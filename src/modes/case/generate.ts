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

const SYSTEM = `You design "Case Files": a detective game built from a student's Concept Map. It must play like a real mystery (think Return of the Obra Dinn or a good whodunit), not a quiz with a story pasted on. ${CONTENT_POLICY}

CORE RULE (intrinsic integration): the investigation IS the learning. The case can only be cracked by APPLYING the unit's concepts to evidence. Motive, body language, or trivia recall alone must never be enough.

THEME — pick what fits the subject:
- "mystery": sabotage, theft, or a staged accident (never a killing). Accusation options = suspects.
- "patient": a patient with symptoms. Options = diagnoses. Characters = patient, family, nurse.
- "system": something failing (a bridge, an economy, an ecosystem, a program). Options = root causes.

STRUCTURE
- hook: one intriguing question specific to THIS case that creates a knowledge gap before anything is explained (for example, for a physics unit: "Why did the heavier cart lose the race downhill?" — never reuse this example). Must not give the answer away.
- Characters: 3–4 involved characters + exactly 1 mentor (is_mentor=true, an expert who teaches concepts Socratically and is never an option). Each non-mentor: a secret, an alibi, facts they know, what they lie about ("" if honest), a distinct speaking style. Secrets and alibis must fit together into one consistent timeline.
- Every non-mentor has a believable motive or opportunity and something to hide. The culprit must NOT be the most obvious by role or motive (no "the rival did it"). Only the concept applied to the evidence separates them.
- Evidence (6–8 items), written as in-world documents (lab reports, logs, receipts, charts, messages) whose text teaches the concept it hinges on through real data or details, not lectures.
  - 3–4 items are in the file from the start (unlocked_by "").
  - 2–4 items must be DISCOVERED: unlocked_by = the id of a non-mentor character who hands it over only when asked about unlock_topic. unlock_topic is a short noun phrase (2–6 words) naming a concrete thing a curious detective would think to ask about after reading the other evidence (e.g. "the oxygen probe log"). The player is only told WHO knows more, not what, so the evidence they already have must point toward the topic. Every discovered item must be needed by at least one board row.
- THREE CLUE RULE: at least 3 evidence items support the correct option, and at least 2 of them directly tie the concept conclusion to that option. List in points_to only the options or characters an item genuinely implicates (at most 2). Each wrong option is made tempting by at least 1 evidence item tied to a real misconception from the map, and is ruled out once the concept is applied correctly.
- Case board (3–5 rows): the reasoning chain up to, but NOT including, the final answer — what the data show → what that rules out → which step or mechanism failed. At least one row is a number check computed from evidence data. Never put the culprit, diagnosis, or root cause on the board; the accusation is where the player combines the rows into the final call. Each row has its own check (kind choice or number only) and cites the evidence_ids needed to answer it. Rows are confirmed only in batches, so each must have exactly one defensible answer.
- Accusation: the final call. Option labels short (max 8 words), neutral, no mechanism given away. wrong_option_feedback corrects the misconception behind each wrong option.
- Solution chain: 3–5 steps from evidence to answer, each tied to a concept id.
- Field guide: one entry per concept used, student-level, with source_ref copied from the concept.

QUALITY BAR
- Every answer must be derivable from in-game information plus the concept. One defensible answer per question.
- No filler questions (no arithmetic unrelated to the concept, no "what is the definition of X").
- Numbers in evidence must be realistic and internally consistent.
- The title, hook, intro, premise, and briefing must not hint at which option is correct.
- NEVER write concept ids (like c_something) in any text a student reads — use concept names.

CHECK FIELDS by kind — number: answer_number, tolerance, formula (mathjs expression computing answer_number); choice: options, answer=[correct], wrong_feedback for EVERY wrong option. All other fields (pairs, etc.) = [] or null. Number checks always include a formula, even if it is just the value from the evidence. For number rows, hint 2 names the most likely wrong value and the misconception behind it. Hints: exactly 3 — a nudge toward the right evidence, an explanation of the concept, a worked SIMILAR example; never the answer.
briefing: 2–4 sentences, in-world, naming the concepts the detective will need as tools, without saying which mechanism happened in this case. setting_tags: 3–5 plain tags describing the location.
IDs: characters "ch_…", evidence "e_…", options "opt_…", board rows "row_…", checks "k_…". Never start a non-concept id with "c_".`;

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
