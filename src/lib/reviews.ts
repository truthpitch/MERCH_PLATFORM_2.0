// Customer reviews: signed-in customers can rate a product 1–5 stars and write a review.
// One review per customer per product (posting again updates it). Reviews only become public
// after the admin approves them (admin → Reviews); editing a review sends it back for approval.
import { prisma } from "./db";

export type RatingSummary = { average: number; count: number };

/** Average stars and number of approved reviews for many products at once, keyed by handle. */
export async function getRatingSummaries(handles: string[]): Promise<Map<string, RatingSummary>> {
  if (handles.length === 0) return new Map();
  const rows = await prisma.review.groupBy({
    by: ["handle"],
    where: { handle: { in: handles }, approved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.handle, { average: r._avg.rating ?? 0, count: r._count._all }]));
}

export type PublicReview = {
  id: number;
  rating: number;
  title: string;
  body: string;
  author: string;
  date: Date;
  mine: boolean;
  /** false only for the viewer's own review that is still waiting for approval */
  approved: boolean;
};

/** "Jane Doe" → "Jane D." so full names aren't shown publicly. */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/**
 * Approved reviews for one product, newest first, plus the summary.
 * The viewer also sees their own review while it waits for approval (marked as such).
 */
export async function getProductReviews(handle: string, customerId: number | null) {
  const [rows, agg, ownRow] = await Promise.all([
    prisma.review.findMany({
      where: { handle, approved: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { customer: { select: { name: true } } },
    }),
    prisma.review.aggregate({ where: { handle, approved: true }, _avg: { rating: true }, _count: { _all: true } }),
    customerId
      ? prisma.review.findUnique({ where: { customerId_handle: { customerId, handle } }, include: { customer: { select: { name: true } } } })
      : null,
  ]);

  const toPublic = (r: (typeof rows)[number]): PublicReview => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    author: publicName(r.customer.name),
    date: r.createdAt,
    mine: r.customerId === customerId,
    approved: r.approved,
  });
  const reviews = rows.map(toPublic);
  // Their own pending review goes on top, so they can see what they sent.
  if (ownRow && !ownRow.approved) reviews.unshift(toPublic(ownRow));

  return {
    reviews,
    summary: { average: agg._avg.rating ?? 0, count: agg._count._all } satisfies RatingSummary,
    own: ownRow ? { rating: ownRow.rating, title: ownRow.title, body: ownRow.body, approved: ownRow.approved } : null,
  };
}

/** Number of reviews waiting for approval (shown in the admin). */
export const countPendingReviews = () => prisma.review.count({ where: { approved: false } });
