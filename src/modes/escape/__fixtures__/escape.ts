import type { ConceptMap } from "@/domain/concept-map";
import type { GameSpec } from "@/domain/game-spec";
import type { EscapeContent } from "../schema";

const concept = (id: string) => ({ id, name: id, summary: "s", kind: "process" as const, facts: ["f"], formulas: [], steps: [], misconceptions: [], relations: [], source_ref: null });
export const map: ConceptMap = { unit: { title: "Resp", course: "AP Bio", level: "AP/IB" }, source_coverage: "x", concepts: [concept("c_atp"), concept("c_etc"), concept("c_gly")] };

const hs = (id: string, lock: string, clue = "", is_exit = false) => ({ id, label: `Object ${id}`, zone: "center" as const, description: `Look at ${id}`, lock_check_id: lock, reveals_clue: clue, is_exit });
export const content: EscapeContent = {
  premise: "Locked in the lab.",
  rooms: [
    { id: "r1", name: "Lab", scene_tags: ["lab"], description: "A lab.", hotspots: [hs("h1", "k1", "SECRET CLUE ONE"), hs("h2", "k2", "Fragment B"), hs("h3", "")] },
    { id: "r2", name: "Vault", scene_tags: ["vault"], description: "A vault.", hotspots: [hs("h4", "k3", "SECRET CLUE TWO"), hs("h5", "k4", "", true), hs("h6", "")] },
  ],
  field_guide: [{ concept_id: "c_atp", title: "ATP", explanation: "Energy currency.", source_ref: null }],
};

const check = (id: string) => ({ id, kind: "number" as const, concept_ids: ["c_atp"], prompt: `Q ${id}`, hints: ["1", "2", "3"], answer: 2, tolerance: 0, formula: "1+1" });
export const spec: GameSpec<EscapeContent> = {
  mode: "escape", title: "T", briefing: "b", intro: "i", outro_win: "w", outro_lose: "l", concept_ids: ["c_atp"],
  asset_requests: [], content, checks: ["k1", "k2", "k3", "k4"].map(check),
};
