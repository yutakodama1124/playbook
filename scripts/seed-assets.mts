import { createLlmClient } from "../src/lib/llm.ts";
import { createSupabaseRepo } from "../src/repo/supabase.ts";
import { generateImage } from "../src/assets/image-gen.ts";
import { tagImage } from "../src/assets/tagger.ts";
import { supabaseUpload } from "../src/assets/resolver.ts";
import { STYLE_VERSION } from "../src/assets/library.ts";

const SCENES = ["high school chemistry lab at night", "old library with tall shelves", "spaceship bridge", "hospital exam room",
  "museum gallery", "1914 war office with maps", "greenhouse", "detective office", "courtroom", "factory floor",
  "research station in antarctica", "ancient roman forum", "biology lab with microscopes", "train station", "bank vault",
  "observatory", "kitchen of a fancy restaurant", "art studio", "ship cabin", "botanical garden"];
const PORTRAITS = ["pharmacist", "chef", "gardener", "scientist", "doctor", "nurse", "security guard", "engineer", "historian",
  "librarian", "museum curator", "ship captain", "student", "teacher", "detective", "coroner", "farmer", "journalist",
  "banker", "athlete coach"].flatMap((r) => [`portrait of a middle-aged ${r}`, `portrait of a young ${r}`]);

const limit = Number(process.argv[2] ?? 60);
const jobs = [...SCENES.map((s) => `wide scene: ${s}, several distinct objects to inspect`), ...PORTRAITS.map((p) => `${p}, shoulders up, neutral background`)].slice(0, limit);
const llm = createLlmClient(), repo = createSupabaseRepo();

for (const [i, prompt] of jobs.entries()) {
  const img = await generateImage(prompt);
  const url = await supabaseUpload(img.bytes, `library/seed-${Date.now()}-${i}.png`);
  const tags = await tagImage(llm, img);
  await repo.addAsset({ url, ...tags, styleVersion: STYLE_VERSION });
  console.log(`${i + 1}/${jobs.length}`, url, tags.tags.slice(0, 5).join(", "));
}
