import { z } from "zod";
import type { LlmClient } from "@/lib/llm";
import type { GeneratedImage } from "./image-gen";

const TagSchema = z.object({
  kind: z.enum(["scene", "portrait", "prop", "card", "boss"]),
  tags: z.array(z.string()).min(3).max(15),
  mood: z.string(),
  positions: z.record(z.string(), z.enum(["top-left", "top-center", "top-right", "middle-left", "center", "middle-right", "bottom-left", "bottom-center", "bottom-right"])),
});

export function tagImage(llm: LlmClient, img: GeneratedImage) {
  return llm.parseStructured({
    schema: TagSchema,
    effort: "low",
    maxTokens: 4000,
    system: "You catalog game art. Tag the image for search: setting, objects, character role/age/look, era, mood. positions: map each clickable-worthy object to its 3x3 grid zone. Lowercase tags.",
    content: [
      { type: "image", source: { type: "base64", media_type: img.mediaType, data: Buffer.from(img.bytes).toString("base64") } },
      { type: "text", text: "Catalog this image." },
    ],
  });
}
