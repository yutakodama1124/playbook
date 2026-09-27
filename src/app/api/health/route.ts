import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Reports which config is present (booleans only — never values).
export function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  return NextResponse.json({
    anthropic: has("ANTHROPIC_API_KEY"),
    supabaseUrl: has("SUPABASE_URL"),
    supabaseKey: has("SUPABASE_SERVICE_ROLE_KEY"),
    aiGateway: has("AI_GATEWAY_API_KEY"),
    render: has("RENDER_API_KEY"),
    pipelineMode: process.env.PIPELINE_MODE ?? "inline",
  });
}
