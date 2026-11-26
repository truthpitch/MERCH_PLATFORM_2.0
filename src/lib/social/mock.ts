// Mock adapter (SOCIAL_MOCK=true): runs the whole flow without real accounts or network calls.
// Put "#fail" in a caption to see what a failed post looks like.
import { SocialError, type Platform, type SocialAdapter } from "./types";
import { envValue } from "./env";

export const isSocialMock = () => envValue("SOCIAL_MOCK") === "true";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function mockAdapter(platform: Platform): SocialAdapter {
  return {
    platform,
    async publish(_auth, input, onContainer) {
      const container = `mock-container-${Date.now()}`;
      await onContainer?.(container);
      await sleep(300);
      if (input.caption.includes("#fail")) {
        throw new SocialError(`Mock ${platform === "INSTAGRAM" ? "Instagram" : "Threads"} error: the caption contains #fail.`);
      }
      const id = `mock-${Date.now()}`;
      return { id, permalink: `https://example.com/mock/${platform.toLowerCase()}/${id}` };
    },
    async refreshToken() {
      return { accessToken: `mock-token-${Date.now()}`, expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000) };
    },
  };
}
