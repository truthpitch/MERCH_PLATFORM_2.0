// Turns blog text written in the admin into page elements.
//
// Supported (a small, Markdown-like set):
//   ## Heading            ### Smaller heading
//   **bold**  *italic*    [link text](https://… or /products)
//   - list item           1. numbered item
//   > quote               ![image description](/media/… or https://…)
//   ---  (a dividing line)
// Paragraphs are separated by a blank line.
//
// Everything is built as React elements (no raw HTML), so a post can never inject
// scripts, and only safe link targets are allowed.
import Link from "next/link";
import type { ReactNode } from "react";

/** Only links to this site, http(s), e-mail or in-page anchors. */
function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("#") || href.startsWith("mailto:")) return href;
  try {
    const u = new URL(href);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function safeImage(raw: string): string | null {
  const href = safeHref(raw);
  return href && !href.startsWith("mailto:") && !href.startsWith("#") ? href : null;
}

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

/** **bold**, *italic* and [links](…) inside a line. */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{inline(m[1], k)}</strong>);
    else if (m[2] !== undefined) out.push(<em key={k}>{inline(m[2], k)}</em>);
    else {
      const href = safeHref(m[4]);
      const label = inline(m[3], k);
      if (!href) out.push(<span key={k}>{label}</span>);
      else if (href.startsWith("/") || href.startsWith("#")) out.push(<Link key={k} href={href}>{label}</Link>);
      else
        out.push(
          <a key={k} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>,
        );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Keeps single line breaks inside a paragraph. */
function withBreaks(lines: string[], key: string): ReactNode[] {
  return lines.flatMap((line, i) => (i === 0 ? inline(line, `${key}-${i}`) : [<br key={`${key}-br${i}`} />, ...inline(line, `${key}-${i}`)]));
}

export type Heading = { id: string; text: string; level: 2 | 3 };

/** The ## and ### headings of a post, for the "In this article" list. */
export function postHeadings(content: string): Heading[] {
  const seen = new Map<string, number>();
  return content
    .split(/\r?\n/)
    .map((l) => l.match(/^(#{2,3})\s+(.+)$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => {
      const text = m[2].replace(/\*\*|\*/g, "").trim();
      const base = slugify(text) || "section";
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      return { id: n ? `${base}-${n + 1}` : base, text, level: m[1].length as 2 | 3 };
    });
}

/** Renders post text as page elements. Style them with the `.blog-content` CSS class. */
export function renderPost(content: string): ReactNode[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const headings = postHeadings(content);
  let h = 0;
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const k = `b${key++}`;

    if (!trimmed) {
      i++;
      continue;
    }

    const heading = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      const id = headings[h++]?.id;
      out.push(heading[1].length === 2 ? <h2 key={k} id={id}>{inline(heading[2], k)}</h2> : <h3 key={k} id={id}>{inline(heading[2], k)}</h3>);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      out.push(<hr key={k} />);
      i++;
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (image) {
      const src = safeImage(image[2]);
      if (src)
        out.push(
          <figure key={k}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={image[1]} loading="lazy" />
            {image[1] && <figcaption>{image[1]}</figcaption>}
          </figure>,
        );
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const ordered = /^\d+[.)]\s+/.test(trimmed);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/).test(lines[i].trim())) {
        items.push(lines[i].trim().replace(ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/, ""));
        i++;
      }
      const children = items.map((item, n) => <li key={`${k}-${n}`}>{inline(item, `${k}-${n}`)}</li>);
      out.push(ordered ? <ol key={k}>{children}</ol> : <ul key={k}>{children}</ul>);
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      out.push(<blockquote key={k}>{withBreaks(quote, k)}</blockquote>);
      continue;
    }

    // Paragraph: until a blank line or the start of another block.
    const para: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || /^(#{2,3})\s/.test(t) || /^[-*]\s+/.test(t) || /^\d+[.)]\s+/.test(t) || t.startsWith(">") || /^(-{3,}|\*{3,})$/.test(t) || /^!\[[^\]]*\]\([^)\s]+\)$/.test(t)) break;
      para.push(t);
      i++;
    }
    out.push(<p key={k}>{withBreaks(para, k)}</p>);
  }
  return out;
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
