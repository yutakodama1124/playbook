import type { UnitSource } from "@/pipeline/ingest";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function fileToSource(name: string, type: string, bytes: ArrayBuffer): UnitSource | null {
  const b64 = () => Buffer.from(bytes).toString("base64");
  if (type === "application/pdf" || name.endsWith(".pdf")) return { kind: "pdf", base64: b64() };
  const img = IMAGE_TYPES.find((t) => t === type);
  if (img) return { kind: "image", base64: b64(), mediaType: img };
  if (type.startsWith("text/") || /\.(md|txt)$/i.test(name)) return { kind: "text", text: new TextDecoder().decode(bytes) };
  return null;
}
