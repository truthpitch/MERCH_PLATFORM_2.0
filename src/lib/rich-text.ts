// Formatted text, as written in the admin's text editor (src/components/admin/RichTextEditor.tsx).
//
// Behind the scenes it's stored in a small, Markdown-like format:
//   ## Extra large text (heading)     ### Large text (subheading)
//   **bold**  *italic*  [link](https://… or /products)
//   - bullet item    1. numbered item    > quote    ![image description](/media/…)    ---
// Paragraphs are separated by a blank line.
//
// This file turns that format into a simple structure ("blocks"). The website renders the blocks
// as React elements (src/lib/blog-format.tsx) and the editor as HTML (mdToHtml below), so both
// always follow the same rules. Nothing is ever rendered as raw HTML from the stored text.

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; children: Inline[] }
  | { type: "italic"; children: Inline[] }
  | { type: "link"; href: string | null; children: Inline[] }
  | { type: "br" };

export type Block =
  | { type: "heading"; level: 2 | 3; children: Inline[]; text: string }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; children: Inline[] }
  | { type: "image"; src: string; alt: string }
  | { type: "hr" };

/** Only links to this site, http(s), e-mail or in-page anchors. */
export function safeHref(raw: string): string | null {
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

export function safeImage(raw: string): string | null {
  const href = safeHref(raw);
  return href && !href.startsWith("mailto:") && !href.startsWith("#") ? href : null;
}

/** **bold**, *italic* and [links](…) inside a line. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: "bold", children: parseInline(m[1]) });
    else if (m[2] !== undefined) out.push({ type: "italic", children: parseInline(m[2]) });
    // Allowed addresses are kept exactly as written (so the editor doesn't change them).
    else out.push({ type: "link", href: safeHref(m[4]) ? m[4].trim() : null, children: parseInline(m[3]) });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

/** Lines joined with line breaks (inside one paragraph or quote). */
function linesInline(lines: string[]): Inline[] {
  return lines.flatMap((line, i) => (i === 0 ? parseInline(line) : [{ type: "br" } as Inline, ...parseInline(line)]));
}

const isList = (t: string) => /^[-*]\s+/.test(t) || /^\d+[.)]\s+/.test(t);
const isImage = (t: string) => /^!\[[^\]]*\]\([^)\s]+\)$/.test(t);
const isHr = (t: string) => /^(-{3,}|\*{3,})$/.test(t);

export function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) {
      i++;
      continue;
    }
    const heading = t.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length as 2 | 3, children: parseInline(heading[2]), text: heading[2].replace(/\*\*|\*/g, "").trim() });
      i++;
      continue;
    }
    if (isHr(t)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }
    const image = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (image) {
      if (safeImage(image[2])) blocks.push({ type: "image", src: image[2].trim(), alt: image[1] });
      i++;
      continue;
    }
    if (isList(t)) {
      const ordered = /^\d+[.)]\s+/.test(t);
      const marker = ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/;
      const items: Inline[][] = [];
      while (i < lines.length && marker.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(marker, "")));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (t.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", children: linesInline(quote) });
      continue;
    }
    // Paragraph: until a blank line or the start of another block.
    const para: string[] = [];
    while (i < lines.length) {
      const p = lines[i].trim();
      if (!p || /^#{2,3}\s/.test(p) || isList(p) || p.startsWith(">") || isHr(p) || isImage(p)) break;
      para.push(p);
      i++;
    }
    blocks.push({ type: "paragraph", children: linesInline(para) });
  }
  return blocks;
}

// ── HTML for the editor ─────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inlineHtml(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case "text":
          return esc(n.text);
        case "br":
          return "<br>";
        case "bold":
          return `<strong>${inlineHtml(n.children)}</strong>`;
        case "italic":
          return `<em>${inlineHtml(n.children)}</em>`;
        case "link":
          return n.href ? `<a href="${esc(n.href)}">${inlineHtml(n.children)}</a>` : inlineHtml(n.children);
      }
    })
    .join("");
}

/** The stored text as (escaped, safe) HTML for the editor to show. */
export function mdToHtml(content: string): string {
  const html = parseBlocks(content)
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `<h${b.level}>${inlineHtml(b.children)}</h${b.level}>`;
        case "paragraph":
          return `<p>${inlineHtml(b.children)}</p>`;
        case "list": {
          const tag = b.ordered ? "ol" : "ul";
          return `<${tag}>${b.items.map((it) => `<li>${inlineHtml(it)}</li>`).join("")}</${tag}>`;
        }
        case "quote":
          return `<blockquote>${inlineHtml(b.children)}</blockquote>`;
        case "image":
          return `<p><img src="${esc(b.src)}" alt="${esc(b.alt)}"></p>`;
        case "hr":
          return "<hr>";
      }
    })
    .join("");
  return html || "<p><br></p>";
}
