import type { Check, GameSpec } from "./game-spec";
import { redactCase } from "@/modes/case/redact";
import type { CaseContent } from "@/modes/case/schema";
import type { ImpostorContent } from "@/modes/impostor/schema";
import { redactEscape } from "@/modes/escape/logic";
import type { EscapeContent } from "@/modes/escape/schema";

type Common = Pick<Check, "id" | "kind" | "concept_ids" | "prompt" | "hints">;
export type PublicCheck = Common & { options?: string[]; items?: string[]; left?: string[]; right?: string[] };

export type PublicSpec = Omit<GameSpec, "checks" | "content"> & { checks: PublicCheck[]; content: unknown };

/** Deterministic shuffle seeded by the check id: stable across requests, so the page doesn't reshuffle while polling. */
function shuffled<T>(xs: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1597334677) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function stripCheck(c: Check): PublicCheck {
  const base: PublicCheck = { id: c.id, kind: c.kind, concept_ids: c.concept_ids, prompt: c.prompt, hints: c.hints };
  switch (c.kind) {
    case "choice": case "set": return { ...base, options: shuffled(c.options, c.id) }; // generators tend to list the answer first
    case "order": {
      // Never present an order puzzle already solved.
      let items = shuffled(c.items, c.id);
      for (let k = 1; items.every((x, i) => x === c.answer[i]) && k < 10; k++) items = shuffled(c.items, `${c.id}#${k}`);
      if (items.every((x, i) => x === c.answer[i])) items = [...items].reverse();
      return { ...base, items };
    }
    case "match": return { ...base, left: c.left, right: [...c.right].sort() };
    case "number": return base;
  }
}

/** What the browser may see before the game is finished: no answers, no secrets, no solution. */
export function toPublicSpec(spec: GameSpec): PublicSpec {
  const content =
    spec.mode === "case" ? redactCase(spec.content as CaseContent)
    : spec.mode === "escape" ? redactEscape(spec.content as EscapeContent)
    : spec.mode === "impostor" ? { rounds: (spec.content as ImpostorContent).rounds.map((r) => ({ topic: r.topic })) } // facts only via room API
    : spec.content;
  return { ...spec, checks: spec.checks.map(stripCheck), content };
}
