"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EMAIL_RE, MIN_PASSWORD_LENGTH, hashPassword, startCustomerSession } from "@/lib/customers";
import { prisma } from "@/lib/db";
import { DEFAULT_CONTACT_EMAIL, describeMailError, isMailConfigured, sendMail } from "@/lib/mail";
import { RESET_MINUTES, createResetToken, findValidReset, siteUrl } from "@/lib/password-reset";
import { isRateLimited } from "@/lib/rate-limit";

export type ForgotState = { sent?: boolean; error?: string; email?: string };

/**
 * Step 1: emails a reset link.
 * The answer is the same whether or not an account exists, so the form can't be used
 * to find out who has an account.
 */
export async function forgotPasswordAction(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address.", email };
  if (!isMailConfigured()) {
    return { error: `Password reset isn't available right now. Please email us at ${DEFAULT_CONTACT_EMAIL}.`, email };
  }
  if (await isRateLimited("forgot", 5, 15 * 60 * 1000)) {
    return { error: "Too many requests. Please wait a few minutes and try again.", email };
  }

  const customer = await prisma.customer.findUnique({ where: { email }, select: { id: true, name: true } });
  if (customer) {
    const link = `${await siteUrl()}/account/reset?token=${await createResetToken(customer.id)}`;
    try {
      await sendMail({
        to: email,
        subject: "Reset your TruthPitch password",
        text: [
          `Hi ${customer.name || "there"},`,
          "",
          "Someone (hopefully you) asked to reset the password of your TruthPitch account.",
          "Choose a new password with this link:",
          "",
          link,
          "",
          `The link works once and expires in ${RESET_MINUTES} minutes.`,
          "If you didn't ask for this, you can ignore this email: your password stays the same.",
          "",
          "TruthPitch",
        ].join("\n"),
      });
    } catch (err) {
      console.error("Password reset email failed", describeMailError(err));
      return { error: `Sorry, we couldn't send the email right now. Please try again later or email ${DEFAULT_CONTACT_EMAIL}.`, email };
    }
  }
  return { sent: true, email };
}

export type ResetState = { error?: string };

/** Step 2: saves the new password, signs out every other session and signs the customer in. */
export async function resetPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = formData.get("token");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  if (password.length > 200) return { error: "That password is too long." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const reset = await findValidReset(token);
  if (!reset) return { error: "This link has expired or was already used. Please request a new one." };

  const passwordHash = await hashPassword(password);
  const [customer] = await prisma.$transaction([
    prisma.customer.update({
      where: { id: reset.customerId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    prisma.passwordReset.deleteMany({ where: { customerId: reset.customerId } }),
    // The reset link came by email, which proves the address: activate the account if it wasn't yet.
    prisma.customer.updateMany({ where: { id: reset.customerId, activatedAt: null }, data: { activatedAt: new Date() } }),
    prisma.emailActivation.deleteMany({ where: { customerId: reset.customerId, usedAt: null } }),
  ]);

  await startCustomerSession(customer.id, customer.sessionVersion);
  revalidatePath("/", "layout");
  redirect("/account?reset=1");
}
