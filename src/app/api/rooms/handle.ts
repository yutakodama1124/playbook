import { NextResponse } from "next/server";

/** Runs a room operation, mapping thrown errors to a 400 with the message. */
export async function handle(fn: () => Promise<unknown>) {
  try {
    return NextResponse.json((await fn()) ?? { ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "request failed" }, { status: 400 });
  }
}
