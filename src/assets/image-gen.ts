import { generateImage as aiGenerateImage } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { HOUSE_STYLE } from "./library";

// Default is the cheap FLUX.2 Klein (~$0.014/image). Bake-off candidates: "recraft/recraft-v4.1-flash", "openai/gpt-image-2".
export const IMAGE_MODEL = process.env.IMAGE_MODEL ?? "bfl/flux-2-klein-4b";

export type GeneratedImage = { bytes: Uint8Array; mediaType: "image/png" | "image/jpeg" | "image/webp" };

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const { image } = await aiGenerateImage({
    model: gateway.imageModel(IMAGE_MODEL),
    prompt: `${prompt}. Style: ${HOUSE_STYLE}`,
    aspectRatio: "16:9",
  });
  const mt = image.mediaType;
  const mediaType = mt === "image/jpeg" || mt === "image/webp" ? mt : "image/png";
  return { bytes: image.uint8Array, mediaType };
}
