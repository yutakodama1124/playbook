import { readFileSync } from "node:fs";
import { createLlmClient } from "../src/lib/llm";
import { ingestUnit } from "../src/pipeline/ingest";

const map = await ingestUnit(createLlmClient(), {
  title: "Cellular Respiration", course: "AP Biology",
  sources: [{ kind: "text", text: readFileSync("fixtures/sample-notes.md", "utf8") }],
});
console.log(JSON.stringify(map, null, 2));
console.log(`\n${map.concepts.length} concepts:`, map.concepts.map((c) => c.id).join(", "));
