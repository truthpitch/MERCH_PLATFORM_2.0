// Turns formatted text from the admin's text editor into page elements (blog posts, policies,
// About text, product stories …). The text format and parsing live in ./rich-text.ts.
//
// Everything is built as React elements (no raw HTML), so a text can never inject scripts,
// and only safe link targets are allowed.
import Link from "next/link";
import type { ReactNode } from "react";
import { parseBlocks, type Inline } from "./rich-text";

/** "Why organic cotton?" → "why-organic-cotton" (for heading anchors and post addresses). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inline(nodes: Inline[], key: string): ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}-${i}`;
    switch (n.type) {
      case "text":
        return n.text;
      case "br":
        return <br key={k} />;
      case "bold":
        return <strong key={k}>{inline(n.children, k)}</strong>;
      case "italic":
        return <em key={k}>{inline(n.children, k)}</em>;
      case "link": {
        const label = inline(n.children, k);
        if (!n.href) return <span key={k}>{label}</span>;
        if (n.href.startsWith("/") || n.href.startsWith("#"))
          return (
            <Link key={k} href={n.href}>
              {label}
            </Link>
          );
        return (
          <a key={k} href={n.href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        );
      }
    }
  });
}

export type Heading = { id: string; text: string; level: 2 | 3 };

/** The ## and ### headings of a text, for the "In this article" list. */
export function postHeadings(content: string): Heading[] {
  const seen = new Map<string, number>();
  return parseBlocks(content)
    .filter((b): b is Extract<typeof b, { type: "heading" }> => b.type === "heading")
    .map((b) => {
      const base = slugify(b.text) || "section";
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      return { id: n ? `${base}-${n + 1}` : base, text: b.text, level: b.level };
    });
}

/** Renders formatted text as page elements. Style them with `.blog-content` or `.rich-text`. */
export function renderPost(content: string): ReactNode[] {
  const headings = postHeadings(content);
  let h = 0;
  return parseBlocks(content).map((b, i) => {
    const k = `b${i}`;
    switch (b.type) {
      case "heading": {
        const id = headings[h++]?.id;
        return b.level === 2 ? (
          <h2 key={k} id={id}>
            {inline(b.children, k)}
          </h2>
        ) : (
          <h3 key={k} id={id}>
            {inline(b.children, k)}
          </h3>
        );
      }
      case "paragraph":
        return <p key={k}>{inline(b.children, k)}</p>;
      case "list": {
        const items = b.items.map((it, n) => <li key={`${k}-${n}`}>{inline(it, `${k}-${n}`)}</li>);
        return b.ordered ? <ol key={k}>{items}</ol> : <ul key={k}>{items}</ul>;
      }
      case "quote":
        return <blockquote key={k}>{inline(b.children, k)}</blockquote>;
      case "image":
        return (
          <figure key={k}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.src} alt={b.alt} loading="lazy" />
            {b.alt && <figcaption>{b.alt}</figcaption>}
          </figure>
        );
      case "hr":
        return <hr key={k} />;
    }
  });
}

/** Plain text without formatting marks (for word counts and descriptions). */
export function plainText(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{2,3}\s+|^>\s?|^[-*]\s+|^\d+[.)]\s+/gm, "")
    .replace(/\*\*|\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** About 200 words a minute, at least 1. */
export function readingMinutes(content: string): number {
  const words = plainText(content).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
