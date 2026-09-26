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
export interface Repo {
  createUnit(input: IngestInput, testDate: string | null): Promise<UnitRow>;
  getUnit(id: string): Promise<UnitRow | null>;
  updateUnit(id: string, patch: Partial<Pick<UnitRow, "status" | "error" | "conceptMap">>): Promise<void>;
  createGame(unitId: string, mode: GameMode): Promise<GameRow>;
  getGame(id: string): Promise<GameRow | null>;
  updateGame(id: string, patch: Partial<Pick<GameRow, "status" | "error" | "spec" | "assets" | "verifierReport">>): Promise<void>;
  listAssets(): Promise<AssetRow[]>;
  addAsset(a: Omit<AssetRow, "id">): Promise<AssetRow>;
}
