// Sends the contact form as an email over SMTP. Nothing is stored on the website.
// ⚠️ Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in the environment variables.
// Hostinger email: SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465,
// SMTP_USER=info@truthpitch.com and that mailbox's password.
import nodemailer from "nodemailer";

/** Default inbox for the contact form. Override with CONTACT_TO_EMAIL if ever needed. */
export const DEFAULT_CONTACT_EMAIL = "info@truthpitch.com";

/** Reads an env var, ignoring surrounding spaces and quotes pasted into a hosting panel. */
function env(name: string): string {
  return (process.env[name] ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");
}

function smtpSettings() {
  const port = Number(env("SMTP_PORT")) || 465;
  return {
    host: env("SMTP_HOST"),
    port,
    user: env("SMTP_USER"),
    // Passwords may legitimately contain spaces, so only strip wrapping quotes / line breaks.
    pass: (process.env.SMTP_PASS ?? "").replace(/^[\r\n]+|[\r\n]+$/g, "").replace(/^(["'])(.*)\1$/, "$2"),
    from: env("SMTP_FROM") || env("SMTP_USER"),
  };
}

export function isMailConfigured(): boolean {
  const s = smtpSettings();
  return Boolean(s.host && s.user && s.pass);
}

export function contactRecipient(): string {
  return env("CONTACT_TO_EMAIL") || DEFAULT_CONTACT_EMAIL;
}

function createTransport() {
  const s = smtpSettings();
  return nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.port === 465, // 465 = TLS from the start; 587 upgrades with STARTTLS
    auth: { user: s.user, pass: s.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | { name: string; address: string };
}): Promise<void> {
  await createTransport().sendMail({
    // Most hosts (Hostinger included) only allow sending from the mailbox you log in with.
    from: { name: "TruthPitch website", address: smtpSettings().from },
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
  });
}

/** Plain-language explanation of a mail error, without secrets. Used in logs and /api/health?mail=1. */
export function describeMailError(err: unknown): { code: string; hint: string; detail: string } {
  const e = err as { code?: string; responseCode?: number; message?: string };
  const code = e.code ?? (e.responseCode ? String(e.responseCode) : "UNKNOWN");
  const pass = smtpSettings().pass;
  let detail = String(e.message ?? err).replace(/\s+/g, " ").slice(0, 300);
  if (pass) detail = detail.split(pass).join("***");

  let hint = "See detail.";
  if (code === "EAUTH" || e.responseCode === 535)
    hint = "Login refused: check SMTP_USER (the full address) and SMTP_PASS (the mailbox password).";
  else if (["ETIMEDOUT", "ECONNECTION", "ECONNREFUSED", "ESOCKET"].includes(code))
    hint = "Can't reach the mail server: check SMTP_HOST, or try SMTP_PORT=587.";
  else if (code === "EDNS" || code === "ENOTFOUND") hint = "SMTP_HOST is not a valid server name.";
  else if (code === "EENVELOPE" || e.responseCode === 553 || e.responseCode === 550)
    hint = "Sender refused: SMTP_FROM must be the same mailbox as SMTP_USER (or left empty).";
  return { code, hint, detail };
}

/** Logs in to the mail server without sending anything. */
export async function verifyMailLogin(): Promise<void> {
  await createTransport().verify();
}
