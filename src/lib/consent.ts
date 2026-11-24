// Cookie consent: the visitor's choice in the cookie banner.
// "accepted" = analytics allowed, "rejected" = only the cookies the shop needs to work.
export const CONSENT_COOKIE = "tp_consent";
export type ConsentChoice = "accepted" | "rejected";

/** Fired on window when the visitor makes or changes a choice. */
export const CONSENT_EVENT = "tp-consent-change";
/** Fired on window by the footer's "Cookie settings" link to show the banner again. */
export const OPEN_CONSENT_EVENT = "tp-open-cookie-settings";

export function readConsent(cookieHeader: string | undefined | null): ConsentChoice | null {
  const m = (cookieHeader ?? "").match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(accepted|rejected)`));
  return (m?.[1] as ConsentChoice) ?? null;
}
