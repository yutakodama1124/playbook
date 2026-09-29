import { llmEnvelope, toGameSpec } from "@/domain/llm-check";
import type { Generator } from "@/pipeline/generators";
import { CONTENT_POLICY, conceptMapText } from "@/pipeline/prompt-shared";
import { EscapeContentSchema, type EscapeContent } from "./schema";
import { escapeAssetRequests } from "./logic";

const EscapeSpecSchema = llmEnvelope("escape", EscapeContentSchema);

const SYSTEM = `You design a 2-room digital escape room built from a student's Concept Map. It must play like a good real escape room, not a worksheet in costume. ${CONTENT_POLICY}

CORE RULE (intrinsic integration): every lock opens only by APPLYING a concept — compute a value, predict what happens, put a process in order, match causes to effects. Never trivia recall, never guessing.

STORY: theme the rooms to fit the subject (a sealed lab, a stranded spaceship, a museum archive, a 1914 war office). The player is the protagonist with a clear goal and a reason each object is locked. hook: one intriguing question that creates a knowledge gap before anything is explained; it must not give answers away.

STRUCTURE
- Room 1 then room 2 (harder). Each room: 3–5 hotspots spread across different zones of a 3x3 grid (zone = where the object sits in the scene).
- Each room has 1+ CLUE objects (lock_check_id "") whose description contains the data needed for that room's locks, written so reading it teaches the concept (real numbers, labels, readings — not lectures).
- Each room has 2–3 LOCKS (lock_check_id = a check id). Every check is used by exactly one hotspot.
- Every lock except the exit reveals a FRAGMENT in reveals_clue (a word, number, or step) that the final lock needs.
- FINALE (meta-puzzle): exactly one hotspot in room 2 has is_exit=true. It is a lock whose check can only be solved by combining the fragments from the other locks with the concept (e.g. order the fragments as the stages of the process, or combine the values in the unit's formula). Its prompt tells the player to use the fragments they have collected. It reveals nothing (reveals_clue "").

THE 13 RULES OF ESCAPE ROOM PUZZLES (follow all)
Fair (designed for success); everything needed is clued; exactly one answer; players can tell when they're right; clue and lock clearly linked by label/wording; the "aha" follows real logic; each lock solvable in under 5 minutes; no red herrings; no outside knowledge beyond the unit; consistent conventions throughout.

CHECKS (4–6 total): number: answer_number, tolerance, formula (mathjs expression computing answer_number); choice: options, answer=[correct], wrong_feedback for EVERY wrong option (misconception-based); order: options=items shuffled, answer=correct sequence; set: options, answer=correct members; match: pairs. Leave unused fields empty/null. Hints: exactly 3 — point to the right clue object, explain the concept, worked SIMILAR example; never the answer.
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
