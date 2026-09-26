import { z } from "zod";

export const GameModeSchema = z.enum(["escape", "case", "impostor", "demo"]);
export type GameMode = z.infer<typeof GameModeSchema>;

const Base = {
  id: z.string(),
  concept_ids: z.array(z.string()).min(1),
  prompt: z.string(),
  hints: z.array(z.string()).length(3), // nudge → concept explanation → similar worked example
};

export const CheckSchema = z.discriminatedUnion("kind", [
  z.object({ ...Base, kind: z.literal("number"), answer: z.number(), tolerance: z.number().min(0), formula: z.string().nullable() }),
  z.object({ ...Base, kind: z.literal("choice"), options: z.array(z.string()).min(2), answer: z.string(),
    feedback_by_wrong: z.record(z.string(), z.string()) }),
  z.object({ ...Base, kind: z.literal("order"), items: z.array(z.string()).min(2), answer: z.array(z.string()) }),
  z.object({ ...Base, kind: z.literal("set"), options: z.array(z.string()).min(2), answer: z.array(z.string()) }),
  z.object({ ...Base, kind: z.literal("match"), left: z.array(z.string()), right: z.array(z.string()),
    answer: z.record(z.string(), z.string()) }),
]);
export type Check = z.infer<typeof CheckSchema>;

export const GameSpecEnvelopeSchema = z.object({
  mode: GameModeSchema,
  title: z.string(),
  briefing: z.string(),       // pre-training intro (spec §0.1)
  intro: z.string(),
  outro_win: z.string(),
  outro_lose: z.string(),
  concept_ids: z.array(z.string()).min(1),
  checks: z.array(CheckSchema).min(1),
  asset_requests: z.array(z.object({ role: z.string(), tags: z.array(z.string()).min(1) })).default([]),
  content: z.unknown(),        // mode-specific; validated by the mode's own schema
});
export type GameSpec<C = unknown> = Omit<z.infer<typeof GameSpecEnvelopeSchema>, "content"> & { content: C };
