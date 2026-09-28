import { llmEnvelope, toGameSpec } from "@/domain/llm-check";
import type { Generator } from "@/pipeline/generators";
import { CONTENT_POLICY, conceptMapText } from "@/pipeline/prompt-shared";
import { EscapeContentSchema, type EscapeContent } from "./schema";
import { escapeAssetRequests } from "./logic";

const EscapeSpecSchema = llmEnvelope("escape", EscapeContentSchema);

const SYSTEM = `You design a 2-room digital escape room built from a student's Concept Map. ${CONTENT_POLICY}
THE CORE RULE: every lock opens only by APPLYING a concept (compute a value, predict an outcome, order a process, match causes to effects). No trivia recall, no guessing.
Theme the rooms to fit the subject (e.g. a sealed lab, a spaceship, a museum archive, a 1914 war office). Room 2 is harder than room 1.
Each room: 3–5 hotspots (distinct objects a student would click: cabinet, terminal, microscope, safe, map). zone: where the object sits in a 3x3 grid of the scene; spread hotspots across different zones.
- 2–3 hotspots per room are LOCKS: lock_check_id = the id of a check in "checks". Every check is used by exactly one hotspot.
- Other hotspots are CLUE objects (lock_check_id ""): their description contains information needed for a lock, written so reading it teaches the concept.
- reveals_clue: text shown after the lock opens (a code fragment, a note, the next hint); "" if none.
- description: what the student sees when examining the object (1–3 sentences).
Checks (one per lock, 4–6 total): kind by what fits — number: answer_number, tolerance, formula (mathjs expression computing answer_number); choice: options, answer=[correct], wrong_feedback for EVERY wrong option (misconception-based); order: options=items shuffled, answer=correct sequence; set: options, answer=correct members; match: pairs. Leave unused fields empty/null. Hints: exactly 3 — nudge, concept explanation, worked SIMILAR example; never the answer.
Field guide: one entry per concept used, with source_ref copied from the concept. scene_tags: 3–5 plain tags describing each room's look.
NEVER write concept ids in student-facing text; use concept names. The briefing introduces the key concepts in-world (2–4 sentences) without giving answers. asset_requests: [].`;

export const generateEscape: Generator = async ({ llm, map, targetConceptIds }) => {
  const out = await llm.parseStructured({
    schema: EscapeSpecSchema, system: SYSTEM, effort: "medium", maxTokens: 24000, mode: "json",
    content: [{ type: "text", text: `Concept Map:\n${conceptMapText(map)}\n\nFocus concepts: ${targetConceptIds.join(", ") || "the most testable"}` }],
  });
  const spec = toGameSpec<EscapeContent>(out as never);
  return { ...spec, mode: "escape", asset_requests: escapeAssetRequests(spec.content) };
};
