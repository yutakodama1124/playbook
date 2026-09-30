import type { ConceptMap } from "@/domain/concept-map";
import type { GameSpec } from "@/domain/game-spec";
import type { CaseContent } from "../schema";

const concept = (id: string) => ({ id, name: id, summary: "s", kind: "process" as const, facts: ["f"], formulas: [], steps: [], misconceptions: [], relations: [], source_ref: null });
export const map: ConceptMap = { unit: { title: "Resp", course: "AP Bio", level: "AP/IB" }, source_coverage: "x",
  concepts: [concept("c_etc"), concept("c_ferment"), concept("c_atp")] };

const ch = (id: string, name: string, role: string, is_mentor = false) => ({ id, name, role, bio: `${name} works here.`, is_mentor, portrait_tags: [role] });
const st = (id: string, text: string, unlock = "") => ({ id, text, press_reply: `More about ${id}.`, press_unlocks_evidence_id: unlock });
const hints = ["Look closely.", "Think about oxygen.", "Compare the log to what they said."];

export const content: CaseContent = {
  theme: "mystery",
  premise: "Every plant in the school greenhouse stopped making energy overnight.",
  setting: "School greenhouse",
  setting_tags: ["greenhouse", "plants"],
  characters: [ch("p1", "Dana Reyes", "pharmacist"), ch("p2", "Chef Omar", "chef"), ch("p3", "Lin Park", "gardener"), ch("m1", "Dr. Vale", "scientist", true)],
  evidence: [
    { id: "e1", title: "Tox report", detail: "Complex IV activity was zero.", key_fact: "Complex IV blocked", concept_ids: ["c_etc"], starts_in_file: true },
    { id: "e2", title: "Sensor log", detail: "ATP fell to near zero in 4 minutes.", key_fact: "ATP gone in 4 minutes", concept_ids: ["c_atp"], starts_in_file: true },
    { id: "e3", title: "Key log", detail: "SECRET UNLOCK: Dana signed out the key at 1 a.m.", key_fact: "Dana had the key", concept_ids: ["c_etc"], starts_in_file: false },
  ],
  testimonies: [
    { id: "t1", witness_id: "p3", title: "The night shift", statements: [st("s1", "I watered at midnight."), st("s2", "The plants were slowly fermenting, so they were fine."), st("s3", "Nobody came in.", "e3")],
      contradiction: { statement_id: "s2", evidence_id: "e2", concept_id: "c_ferment", explanation: "Fermentation keeps some ATP; losing it all in minutes means the chain was blocked." },
      breakthrough: "Okay, the readings crashed fast. I panicked.", hints },
    { id: "t2", witness_id: "p1", title: "My alibi", statements: [st("s4", "I never touched the pharmacy key."), st("s5", "I left at 11."), st("s6", "Omar was still in the kitchen.")],
      contradiction: { statement_id: "s4", evidence_id: "e3", concept_id: "c_etc", explanation: "The key log shows Dana signed out the key." },
      breakthrough: "Fine. I borrowed the key.", hints },
  ],
  finale: {
    question: "Who sabotaged the greenhouse?",
    options: [{ id: "o1", label: "Dana Reyes", character_id: "p1" }, { id: "o2", label: "Chef Omar", character_id: "p2" }, { id: "o3", label: "Lin Park", character_id: "p3" }],
    correct_option_id: "o1", proof_evidence_id: "e1",
    wrong_option_feedback: [{ option_id: "o2", feedback: "Omar's yeast acts slowly." }, { option_id: "o3", feedback: "Lin had no access to inhibitors." }],
    explanation: "SOLUTION TEXT: a complex IV inhibitor stopped the chain.",
  },
  field_guide: [{ concept_id: "c_etc", title: "ETC", explanation: "Electrons flow to O2.", source_ref: "slide 3" }],
};

export const spec: GameSpec<CaseContent> = {
  mode: "case", title: "The Dark Greenhouse", hook: "Why would every plant stop making energy at once?", briefing: "b", intro: "i", outro_win: "w", outro_lose: "l",
  concept_ids: ["c_etc"], asset_requests: [], content, checks: [],
};
