import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, PageTitle } from "@/components/admin/Card";
import { SocialComposer } from "@/components/admin/SocialComposer";
import { prisma } from "@/lib/db";
import { pickerData } from "@/lib/media";
import { composerAccounts, composerProducts } from "@/lib/social/admin-data";
import { utcToAmsterdamInput } from "@/lib/social/time";

/** Edit a scheduled post (only while nothing of it has been published). */
export default async function EditSocialPost({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const post = await prisma.socialPost.findUnique({ where: { id }, include: { targets: true } });
  if (!post) notFound();
  if (post.targets.some((t) => t.status !== "scheduled")) redirect("/admin/social#queue");

  const [accounts, products, { media, folders }] = await Promise.all([composerAccounts(), composerProducts(), pickerData()]);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/social" className="text-neutral-600 underline underline-offset-4 hover:text-black">
          ← Social
        </Link>
      </p>
      <PageTitle title="Edit scheduled post" description="Times are Amsterdam time." />
      <Card>
        <SocialComposer
          accounts={accounts}
          products={products}
          media={media}
          folders={folders}
          initial={{
            id: post.id,
            caption: post.caption,
            imageUrl: post.imageUrl,
            productHandle: post.productHandle,
            accountIds: post.targets.flatMap((t) => (t.accountId ? [t.accountId] : [])),
            scheduledLocal: post.scheduledAt ? utcToAmsterdamInput(post.scheduledAt) : "",
          }}
        />
      </Card>
    </>
  );
}
