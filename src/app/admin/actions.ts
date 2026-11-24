"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, isAuthConfigured, requireAdmin, startSession } from "@/lib/auth";
import { findCategory } from "@/lib/categories";
import { DEFAULT_REFUND_POLICY } from "@/lib/legal";
import { DEFAULT_PRIVACY_POLICY } from "@/lib/privacy-policy";
import { DEFAULT_SHIPPING_POLICY } from "@/lib/shipping-policy";
import { DEFAULT_TERMS } from "@/lib/terms";
import { prisma } from "@/lib/db";
import { getUploadDir, isSafeFilename, removeFaviconFile } from "@/lib/uploads";
import { isMailConfigured, sendActivationEmail } from "@/lib/activation";

// ── Helpers ─────────────────────────────────────────────────

function text(formData: FormData, key: string, max = 5000): string {
  return String(formData.get(key) ?? "").slice(0, max).trim();
}

/** Accept empty, site-relative (/media/…) or http(s) URLs only. */
function imageUrl(formData: FormData, key: string): string {
  const value = text(formData, key, 1000);
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Same rules as imageUrl: a page on this site (/products…) or an http(s) link. */
const linkUrl = imageUrl;

/** An exact moment sent as an ISO string by the admin's date picker, or null when empty/invalid. */
function dateOrNull(formData: FormData, key: string): Date | null {
  const value = text(formData, key, 40);
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function refreshSite() {
  revalidatePath("/", "layout");
}

// ── Auth ────────────────────────────────────────────────────

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return { error: "Admin login is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD and AUTH_SECRET in .env." };
  }
  const email = text(formData, "email", 200);
  const password = String(formData.get("password") ?? "");
  if (!checkCredentials(email, password)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "Incorrect email or password." };
  }
  await startSession(email, formData.get("remember") === "on");
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ── Maintenance ─────────────────────────────────────────────

export async function setMaintenanceAction(formData: FormData) {
  await requireAdmin();
  const on = formData.get("on") === "1";
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: { maintenanceMode: on }, create: { id: 1, maintenanceMode: on } });
  refreshSite();
}

// ── Favicon (upload goes through /admin/favicon) ─────────────

export async function removeFaviconAction() {
  await requireAdmin();
  const { faviconUrl } = await prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.siteSettings.update({ where: { id: 1 }, data: { faviconUrl: "" } });
  await removeFaviconFile(faviconUrl);
  refreshSite();
  redirect("/admin?favicon=removed#favicon");
}

export async function saveMaintenanceMessageAction(formData: FormData) {
  await requireAdmin();
  const maintenanceMessage = text(formData, "maintenanceMessage", 500);
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: { maintenanceMessage }, create: { id: 1, maintenanceMessage } });
  refreshSite();
  redirect("/admin?saved=1");
}

// ── Homepage content ────────────────────────────────────────

export async function saveHomepageAction(formData: FormData) {
  await requireAdmin();
  const data = {
    heroTitle: text(formData, "heroTitle", 200),
    heroSubtitle: text(formData, "heroSubtitle", 500),
    heroCtaLabel: text(formData, "heroCtaLabel", 60),
    heroImageUrl: imageUrl(formData, "heroImageUrl"),
    announcementEnabled: formData.get("announcementEnabled") === "on",
    announcementText: text(formData, "announcementText", 200),
    announcementTimerLabel: text(formData, "announcementTimerLabel", 80),
    announcementCtaLabel: text(formData, "announcementCtaLabel", 40),
    announcementCtaUrl: linkUrl(formData, "announcementCtaUrl"),
    announcementEndsAt: dateOrNull(formData, "announcementEndsAt"),
  };
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  refreshSite();
  redirect("/admin/homepage?saved=1");
}

// ── About page ──────────────────────────────────────────────

export async function saveAboutAction(formData: FormData) {
  await requireAdmin();
  const data = {
    aboutTitle: text(formData, "aboutTitle", 120),
    aboutIntro: text(formData, "aboutIntro", 500),
    aboutText: text(formData, "aboutText", 10000),
    aboutImageUrl: imageUrl(formData, "aboutImageUrl"),
    aboutValue1Title: text(formData, "aboutValue1Title", 80),
    aboutValue1Text: text(formData, "aboutValue1Text", 500),
    aboutValue2Title: text(formData, "aboutValue2Title", 80),
    aboutValue2Text: text(formData, "aboutValue2Text", 500),
    aboutValue3Title: text(formData, "aboutValue3Title", 80),
    aboutValue3Text: text(formData, "aboutValue3Text", 500),
  };
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  refreshSite();
  redirect("/admin/about?saved=1");
}

// ── Featured products ───────────────────────────────────────

export async function addFeaturedAction(formData: FormData) {
  await requireAdmin();
  const handle = text(formData, "handle", 255);
  if (!handle) return;
  const last = await prisma.featuredProduct.findFirst({ orderBy: { position: "desc" } });
  await prisma.featuredProduct.upsert({
    where: { handle },
    update: {},
    create: { handle, position: (last?.position ?? -1) + 1 },
  });
  refreshSite();
}

export async function removeFeaturedAction(formData: FormData) {
  await requireAdmin();
  const handle = text(formData, "handle", 255);
  await prisma.featuredProduct.deleteMany({ where: { handle } });
  refreshSite();
}

export async function moveFeaturedAction(formData: FormData) {
  await requireAdmin();
  const handle = text(formData, "handle", 255);
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const rows = await prisma.featuredProduct.findMany({ orderBy: { position: "asc" } });
  const i = rows.findIndex((r) => r.handle === handle);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await prisma.$transaction(rows.map((r, position) => prisma.featuredProduct.update({ where: { id: r.id }, data: { position } })));
  refreshSite();
}

// ── Product stories ("MORE INFO") ───────────────────────────

export async function saveStoryAction(formData: FormData) {
  await requireAdmin();
  const handle = text(formData, "handle", 255);
  if (!handle) return;
  const data = { story: text(formData, "story", 20000), imageUrl: imageUrl(formData, "imageUrl") };
  await prisma.productStory.upsert({ where: { handle }, update: data, create: { handle, ...data } });
  refreshSite();
  redirect(`/admin/products/${encodeURIComponent(handle)}?saved=1`);
}

/** Picks a category for one product by hand; "" goes back to automatic. */
export async function saveProductCategoryAction(formData: FormData) {
  await requireAdmin();
  const handle = text(formData, "handle", 255);
  if (!handle) return;
  const wanted = text(formData, "category", 100);
  const category = findCategory(wanted)?.slug ?? "";
  await prisma.productStory.upsert({ where: { handle }, update: { category }, create: { handle, category } });
  refreshSite();
  redirect(`/admin/products?saved=${encodeURIComponent(handle)}`);
}

// ── Media ───────────────────────────────────────────────────

export async function deleteMediaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return;
  if (isSafeFilename(media.filename)) {
    await unlink(path.join(getUploadDir(), media.filename)).catch(() => undefined);
  }
  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}

// ── Contact page ────────────────────────────────────────────

export async function saveContactPageAction(formData: FormData) {
  await requireAdmin();
  const contactEmail = text(formData, "contactEmail", 200);
  const data = {
    contactTitle: text(formData, "contactTitle", 120) || "Contact",
    contactIntro: text(formData, "contactIntro", 2000),
    // Optional address shown next to the form on the contact page.
    contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ? contactEmail : "",
  };
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  refreshSite();
  redirect("/admin/contact?saved=1");
}

// ── User accounts ───────────────────────────────────────────

/** Back to the accounts list the admin was looking at (only that page is allowed). */
function accountsBack(formData: FormData, result: string): never {
  const back = text(formData, "back", 500);
  const base = back.startsWith("/admin/accounts") && !back.startsWith("//") ? back : "/admin/accounts";
  redirect(`${base}${base.includes("?") ? "&" : "?"}done=${result}`);
}

const customerIdFrom = (formData: FormData) => {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Marks the account as not activated and emails a new activation link.
 * The customer is signed out everywhere until they click it.
 */
export async function sendActivationLinkAction(formData: FormData) {
  await requireAdmin();
  const id = customerIdFrom(formData);
  const customer = id ? await prisma.customer.findUnique({ where: { id } }) : null;
  if (!customer) accountsBack(formData, "missing");
  if (!isMailConfigured()) accountsBack(formData, "nomail");

  await prisma.customer.update({ where: { id: customer.id }, data: { activatedAt: null, sessionVersion: { increment: 1 } } });
  const result = await sendActivationEmail(customer, "/account", { force: true });
  if (result !== "sent") {
    // The email didn't go out: put the account back the way it was.
    await prisma.customer.update({ where: { id: customer.id }, data: { activatedAt: customer.activatedAt } });
    accountsBack(formData, "failed");
  }
  accountsBack(formData, "sent");
}

/** Permanently deletes a customer account and its favorites. Orders stay in Shopify. */
export async function deleteCustomerAction(formData: FormData) {
  await requireAdmin();
  const id = customerIdFrom(formData);
  if (id) await prisma.customer.delete({ where: { id } }).catch(() => null);
  accountsBack(formData, "deleted");
}

// ── Product page texts ─────────────────────────────────────

/** The "Shipping & returns" fold shown on every product page. */
export async function saveShippingReturnsAction(formData: FormData) {
  await requireAdmin();
  const shippingReturnsText = text(formData, "shippingReturnsText", 10000);
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: { shippingReturnsText }, create: { id: 1, shippingReturnsText } });
  refreshSite();
  redirect("/admin/products?shipping=saved#shipping");
}

/** Size table for one shop category; empty removes it from product pages. */
export async function saveSizeGuideAction(formData: FormData) {
  await requireAdmin();
  const category = findCategory(text(formData, "category", 100))?.slug;
  if (!category) return;
  const content = String(formData.get("content") ?? "").slice(0, 20000);
  if (content.trim()) {
    await prisma.sizeGuide.upsert({ where: { category }, update: { content }, create: { category, content } });
  } else {
    await prisma.sizeGuide.deleteMany({ where: { category } });
  }
  refreshSite();
  redirect(`/admin/size-guides?saved=${category}#${category}`);
}

// ── Reviews ─────────────────────────────────────────────────

/** Back to the Reviews list with the same filter, plus a "done" message. */
function reviewsBack(formData: FormData, done: string): never {
  const status = text(formData, "status", 20);
  const qs = new URLSearchParams({ done });
  if (["pending", "approved", "all"].includes(status)) qs.set("status", status);
  redirect(`/admin/reviews?${qs}`);
}

const reviewId = (formData: FormData) => {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
};

/** Makes a review public on the product page. */
export async function approveReviewAction(formData: FormData) {
  await requireAdmin();
  const id = reviewId(formData);
  if (id) await prisma.review.updateMany({ where: { id }, data: { approved: true, approvedAt: new Date() } });
  refreshSite();
  reviewsBack(formData, "approved");
}

/** Takes an approved review off the website again (it goes back to "Waiting for approval"). */
export async function unapproveReviewAction(formData: FormData) {
  await requireAdmin();
  const id = reviewId(formData);
  if (id) await prisma.review.updateMany({ where: { id }, data: { approved: false, approvedAt: null } });
  refreshSite();
  reviewsBack(formData, "hidden");
}

/** Permanently deletes a customer review. */
export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = reviewId(formData);
  if (id) await prisma.review.delete({ where: { id } }).catch(() => null);
  refreshSite();
  reviewsBack(formData, "deleted");
}

// ── Legal ───────────────────────────────────────────────────

/**
 * A policy text from the admin. Saving the unchanged standard text stores "" so the page keeps
 * following future improvements to it. Browsers send textarea line breaks as \r\n: normalise first.
 */
function policyText(formData: FormData, key: string, standard: string): string {
  const value = String(formData.get(key) ?? "").replace(/\r\n/g, "\n").slice(0, 60000).trim();
  return value === standard.trim() ? "" : value;
}

/** Legal notice (Impressum) details and the policy pages (refund, privacy, shipping, terms). */
export async function saveLegalAction(formData: FormData) {
  await requireAdmin();
  const email = text(formData, "legalEmail", 200);
  const data = {
    legalCompanyName: text(formData, "legalCompanyName", 200),
    legalAddress: text(formData, "legalAddress", 500),
    legalEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "",
    legalPhone: text(formData, "legalPhone", 50),
    legalKvk: text(formData, "legalKvk", 50),
    legalVat: text(formData, "legalVat", 50),
    legalExtra: text(formData, "legalExtra", 3000),
    refundPolicyText: policyText(formData, "refundPolicyText", DEFAULT_REFUND_POLICY),
    privacyPolicyText: policyText(formData, "privacyPolicyText", DEFAULT_PRIVACY_POLICY),
    shippingPolicyText: policyText(formData, "shippingPolicyText", DEFAULT_SHIPPING_POLICY),
    termsText: policyText(formData, "termsText", DEFAULT_TERMS),
  };
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  refreshSite();
  redirect("/admin/legal?saved=1");
}

// ── Ordering pause ──────────────────────────────────────────

/** Switches the ordering pause on or off. Turning it off also clears the end time. */
export async function setOrderingPausedAction(formData: FormData) {
  await requireAdmin();
  const on = formData.get("on") === "1";
  const data = on ? { orderingPaused: true } : { orderingPaused: false, orderingPausedUntil: null };
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  refreshSite();
  redirect("/admin?ordering=" + (on ? "paused" : "open") + "#ordering");
}

/** The notice text and the optional moment ordering opens again by itself. */
export async function saveOrderingPauseAction(formData: FormData) {
  await requireAdmin();
  const data = {
    orderingPauseMessage: text(formData, "orderingPauseMessage", 300),
    orderingPausedUntil: dateOrNull(formData, "orderingPausedUntil"),
  };
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  refreshSite();
  redirect("/admin?ordering=saved#ordering");
}
