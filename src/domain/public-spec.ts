import type { Check, GameSpec } from "./game-spec";
import { redactCase } from "@/modes/case/redact";
import type { CaseContent } from "@/modes/case/schema";
import type { ImpostorContent } from "@/modes/impostor/schema";
import { redactEscape } from "@/modes/escape/logic";
import type { EscapeContent } from "@/modes/escape/schema";

type Common = Pick<Check, "id" | "kind" | "concept_ids" | "prompt" | "hints">;
export type PublicCheck = Common & { options?: string[]; items?: string[]; left?: string[]; right?: string[] };

export type PublicSpec = Omit<GameSpec, "checks" | "content"> & { checks: PublicCheck[]; content: unknown };

function stripCheck(c: Check): PublicCheck {
  const base: PublicCheck = { id: c.id, kind: c.kind, concept_ids: c.concept_ids, prompt: c.prompt, hints: c.hints };
  switch (c.kind) {
    case "choice": case "set": return { ...base, options: c.options };
    case "order": return { ...base, items: c.items };
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
