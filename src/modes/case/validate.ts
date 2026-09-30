import type { ConceptMap } from "@/domain/concept-map";
import type { CaseContent } from "./schema";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
// Readability limits: short lines keep it a game, not a reading assignment.
const LIMITS = { statement: 25, press_reply: 35, detail: 35, key_fact: 14, premise: 70, bio: 25, explanation: 60, breakthrough: 40 };

export function validateCase(c: CaseContent, map: ConceptMap): string[] {
  const problems: string[] = [];
  const concepts = new Set(map.concepts.map((x) => x.id));
  const chars = new Map(c.characters.map((x) => [x.id, x]));
  const evidence = new Map(c.evidence.map((e) => [e.id, e]));
  const long = (what: string, text: string, max: number) => { if (words(text) > max) problems.push(`${what} is too long (${words(text)} words, max ${max}) — shorten it`); };

  const mentors = c.characters.filter((x) => x.is_mentor);
  if (mentors.length !== 1) problems.push(`case needs exactly 1 mentor character, found ${mentors.length}`);
  const suspects = c.characters.length - mentors.length;
  if (suspects < 3 || suspects > 4) problems.push(`case needs 3–4 non-mentor characters, found ${suspects}`);
  if (chars.size !== c.characters.length) problems.push("duplicate character ids");
  if (evidence.size !== c.evidence.length) problems.push("duplicate evidence ids");
  long("premise", c.premise, LIMITS.premise);
  for (const ch of c.characters) long(`bio of ${ch.id}`, ch.bio, LIMITS.bio);
  for (const e of c.evidence) {
    long(`evidence ${e.id} detail`, e.detail, LIMITS.detail);
    long(`evidence ${e.id} key_fact`, e.key_fact, LIMITS.key_fact);
    for (const id of e.concept_ids) if (!concepts.has(id)) problems.push(`evidence ${e.id} references unknown concept ${id}`);
  }
  if (c.evidence.filter((e) => e.starts_in_file).length < 2) problems.push("case needs at least 2 evidence items in the file at the start");

  // Testimonies: each has exactly one contradiction the player can prove with evidence they have by then.
  if (c.testimonies.length < 2 || c.testimonies.length > 4) problems.push(`case needs 2–4 testimonies, got ${c.testimonies.length}`);
  const available = new Set(c.evidence.filter((e) => e.starts_in_file).map((e) => e.id));
  const unlockedBy = new Map<string, number>();
  for (const t of c.testimonies) {
    const w = chars.get(t.witness_id);
    if (!w) problems.push(`testimony ${t.id} has unknown witness ${t.witness_id}`);
    else if (w.is_mentor) problems.push(`testimony ${t.id}: the mentor can't be a witness`);
    if (t.statements.length < 3 || t.statements.length > 6) problems.push(`testimony ${t.id} needs 3–6 statements`);
    if (t.hints.length !== 3) problems.push(`testimony ${t.id} needs exactly 3 hints`);
    long(`testimony ${t.id} breakthrough`, t.breakthrough, LIMITS.breakthrough);
    long(`testimony ${t.id} explanation`, t.contradiction.explanation, LIMITS.explanation);
    for (const s of t.statements) {
      long(`statement ${s.id}`, s.text, LIMITS.statement);
      long(`press reply ${s.id}`, s.press_reply, LIMITS.press_reply);
      if (s.press_unlocks_evidence_id) {
        const e = evidence.get(s.press_unlocks_evidence_id);
        if (!e) problems.push(`statement ${s.id} unlocks unknown evidence ${s.press_unlocks_evidence_id}`);
        else if (e.starts_in_file) problems.push(`statement ${s.id} unlocks ${e.id}, which is already in the file`);
        unlockedBy.set(s.press_unlocks_evidence_id, (unlockedBy.get(s.press_unlocks_evidence_id) ?? 0) + 1);
        available.add(s.press_unlocks_evidence_id); // pressing within this testimony makes it available here
      }
    }
    const k = t.contradiction;
    if (!t.statements.some((s) => s.id === k.statement_id)) problems.push(`testimony ${t.id} contradiction points to statement ${k.statement_id}, which isn't in it`);
    if (!evidence.has(k.evidence_id)) problems.push(`testimony ${t.id} contradiction uses unknown evidence ${k.evidence_id}`);
    else if (!available.has(k.evidence_id)) problems.push(`testimony ${t.id} contradiction uses ${k.evidence_id}, which is not available yet at that point`);
    if (!concepts.has(k.concept_id)) problems.push(`testimony ${t.id} contradiction references unknown concept ${k.concept_id}`);
  }
  for (const e of c.evidence) if (!e.starts_in_file && (unlockedBy.get(e.id) ?? 0) !== 1) problems.push(`evidence ${e.id} must be unlocked by exactly one pressed statement`);

  // Finale: pick the answer AND present the proof.
  const f = c.finale;
  const optionIds = new Set(f.options.map((o) => o.id));
  if (f.options.length < 3) problems.push("finale needs at least 3 options");
  if (!optionIds.has(f.correct_option_id)) problems.push(`finale correct_option_id ${f.correct_option_id} is not an option`);
  if (!evidence.has(f.proof_evidence_id)) problems.push(`finale proof evidence ${f.proof_evidence_id} doesn't exist`);
  long("finale explanation", f.explanation, LIMITS.explanation);
  for (const o of f.options) {
    if (o.id !== f.correct_option_id && !f.wrong_option_feedback.some((w) => w.option_id === o.id)) problems.push(`finale needs feedback for ${o.id}`);
    if (o.character_id && chars.get(o.character_id)?.is_mentor) problems.push(`finale option ${o.id} names the mentor — the mentor can't be an option`);
    if (o.character_id && !chars.has(o.character_id)) problems.push(`finale option ${o.id} references unknown character ${o.character_id}`);
  }
  for (const g of c.field_guide) if (!concepts.has(g.concept_id)) problems.push(`field guide references unknown concept ${g.concept_id}`);
  return problems;
}
