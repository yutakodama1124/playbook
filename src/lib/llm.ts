import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const MODEL = "claude-opus-5";
export type ContentBlock = Anthropic.ContentBlockParam;

export type StructuredArgs<T> = {
  schema: z.ZodType<T>;
  system: string;
  content: ContentBlock[];
  effort?: "low" | "medium" | "high" | "xhigh";
  maxTokens?: number;
  /** "strict" = grammar-constrained structured output (small schemas). "json" = schema in prompt, validated in code (large schemas that exceed grammar limits). */
  mode?: "strict" | "json";
};

export interface LlmClient {
  parseStructured<T>(args: StructuredArgs<T>): Promise<T>;
}

export class RefusalError extends Error {}
export class ParseError extends Error {}

export function createLlmClient(anthropic: Anthropic = new Anthropic()): LlmClient {
  return {
    async parseStructured<T>({ schema, system, content, effort = "high", maxTokens = 16000, mode = "strict" }: StructuredArgs<T>) {
      // Server-side refusal fallback (spec: Global Constraints). SDK typings may lag the "default" form,
      // so these two fields are spread from an untyped object.
      const fallback = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as Record<string, unknown>;
      // Streaming avoids SDK/HTTP timeouts on long generations (e.g. 32k-token case files).
      const res = await anthropic.beta.messages.stream({
        model: MODEL,
        max_tokens: maxTokens,
        thinking: { type: "adaptive" },
        system: mode === "json"
          ? `${system}\n\nRespond with ONLY a JSON object (no prose) that validates against this JSON Schema:\n${JSON.stringify(z.toJSONSchema(schema, { io: "input" }))}`
          : system,
        messages: [{ role: "user", content }],
        output_config: mode === "json" ? { effort } : { effort, format: zodOutputFormat(schema) },
        ...fallback,
      } as Parameters<typeof anthropic.beta.messages.stream>[0]).finalMessage();
      if (res.stop_reason === "refusal") throw new RefusalError("Claude declined this request");
      if (mode === "json") return parseJsonText(schema, res.content, res.stop_reason);
      if (res.parsed_output == null) throw new ParseError(`No valid structured output (stop_reason=${res.stop_reason})`);
      return res.parsed_output as T;
    },
  };
}

function parseJsonText<T>(schema: z.ZodType<T>, blocks: { type: string; text?: string }[], stopReason: string | null): T {
  const text = blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  const body = text.replace(/^[\s\S]*?```(?:json)?\s*/i, "").replace(/```[\s\S]*$/, "").trim() || text.trim();
  let data: unknown;
  try {
    data = JSON.parse(body.slice(body.indexOf("{"), body.lastIndexOf("}") + 1));
  } catch {
    throw new ParseError(`Output was not valid JSON (stop_reason=${stopReason})`);
  }
  const r = schema.safeParse(data);
  if (!r.success) throw new ParseError(`Output did not match schema: ${r.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  return r.data;
}
