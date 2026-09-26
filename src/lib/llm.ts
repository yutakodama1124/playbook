import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export const MODEL = "claude-opus-5";
export type ContentBlock = Anthropic.ContentBlockParam;

export type StructuredArgs<T> = {
  schema: z.ZodType<T>;
  system: string;
  content: ContentBlock[];
  effort?: "low" | "medium" | "high" | "xhigh";
  maxTokens?: number;
};

export interface LlmClient {
  parseStructured<T>(args: StructuredArgs<T>): Promise<T>;
}

export class RefusalError extends Error {}
export class ParseError extends Error {}

export function createLlmClient(anthropic: Anthropic = new Anthropic()): LlmClient {
  return {
    async parseStructured<T>({ schema, system, content, effort = "high", maxTokens = 16000 }: StructuredArgs<T>) {
      // Server-side refusal fallback (spec: Global Constraints). SDK typings may lag the "default" form,
      // so these two fields are spread from an untyped object.
      const fallback = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as Record<string, unknown>;
      const res = await anthropic.beta.messages.parse({
        model: MODEL,
        max_tokens: maxTokens,
        thinking: { type: "adaptive" },
        system,
        messages: [{ role: "user", content }],
        output_config: { effort, format: zodOutputFormat(schema) },
        ...fallback,
      } as Parameters<typeof anthropic.beta.messages.parse>[0]);
      if (res.stop_reason === "refusal") throw new RefusalError("Claude declined this request");
      if (res.parsed_output == null) throw new ParseError(`No valid structured output (stop_reason=${res.stop_reason})`);
      return res.parsed_output as T;
    },
  };
}
