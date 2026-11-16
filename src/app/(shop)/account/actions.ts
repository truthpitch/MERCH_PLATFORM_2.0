"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  EMAIL_RE,
  MIN_PASSWORD_LENGTH,
  endCustomerSession,
  getCustomerId,
  hashPassword,
  safeNext,
  startCustomerSession,
  verifyPassword,
} from "@/lib/customers";
import { prisma } from "@/lib/db";
import { mergeGuestFavorites } from "@/lib/favorites";

export type AccountField = "name" | "email" | "password";
export type AccountState = {
  error?: string;
  fieldErrors?: Partial<Record<AccountField, string>>;
  values?: { name?: string; email?: string };
};

// In-memory rate limit against password guessing: 10 tries per 15 minutes per visitor (IP).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 10;
const tries = new Map<string, number[]>();

async function tooManyTries(): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const now = Date.now();
  const list = (tries.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  const limited = list.length >= MAX_TRIES;
  if (!limited) list.push(now);
  if (tries.size > 5000) tries.clear();
  tries.set(ip, list);
  return limited;
}

const read = (formData: FormData, key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);

export async function registerAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const name = read(formData, "name", 100);
  const email = read(formData, "email", 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { name, email };

  const fieldErrors: AccountState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Please enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH) fieldErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  else if (password.length > 200) fieldErrors.password = "That password is too long.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  if (await tooManyTries()) return { error: "Too many attempts. Please wait a few minutes and try again.", values };

  if (await prisma.customer.findUnique({ where: { email }, select: { id: true } })) {
    return { fieldErrors: { email: "An account with this email already exists. Sign in instead." }, values };
  }

  const customer = await prisma.customer.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  await startCustomerSession(customer.id);
  await mergeGuestFavorites(customer.id);
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function loginAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const email = read(formData, "email", 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { email };
  if (!EMAIL_RE.test(email) || !password) return { error: "Please enter your email and password.", values };
  if (await tooManyTries()) return { error: "Too many attempts. Please wait a few minutes and try again.", values };

  const customer = await prisma.customer.findUnique({ where: { email } });
  // Same message whether the email or the password is wrong, so emails can't be probed.
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return { error: "That email and password don't match.", values };
  }

  await startCustomerSession(customer.id);
  await mergeGuestFavorites(customer.id);
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await endCustomerSession();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Permanently deletes the account and its favorites (the visitor must tick a confirmation box). */
export async function deleteAccountAction(formData: FormData) {
  const id = await getCustomerId();
  if (!id) redirect("/account/login");
  if (formData.get("confirm") !== "on") redirect("/account?delete=confirm");
  await prisma.customer.delete({ where: { id } }).catch(() => null);
  await endCustomerSession();
  revalidatePath("/", "layout");
  redirect("/?account=deleted");
}
