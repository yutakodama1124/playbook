import { llmEnvelope, toGameSpec } from "@/domain/llm-check";
import type { Generator } from "@/pipeline/generators";
import { CONTENT_POLICY, conceptMapText } from "@/pipeline/prompt-shared";
import { EscapeContentSchema, type EscapeContent } from "./schema";
import { escapeAssetRequests } from "./logic";

const EscapeSpecSchema = llmEnvelope("escape", EscapeContentSchema);

const SYSTEM = `You design a 2-room digital escape room built from a student's Concept Map. It must play like a good real escape room, not a worksheet in costume. ${CONTENT_POLICY}

STYLE (this is a game, not a textbook — follow strictly)
- 8th-grade reading level. Short sentences (aim for under 15 words). One idea per sentence.
- Playful, story-driven voice with a bit of humor: urgent stakes, a quirky setting, objects with personality. Talk to the player as "you".
- No jargon beyond the unit's own terms. Never explain a term with a harder word.
- Hotspot descriptions: at most 2 sentences (≤ 45 words), plus a short data readout if it's a clue object (numbers and labels, not paragraphs).
- Lock prompts: ≤ 30 words, phrased as an in-world challenge from the object itself, e.g. "The keypad wants the number of ATP one glucose makes. Enter it."
- Fragments (reveals_clue): ≤ 10 words, punchy, e.g. "Meter: ATP = 21 per minute."
- Premise ≤ 60 words; room descriptions ≤ 40 words; briefing 2–4 short sentences; intro and outros 1–3 short sentences.
- Hints and feedback: short and friendly, 1–2 sentences each.

CORE RULE (intrinsic integration): every lock opens only by APPLYING a concept — compute a value, predict what happens, put a process in order, match causes to effects. Never trivia recall, never guessing.

STORY: theme the rooms to fit the subject (a sealed lab, a stranded spaceship, a museum archive, a 1914 war office). The player is the hero with a clear goal and a reason each object is locked. hook: one intriguing question that creates a knowledge gap before anything is explained; no answers.

STRUCTURE
- Room 1 then room 2 (harder). Each room: 3–5 hotspots, each in a different zone of a 3x3 grid (zone = where the object sits in the scene).
- Each room has 1+ CLUE objects (lock_check_id "") whose description holds the data its locks need, so reading it teaches the concept (real numbers, labels, readings — not lectures).
- Each room has 2–3 LOCKS (lock_check_id = a check id). Every check is used by exactly one hotspot.
- Every lock except the exit reveals a FRAGMENT in reveals_clue. At least 3 fragments must be numbers or items the exit's formula/answer directly uses; any other fragment must state a rule that changes how the exit is solved. The exit's answer must not appear anywhere in the room text.
- At most one lock per room may be a pure calculation; the others must require predicting, diagnosing, or deciding (the concept decides the answer, not arithmetic).
- FINALE (meta-puzzle): exactly one hotspot in room 2 has is_exit=true. It is a lock whose check can only be solved by combining the fragments from the other locks with the concept (e.g. order the fragments as the stages of the process, or combine the values in the unit's formula). Its prompt tells the player to use the fragments they collected. It reveals nothing (reveals_clue "").

THE 13 RULES OF ESCAPE ROOM PUZZLES (follow all)
Fair (designed for success); everything needed is clued; exactly one answer; players can tell when they're right; clue and lock clearly linked by label/wording; the "aha" follows real logic; each lock solvable in under 5 minutes; no red herrings; no outside knowledge beyond the unit; consistent conventions throughout.

CHECKS (4–6 total): number: answer_number, tolerance, formula (mathjs expression computing answer_number); choice: options, answer=[correct], wrong_feedback for EVERY wrong option (misconception-based); order: options=items shuffled, answer=correct sequence; set: options, answer=correct members; match: pairs. Leave unused fields empty/null; number checks always include a formula. Order items must NOT start in the correct order. Hints: exactly 3 — point to the right clue object; explain the concept (for number locks, name the most likely wrong value and its misconception); a worked SIMILAR example with different numbers that is not one step from the answer. Never the answer.
Field guide: one entry per concept used, source_ref copied from the concept; explanations in 1–2 plain sentences. scene_tags: 3–5 plain tags describing each room's look.
NEVER write concept ids in student-facing text; use concept names. Never start a non-concept id with "c_". The briefing introduces the key concepts in-world without giving answers. asset_requests: [].`;

export const generateEscape: Generator = async ({ llm, map, targetConceptIds }) => {
  const out = await llm.parseStructured({
    schema: EscapeSpecSchema, system: SYSTEM, effort: "medium", maxTokens: 24000, mode: "json",
    content: [{ type: "text", text: `Concept Map:\n${conceptMapText(map)}\n\nFocus concepts: ${targetConceptIds.join(", ") || "the most testable"}` }],
  });
  const spec = toGameSpec<EscapeContent>(out as never);
  return { ...spec, mode: "escape", asset_requests: escapeAssetRequests(spec.content) };
};
