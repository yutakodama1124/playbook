// Import hand-made art into the asset library:
// reads assets-import/<kind>-<description>.(png|jpg|jpeg|webp), uploads to Supabase, then tags each image.
// Usage: npx tsx --env-file=.env.local scripts/import-assets.mts
import { readdirSync, readFileSync, renameSync, mkdirSync } from "node:fs";
import { createLlmClient } from "../src/lib/llm.ts";
import { createSupabaseRepo } from "../src/repo/supabase.ts";
import { tagImage } from "../src/assets/tagger.ts";
import { STYLE_VERSION } from "../src/assets/library.ts";
import { supabaseAdmin } from "../src/lib/supabase-admin.ts";

const DIR = "assets-import";
const KINDS = ["scene", "portrait", "prop", "card", "boss"] as const;
const TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" } as const;

const llm = createLlmClient(), repo = createSupabaseRepo(), db = supabaseAdmin();
mkdirSync(`${DIR}/done`, { recursive: true });
const known = new Set((await repo.listAssets()).map((a) => a.url));

for (const file of readdirSync(DIR).sort()) {
  const m = file.match(/^([a-z]+)-(.+)\.(png|jpe?g|webp)$/i);
  if (!m) continue;
  const kind = m[1].toLowerCase() as (typeof KINDS)[number];
  if (!KINDS.includes(kind)) { console.warn(`skip ${file}: unknown kind "${m[1]}"`); continue; }
  const ext = m[3].toLowerCase() as keyof typeof TYPES;
  const bytes = new Uint8Array(readFileSync(`${DIR}/${file}`));
  const path = `library/import-${file.toLowerCase()}`;
  const url = db.storage.from("assets").getPublicUrl(path).data.publicUrl;
  if (known.has(url)) { console.log(`already imported ${file}`); continue; }

  const { error } = await db.storage.from("assets").upload(path, bytes, { contentType: TYPES[ext], upsert: true });
  if (error) throw new Error(`${file}: ${error.message}`);
  const tags = await tagImage(llm, { bytes, mediaType: TYPES[ext] });
  const nameTags = m[2].toLowerCase().split("-").filter((t) => t.length > 2);
  await repo.addAsset({ url, kind, mood: tags.mood, positions: tags.positions,
    tags: [...new Set([...nameTags, ...tags.tags])], styleVersion: STYLE_VERSION });
  renameSync(`${DIR}/${file}`, `${DIR}/done/${file}`);
  console.log(`imported ${file}: ${tags.tags.slice(0, 5).join(", ")}`);
}
