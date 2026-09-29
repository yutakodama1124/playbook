import { evaluate } from "mathjs";
import type { ConceptMap } from "@/domain/concept-map";
import type { GameSpec } from "@/domain/game-spec";
import type { VerifierReport } from "@/repo/types";
import { CaseContentSchema } from "@/modes/case/schema";
import { validateCase } from "@/modes/case/validate";
import { ImpostorContentSchema } from "@/modes/impostor/schema";
import { validateImpostor } from "@/modes/impostor/validate";
import { EscapeContentSchema, type EscapeContent } from "@/modes/escape/schema";
import { validateEscape } from "@/modes/escape/logic";

const CONCEPT_ID = /\bc_[a-z0-9]+(?:_[a-z0-9]+)*\b/;

/** Students must see concept names, never raw ids like "c_electron_transport_chain". */
function idLeaks(value: unknown, path: string, out: string[]) {
  if (typeof value === "string") { if (CONCEPT_ID.test(value)) out.push(`raw concept id in student-facing text at ${path}; use the concept's name`); return; }
  if (Array.isArray(value)) { value.forEach((v, i) => idLeaks(v, `${path}[${i}]`, out)); return; }
  if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) if (!/(^id$|_id$|_ids$)/.test(k)) idLeaks(v, path ? `${path}.${k}` : k, out);
}

/** Mode-specific structural checks on spec.content. */
function modeProblems(spec: GameSpec, map: ConceptMap): string[] {
  if ((spec.mode === "case" || spec.mode === "escape") && !spec.hook?.trim()) return ["missing hook: open with one intriguing question that creates a knowledge gap"];
  if (spec.mode === "case") {
    const parsed = CaseContentSchema.safeParse(spec.content);
    return parsed.success ? validateCase(parsed.data, map, spec.checks) : [`case content invalid: ${parsed.error.issues[0]?.message}`];
  }
  if (spec.mode === "impostor") {
    const parsed = ImpostorContentSchema.safeParse(spec.content);
    return parsed.success ? validateImpostor(parsed.data, map) : [`impostor content invalid: ${parsed.error.issues[0]?.message}`];
  }
  if (spec.mode === "escape") {
    const parsed = EscapeContentSchema.safeParse(spec.content);
    return parsed.success ? validateEscape({ ...spec, content: parsed.data } as GameSpec<EscapeContent>, map) : [`escape content invalid: ${parsed.error.issues[0]?.message}`];
  }
  return [];
}

const norm = (s: string) => s.trim().toLowerCase();

export function verifyGame(spec: GameSpec, map: ConceptMap): VerifierReport {
  const problems: string[] = [];
  const known = new Set(map.concepts.map((c) => c.id));
  const seen = new Set<string>();

  for (const id of spec.concept_ids) if (!known.has(id)) problems.push(`game references unknown concept ${id}`);

  for (const c of spec.checks) {
    if (seen.has(c.id)) problems.push(`duplicate check id ${c.id}`);
    seen.add(c.id);
    for (const id of c.concept_ids) if (!known.has(id)) problems.push(`check ${c.id} references unknown concept ${id}`);

    if (c.kind === "number" && c.formula) {
      try {
        const v = Number(evaluate(c.formula));
        if (!Number.isFinite(v) || Math.abs(v - c.answer) > Math.max(c.tolerance, 1e-9))
          problems.push(`check ${c.id}: formula ${c.formula} = ${v}, but answer is ${c.answer}`);
      } catch {
        problems.push(`check ${c.id}: formula "${c.formula}" could not be evaluated`);
      }
    }
    if (c.kind === "choice" && !c.options.map(norm).includes(norm(c.answer)))
      problems.push(`check ${c.id}: answer "${c.answer}" is not one of the options`);
    if (c.kind === "order") {
      const a = [...c.answer].map(norm).sort().join("|"), i = [...c.items].map(norm).sort().join("|");
      if (a !== i) problems.push(`check ${c.id}: order answer is not a permutation of items`);
    }
    if (c.kind === "set" && !c.answer.every((x) => c.options.map(norm).includes(norm(x))))
      problems.push(`check ${c.id}: set answer contains values not in options`);
    if (c.kind === "match") {
      const lefts = new Set(c.left.map(norm)), rights = new Set(c.right.map(norm));
      for (const [l, r] of Object.entries(c.answer))
        if (!lefts.has(norm(l)) || !rights.has(norm(r))) problems.push(`check ${c.id}: pair ${l}→${r} not in left/right lists`);
    }
  }
  problems.push(...modeProblems(spec, map));
  idLeaks(spec, "", problems);
  return { ok: problems.length === 0, problems };
}
