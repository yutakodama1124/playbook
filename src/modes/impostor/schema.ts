import { z } from "zod";

export const ImpostorRoundSchema = z.object({
  topic: z.string(),                 // sub-topic all facts in the round are about
  concept_ids: z.array(z.string()),
  true_facts: z.array(z.string()),   // ≥9 distinct, similar length/style to the corrupted fact
  corrupted_fact: z.string(),        // subtly wrong, built from a real misconception
  correct_version: z.string(),       // the corrupted fact, fixed
  explanation: z.string(),           // why it's wrong (the misconception)
});

export const ImpostorContentSchema = z.object({ rounds: z.array(ImpostorRoundSchema) });

export type ImpostorRound = z.infer<typeof ImpostorRoundSchema>;
export type ImpostorContent = z.infer<typeof ImpostorContentSchema>;
