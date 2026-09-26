import type { Check } from "./game-spec";

export type CheckResult = { correct: boolean; feedback?: string };

const norm = (s: unknown) => String(s).trim().toLowerCase();

export function checkAnswer(check: Check, response: unknown): CheckResult {
  switch (check.kind) {
    case "number": {
      const n = typeof response === "number" ? response : Number(String(response).trim());
      if (!Number.isFinite(n)) return { correct: false };
      return { correct: Math.abs(n - check.answer) <= check.tolerance };
    }
    case "choice": {
      if (norm(response) === norm(check.answer)) return { correct: true };
      const key = Object.keys(check.feedback_by_wrong).find((k) => norm(k) === norm(response));
      return { correct: false, feedback: key ? check.feedback_by_wrong[key] : undefined };
    }
    case "order": {
      if (!Array.isArray(response) || response.length !== check.answer.length) return { correct: false };
      return { correct: response.every((r, i) => norm(r) === norm(check.answer[i])) };
    }
    case "set": {
      if (!Array.isArray(response)) return { correct: false };
      const a = new Set(check.answer.map(norm));
      const r = new Set(response.map(norm));
      return { correct: a.size === r.size && [...a].every((x) => r.has(x)) };
    }
    case "match": {
      if (typeof response !== "object" || response === null) return { correct: false };
      const r = response as Record<string, unknown>;
      const keys = Object.keys(check.answer);
      return { correct: keys.length === Object.keys(r).length && keys.every((k) => norm(r[k]) === norm(check.answer[k])) };
    }
  }
}
