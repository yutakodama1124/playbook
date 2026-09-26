import { nanoid } from "nanoid";
import { env } from "@/lib/env";
import type { LlmClient } from "@/lib/llm";
import type { AssetResolver } from "@/pipeline/run";
import type { Repo } from "@/repo/types";
import { generateImage } from "./image-gen";
import { pickAsset, PLACEHOLDER_URL, STYLE_VERSION } from "./library";
import { tagImage } from "./tagger";

export function createAssetResolver(deps: {
  repo: Repo; llm: LlmClient; upload: (bytes: Uint8Array, path: string) => Promise<string>;
}): AssetResolver {
  return async (spec) => {
    const out: Record<string, string> = {};
    const library = await deps.repo.listAssets();
    for (const req of spec.asset_requests) {
      const hit = pickAsset(library, req.tags, 2);
      if (hit) { out[req.role] = hit.url; continue; }
      if (env.devNoImages) { out[req.role] = PLACEHOLDER_URL; continue; }
      const img = await generateImage(req.tags.join(", "));
      const url = await deps.upload(img.bytes, `library/${nanoid()}.png`);
      const tags = await tagImage(deps.llm, img);
      const row = await deps.repo.addAsset({ url, ...tags, tags: [...new Set([...tags.tags, ...req.tags])], styleVersion: STYLE_VERSION });
      library.push(row);
      out[req.role] = url;
    }
    return out;
  };
}

export async function supabaseUpload(bytes: Uint8Array, path: string): Promise<string> {
  const { supabaseAdmin } = await import("@/lib/supabase-admin");
  const db = supabaseAdmin();
  const { error } = await db.storage.from("assets").upload(path, bytes, { contentType: "image/png", upsert: false });
  if (error) throw new Error(error.message);
  return db.storage.from("assets").getPublicUrl(path).data.publicUrl;
}
