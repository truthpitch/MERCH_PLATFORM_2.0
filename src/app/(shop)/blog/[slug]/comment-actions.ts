"use server";

import { getPostBySlug } from "@/lib/blog";
import { COMMENT_MAX, COMMENT_NAME_MAX } from "@/lib/blog-comment-limits";
import { getCurrentCustomer } from "@/lib/customers";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { publicName } from "@/lib/reviews";

export type CommentState = { sent?: boolean; error?: string; values?: { name: string; body: string } };

/**
 * Saves a reply under a blog post. It always waits for the admin's approval (admin → Replies)
 * before it's shown, so nothing appears on the website until it has been checked.
 */
export async function submitCommentAction(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").replace(/\r\n?/g, "\n").trim();
  const customer = await getCurrentCustomer();
  // Signed-in customers are shown as "Jane D.", like reviews; guests choose the name themselves.
  const name = customer ? publicName(customer.name) : String(formData.get("name") ?? "").replace(/\s+/g, " ").trim();
  const values = { name: customer ? "" : name.slice(0, COMMENT_NAME_MAX), body: body.slice(0, COMMENT_MAX) };

  // Honeypot: people never see the hidden "website" field. Pretend success for bots.
  if (String(formData.get("website") ?? "").trim()) return { sent: true };

  if (!customer && name.length < 2) return { error: "Please enter your name.", values };
  if (name.length > COMMENT_NAME_MAX) return { error: `Please keep your name under ${COMMENT_NAME_MAX} characters.`, values };
  if (body.length < 3) return { error: "Please write your reply.", values };
  if (body.length > COMMENT_MAX) return { error: `Please keep your reply under ${COMMENT_MAX} characters.`, values };
  if (await isRateLimited("blog-comment", 5, 10 * 60 * 1000)) {
    return { error: "You've sent several replies in a short time. Please try again in a few minutes.", values };
  }

  const post = await getPostBySlug(slug);
  if (!post) return { error: "This post can't receive replies.", values };

  await prisma.blogComment.create({ data: { postId: post.id, customerId: customer?.id ?? null, name, body } });
  // Nothing to revalidate: the reply only becomes public once it's approved.
  return { sent: true };
}
