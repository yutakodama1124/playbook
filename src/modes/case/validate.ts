import type { ConceptMap } from "@/domain/concept-map";
import type { CaseContent } from "./schema";

export function validateCase(c: CaseContent, map: ConceptMap): string[] {
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
  if (c.solution.chain.length < 2) problems.push("solution chain needs at least 2 steps");
  for (const s of c.solution.chain) if (!concepts.has(s.concept_id)) problems.push(`solution step references unknown concept ${s.concept_id}`);
  for (const f of c.field_guide) if (!concepts.has(f.concept_id)) problems.push(`field guide references unknown concept ${f.concept_id}`);
  return problems;
}
