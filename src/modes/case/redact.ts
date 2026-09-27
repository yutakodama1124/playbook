import type { CaseContent } from "./schema";

export type PublicCaseContent = {
  theme: CaseContent["theme"];
  premise: string;
  setting: string;
  characters: { id: string; name: string; role: string; bio: string; is_mentor: boolean }[];
  evidence: { id: string; title: string; text: string; concept_ids: string[] }[];
  accusation: { prompt: string; options: { id: string; label: string; character_id: string | null }[] };
  field_guide: CaseContent["field_guide"];
};

export function redactCase(c: CaseContent): PublicCaseContent {
  return {
    theme: c.theme,
    premise: c.premise,
    setting: c.setting,
    characters: c.characters.map(({ id, name, role, bio, is_mentor }) => ({ id, name, role, bio, is_mentor })),
    evidence: c.evidence.map(({ id, title, text, concept_ids }) => ({ id, title, text, concept_ids })),
    accusation: { prompt: c.accusation.prompt, options: c.accusation.options },
    field_guide: c.field_guide,
  };
}
