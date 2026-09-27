import type { AssetRow } from "@/repo/types";

export const HOUSE_STYLE = "flat vector illustration, clean shapes, soft cel shading, muted teal and warm amber palette, subtle paper texture, no text, no watermark, consistent storybook game art";
export const STYLE_VERSION = 1;
export const PLACEHOLDER_URL = "/placeholder-scene.svg";

const words = (tags: string[]) => new Set(tags.flatMap((t) => t.toLowerCase().split(/[\s,/]+/)).filter(Boolean));

/** Number of wanted words found anywhere in the asset's tags ("middle-aged" matches "middle-aged man"). */
export function scoreAsset(asset: AssetRow, wanted: string[]): number {
  const have = words(asset.tags);
  return [...words(wanted)].filter((w) => have.has(w)).length;
}

export function pickAsset(assets: AssetRow[], wanted: string[], minScore = 1, excludeUrls: Set<string> = new Set()): AssetRow | null {
  let best: AssetRow | null = null, bestScore = minScore - 1;
  for (const a of assets) {
    if (a.styleVersion !== STYLE_VERSION || excludeUrls.has(a.url)) continue;
    const s = scoreAsset(a, wanted);
    if (s > bestScore) { best = a; bestScore = s; }
  }
  return best;
}
