import type { ConceptMap } from "@/domain/concept-map";
import type { Check } from "@/domain/game-spec";
import type { ImpostorContent } from "./schema";

export const ROUNDS = 5, MIN_TRUE_FACTS = 9;

/** Readability limits (word counts): fact cards are read aloud, so keep them short. */
export const IMPOSTOR_WORD_LIMITS = { fact: 25, explanation: 40 } as const;
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function validateImpostor(c: ImpostorContent, map: ConceptMap): string[] {
  const problems: string[] = [];
  const concepts = new Set(map.concepts.map((x) => x.id));
  if (c.rounds.length !== ROUNDS) problems.push(`impostor needs exactly ${ROUNDS} rounds, got ${c.rounds.length}`);
  c.rounds.forEach((r, i) => {
    const distinct = new Set(r.true_facts.map((f) => f.trim().toLowerCase()));
    if (distinct.size < MIN_TRUE_FACTS) problems.push(`round ${i + 1} needs at least ${MIN_TRUE_FACTS} distinct true facts`);
    if (distinct.has(r.corrupted_fact.trim().toLowerCase())) problems.push(`round ${i + 1}: corrupted fact also appears as a true fact`);
    // Format tells: the fake must not be spottable by length alone.
    const lengths = r.true_facts.map((f) => f.length).sort((a, b) => a - b);
    const median = lengths[Math.floor(lengths.length / 2)] ?? 0;
    if (median && (r.corrupted_fact.length < median * 0.75 || r.corrupted_fact.length > median * 1.3))
      problems.push(`round ${i + 1}: corrupted fact length (${r.corrupted_fact.length} chars) stands out from the true facts (median ${median}) — match their length and style`);
    if (lengths.length && r.corrupted_fact.length > lengths[lengths.length - 1]) problems.push(`round ${i + 1}: corrupted fact is the longest card — shorten it`);
    if (r.concept_ids.length === 0) problems.push(`round ${i + 1} needs concept_ids`);
    if (r.correct_version.trim().toLowerCase() === r.corrupted_fact.trim().toLowerCase()) problems.push(`round ${i + 1}: correct_version must differ from the corrupted fact`);
    const L = IMPOSTOR_WORD_LIMITS, tooLong = (what: string, s: string, max: number) => {
      const n = wordCount(s); if (n > max) problems.push(`round ${i + 1}: ${what} is too long (${n} words, max ${max}) — keep it short and simple`);
    };
    r.true_facts.forEach((f, k) => tooLong(`true fact ${k + 1}`, f, L.fact));
    tooLong("corrupted fact", r.corrupted_fact, L.fact);
    tooLong("explanation", r.explanation, L.explanation);
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
      id: `impostor_r${i + 1}`, kind: "choice", concept_ids: r.concept_ids,
      prompt: `${r.topic}: one of these facts is fake. Which one?`,
      hints: ["Three of these are straight from the unit. Which one would a confused student say?",
        `Think about the concept behind "${r.topic}" — what exactly happens, and where?`,
        "Check each statement word by word: the fake usually swaps a place, a direction, or a cause."],
      options, answer: r.corrupted_fact,
      feedback_by_wrong: Object.fromEntries(truths.map((t) => [t, "That one is true. Look for the statement that swaps a detail."])),
    };
  });
}
