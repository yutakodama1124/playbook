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

const SYSTEM = `You design "Case Files": a detective-style learning game built from a student's Concept Map. ${CONTENT_POLICY}
THE CORE RULE: the case can only be solved by APPLYING the unit's concepts. Guessing, body language, or motive alone must not be enough.
Theme:
- "mystery": sabotage, theft, or a staged accident (never a killing). Accusation options = the suspects.
- "patient": a patient with symptoms. Accusation options = possible diagnoses. Characters = patient, family, nurse.
- "system": something failing (a bridge, an economy, an ecosystem, a program). Accusation options = root causes.
Pick the theme that best fits the unit's subject.
Characters: 3–4 involved characters + exactly 1 mentor (is_mentor=true: a scientist/coroner/expert who teaches concepts Socratically and is never a suspect).
Each non-mentor has a secret, an alibi, facts they know (revealed only when asked the right question), and what they lie about ("" if honest). Portrait_tags: role, age, look (e.g. ["pharmacist","middle-aged","woman"]).
Evidence: 5–7 items. Write each as an in-world document (lab report, log, receipt, chart) whose text teaches the concept it hinges on. points_to = ids of characters/options it supports.
Accusation option labels: short (max 8 words), neutral, and must not explain the mechanism — the student has to reason it out.
Red herring: at least one wrong option must look right to a student holding a common misconception from the map; its wrong_option_feedback corrects that misconception.
Solution chain: 3–5 steps from evidence to answer, each tied to a concept id.
Field guide: one entry per concept used, a clear student-level explanation, with source_ref copied from the concept.
Checks: 2–3 "deduction" checks the student answers mid-case (predict or apply a concept to the evidence). Check fields by kind — number: answer_number, tolerance, formula (mathjs expression computing answer_number); choice: options, answer=[correct], wrong_feedback for EVERY wrong option; order: options=items shuffled, answer=correct sequence; set: options, answer=correct members; match: pairs. Leave unused fields empty/null. Hints: exactly 3 — nudge, concept explanation, similar worked example; never the answer.
briefing: 2–4 sentences, in-world, introducing the key concepts the detective will need (pre-training). Use only concept ids from the map. setting_tags: 3–5 plain tags describing the location.`;

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
