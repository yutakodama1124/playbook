import { z } from "zod";
import { createLlmClient } from "../src/lib/llm.ts";

const out = await createLlmClient().parseStructured({
  schema: z.object({ capital: z.string() }),
  system: "Answer concisely.",
  content: [{ type: "text", text: "Capital of Japan?" }],
  effort: "low",
  maxTokens: 2000,
});
console.log(out);
