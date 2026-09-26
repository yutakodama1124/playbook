import { describe, it, expect } from "vitest";
import { fileToSource } from "./parse-upload";

const bytes = new TextEncoder().encode("hi").buffer;

describe("fileToSource", () => {
  it("maps pdf, images, and text; rejects others", () => {
    expect(fileToSource("a.pdf", "application/pdf", bytes)).toMatchObject({ kind: "pdf" });
    expect(fileToSource("a.jpg", "image/jpeg", bytes)).toMatchObject({ kind: "image", mediaType: "image/jpeg" });
    expect(fileToSource("a.md", "text/markdown", bytes)).toEqual({ kind: "text", text: "hi" });
    expect(fileToSource("a.zip", "application/zip", bytes)).toBeNull();
  });
});
