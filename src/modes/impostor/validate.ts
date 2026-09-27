import type { ConceptMap } from "@/domain/concept-map";
import type { Check } from "@/domain/game-spec";
import type { ImpostorContent } from "./schema";

export const ROUNDS = 5, MIN_TRUE_FACTS = 9;

export function validateImpostor(c: ImpostorContent, map: ConceptMap): string[] {
  const problems: string[] = [];
  const concepts = new Set(map.concepts.map((x) => x.id));
  if (c.rounds.length !== ROUNDS) problems.push(`impostor needs exactly ${ROUNDS} rounds, got ${c.rounds.length}`);
  c.rounds.forEach((r, i) => {
    const distinct = new Set(r.true_facts.map((f) => f.trim().toLowerCase()));
    if (distinct.size < MIN_TRUE_FACTS) problems.push(`round ${i + 1} needs at least ${MIN_TRUE_FACTS} distinct true facts`);
    if (distinct.has(r.corrupted_fact.trim().toLowerCase())) problems.push(`round ${i + 1}: corrupted fact also appears as a true fact`);
    for (const id of r.concept_ids) if (!concepts.has(id)) problems.push(`round ${i + 1} references unknown concept ${id}`);
  });
  return problems;
}

/** Solo practice + mastery: for each round, "which of these is fake?" (fake + 3 true facts). */
export function impostorChecks(c: ImpostorContent): Check[] {
  return c.rounds.map((r, i) => {
    const truths = r.true_facts.slice(0, 3);
    const options = [...truths];
    options.splice(i % 4, 0, r.corrupted_fact); // deterministic position that varies by round
    return {
      id: `impostor_r${i + 1}`, kind: "choice", concept_ids: r.concept_ids.length ? r.concept_ids : ["c_unknown"],
      prompt: `${r.topic}: one of these facts is fake. Which one?`,
      hints: ["Three of these are straight from the unit. Which one would a confused student say?",
        `Think about the concept behind "${r.topic}" — what exactly happens, and where?`,
        "Check each statement word by word: the fake usually swaps a place, a direction, or a cause."],
      options, answer: r.corrupted_fact,
      feedback_by_wrong: Object.fromEntries(truths.map((t) => [t, "That one is true. Look for the statement that swaps a detail."])),
    };
  });
}
