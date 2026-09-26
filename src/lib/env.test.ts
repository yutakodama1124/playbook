import { describe, it, expect, beforeEach } from "vitest";
import { readEnv } from "./env";

describe("readEnv", () => {
  beforeEach(() => {
    delete process.env.PIPELINE_MODE;
    delete process.env.DEV_NO_IMAGES;
  });
  it("defaults pipelineMode to inline and devNoImages to false", () => {
    const env = readEnv();
    expect(env.pipelineMode).toBe("inline");
    expect(env.devNoImages).toBe(false);
  });
  it("reads render mode and no-images flag", () => {
    process.env.PIPELINE_MODE = "render";
    process.env.DEV_NO_IMAGES = "1";
    const env = readEnv();
    expect(env.pipelineMode).toBe("render");
    expect(env.devNoImages).toBe(true);
  });
  it("throws a clear error when a required key is read but missing", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => readEnv().anthropicKey).toThrow(/ANTHROPIC_API_KEY/);
  });
});
