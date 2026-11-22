// RSS feed of the newest blog posts: /blog/rss.xml (for feed readers and some search tools).
import { getLatestPosts } from "@/lib/blog";
import { plainText } from "@/lib/blog-format";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const posts = await getLatestPosts(30);
  const items = posts
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>
      <description>${esc((p.excerpt || plainText(p.content)).slice(0, 300))}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} Blog</title>
    <link>${esc(absoluteUrl("/blog"))}</link>
    <atom:link href="${esc(absoluteUrl("/blog/rss.xml"))}" rel="self" type="application/rss+xml" />
    <description>Stories, guides and news from ${esc(SITE_NAME)}.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}
