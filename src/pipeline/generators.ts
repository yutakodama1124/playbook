import { z } from "zod";
import type { ConceptMap } from "@/domain/concept-map";
import type { GameMode, GameSpec } from "@/domain/game-spec";
import { llmEnvelope, toGameSpec } from "@/domain/llm-check";
import type { LlmClient } from "@/lib/llm";

export type GenerateContext = { llm: LlmClient; map: ConceptMap; targetConceptIds: string[]; learnMode: boolean };
export type Generator = (ctx: GenerateContext) => Promise<GameSpec>;

import { CONTENT_POLICY, conceptMapText } from "./prompt-shared";

// Stub mode proving the pipeline end-to-end: a 3-question "warm-up" whose checks follow the shared Check schema.
const DemoSpecSchema = llmEnvelope("demo", z.object({ theme: z.string() }));

const demo: Generator = async ({ llm, map, targetConceptIds }) =>
  toGameSpec(await llm.parseStructured({
    schema: DemoSpecSchema,
    effort: "medium",
    system: `You design short learning games from a Concept Map. ${CONTENT_POLICY}
Create a 3-check warm-up. Each check must require APPLYING a concept, not recalling a definition. Use only concept ids from the map.
Hints: exactly 3 — (1) a nudge, (2) an explanation of the concept, (3) a worked example of a SIMILAR problem. Never reveal the answer in hints.
Check fields by kind — number: answer_number, tolerance, formula (mathjs expression computing answer_number); choice: options, answer=[correct option], wrong_feedback for EVERY wrong option (a correction based on a misconception); order: options=items shuffled, answer=correct sequence; set: options, answer=correct members; match: pairs. Leave unused fields empty/null.
Never write concept ids in student-facing text; use concept names.\nasset_requests: one {role:"scene", tags:[...]} describing a fitting background.`,
    content: [{ type: "text", text: `Concept Map:\n${conceptMapText(map)}\n\nTarget concepts (prioritize): ${targetConceptIds.join(", ") || "any"}` }],
  }));

import { generateCase } from "@/modes/case/generate";
import { generateImpostor } from "@/modes/impostor/generate";

export const generators: Partial<Record<GameMode, Generator>> = { demo, case: generateCase, impostor: generateImpostor };
