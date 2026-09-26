import { z } from "zod";

export const ConceptSchema = z.object({
  id: z.string().regex(/^c_[a-z0-9_]+$/),
  name: z.string(),
  summary: z.string(),
  kind: z.enum(["process", "entity", "formula", "principle", "event", "term"]),
  facts: z.array(z.string()).min(1),
  formulas: z.array(z.object({ expr: z.string(), variables: z.record(z.string(), z.string()) })).default([]),
  steps: z.array(z.string()).default([]),
  misconceptions: z.array(z.object({ wrong: z.string(), why_wrong: z.string() })).default([]),
  relations: z.array(z.object({
    to: z.string(),
    type: z.enum(["causes", "requires", "produces", "part_of", "opposes", "precedes"]),
  })).default([]),
  source_ref: z.string().nullable().default(null), // e.g. "slide 7" or "p. 3"; null if general knowledge
});

export const ConceptMapSchema = z.object({
  unit: z.object({
    title: z.string(),
    course: z.string(),
    level: z.enum(["middle", "high", "AP/IB", "college"]),
  }),
  concepts: z.array(ConceptSchema).min(3).max(25),
  source_coverage: z.string(),
});

export type Concept = z.infer<typeof ConceptSchema>;
export type ConceptMap = z.infer<typeof ConceptMapSchema>;
