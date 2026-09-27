import { z } from "zod";
import { CheckSchema, GameSpecEnvelopeSchema, type Check, type GameSpec } from "./game-spec";

// Flat shape Claude fills in. The strict discriminated union (CheckSchema) is too large for
// structured-output grammars, so generators ask for this and convert with fromLlmCheck().
export const LlmCheckSchema = z.object({
  id: z.string(),
  kind: z.enum(["number", "choice", "order", "set", "match"]),
  concept_ids: z.array(z.string()),
  prompt: z.string(),
  hints: z.array(z.string()),
  answer_number: z.number().nullable(), // number
  tolerance: z.number().nullable(),     // number
  formula: z.string().nullable(),       // number: mathjs expression that computes answer_number
  options: z.array(z.string()),         // choice/set: options; order: items in shuffled order
  answer: z.array(z.string()),          // choice: [correct]; order: correct sequence; set: correct members
  pairs: z.array(z.object({ left: z.string(), right: z.string() })), // match
  wrong_feedback: z.array(z.object({ option: z.string(), feedback: z.string() })), // choice
});
export type LlmCheck = z.infer<typeof LlmCheckSchema>;

/** A generated spec that can't be converted; the pipeline feeds the message back for repair. */
export class InvalidSpecError extends Error {}

function threeHints(h: string[]): string[] {
  const out = h.slice(0, 3);
  while (out.length < 3) out.push(out[out.length - 1] ?? "Re-read the concept in the Field Guide.");
  return out;
}

export function fromLlmCheck(c: LlmCheck): Check {
  try {
    return convert(c);
  } catch (e) {
    if (e instanceof InvalidSpecError) throw e;
    throw new InvalidSpecError(`check ${c.id}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function convert(c: LlmCheck): Check {
  const base = { id: c.id, concept_ids: c.concept_ids, prompt: c.prompt, hints: threeHints(c.hints) };
  const fail = (why: string): never => { throw new InvalidSpecError(`check ${c.id}: ${why}`); };
  switch (c.kind) {
    case "number":
      if (c.answer_number == null) fail("number check has no answer_number");
      return CheckSchema.parse({ ...base, kind: "number", answer: c.answer_number, tolerance: c.tolerance ?? 0, formula: c.formula });
    case "choice":
      if (!c.answer[0]) fail("choice check has no answer");
      return CheckSchema.parse({ ...base, kind: "choice", options: c.options, answer: c.answer[0],
        feedback_by_wrong: Object.fromEntries(c.wrong_feedback.map((w) => [w.option, w.feedback])) });
    case "order":
      return CheckSchema.parse({ ...base, kind: "order", items: c.options, answer: c.answer });
    case "set":
      return CheckSchema.parse({ ...base, kind: "set", options: c.options, answer: c.answer });
    case "match":
      return CheckSchema.parse({ ...base, kind: "match", left: c.pairs.map((p) => p.left), right: c.pairs.map((p) => p.right),
        answer: Object.fromEntries(c.pairs.map((p) => [p.left, p.right])) });
  }
}

/** Envelope Claude fills: same as GameSpec but with flat checks and a mode-specific content schema. */
export function llmEnvelope<C extends z.ZodTypeAny>(mode: GameSpec["mode"], content: C) {
  return GameSpecEnvelopeSchema.extend({ mode: z.literal(mode), checks: z.array(LlmCheckSchema), content });
}

export function toGameSpec<C>(s: Omit<GameSpec<C>, "checks"> & { checks: LlmCheck[] }): GameSpec<C> {
  return { ...s, checks: s.checks.map(fromLlmCheck) };
}
