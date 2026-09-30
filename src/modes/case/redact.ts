import type { CaseContent } from "./schema";
import { startingEvidence } from "./trial";

/** What the browser may see: testimony text and in-file evidence. No contradictions, press replies, locked evidence, or answers. */
export function redactCase(c: CaseContent) {
  return {
    theme: c.theme, premise: c.premise, setting: c.setting,
    characters: c.characters.map(({ id, name, role, bio, is_mentor }) => ({ id, name, role, bio, is_mentor })),
    evidence: startingEvidence(c),
    testimonies: c.testimonies.map((t) => ({
      id: t.id, witness_id: t.witness_id, title: t.title, hints: t.hints,
      statements: t.statements.map(({ id, text }) => ({ id, text })),
    })),
    finale: { question: c.finale.question, options: c.finale.options },
    field_guide: c.field_guide,
  };
}
export type PublicCaseContent = ReturnType<typeof redactCase>;
