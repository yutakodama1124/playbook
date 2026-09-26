function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} — add it to .env.local`);
  return v;
}

export function readEnv() {
  return {
    get anthropicKey() { return required("ANTHROPIC_API_KEY"); },
    get supabaseUrl() { return required("SUPABASE_URL"); },
    get supabaseServiceKey() { return required("SUPABASE_SERVICE_ROLE_KEY"); },
    get renderApiKey() { return required("RENDER_API_KEY"); },
    get aiGatewayKey() { return required("AI_GATEWAY_API_KEY"); },
    get renderWorkflowSlug() { return process.env.RENDER_WORKFLOW_SLUG ?? "playbook-pipeline"; },
    pipelineMode: (process.env.PIPELINE_MODE === "render" ? "render" : "inline") as "inline" | "render",
    devNoImages: process.env.DEV_NO_IMAGES === "1",
  };
}

export const env = readEnv();
