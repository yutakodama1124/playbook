import { z } from "zod";
import type { ConceptMap } from "@/domain/concept-map";
import type { GameSpec } from "@/domain/game-spec";
import type { LlmClient } from "@/lib/llm";
import { conceptMapText } from "./prompt-shared";

export type Reviewer = (spec: GameSpec, map: ConceptMap) => Promise<string[]>;

const ReviewSchema = z.object({
  answers_verified: z.boolean(),
  problems: z.array(z.object({
    severity: z.enum(["blocker", "major", "minor"]),
    where: z.string(),
    issue: z.string(),
    fix: z.string(),
  })),
});

const MODE_FOCUS: Record<string, string> = {
  case: `Case Files: Could a student who understands the unit reach the correct option using ONLY the evidence text, character knowledge, and deductions? Is the correct option supported by at least two pieces of evidence? Does each wrong option have a real reason to be tempting (a misconception), yet get ruled out by evidence + concept? Is the timeline consistent? Do characters' secrets/alibis make sense together? Could motive or body language alone solve it (bad)?`,
  escape: `Escape Room: For each lock, is every value/fact needed to solve it present in the same room (hotspot descriptions, clues, or briefing)? Does each lock require applying a concept rather than recalling trivia? Are the rooms' story and objects coherent (why this lock is on this object)? Do revealed clues actually help later locks?`,
  impostor: `Impostor: In each round, is every "true fact" actually correct and specific? Is the corrupted fact unambiguously wrong to someone who knows the concept, yet plausible to someone holding the misconception? Does it match the true facts in length, style, and specificity so it can't be spotted by format alone? Do any true facts contradict each other or directly expose the fake?`,
};

const SYSTEM = `You are a demanding editor and playtester for learning games used by high school students. Your job is to catch anything a student or teacher would find confusing, wrong, unfair, or pointless BEFORE the game ships.
Method: for EVERY check/lock/question, independently derive the answer yourself from the in-game information and the unit's concepts, then compare with the stored answer. Also try to solve each one WITHOUT the concept (by guessing, elimination by wording, option length, or common sense) — if that works, it's a problem.
Report problems with severity:
- blocker: wrong answer key, wrong science, unsolvable with the given info, more than one defensible answer, the answer is given away (in a hint, the title, the intro, or an option's wording), content not appropriate for school.
- major: solvable by guessing or trivia without the concept, contradictions in the story/timeline, trivial or nonsensical questions (e.g. arithmetic unrelated to the concept), hints that don't teach, red herrings that make no sense.
- minor: style or polish.
Be concrete in "where" (check id, evidence id, round number) and give a specific "fix". Do not invent problems; if the game is solid, return an empty list. answers_verified = true only if every stored answer matched your independent derivation.`;

export function createReviewer(llm: LlmClient): Reviewer {
  return async (spec, map) => {
    const out = await llm.parseStructured({
      schema: ReviewSchema, effort: "high", maxTokens: 12000,
      system: `${SYSTEM}\n\nMode-specific focus — ${MODE_FOCUS[spec.mode] ?? ""}`,
      content: [{ type: "text", text: `Concept Map:\n${conceptMapText(map)}\n\nGame (full spec, including answers):\n${JSON.stringify(spec)}` }],
    });
    const serious = out.problems.filter((p) => p.severity !== "minor").map((p) => `[${p.severity}] ${p.where}: ${p.issue} — fix: ${p.fix}`);
    if (!out.answers_verified && serious.length === 0) serious.push("[blocker] answer key: reviewer could not verify every stored answer — recheck each answer against the in-game information");
    return serious;
  };
}
