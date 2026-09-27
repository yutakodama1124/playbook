import { describe, it, expect, vi } from "vitest";
import { generateCase, caseAssetRequests } from "./generate";
import { content, map } from "./__fixtures__/case";
import type { LlmClient } from "@/lib/llm";

describe("caseAssetRequests", () => {
  it("requests one scene and one portrait per character", () => {
    const r = caseAssetRequests(content);
    expect(r[0]).toEqual({ role: "scene", tags: ["greenhouse", "plants"] });
    expect(r.filter((x) => x.role.startsWith("portrait:"))).toHaveLength(4);
    expect(r.find((x) => x.role === "portrait:p1")?.tags).toContain("pharmacist");
  });
});

describe("generateCase", () => {
  it("returns a case spec with deterministic asset requests and converted checks", async () => {
    const llmOut = { mode: "case", title: "T", briefing: "b", intro: "i", outro_win: "w", outro_lose: "l", concept_ids: ["c_etc"],
      asset_requests: [{ role: "junk", tags: ["x"] }], content,
      checks: [{ id: "d1", kind: "number", concept_ids: ["c_atp"], prompt: "p", hints: ["1", "2", "3"], answer_number: 2, tolerance: 0, formula: "1+1",
        options: [], answer: [], pairs: [], wrong_feedback: [] }] };
    const llm: LlmClient = { parseStructured: vi.fn().mockResolvedValue(llmOut) };
    const spec = await generateCase({ llm, map, targetConceptIds: [], learnMode: true });
    expect(spec.mode).toBe("case");
    expect(spec.checks[0]).toMatchObject({ kind: "number", answer: 2 });
    expect(spec.asset_requests.map((a) => a.role)).not.toContain("junk");
    const args = (llm.parseStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args.system).toMatch(/concept/i);
    expect(args.system).not.toMatch(/murder/i);
  });
});
