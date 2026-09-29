/**
 * Best-effort per-IP limiter for chat-style endpoints. In-memory, so it is per serverless
 * instance and resets on cold start — it slows abuse down; the hard caps live in budget.ts.
 */
const hits = new Map<string, number[]>();

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

export function allow(key: string, max: number, windowMs: number, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
