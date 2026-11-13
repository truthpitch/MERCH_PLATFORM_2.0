import { prisma } from "./db";

/** Returns the single settings row, creating it with defaults on first run. */
export async function getSettings() {
  return prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}
