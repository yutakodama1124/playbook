import { z } from "zod";

// Flat, grammar-safe shape (no unions/records) — Claude fills this directly.
export const CaseCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),              // e.g. "pharmacist", "patient", "site engineer"
  bio: z.string(),               // public
  is_mentor: z.boolean(),        // the one character who teaches concepts
  secret: z.string(),            // hidden
  alibi: z.string(),             // hidden
  knows: z.array(z.string()),    // hidden facts they can reveal when asked the right question
  lies_about: z.string(),        // hidden; "" if honest
  speaking_style: z.string(),    // hidden
  portrait_tags: z.array(z.string()),
});

export const CaseContentSchema = z.object({
  theme: z.enum(["mystery", "patient", "system"]),
  premise: z.string(),
  setting: z.string(),
  setting_tags: z.array(z.string()),
  characters: z.array(CaseCharacterSchema),
  evidence: z.array(z.object({
    id: z.string(),
    title: z.string(),
    text: z.string(),              // written so reading it teaches the concept it hinges on
    concept_ids: z.array(z.string()),
    points_to: z.array(z.string()), // character ids or accusation option ids it implicates/supports
  })),
  accusation: z.object({
    prompt: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string(), character_id: z.string().nullable() })),
    correct_option_id: z.string(),
    wrong_option_feedback: z.array(z.object({ option_id: z.string(), feedback: z.string() })),
  }),
  solution: z.object({
    summary: z.string(),
    chain: z.array(z.object({ step: z.string(), concept_id: z.string() })),
  }),
  field_guide: z.array(z.object({
    concept_id: z.string(), title: z.string(), explanation: z.string(), source_ref: z.string().nullable(),
  })),
});

export type CaseCharacter = z.infer<typeof CaseCharacterSchema>;
export type CaseContent = z.infer<typeof CaseContentSchema>;
