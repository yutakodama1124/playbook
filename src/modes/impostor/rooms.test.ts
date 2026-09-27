import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryRepo } from "@/repo/memory";
import type { Repo } from "@/repo/types";
import { createRoom, joinRoom, roomView, hostAction, castVote } from "./rooms";
import { content } from "./__fixtures__/impostor";

let repo: Repo, gameId: string;
beforeEach(async () => {
  repo = createMemoryRepo();
  const u = await repo.createUnit({ title: "t", course: "c", sources: [] }, null);
  const g = await repo.createGame(u.id, "impostor");
  await repo.updateGame(g.id, { status: "ready", spec: { mode: "impostor", title: "T", briefing: "b", intro: "i", outro_win: "w", outro_lose: "l", concept_ids: ["c_light"], checks: [], asset_requests: [], content } });
  gameId = g.id;
});

async function lobby(n = 3) {
  const { code, hostToken } = await createRoom(repo, gameId);
  const ps = [];
  for (let i = 0; i < n; i++) ps.push(await joinRoom(repo, code, `Player ${i}`));
  return { code, hostToken, ps };
}

describe("rooms", () => {
  it("creates a room with a short code and lets players join the lobby", async () => {
    const { code, hostToken, ps } = await lobby(3);
    expect(code).toMatch(/^[A-Z]{5}$/);
    const hv = await roomView(repo, code, hostToken);
    expect(hv.isHost).toBe(true);
    expect(hv.view.players.map((p) => p.name)).toEqual(["Player 0", "Player 1", "Player 2"]);
    expect(JSON.stringify(hv)).not.toContain(ps[0].token);
  });

  it("refuses to start with fewer than 3 players and rejects non-host actions", async () => {
    const { code, hostToken, ps } = await lobby(2);
    await expect(hostAction(repo, code, hostToken, "next")).rejects.toThrow(/3 players/);
    await expect(hostAction(repo, code, ps[0].token, "next")).rejects.toThrow(/host/);
  });

  it("runs a full round: deal, vote, reveal with scores", async () => {
    const { code, hostToken, ps } = await lobby(3);
    await hostAction(repo, code, hostToken, "next");
    const views = await Promise.all(ps.map((p) => roomView(repo, code, p.token)));
    expect(views.every((v) => v.view.phase === "discuss" && v.view.me?.fact)).toBe(true);
    const impostor = views.find((v) => v.view.me?.impostor)!.view.me!.id;
    await hostAction(repo, code, hostToken, "vote");
    for (const p of ps) if (p.playerId !== impostor) await castVote(repo, code, p.token, impostor);
    await expect(castVote(repo, code, ps[0].token, ps[0].playerId)).rejects.toThrow(/yourself/);
    await hostAction(repo, code, hostToken, "reveal");
    const after = await roomView(repo, code, hostToken);
    expect(after.view.phase).toBe("reveal");
    expect(after.view.lastResult?.caught).toBe(true);
    expect(after.view.lastResult?.fake).toBe("Fake fact 1");
    expect(after.view.players.filter((p) => p.score === 1)).toHaveLength(2);
  });

  it("ends in the final phase after the last round and blocks late joins", async () => {
    const { code, hostToken } = await lobby(3);
    for (let r = 0; r < 5; r++) { await hostAction(repo, code, hostToken, "next"); await hostAction(repo, code, hostToken, "vote"); await hostAction(repo, code, hostToken, "reveal"); }
    await hostAction(repo, code, hostToken, "next");
    expect((await roomView(repo, code, hostToken)).view.phase).toBe("final");
    await expect(joinRoom(repo, code, "Late")).rejects.toThrow(/started/);
  });
});
