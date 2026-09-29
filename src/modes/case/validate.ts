import type { ConceptMap } from "@/domain/concept-map";
import type { Check } from "@/domain/game-spec";
import type { CaseContent } from "./schema";

export function validateCase(c: CaseContent, map: ConceptMap, checks: Check[]): string[] {
  const problems: string[] = [];
  const concepts = new Set(map.concepts.map((x) => x.id));
  const charIds = new Set(c.characters.map((x) => x.id));
  const optionIds = new Set(c.accusation.options.map((o) => o.id));
  const refIds = new Set([...charIds, ...optionIds]);

  const mentors = c.characters.filter((x) => x.is_mentor).length;
  if (mentors !== 1) problems.push(`case needs exactly 1 mentor character, found ${mentors}`);
  if (c.characters.length - mentors < 3) problems.push("case needs at least 3 non-mentor characters");
  if (charIds.size !== c.characters.length) problems.push("duplicate character ids");

  if (!optionIds.has(c.accusation.correct_option_id)) problems.push(`accusation correct_option_id ${c.accusation.correct_option_id} is not an option`);
  if (c.accusation.options.length < 3) problems.push("accusation needs at least 3 options");
  const fb = new Set(c.accusation.wrong_option_feedback.map((f) => f.option_id));
  for (const o of c.accusation.options)
    if (o.id !== c.accusation.correct_option_id && !fb.has(o.id)) problems.push(`missing wrong-option feedback for ${o.id}`);
  for (const o of c.accusation.options)
    if (o.character_id && !charIds.has(o.character_id)) problems.push(`option ${o.id} references unknown character ${o.character_id}`);

  if (c.evidence.length < 4) problems.push("case needs at least 4 evidence items");
  for (const e of c.evidence) {
    for (const id of e.concept_ids) if (!concepts.has(id)) problems.push(`evidence ${e.id} references unknown concept ${id}`);
    for (const id of e.points_to) if (!refIds.has(id)) problems.push(`evidence ${e.id} points to unknown id ${id}`);
  }
  // Fair-play rules: the answer must be provable, and every wrong option must be tempting for a reason.
  const supports = (optId: string) => {
    const o = c.accusation.options.find((x) => x.id === optId);
    return c.evidence.filter((e) => e.points_to.includes(optId) || (!!o?.character_id && e.points_to.includes(o.character_id))).length;
  };
  // Three Clue Rule: players miss clues, so the key conclusion needs redundancy.
  if (optionIds.has(c.accusation.correct_option_id) && supports(c.accusation.correct_option_id) < 3)
    problems.push("correct option needs at least 3 evidence items pointing to it (three clue rule: players miss clues)");
  for (const o of c.accusation.options)
    if (o.id !== c.accusation.correct_option_id && supports(o.id) === 0)
      problems.push(`wrong option ${o.id} has no evidence making it tempting — add a red-herring clue tied to a misconception`);
  // Discovery: some evidence is in the file, some must be earned by asking the right person.
  const nonMentors = new Set(c.characters.filter((x) => !x.is_mentor).map((x) => x.id));
  const start = c.evidence.filter((e) => !e.unlocked_by), locked = c.evidence.filter((e) => e.unlocked_by);
  if (start.length < 2) problems.push("case needs at least 2 evidence items available at the start");
  if (locked.length < 2) problems.push("case needs at least 2 evidence items discovered by questioning characters");
  for (const e of locked) {
    if (!nonMentors.has(e.unlocked_by)) problems.push(`evidence ${e.id} is unlocked by ${e.unlocked_by}, which must be a non-mentor character`);
    if (!e.unlock_topic.trim()) problems.push(`evidence ${e.id} needs an unlock_topic (what to ask about)`);
  }
  // Case board (Obra Dinn-style): 3–5 rows, each graded by its own choice/number check.
  const checkById = new Map(checks.map((k) => [k.id, k]));
  const evidenceIds = new Set(c.evidence.map((e) => e.id));
  if (c.board.length < 3 || c.board.length > 5) problems.push(`case board needs 3–5 rows, got ${c.board.length}`);
  const usedChecks = new Map<string, number>();
  for (const row of c.board) {
    const k = checkById.get(row.check_id);
    if (!k) problems.push(`board row ${row.id} uses unknown check ${row.check_id}`);
    else if (k.kind !== "choice" && k.kind !== "number") problems.push(`board row ${row.id} must use a choice or number check, not ${k.kind}`);
    usedChecks.set(row.check_id, (usedChecks.get(row.check_id) ?? 0) + 1);
    for (const id of row.evidence_ids) if (!evidenceIds.has(id)) problems.push(`board row ${row.id} cites unknown evidence ${id}`);
  }
  for (const [id, n] of usedChecks) if (n > 1) problems.push(`check ${id} is used by more than one board row`);
  for (const k of checks) if (!usedChecks.has(k.id)) problems.push(`check ${k.id} is not on the case board`);
  if (c.solution.chain.length < 2) problems.push("solution chain needs at least 2 steps");
  for (const s of c.solution.chain) if (!concepts.has(s.concept_id)) problems.push(`solution step references unknown concept ${s.concept_id}`);
  for (const f of c.field_guide) if (!concepts.has(f.concept_id)) problems.push(`field guide references unknown concept ${f.concept_id}`);
  return problems;
}
