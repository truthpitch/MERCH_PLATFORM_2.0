// Sends the contact form as an email over SMTP. Nothing is stored on the website.
// ⚠️ Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in the environment variables.
// Hostinger email: SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465,
// SMTP_USER=info@truthpitch.com and that mailbox's password.
import nodemailer from "nodemailer";

/** Default inbox for the contact form. Override with CONTACT_TO_EMAIL if ever needed. */
export const DEFAULT_CONTACT_EMAIL = "info@truthpitch.com";

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function contactRecipient(): string {
  return process.env.CONTACT_TO_EMAIL || DEFAULT_CONTACT_EMAIL;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | { name: string; address: string };
}): Promise<void> {
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = TLS from the start; 587 upgrades with STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    // Most hosts (Hostinger included) only allow sending from the mailbox you log in with.
    from: { name: "TruthPitch website", address: process.env.SMTP_FROM || process.env.SMTP_USER || "" },
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
  });
}
