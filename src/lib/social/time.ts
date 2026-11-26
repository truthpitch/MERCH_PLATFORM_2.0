// Times in the social scheduler are stored in UTC and shown/entered in Amsterdam time.
const ZONE = "Europe/Amsterdam";

/** Offset of Amsterdam from UTC at a given moment, in ms (+1h in winter, +2h in summer). */
function offsetMs(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** "2026-12-01T09:30" (Amsterdam wall clock) → the exact UTC moment, or null if invalid. */
export function amsterdamToUtc(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes handle the daylight-saving switch correctly.
  let utc = guess - offsetMs(new Date(guess));
  utc = guess - offsetMs(new Date(utc));
  const d = new Date(utc);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** UTC moment → "2026-12-01T09:30" in Amsterdam time (for a datetime-local field). */
export function utcToAmsterdamInput(d: Date): string {
  return new Date(d.getTime() + offsetMs(d)).toISOString().slice(0, 16);
}

/** "1 Dec 2026, 09:30" in Amsterdam time. */
export const formatAmsterdam = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: ZONE });
