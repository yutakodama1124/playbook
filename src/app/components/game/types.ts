import type { PublicCheck } from "@/domain/public-spec";

export type PublicGame<C = unknown> = {
  id: string; unitId: string; mode: string; status: string; error: string | null;
  assets: Record<string, string>;
  spec: { title: string; hook?: string; briefing: string; intro: string; outro_win: string; outro_lose: string; checks: PublicCheck[]; content: C } | null;
};
