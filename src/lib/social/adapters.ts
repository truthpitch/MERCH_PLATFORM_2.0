// Picks the adapter for a platform: the mock when SOCIAL_MOCK=true, otherwise the real API.
import { isSocialMock, mockAdapter } from "./mock";
import { SocialError, type Platform, type SocialAdapter } from "./types";

export function adapterFor(platform: Platform): SocialAdapter {
  if (isSocialMock()) return mockAdapter(platform);
  // Real adapters arrive in step 2 (Instagram) and step 3 (Threads).
  const notYet = (): never => {
    throw new SocialError(`${platform === "INSTAGRAM" ? "Instagram" : "Threads"} publishing isn't set up yet. Use SOCIAL_MOCK=true for now.`);
  };
  return { platform, publish: async () => notYet(), refreshToken: async () => notYet() };
}
