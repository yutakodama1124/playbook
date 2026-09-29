import type { ConceptMap } from "@/domain/concept-map";
import type { GameSpec } from "@/domain/game-spec";
import type { CaseContent } from "../schema";

const concept = (id: string) => ({ id, name: id, summary: "s", kind: "process" as const, facts: ["f"], formulas: [], steps: [], misconceptions: [], relations: [], source_ref: null });
export const map: ConceptMap = { unit: { title: "Resp", course: "AP Bio", level: "AP/IB" }, source_coverage: "x",
  concepts: [concept("c_etc"), concept("c_ferment"), concept("c_atp")] };

const ch = (id: string, name: string, role: string, is_mentor = false) => ({ id, name, role, bio: `${name} bio`, is_mentor,
  secret: `${name} SECRET`, alibi: `${name} ALIBI`, knows: [`${name} KNOWS`], lies_about: "", speaking_style: "plain", portrait_tags: [role] });

export const content: CaseContent = {
  theme: "mystery",
  premise: "The greenhouse sensors went dark and every plant cell stopped making ATP.",
  setting: "School greenhouse",
  setting_tags: ["greenhouse", "plants"],
  characters: [ch("p1", "Dana Reyes", "pharmacist"), ch("p2", "Chef Omar", "chef"), ch("p3", "Lin Park", "gardener"), ch("m1", "Dr. Vale", "scientist", true)],
  evidence: [
    { id: "e1", title: "Tox report", text: "Complex IV blocked.", concept_ids: ["c_etc"], points_to: ["p1"], unlocked_by: "", unlock_topic: "" },
    { id: "e2", title: "Sensor log", text: "ATP fell in 4 minutes.", concept_ids: ["c_atp"], points_to: ["o1"], unlocked_by: "", unlock_topic: "" },
    { id: "e3", title: "Kitchen receipt", text: "Yeast order.", concept_ids: ["c_ferment"], points_to: ["p2"], unlocked_by: "", unlock_topic: "" },
    { id: "e4", title: "Garden diary", text: "Watered at noon.", concept_ids: [], points_to: ["p3"], unlocked_by: "p3", unlock_topic: "the watering schedule" },
    { id: "e5", title: "Pharmacy key log", text: "LOCKED SECRET EVIDENCE: Dana signed out the key.", concept_ids: ["c_etc"], points_to: ["p1"], unlocked_by: "p2", unlock_topic: "who had the pharmacy key" },
  ],
  board: [
    { id: "b1", question: "Which stage stopped first?", check_id: "d1", evidence_ids: ["e1"] },
    { id: "b2", question: "How many minutes did ATP take to fall?", check_id: "d2", evidence_ids: ["e2"] },
    { id: "b3", question: "Who had access to the inhibitor?", check_id: "d3", evidence_ids: ["e5"] },
  ],
  accusation: { prompt: "Who sabotaged the greenhouse?", options: [
    { id: "o1", label: "Dana Reyes", character_id: "p1" }, { id: "o2", label: "Chef Omar", character_id: "p2" }, { id: "o3", label: "Lin Park", character_id: "p3" }],
    correct_option_id: "o1", wrong_option_feedback: [{ option_id: "o2", feedback: "Fermentation clue misread." }, { option_id: "o3", feedback: "Timeline too slow." }] },
  solution: { summary: "Dana used a complex IV inhibitor.", chain: [
    { step: "ATP collapsed within minutes", concept_id: "c_atp" }, { step: "Only an ETC blocker acts that fast", concept_id: "c_etc" }] },
  field_guide: [{ concept_id: "c_etc", title: "ETC", explanation: "Electrons flow to O2.", source_ref: "slide 3" }],
};

export const spec: GameSpec<CaseContent> = {
  mode: "case", title: "The Dark Greenhouse", hook: "Why would every plant cell stop making energy at once?", briefing: "b", intro: "i", outro_win: "w", outro_lose: "l",
  concept_ids: ["c_etc"], asset_requests: [], content,
  checks: [{ id: "d1", kind: "choice", concept_ids: ["c_etc"], prompt: "Which stage stops first?", hints: ["1", "2", "3"],
    options: ["Glycolysis", "ETC"], answer: "ETC", feedback_by_wrong: { Glycolysis: "Glycolysis needs no O2." } },
    { id: "d2", kind: "number", concept_ids: ["c_atp"], prompt: "Minutes?", hints: ["1", "2", "3"], answer: 4, tolerance: 0, formula: null },
    { id: "d3", kind: "choice", concept_ids: ["c_etc"], prompt: "Who?", hints: ["1", "2", "3"], options: ["Dana Reyes", "Chef Omar"], answer: "Dana Reyes", feedback_by_wrong: { "Chef Omar": "His yeast acts slowly." } }],
};
