import type { ConceptMap } from "@/domain/concept-map";
import type { GameMode, GameSpec } from "@/domain/game-spec";
import type { IngestInput } from "@/pipeline/ingest";

export type JobStatus = "queued" | "running" | "ready" | "failed";
export type UnitRow = { id: string; title: string; course: string; testDate: string | null; status: JobStatus;
  error: string | null; conceptMap: ConceptMap | null; input: IngestInput; createdAt: string };
export type GameRow = { id: string; unitId: string; mode: GameMode; status: JobStatus; error: string | null;
  spec: GameSpec | null; assets: Record<string, string>; verifierReport: VerifierReport | null; createdAt: string };
export type AssetRow = { id: string; url: string; kind: "scene" | "portrait" | "prop" | "card" | "boss";
  tags: string[]; mood: string | null; positions: Record<string, string>; styleVersion: number };
export type VerifierReport = { ok: boolean; problems: string[] };
export type RoomRow = { id: string; code: string; gameId: string; hostToken: string; state: unknown };
export type RoomPlayerRow = { id: string; roomId: string; name: string; token: string; score: number };
export type RoomVoteRow = { voterId: string; targetId: string };
export type MasteryEventRow = { deviceId: string; unitId: string; gameId: string | null; conceptIds: string[]; correct: boolean; createdAt: string };
export interface Repo {
  createUnit(input: IngestInput, testDate: string | null): Promise<UnitRow>;
  getUnit(id: string): Promise<UnitRow | null>;
  updateUnit(id: string, patch: Partial<Pick<UnitRow, "status" | "error" | "conceptMap" | "testDate">>): Promise<void>;
  listGames(unitId: string): Promise<GameRow[]>;
  addMasteryEvent(e: Omit<MasteryEventRow, "createdAt">): Promise<void>;
  listMasteryEvents(deviceId: string, unitId: string): Promise<MasteryEventRow[]>;
  createGame(unitId: string, mode: GameMode): Promise<GameRow>;
  getGame(id: string): Promise<GameRow | null>;
  updateGame(id: string, patch: Partial<Pick<GameRow, "status" | "error" | "spec" | "assets" | "verifierReport">>): Promise<void>;
  listAssets(): Promise<AssetRow[]>;
  addAsset(a: Omit<AssetRow, "id">): Promise<AssetRow>;
  createRoom(r: Omit<RoomRow, "id">): Promise<RoomRow>;
  getRoomByCode(code: string): Promise<RoomRow | null>;
  updateRoomState(id: string, state: unknown): Promise<void>;
  addPlayer(roomId: string, name: string, token: string): Promise<RoomPlayerRow>;
  listPlayers(roomId: string): Promise<RoomPlayerRow[]>;
  setScore(playerId: string, score: number): Promise<void>;
  castVote(roomId: string, round: number, voterId: string, targetId: string): Promise<void>;
  listVotes(roomId: string, round: number): Promise<RoomVoteRow[]>;
}
