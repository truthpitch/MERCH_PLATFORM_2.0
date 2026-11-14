"use server";

import { headers } from "next/headers";
import { contactRecipient, describeMailError, isMailConfigured, sendMail } from "@/lib/mail";

export type ContactField = "name" | "email" | "subject" | "orderNumber" | "message";
export type ContactState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
  values?: Partial<Record<ContactField, string>>;
};

const LIMITS: Record<ContactField, number> = { name: 100, email: 200, subject: 150, orderNumber: 50, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limit: 5 messages per 10 minutes per visitor (IP).
// It resets when the server restarts, which is fine for a small shop.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  const limited = hits.length >= MAX_PER_WINDOW;
  if (!limited) hits.push(now);
  if (recent.size > 5000) recent.clear(); // keep memory bounded
  recent.set(key, hits);
  return limited;
}

/**
 * Sends the contact form straight to the shop's mailbox (info@truthpitch.com by default).
 * Nothing is stored on the website. Reply-To is the visitor, so "Reply" in your
 * mail program answers them directly.
 */
export async function submitContactAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = Object.fromEntries(
    (Object.keys(LIMITS) as ContactField[]).map((k) => [k, String(formData.get(k) ?? "").trim().slice(0, LIMITS[k])]),
  ) as Record<ContactField, string>;

  // Honeypot: people never see or fill the hidden "website" field. Pretend success for bots.
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const fieldErrors: NonNullable<ContactState["fieldErrors"]> = {};
  if (!values.name) fieldErrors.name = "Please enter your name.";
  if (!values.email) fieldErrors.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(values.email)) fieldErrors.email = "That email address doesn't look right.";
  if (values.message.length < 10) fieldErrors.message = "Please write a message of at least 10 characters.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const to = contactRecipient();
  const unavailable = `Sorry, the form isn't working right now. Please email us at ${to}.`;
  if (!isMailConfigured()) {
    console.error("Contact form: SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS).");
    return { error: unavailable, values };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) {
    return { error: "You've sent several messages in a short time. Please try again in a few minutes.", values };
  }

  const lines = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    ...(values.orderNumber ? [`Order number: ${values.orderNumber}`] : []),
    ...(values.subject ? [`Subject: ${values.subject}`] : []),
    "",
    values.message,
    "",
    `-- Sent from the contact form on truthpitch.com. Reply to this email to answer ${values.name} directly.`,
  ];

  try {
    await sendMail({
      to,
      replyTo: { name: values.name, address: values.email },
      subject: `Contact form: ${values.subject || "New message"} (${values.name})`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("Contact form: sending the email failed", describeMailError(err));
    return { error: unavailable, values };
  }

  return { ok: true };
}
