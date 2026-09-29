import type { ConceptMap } from "@/domain/concept-map";
import type { ImpostorContent } from "../schema";

const concept = (id: string) => ({ id, name: id, summary: "s", kind: "process" as const, facts: ["f"], formulas: [], steps: [], misconceptions: [], relations: [], source_ref: null });
export const map: ConceptMap = { unit: { title: "Photo", course: "AP Bio", level: "AP/IB" }, source_coverage: "x", concepts: [concept("c_light"), concept("c_calvin"), concept("c_rubisco")] };

const round = (i: number) => ({
  topic: `Topic ${i}`, concept_ids: ["c_light"],
  true_facts: Array.from({ length: 9 }, (_, k) => `True fact ${i}.${k}`),
  corrupted_fact: `Fake fact ${i}.x`, correct_version: `Fixed fact ${i}`, explanation: `Why ${i}`,
});
export const content: ImpostorContent = { rounds: [1, 2, 3, 4, 5].map(round) };
