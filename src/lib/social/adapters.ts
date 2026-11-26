// Picks the adapter for a platform: the mock when SOCIAL_MOCK=true, otherwise the real API.
import { instagramAdapter } from "./instagram";
import { isSocialMock, mockAdapter } from "./mock";
import { threadsAdapter } from "./threads";
import type { Platform, SocialAdapter } from "./types";

export function adapterFor(platform: Platform): SocialAdapter {
  if (isSocialMock()) return mockAdapter(platform);
  return platform === "INSTAGRAM" ? instagramAdapter : threadsAdapter;
}
