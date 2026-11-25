// Readers' replies under blog posts. Anyone can write one; nothing is public until the admin
// approves it in admin → Replies.
import { prisma } from "./db";

export { COMMENT_MAX, COMMENT_NAME_MAX } from "./blog-comment-limits";

/** Approved replies for one post, oldest first (reads like a conversation). */
export const getApprovedComments = (postId: number) =>
  prisma.blogComment.findMany({
    where: { postId, approved: true },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, name: true, body: true, createdAt: true },
  });

/** Number of replies waiting for approval (shown in the admin). */
export const countPendingComments = () => prisma.blogComment.count({ where: { approved: false } });
