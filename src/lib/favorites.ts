// Favorites ("hearts").
//  • Signed-in customers: saved in the database, so they follow the account to any device.
//  • Guests: saved in a cookie on this device. When a guest signs in or registers,
//    those favorites are moved into the account.
import { cookies } from "next/headers";
import { getCustomerId } from "./customers";
import { prisma } from "./db";

const GUEST_COOKIE = "tp_favorites";
const MAX_GUEST = 60; // keeps the cookie well under the 4 KB limit
const HANDLE_RE = /^[a-z0-9][a-z0-9-]{0,99}$/i;

export const isValidHandle = (h: unknown): h is string => typeof h === "string" && HANDLE_RE.test(h);

async function readGuest(): Promise<string[]> {
  const raw = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidHandle).slice(0, MAX_GUEST) : [];
  } catch {
    return [];
  }
}

async function writeGuest(handles: string[]) {
  const jar = await cookies();
  if (handles.length === 0) jar.delete(GUEST_COOKIE);
  else
    jar.set(GUEST_COOKIE, JSON.stringify(handles.slice(0, MAX_GUEST)), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
}

/** Handles of the visitor's favorite products, newest first. */
export async function getFavoriteHandles(): Promise<string[]> {
  const customerId = await getCustomerId();
  if (!customerId) return readGuest();
  const rows = await prisma.favorite.findMany({ where: { customerId }, orderBy: { createdAt: "desc" }, select: { handle: true } });
  return rows.map((r) => r.handle);
}

/** Adds or removes a favorite. Returns the new list. */
export async function setFavorite(handle: string, on: boolean): Promise<string[]> {
  const customerId = await getCustomerId();
  if (customerId) {
    if (on) {
      await prisma.favorite.upsert({
        where: { customerId_handle: { customerId, handle } },
        update: {},
        create: { customerId, handle },
      });
    } else {
      await prisma.favorite.deleteMany({ where: { customerId, handle } });
    }
    return getFavoriteHandles();
  }
  const list = (await readGuest()).filter((h) => h !== handle);
  const next = on ? [handle, ...list] : list;
  await writeGuest(next);
  return next.slice(0, MAX_GUEST);
}

/** After signing in: move this device's guest favorites into the account. */
export async function mergeGuestFavorites(customerId: number): Promise<void> {
  const guest = await readGuest();
  if (guest.length === 0) return;
  const existing = new Set(
    (await prisma.favorite.findMany({ where: { customerId }, select: { handle: true } })).map((r) => r.handle),
  );
  const missing = guest.filter((h) => !existing.has(h));
  for (const handle of missing.reverse()) {
    await prisma.favorite.create({ data: { customerId, handle } });
  }
  await writeGuest([]);
}
