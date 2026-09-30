import { llmEnvelope, toGameSpec } from "@/domain/llm-check";
import type { Generator } from "@/pipeline/generators";
import { CONTENT_POLICY, conceptMapText } from "@/pipeline/prompt-shared";
import { ImpostorContentSchema, type ImpostorContent } from "./schema";
import { impostorChecks, MIN_TRUE_FACTS, ROUNDS } from "./validate";

const ImpostorSpecSchema = llmEnvelope("impostor", ImpostorContentSchema);

const SYSTEM = `You write rounds for "Impostor", a party game for studying (like Among Us). ${CONTENT_POLICY}
Each round, every player gets a fact card about one sub-topic. One player secretly gets a CORRUPTED fact. Each player reads their fact aloud AND explains why it's true; the group grills weak explanations and votes out who they think has the fake. The fun comes from bluffing and arguing (like Werewolf / Among Us), so facts must be things a student can explain and defend, not isolated trivia. Only students who truly understand the concept can spot the fake or catch a bluff.

STYLE (cards are read aloud at a party — keep them snappy)
- 8th-grade reading level. Plain words; no jargon beyond the unit's own terms.
- Every fact card (true or corrupted) ≤ 20 words, one sentence, and still contains a because/so clause.
- explanation ≤ 40 words. briefing: 1–2 short sentences on how to play. intro and outros: 1–2 short sentences. Use a playful, game-show tone with a bit of humor.

Write exactly ${ROUNDS} rounds, each on a different sub-topic, getting harder each round.
Per round:
- true_facts: ${MIN_TRUE_FACTS}–10 distinct, correct, specific facts about the sub-topic, each ONE sentence with a causal clause (because / so / which / as), so a player can explain WHY it's true. No names, numbers, or locations without a reason. At least one true fact lets a student who understands the concept REASON to the fake's error (never by repeating its words).
- corrupted_fact: ONE sentence on this round's exact sub-topic, sharing key terms with at least 2 true facts, built from a real misconception in the map by swapping a location, direction, cause, or quantity. Plausible, never absurd. Its length must be within ±15% of the median true fact (count characters) and it must never be the longest card.
- correct_version: the corrupted sentence, fixed. explanation: 1–2 sentences on the misconception and why it's wrong.
Fill topic and concept_ids for every round. Round 1 must still require understanding, not a famous misconception. Use concept names in text, never concept ids. checks: [] (leave empty). asset_requests: [].`;

export const generateImpostor: Generator = async ({ llm, map, targetConceptIds }) => {
  const out = await llm.parseStructured({
    schema: ImpostorSpecSchema, system: SYSTEM, effort: "medium", maxTokens: 16000, mode: "json",
    content: [{ type: "text", text: `Concept Map:\n${conceptMapText(map)}\n\nFocus concepts: ${targetConceptIds.join(", ") || "the most testable"}` }],
  });
  const spec = toGameSpec<ImpostorContent>(out as never);
  return { ...spec, mode: "impostor", asset_requests: [], checks: impostorChecks(spec.content) };
};
