// Shared types for the social scheduler. Kept free of server-only imports so client
// components (the composer) can use the limits and labels too.

export type Platform = "INSTAGRAM" | "THREADS";
export const PLATFORMS: Platform[] = ["INSTAGRAM", "THREADS"];
export const isPlatform = (v: unknown): v is Platform => v === "INSTAGRAM" || v === "THREADS";

export const PLATFORM_LABEL: Record<Platform, string> = { INSTAGRAM: "Instagram", THREADS: "Threads" };
/** Maximum caption length per platform. */
export const CAPTION_LIMIT: Record<Platform, number> = { INSTAGRAM: 2200, THREADS: 500 };
/** Instagram can't post text only; Threads can. */
export const NEEDS_IMAGE: Record<Platform, boolean> = { INSTAGRAM: true, THREADS: false };

export type TargetStatus = "scheduled" | "publishing" | "published" | "failed";

/** An error with a message that's safe and useful to show in the admin (never contains tokens). */
export class SocialError extends Error {
  constructor(
    message: string,
    /** true when the account must be reconnected (token expired or revoked). */
    readonly needsReconnect = false,
  ) {
    super(message);
    this.name = "SocialError";
  }
}

export type PublishInput = {
  caption: string;
  imageUrl: string | null;
  /** Container from an earlier attempt (retry): reused when it is still valid, so nothing is posted twice. */
  previousContainerId?: string | null;
};
export type PublishResult = { id: string; permalink: string | null };
export type AccountAuth = { externalUserId: string; accessToken: string };

/** Same interface for every platform (and the mock). */
export interface SocialAdapter {
  platform: Platform;
  /**
   * Creates the media container, waits until it's ready and publishes it.
   * `onContainer` is called with the container id as soon as it exists, so it's recorded
   * even if publishing fails later.
   */
  publish(auth: AccountAuth, input: PublishInput, onContainer?: (id: string) => Promise<void>): Promise<PublishResult>;
  /** Exchanges a long-lived token for a fresh one (another ~60 days). */
  refreshToken(accessToken: string): Promise<{ accessToken: string; expiresAt: Date | null }>;
}
