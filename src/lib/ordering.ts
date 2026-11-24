// Ordering pause: switched on in admin → Dashboard. The shop stays open for browsing, favorites,
// the blog and search engines, but adding to cart and checkout are blocked, also on the server.
import { getSettings } from "./settings";

export type OrderingState = { paused: boolean; message: string; until: Date | null };

type PauseFields = { orderingPaused: boolean; orderingPauseMessage: string; orderingPausedUntil: Date | null };

export const DEFAULT_PAUSE_MESSAGE = "Ordering is paused for a short while. You can still browse and save your favorites.";

/** Paused when the switch is on and the optional end time hasn't passed yet. */
export function orderingState(s: PauseFields): OrderingState {
  const until = s.orderingPausedUntil;
  const paused = s.orderingPaused && !(until && until.getTime() <= Date.now());
  return { paused, message: s.orderingPauseMessage.trim() || DEFAULT_PAUSE_MESSAGE, until: paused ? until : null };
}

export async function getOrderingState(): Promise<OrderingState> {
  return orderingState(await getSettings());
}

/** The visitor-facing notice: the admin's message plus when ordering opens again (if set). */
export function pauseText(state: OrderingState): string {
  return state.until ? `${state.message} Ordering opens again on ${formatResumeTime(state.until)} (Amsterdam time).` : state.message;
}

/** "Monday 1 December, 09:00" in Amsterdam time, for the notice. */
export function formatResumeTime(d: Date): string {
  return d.toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
}
