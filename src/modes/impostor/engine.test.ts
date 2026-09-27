import { describe, it, expect } from "vitest";
import { assignRoles, tally, viewFor, type RoomState } from "./engine";
import { content } from "./__fixtures__/impostor";

const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, score: 0 }));
const fixedRng = () => 0.42;

describe("assignRoles", () => {
  it("gives 1 impostor below 7 players, 2 from 7, distinct true facts to crew, the fake to impostors", () => {
    const a = assignRoles(players(5), content.rounds[0], fixedRng);
    const roles = Object.values(a);
    expect(roles.filter((r) => r.impostor)).toHaveLength(1);
    expect(roles.filter((r) => r.impostor).every((r) => r.fact === "Fake fact 1")).toBe(true);
    const crewFacts = roles.filter((r) => !r.impostor).map((r) => r.fact);
    expect(new Set(crewFacts).size).toBe(crewFacts.length);
    expect(Object.values(assignRoles(players(7), content.rounds[0], fixedRng)).filter((r) => r.impostor)).toHaveLength(2);
  });
});

describe("tally", () => {
  const assignment = { p0: { fact: "f", impostor: true }, p1: { fact: "t1", impostor: false }, p2: { fact: "t2", impostor: false }, p3: { fact: "t3", impostor: false } };
  it("ejects the top vote-getter and scores crew who voted for the impostor", () => {
    const r = tally([{ voterId: "p1", targetId: "p0" }, { voterId: "p2", targetId: "p0" }, { voterId: "p3", targetId: "p1" }, { voterId: "p0", targetId: "p1" }, { voterId: "p0", targetId: "p0" }].slice(0, 4).concat([]), assignment);
    // p0: 2 votes, p1: 2 votes -> tie -> nobody ejected
    expect(r.ejectedIds).toEqual([]);
    expect(r.caught).toBe(false);
    expect(r.deltas).toEqual({ p1: 1, p2: 1, p0: 2 });
  });
  it("catches the impostor on a clear majority; impostor gets nothing", () => {
    const r = tally([{ voterId: "p1", targetId: "p0" }, { voterId: "p2", targetId: "p0" }, { voterId: "p3", targetId: "p0" }, { voterId: "p0", targetId: "p1" }], assignment);
    expect(r.ejectedIds).toEqual(["p0"]);
    expect(r.caught).toBe(true);
    expect(r.deltas).toEqual({ p1: 1, p2: 1, p3: 1 });
  });
});

describe("viewFor", () => {
  const state: RoomState = { phase: "discuss", round: 0, assignment: { p0: { fact: "Fake fact 1", impostor: true }, p1: { fact: "True fact 1.0", impostor: false }, p2: { fact: "True fact 1.1", impostor: false } }, results: [] };
  it("shows a player only their own card; never shows cards to the host", () => {
    const pv = viewFor(state, content, players(3), [], { kind: "player", id: "p1" });
    expect(pv.me).toMatchObject({ id: "p1", fact: "True fact 1.0", impostor: false, myVote: null });
    expect(JSON.stringify(pv)).not.toContain("Fake fact 1");
    const hv = viewFor(state, content, players(3), [], { kind: "host" });
    expect(hv.me).toBeNull();
    expect(JSON.stringify(hv)).not.toContain("fact 1");
    expect(hv.topic).toBe("Topic 1");
  });
  it("shows who has voted but not whom they voted for", () => {
    const v = viewFor({ ...state, phase: "vote" }, content, players(3), [{ voterId: "p2", targetId: "p0" }], { kind: "host" });
    expect(v.players.find((p) => p.id === "p2")?.voted).toBe(true);
    expect(JSON.stringify(v)).not.toContain("targetId");
  });
});
