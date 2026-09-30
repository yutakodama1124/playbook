import type { GameSpec } from "@/domain/game-spec";
import type { CaseContent } from "./schema";

type Spec = GameSpec<CaseContent>;
const publicEvidence = ({ id, title, detail, key_fact, concept_ids }: CaseContent["evidence"][number]) => ({ id, title, detail, key_fact, concept_ids });
export type PublicEvidence = ReturnType<typeof publicEvidence>;

function find(spec: Spec, testimonyId: string, statementId: string) {
  const t = spec.content.testimonies.find((x) => x.id === testimonyId);
  const s = t?.statements.find((x) => x.id === statementId);
  if (!t || !s) throw new Error("unknown testimony or statement");
  return { t, s };
}

export const startingEvidence = (c: CaseContent) => c.evidence.filter((e) => e.starts_in_file).map(publicEvidence);

/** PRESS: the witness adds detail; some presses surface new evidence. */
export function press(spec: Spec, testimonyId: string, statementId: string) {
  const { s } = find(spec, testimonyId, statementId);
  const e = spec.content.evidence.find((x) => x.id === s.press_unlocks_evidence_id);
  return { reply: s.press_reply, unlocked: e ? [publicEvidence(e)] : [] };
}

/** PRESENT: correct only for the contradicting statement + the evidence that disproves it. */
export function present(spec: Spec, testimonyId: string, statementId: string, evidenceId: string) {
  const { t } = find(spec, testimonyId, statementId);
  const k = t.contradiction;
  if (k.statement_id === statementId && k.evidence_id === evidenceId) {
    // Hand over anything this testimony's presses would have revealed, so a skipped press can never soft-lock later testimonies.
    const unlocked = t.statements.flatMap((s) => spec.content.evidence.filter((e) => e.id === s.press_unlocks_evidence_id)).map(publicEvidence);
    return { correct: true as const, explanation: k.explanation, breakthrough: t.breakthrough, conceptId: k.concept_id, unlocked };
  }
  return { correct: false as const, conceptId: k.concept_id };
}

/** VERDICT: the right answer plus the evidence that proves it. Reveals the full explanation. */
export function verdict(spec: Spec, optionId: string, evidenceId: string) {
  const f = spec.content.finale;
  if (!f.options.some((o) => o.id === optionId)) throw new Error("unknown option");
  const correct = optionId === f.correct_option_id;
  return {
    correct, proofCorrect: evidenceId === f.proof_evidence_id,
    feedback: correct ? null : f.wrong_option_feedback.find((w) => w.option_id === optionId)?.feedback ?? null,
    correctOptionId: f.correct_option_id, proofEvidenceId: f.proof_evidence_id, explanation: f.explanation,
    contradictions: spec.content.testimonies.map((t) => ({ statement: t.statements.find((s) => s.id === t.contradiction.statement_id)?.text ?? "", explanation: t.contradiction.explanation, conceptId: t.contradiction.concept_id })),
  };
}
