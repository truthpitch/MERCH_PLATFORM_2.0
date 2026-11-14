// Optional email notifications (contact form) over SMTP.
// ⚠️ Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to turn this on.
// Hostinger email: SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465, and the mailbox address + password.
// Without these, messages are still saved and shown in the admin "Messages" page.
import nodemailer from "nodemailer";

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Where contact notifications go: CONTACT_TO_EMAIL, falling back to ADMIN_EMAIL. */
export function notificationAddress(): string {
  return process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL || "";
}

export async function sendMail(options: { to: string; subject: string; text: string; replyTo?: string }): Promise<void> {
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = TLS from the start; 587 upgrades with STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    // Many hosts (Hostinger included) only allow sending from the mailbox you log in with.
    from: `"TruthPitch website" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
  });
}
