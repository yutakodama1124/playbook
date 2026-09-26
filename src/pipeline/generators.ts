import { z } from "zod";
import type { ConceptMap } from "@/domain/concept-map";
import { GameSpecEnvelopeSchema, type GameMode, type GameSpec } from "@/domain/game-spec";
import type { LlmClient } from "@/lib/llm";

export type GenerateContext = { llm: LlmClient; map: ConceptMap; targetConceptIds: string[]; learnMode: boolean };
export type Generator = (ctx: GenerateContext) => Promise<GameSpec>;

export const CONTENT_POLICY = "Content must be school-appropriate for ages 13–18: no gore, no sexual content, no real-person defamation. Default to non-violent stakes.";

export const conceptMapText = (map: ConceptMap) => JSON.stringify(map);

// Stub mode proving the pipeline end-to-end: a 3-question "warm-up" whose checks follow the shared Check schema.
const DemoSpecSchema = GameSpecEnvelopeSchema.extend({ mode: z.literal("demo"), content: z.object({ theme: z.string() }) });

const demo: Generator = async ({ llm, map, targetConceptIds }) =>
  llm.parseStructured({
    schema: DemoSpecSchema,
    effort: "medium",
    system: `You design short learning games from a Concept Map. ${CONTENT_POLICY}
Create a 3-check warm-up. Each check must require APPLYING a concept, not recalling a definition. Use only concept ids from the map.
Hints: exactly 3 — (1) a nudge, (2) an explanation of the concept, (3) a worked example of a SIMILAR problem. Never reveal the answer in hints.
Number checks must include a mathjs-evaluable formula that computes the answer. Choice checks: feedback_by_wrong maps every wrong option to a correction based on a misconception.
asset_requests: one {role:"scene", tags:[...]} describing a fitting background.`,
    content: [{ type: "text", text: `Concept Map:\n${conceptMapText(map)}\n\nTarget concepts (prioritize): ${targetConceptIds.join(", ") || "any"}` }],
  }) as Promise<GameSpec>;

export const generators: Partial<Record<GameMode, Generator>> = { demo };
