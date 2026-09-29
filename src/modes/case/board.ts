import { checkAnswer } from "@/domain/check";
import type { GameSpec } from "@/domain/game-spec";
import type { CaseContent } from "./schema";

export const BATCH = 2;

/**
 * Grades the case board like Return of the Obra Dinn: correct answers are only confirmed
 * when at least BATCH of them are right together, so guessing one row at a time doesn't work.
 */
export function gradeBoard(spec: GameSpec<CaseContent>, answers: Record<string, unknown>, alreadyConfirmed: string[]) {
  const done = new Set(alreadyConfirmed.filter((id) => spec.content.board.some((r) => r.id === id))); // ignore forged ids
  const remaining = spec.content.board.filter((r) => !done.has(r.id));
  const correct = remaining.filter((row) => {
    if (!(row.id in answers)) return false;
    const check = spec.checks.find((k) => k.id === row.check_id);
    return !!check && checkAnswer(check, answers[row.id]).correct;
  }).map((r) => r.id);
  const needed = Math.min(BATCH, remaining.length);
  if (needed === 0) return { confirmed: [] as string[], message: "The whole board is confirmed. Make your call." };
  if (needed > 0 && correct.length >= needed)
    return { confirmed: correct, message: `${correct.length} ${correct.length === 1 ? "answer" : "answers"} confirmed.` };
  return { confirmed: [] as string[], message: `Not enough is right yet. You need at least ${needed} correct answers before any are confirmed.` };
}
