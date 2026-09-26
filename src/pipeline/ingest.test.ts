import { describe, it, expect, vi } from "vitest";
import { buildIngestContent, ingestUnit } from "./ingest";
import type { LlmClient } from "@/lib/llm";

describe("buildIngestContent", () => {
  it("puts documents/images before the instruction text", () => {
    const blocks = buildIngestContent({ title: "Cell Resp", course: "AP Bio", sources: [
      { kind: "pdf", base64: "PDFDATA" },
      { kind: "image", base64: "IMG", mediaType: "image/png" },
      { kind: "text", text: "my notes" },
    ] });
    expect(blocks[0]).toMatchObject({ type: "document", source: { type: "base64", media_type: "application/pdf", data: "PDFDATA" } });
    expect(blocks[1]).toMatchObject({ type: "image", source: { type: "base64", media_type: "image/png", data: "IMG" } });
    const last = blocks[blocks.length - 1];
    expect(last.type).toBe("text");
    expect((last as { text: string }).text).toContain("Cell Resp");
    expect((last as { text: string }).text).toContain("my notes");
  });
  it("works with a topic only (no sources)", () => {
    const blocks = buildIngestContent({ title: "WWI causes", course: "World History", sources: [] });
    expect(blocks).toHaveLength(1);
  });
});

describe("ingestUnit", () => {
  it("calls the LLM with the ConceptMap schema and returns its result", async () => {
    const map = { unit: { title: "t", course: "c", level: "AP/IB" }, concepts: [], source_coverage: "x" };
    const llm: LlmClient = { parseStructured: vi.fn().mockResolvedValue(map) };
    const out = await ingestUnit(llm, { title: "t", course: "c", sources: [] });
    expect(out).toBe(map);
    const args = (llm.parseStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args.system).toMatch(/misconception/i);
    expect(args.effort).toBe("high");
  });
});
