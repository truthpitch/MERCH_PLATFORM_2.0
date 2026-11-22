// Customer reviews: signed-in customers can rate a product 1–5 stars and write a review.
// One review per customer per product (posting again updates it). The admin can delete any review.
import { prisma } from "./db";

export type RatingSummary = { average: number; count: number };

/** Average stars and number of reviews for many products at once, keyed by handle. */
export async function getRatingSummaries(handles: string[]): Promise<Map<string, RatingSummary>> {
  if (handles.length === 0) return new Map();
  const rows = await prisma.review.groupBy({
    by: ["handle"],
    where: { handle: { in: handles } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.handle, { average: r._avg.rating ?? 0, count: r._count._all }]));
}

export type PublicReview = { id: number; rating: number; title: string; body: string; author: string; date: Date; mine: boolean };

/** "Jane Doe" → "Jane D." so full names aren't shown publicly. */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** Reviews for one product, newest first, plus the summary. `customerId` marks the viewer's own review. */
export async function getProductReviews(handle: string, customerId: number | null) {
  const rows = await prisma.review.findMany({
    where: { handle },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { customer: { select: { name: true } } },
  });
  const reviews: PublicReview[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    author: publicName(r.customer.name),
    date: r.createdAt,
    mine: r.customerId === customerId,
  }));
  const count = await prisma.review.count({ where: { handle } });
  const avg = await prisma.review.aggregate({ where: { handle }, _avg: { rating: true } });
  const own = customerId ? rows.find((r) => r.customerId === customerId) ?? (await prisma.review.findUnique({ where: { customerId_handle: { customerId, handle } } })) : null;
  return {
    reviews,
    summary: { average: avg._avg.rating ?? 0, count } satisfies RatingSummary,
    own: own ? { rating: own.rating, title: own.title, body: own.body } : null,
  };
}
