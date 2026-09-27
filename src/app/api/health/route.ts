import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Temporary deploy check: reports which config is present (booleans only). Remove after deploy is verified.
export function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  return NextResponse.json({
    anthropic: has("ANTHROPIC_API_KEY"),
    supabaseUrl: has("SUPABASE_URL"),
    supabaseKey: has("SUPABASE_SERVICE_ROLE_KEY"),
    aiGateway: has("AI_GATEWAY_API_KEY"),
    render: has("RENDER_API_KEY"),
    pipelineMode: has("PIPELINE_MODE"),
  });
}
