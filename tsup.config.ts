import { defineConfig } from "tsup";
export default defineConfig({ entry: ["workflow/index.ts"], format: ["esm"], outDir: "dist-workflow", clean: true,
  esbuildOptions(o) { o.alias = { "@": "./src" }; } });
