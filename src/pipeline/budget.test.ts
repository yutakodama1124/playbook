import { describe, it, expect } from "vitest";
import { decideGameRequest, LIMITS } from "./budget";
import type { GameRow } from "@/repo/types";

const g = (mode: GameRow["mode"], status: GameRow["status"]): GameRow => ({ id: `${mode}-${status}`, unitId: "u", mode, status, error: null, spec: null, assets: {}, verifierReport: null, createdAt: "" });

describe("decideGameRequest", () => {
  it("reuses a game of the same mode that is still building", () => {
    expect(decideGameRequest([g("case", "running")], "case", 0)).toEqual({ reuse: "case-running" });
    expect(decideGameRequest([g("case", "queued")], "case", 0)).toEqual({ reuse: "case-queued" });
  });
  it("allows a new game otherwise", () => {
    expect(decideGameRequest([g("case", "ready"), g("escape", "running")], "case", 0)).toEqual({ ok: true });
  });
  it("caps games per unit and the global hourly budget", () => {
    const many = Array.from({ length: LIMITS.gamesPerUnit }, () => g("case", "ready"));
    expect(decideGameRequest(many, "escape", 0)).toMatchObject({ status: 429 });
    expect(decideGameRequest([], "case", LIMITS.gamesPerHour)).toMatchObject({ status: 429 });
  });
});
