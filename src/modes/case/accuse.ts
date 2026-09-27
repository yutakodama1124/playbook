import { z } from "zod";
import type { GameSpec } from "@/domain/game-spec";
import type { LlmClient } from "@/lib/llm";
import type { CaseContent } from "./schema";

const GradeSchema = z.object({ covered_step_indexes: z.array(z.number()), coaching: z.string() });

export async function gradeAccusation(llm: LlmClient, spec: GameSpec<CaseContent>, optionId: string, justification: string) {
  const c = spec.content;
  if (!c.accusation.options.some((o) => o.id === optionId)) throw new Error(`unknown option ${optionId}`);
  const correct = optionId === c.accusation.correct_option_id;
  const chain = c.solution.chain;

  const grade = await llm.parseStructured({
    schema: GradeSchema, effort: "low", maxTokens: 3000,
    system: `You grade a student's written reasoning for a detective-style science case. For each numbered solution step, decide whether the student's reasoning clearly states that idea (in their own words is fine). Return the indexes covered. coaching: 2 sentences, encouraging, naming the most important missing concept. Do not grade spelling.`,
    content: [{ type: "text", text: `Solution steps:\n${chain.map((s, i) => `${i}. ${s.step}`).join("\n")}\n\nStudent chose: ${c.accusation.options.find((o) => o.id === optionId)?.label}\nStudent reasoning: ${justification.slice(0, 2000)}` }],
  });
  const covered = new Set(grade.covered_step_indexes.filter((i) => Number.isInteger(i) && i >= 0 && i < chain.length));

  return {
    correct,
    feedback: correct ? null : c.accusation.wrong_option_feedback.find((f) => f.option_id === optionId)?.feedback ?? null,
    steps: chain.map((s, i) => ({ ...s, covered: covered.has(i) })),
    coaching: grade.coaching,
    correctOptionId: c.accusation.correct_option_id,
    solution: c.solution,
  };
}
