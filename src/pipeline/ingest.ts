import { ConceptMapSchema, type ConceptMap } from "@/domain/concept-map";
import type { ContentBlock, LlmClient } from "@/lib/llm";

export type UnitSource =
  | { kind: "text"; text: string }
  | { kind: "pdf"; base64: string }
  | { kind: "image"; base64: string; mediaType: "image/png" | "image/jpeg" | "image/webp" };

export type IngestInput = { title: string; course: string; sources: UnitSource[] };

export const INGEST_SYSTEM = `You analyze a student's school unit material and produce a Concept Map used to generate learning games.
Rules:
- Extract 6–15 concepts that a test on this unit would assess. Prefer concepts the material actually covers.
- Each concept: ids like "c_electron_transport_chain" (lowercase, underscores). Atomic, correct facts. Ordered steps for processes. Formulas with variable meanings where relevant.
- For every concept list 1–3 COMMON STUDENT MISCONCEPTIONS with why each is wrong — games use these as traps and corrections.
- Relations must reference other concept ids in this map.
- source_ref: where in the material the concept appears (e.g. "slide 7", "page 2", "photo 1"); null if you added it from general knowledge.
- source_coverage: one sentence on what the material covered and anything you filled in.
- Accuracy matters more than breadth. Pitch to the stated course level. School-appropriate content only.`;

export function buildIngestContent(input: IngestInput): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const texts: string[] = [];
  for (const s of input.sources) {
    if (s.kind === "pdf") blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: s.base64 } });
    else if (s.kind === "image") blocks.push({ type: "image", source: { type: "base64", media_type: s.mediaType, data: s.base64 } });
    else texts.push(s.text);
  }
  const notes = texts.length ? `\n\nStudent notes:\n${texts.join("\n\n---\n\n")}` : "";
  const hasMaterial = blocks.length > 0 || texts.length > 0;
  blocks.push({
    type: "text",
    text: `Unit: ${input.title}\nCourse: ${input.course}${notes}\n\n${
      hasMaterial
        ? "Build the Concept Map from the material above."
        : "No material was provided; build the Concept Map from the standard curriculum for this unit and set every source_ref to null."
    }`,
  });
  return blocks;
}

export function ingestUnit(llm: LlmClient, input: IngestInput): Promise<ConceptMap> {
  return llm.parseStructured({ schema: ConceptMapSchema, system: INGEST_SYSTEM, content: buildIngestContent(input), effort: "high" });
}
