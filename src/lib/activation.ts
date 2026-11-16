// Account activation: after registering, the customer gets one emailed link that
// activates the account. Like reset links, only the token's SHA-256 hash is stored.
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";
import { DEFAULT_CONTACT_EMAIL, describeMailError, isMailConfigured, sendMail } from "./mail";
import { siteUrl } from "./password-reset";

export const ACTIVATION_HOURS = 48;
/** Don't send another link if one went out less than this long ago (stops inbox flooding). */
const RESEND_AFTER_MS = 2 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const ACTIVATION_UNAVAILABLE = `Creating an account isn't available right now. Please email us at ${DEFAULT_CONTACT_EMAIL}.`;
export const ACTIVATION_SEND_FAILED = `Sorry, we couldn't send the activation email right now. Please try again later or email ${DEFAULT_CONTACT_EMAIL}.`;

export { isMailConfigured };

/**
 * Emails a fresh activation link (older unused links stop working).
 * Returns "sent", "recent" (a link went out moments ago, nothing sent) or "failed".
 */
export async function sendActivationEmail(
  customer: { id: number; email: string; name: string },
  next = "/account",
  { force = false } = {},
): Promise<"sent" | "recent" | "failed"> {
  if (!force) {
    const latest = await prisma.emailActivation.findFirst({ where: { customerId: customer.id, usedAt: null }, orderBy: { createdAt: "desc" } });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_AFTER_MS) return "recent";
  }

  const token = randomBytes(32).toString("base64url");
  await prisma.emailActivation.deleteMany({ where: { customerId: customer.id, usedAt: null } });
  await prisma.emailActivation.create({
    data: { customerId: customer.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ACTIVATION_HOURS * 60 * 60 * 1000) },
  });

  const nextQuery = next !== "/account" ? `&next=${encodeURIComponent(next)}` : "";
  const link = `${await siteUrl()}/account/activate?token=${token}${nextQuery}`;
  try {
    await sendMail({
      to: customer.email,
      subject: "Activate your TruthPitch account",
      text: [
        `Hi ${customer.name || "there"},`,
        "",
        "Thanks for creating a TruthPitch account. Click this link to activate it:",
        "",
        link,
        "",
        `The link works once and expires in ${ACTIVATION_HOURS} hours.`,
        "If you didn't create an account, you can ignore this email.",
        "",
        "TruthPitch",
      ].join("\n"),
    });
    return "sent";
  } catch (err) {
    console.error("Activation email failed", describeMailError(err));
    return "failed";
  }
}

export type ActivationResult = { status: "activated"; customer: { id: number; sessionVersion: number } } | { status: "used" | "expired" | "invalid" };

/** Activates the account behind a token. A link only ever activates once. */
export async function activateWithToken(token: unknown): Promise<ActivationResult> {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return { status: "invalid" };
  const row = await prisma.emailActivation.findUnique({ where: { tokenHash: hashToken(token) }, include: { customer: true } });
  if (!row) return { status: "invalid" };
  if (row.usedAt || row.customer.activatedAt) return { status: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { status: "expired" };

  // Mark the link used only if nobody else did in the meantime (two clicks at once).
  const claimed = await prisma.emailActivation.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count === 0) return { status: "used" };
  const customer = await prisma.customer.update({
    where: { id: row.customerId },
    data: { activatedAt: new Date() },
    select: { id: true, sessionVersion: true },
  });
  await prisma.emailActivation.deleteMany({ where: { customerId: row.customerId, usedAt: null } });
  return { status: "activated", customer };
}
