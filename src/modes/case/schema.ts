import { z } from "zod";

/**
 * Case Files — "trial" format (inspired by Ace Attorney cross-examination).
 * Witnesses testify; the player PRESSes statements for more detail and PRESENTs the evidence
 * that contradicts one statement per testimony. The contradiction is only visible if you
 * apply the concept. Everything is generated up front, so play needs no AI calls.
 */
export const CaseCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  bio: z.string(),                   // ≤ 20 words, public
  is_mentor: z.boolean(),            // your partner: gives hints, never a suspect
  portrait_tags: z.array(z.string()),
});

export const EvidenceSchema = z.object({
  id: z.string(),
  title: z.string(),                 // 2–5 words
  detail: z.string(),                // ≤ 30 words
  key_fact: z.string(),              // ≤ 12 words — the line that matters, highlighted in the UI
  concept_ids: z.array(z.string()),
  starts_in_file: z.boolean(),       // false = unlocked by pressing a statement
});

export const StatementSchema = z.object({
  id: z.string(),
  text: z.string(),                  // ≤ 22 words, in the witness's voice
  press_reply: z.string(),           // ≤ 30 words: what they add when pressed
  press_unlocks_evidence_id: z.string(), // "" or the id of evidence this press reveals
});

export const TestimonySchema = z.object({
  id: z.string(),
  witness_id: z.string(),
  title: z.string(),                 // e.g. "What I saw at 2 a.m."
  statements: z.array(StatementSchema),
  contradiction: z.object({
    statement_id: z.string(),        // the false/impossible statement
    evidence_id: z.string(),         // evidence that proves it wrong once you apply the concept
    concept_id: z.string(),
    explanation: z.string(),         // ≤ 45 words: why it's a contradiction (shown after the OBJECTION)
  }),
  breakthrough: z.string(),          // ≤ 35 words: what the witness admits once caught
  hints: z.array(z.string()),        // exactly 3, from the mentor: vague → concept → nearly there (never names the statement + evidence pair)
});

export const CaseContentSchema = z.object({
  theme: z.enum(["mystery", "patient", "system"]),
  premise: z.string(),               // ≤ 60 words
  setting: z.string(),
  setting_tags: z.array(z.string()),
  characters: z.array(CaseCharacterSchema),
  evidence: z.array(EvidenceSchema),
  testimonies: z.array(TestimonySchema), // 3 witnesses, in order
  finale: z.object({
    question: z.string(),            // "Who sabotaged the cultures?" / "What's the diagnosis?"
    options: z.array(z.object({ id: z.string(), label: z.string(), character_id: z.string().nullable() })),
    correct_option_id: z.string(),
    proof_evidence_id: z.string(),   // the one piece of evidence that proves it
    wrong_option_feedback: z.array(z.object({ option_id: z.string(), feedback: z.string() })),
    explanation: z.string(),         // ≤ 60 words: the science behind the whole case
  }),
  field_guide: z.array(z.object({ concept_id: z.string(), title: z.string(), explanation: z.string(), source_ref: z.string().nullable() })),
});

export type CaseCharacter = z.infer<typeof CaseCharacterSchema>;
export type CaseContent = z.infer<typeof CaseContentSchema>;
export type Testimony = z.infer<typeof TestimonySchema>;
