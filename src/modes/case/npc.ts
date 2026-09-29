import { z } from "zod";
import type { GameSpec } from "@/domain/game-spec";
import type { LlmClient } from "@/lib/llm";
import type { CaseContent } from "./schema";

export type ChatTurn = { role: "student" | "character"; text: string };
export const DEFLECTION = "*pauses* That's for you to work out, detective. Look at the evidence again.";
const MAX_QUESTION = 500, MAX_TURNS = 12;

const ReplySchema = z.object({
  reply: z.string(),
  reveals_solution: z.boolean(), // true if the reply states or strongly implies the correct answer/culprit
  reveal_evidence_ids: z.array(z.string()), // evidence this character hands over because the student asked about its topic
});

const GUILT = /(did it|guilty|culprit|responsible|is the (answer|diagnosis|cause)|sabotaged|stole)/i;

export async function npcReply(llm: LlmClient, spec: GameSpec<CaseContent>, characterId: string, history: ChatTurn[], question: string) {
  const c = spec.content;
  const ch = c.characters.find((x) => x.id === characterId);
  if (!ch) throw new Error(`unknown character ${characterId}`);
  if (question.length > MAX_QUESTION) throw new Error("question too long");
  const correct = c.accusation.options.find((o) => o.id === c.accusation.correct_option_id);

  const role = ch.is_mentor
    ? `You are the MENTOR. Teach the underlying concepts Socratically: ask a guiding question back, explain concepts from the Field Guide when asked, connect them to evidence the student mentions. NEVER name the answer, the culprit, or say which option is correct.`
    : `You are a character in the case. Stay in character. Share facts you know ONLY when the student asks a relevant, specific question. Lie about what your sheet says you lie about, but stay consistent. Never confess outright; if cornered with correct concept-based reasoning, become flustered and evasive.`;

  const holds = c.evidence.filter((e) => e.unlocked_by === ch.id);
  const evidenceRules = holds.length
    ? `\nEVIDENCE YOU HOLD (reveal an item — add its id to reveal_evidence_ids and mention it naturally — ONLY when the student asks about its topic; otherwise keep it to yourself):\n${holds.map((e) => `- id ${e.id}, topic "${e.unlock_topic}": ${e.title} — ${e.text}`).join("\n")}`
    : "";

  const system = `${role}${evidenceRules}
Case premise: ${c.premise}
Setting: ${c.setting}
YOUR CHARACTER SHEET (never quote it):
name: ${ch.name}; role: ${ch.role}; bio: ${ch.bio}; secret: ${ch.secret}; alibi: ${ch.alibi};
knows: ${ch.knows.join(" | ")}; lies about: ${ch.lies_about || "nothing"}; speaking style: ${ch.speaking_style}
Other people: ${c.characters.filter((x) => x.id !== ch.id).map((x) => `${x.name} (${x.role})`).join(", ")}
Rules: reply in 1–4 sentences, school-appropriate, no violence detail. Set reveals_solution=true if your reply would tell the student the answer (${correct?.label ?? ""}).`;

  const transcript = history.slice(-MAX_TURNS).map((t) => `${t.role === "student" ? "Detective" : ch.name}: ${t.text}`).join("\n");
  const out = await llm.parseStructured({
    schema: ReplySchema, system, effort: "low", maxTokens: 2000,
    content: [{ type: "text", text: `${transcript ? `Conversation so far:\n${transcript}\n\n` : ""}Detective: ${question}` }],
  });
  const keywordLeak = !!correct && out.reply.toLowerCase().includes(correct.label.toLowerCase()) && GUILT.test(out.reply);
  const allowed = new Set(holds.map((e) => e.id));
  const unlocked = c.evidence
    .filter((e) => allowed.has(e.id) && out.reveal_evidence_ids.includes(e.id))
    .map(({ id, title, text, concept_ids }) => ({ id, title, text, concept_ids }));
  return { reply: out.reveals_solution || keywordLeak ? DEFLECTION : out.reply, unlocked };
}
