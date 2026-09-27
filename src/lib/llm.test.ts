import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { createLlmClient, RefusalError, ParseError } from "./llm";

function fakeAnthropic(result: object) {
  // parseStructured streams (needed for long generations); the fake returns the final parsed message.
  const parse = vi.fn().mockReturnValue({ finalMessage: vi.fn().mockResolvedValue(result) });
  return { client: { beta: { messages: { stream: parse } } } as never, parse };
}

const Schema = z.object({ answer: z.number() });

describe("createLlmClient.parseStructured", () => {
  it("returns parsed output and sends model, system, effort, fallbacks", async () => {
    const { client, parse } = fakeAnthropic({ stop_reason: "end_turn", parsed_output: { answer: 42 } });
    const llm = createLlmClient(client);
    const out = await llm.parseStructured({ schema: Schema, system: "sys", content: [{ type: "text", text: "q" }], effort: "low" });
    expect(out).toEqual({ answer: 42 });
    const req = parse.mock.calls[0][0];
    expect(req.model).toBe("claude-opus-5");
    expect(req.system).toBe("sys");
    expect(req.output_config.effort).toBe("low");
    expect(req.fallbacks).toBe("default");
    expect(req.betas).toContain("server-side-fallback-2026-07-01");
  });
  it("throws RefusalError on refusal", async () => {
    const { client } = fakeAnthropic({ stop_reason: "refusal", parsed_output: null, stop_details: { category: "x" } });
    await expect(createLlmClient(client).parseStructured({ schema: Schema, system: "s", content: [] })).rejects.toBeInstanceOf(RefusalError);
  });
  it("throws ParseError when parsed_output is null", async () => {
    const { client } = fakeAnthropic({ stop_reason: "max_tokens", parsed_output: null });
    await expect(createLlmClient(client).parseStructured({ schema: Schema, system: "s", content: [] })).rejects.toBeInstanceOf(ParseError);
  });
  it("json mode: sends no grammar, parses fenced JSON text, validates with the schema", async () => {
    const { client, parse } = fakeAnthropic({ stop_reason: "end_turn", content: [{ type: "text", text: "```json\n{\"answer\": 7}\n```" }] });
    const out = await createLlmClient(client).parseStructured({ schema: Schema, system: "s", content: [], mode: "json" });
    expect(out).toEqual({ answer: 7 });
    const req = parse.mock.calls[0][0];
    expect(req.output_config.format).toBeUndefined();
    expect(req.system).toContain("JSON Schema");
  });
  it("json mode: throws ParseError with the validation problem on bad JSON", async () => {
    const { client } = fakeAnthropic({ stop_reason: "end_turn", content: [{ type: "text", text: "{\"answer\": \"seven\"}" }] });
    await expect(createLlmClient(client).parseStructured({ schema: Schema, system: "s", content: [], mode: "json" })).rejects.toThrow(/answer/);
  });
});
