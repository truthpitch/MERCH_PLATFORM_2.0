import Link from "next/link";
import { BlogForm } from "@/components/admin/BlogForm";
import { PageTitle } from "@/components/admin/Card";
import { pickerData } from "@/lib/media";
import { publicSiteUrl } from "@/lib/site";

export default async function NewBlogPost() {
  const { media, folders } = await pickerData();
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/blog" className="text-neutral-600 underline underline-offset-4 hover:text-black">
          ← Blog
        </Link>
      </p>
      <PageTitle title="New post" />
      <BlogForm
        siteUrl={publicSiteUrl()}
        media={media}
        folders={folders}
        post={{
          id: null,
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          coverImageUrl: "",
          coverImageAlt: "",
          author: "TruthPitch",
          tags: "",
          metaTitle: "",
          metaDescription: "",
          published: false,
          publishedAt: null,
        }}
      />
    </>
  );
}
