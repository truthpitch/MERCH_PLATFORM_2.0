// Simple in-memory rate limiting per visitor (IP address).
// It resets when the server restarts, which is fine for a small shop.
import { headers } from "next/headers";

const buckets = new Map<string, Map<string, number[]>>();

/** Returns true when this visitor already used up `max` tries within `windowMs` for this bucket. */
export async function isRateLimited(bucket: string, max: number, windowMs: number): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const hits = buckets.get(bucket) ?? new Map<string, number[]>();
  buckets.set(bucket, hits);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  const limited = recent.length >= max;
  if (!limited) recent.push(now);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  hits.set(ip, recent);
  return limited;
}
