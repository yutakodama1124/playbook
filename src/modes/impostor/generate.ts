import { llmEnvelope, toGameSpec } from "@/domain/llm-check";
import type { Generator } from "@/pipeline/generators";
import { CONTENT_POLICY, conceptMapText } from "@/pipeline/prompt-shared";
import { ImpostorContentSchema, type ImpostorContent } from "./schema";
import { impostorChecks, MIN_TRUE_FACTS, ROUNDS } from "./validate";

const ImpostorSpecSchema = llmEnvelope("impostor", ImpostorContentSchema);

const SYSTEM = `You write rounds for "Impostor", a party game for studying (like Among Us). ${CONTENT_POLICY}
Each round, every player gets a fact card about one sub-topic. One player secretly gets a CORRUPTED fact. Each player reads their fact aloud AND explains why it's true; the group questions weak explanations and votes out who they think has the fake. The fun comes from bluffing and argument (like Werewolf / Among Us), so facts must be things a student can explain and defend, not isolated trivia. Only students who truly understand the concept can spot the fake or catch a bluffed explanation.
Write exactly ${ROUNDS} rounds, each on a different sub-topic, getting harder each round.
Per round:
- true_facts: ${MIN_TRUE_FACTS}–10 distinct, correct, specific facts about the sub-topic, each one sentence, similar length and style. Prefer mechanism-level facts (what happens, where, why, with what effect) that invite an explanation; no facts that directly contradict or expose the fake.
- corrupted_fact: ONE sentence in the same style that is subtly wrong — built from a real student misconception in the map (swap a location, direction, cause, or quantity). It must be plausible, never absurd.
- correct_version: the corrupted sentence, fixed. explanation: 1–2 sentences on the misconception and why it's wrong.
Use concept names in text, never concept ids. checks: [] (leave empty). briefing: 1–2 sentences on how to play. asset_requests: [].`;

export const generateImpostor: Generator = async ({ llm, map, targetConceptIds }) => {
  const out = await llm.parseStructured({
    schema: ImpostorSpecSchema, system: SYSTEM, effort: "medium", maxTokens: 16000, mode: "json",
    content: [{ type: "text", text: `Concept Map:\n${conceptMapText(map)}\n\nFocus concepts: ${targetConceptIds.join(", ") || "the most testable"}` }],
  });
  const spec = toGameSpec<ImpostorContent>(out as never);
  return { ...spec, mode: "impostor", asset_requests: [], checks: impostorChecks(spec.content) };
};
