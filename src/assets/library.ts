import type { AssetRow } from "@/repo/types";

export const HOUSE_STYLE = "flat vector illustration, clean shapes, soft cel shading, muted teal and warm amber palette, subtle paper texture, no text, no watermark, consistent storybook game art";
export const STYLE_VERSION = 1;
export const PLACEHOLDER_URL = "/placeholder-scene.svg";

export function scoreAsset(asset: AssetRow, wanted: string[]): number {
  const have = new Set(asset.tags.map((t) => t.toLowerCase()));
  return wanted.filter((w) => have.has(w.toLowerCase())).length;
}

export function pickAsset(assets: AssetRow[], wanted: string[], minScore = 1): AssetRow | null {
  let best: AssetRow | null = null, bestScore = minScore - 1;
  for (const a of assets) {
    if (a.styleVersion !== STYLE_VERSION) continue;
    const s = scoreAsset(a, wanted);
    if (s > bestScore) { best = a; bestScore = s; }
  }
  return best;
}
