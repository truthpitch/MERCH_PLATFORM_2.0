"use client";

import { useEffect, useRef, useState } from "react";
import { mdToHtml, safeHref, safeImage } from "@/lib/rich-text";
import { MediaPicker, type PickerFolder, type PickerImage } from "./MediaPicker";

// A small "what you see is what you get" text editor for the admin's longer texts.
// It shows the formatting (bold, sizes, lists …) and keeps the stored text in the site's simple
// format (see src/lib/rich-text.ts) in a hidden form field, so saving works like before and the
// website can still render it safely without any raw HTML.

// ── Page HTML → stored format ───────────────────────────────

const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "BLOCKQUOTE", "HR", "FIGURE", "IMG", "TABLE", "PRE", "SECTION", "ARTICLE"]);

function isBold(el: HTMLElement) {
  if (el.tagName === "B" || el.tagName === "STRONG") return true;
  const w = el.style?.fontWeight;
  return w === "bold" || Number(w) >= 600;
}
const isItalic = (el: HTMLElement) => el.tagName === "I" || el.tagName === "EM" || el.style?.fontStyle === "italic";

/** An image address exactly as written, if it's an allowed one. */
function keptImage(raw: string | null): string | null {
  const src = (raw ?? "").trim();
  return safeImage(src) ? src : null;
}

/** Puts spaces outside the markers: "** word**" doesn't work, " **word**" does. */
function wrap(inner: string, mark: string) {
  if (!inner.trim()) return inner;
  const lead = inner.match(/^\s*/)![0];
  const trail = inner.match(/\s*$/)![0];
  return `${lead}${mark}${inner.trim()}${mark}${trail}`;
}

function inlineMd(nodes: NodeListOf<ChildNode> | ChildNode[], marks = { bold: false, italic: false }): string {
  let out = "";
  for (const node of Array.from(nodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += (node.textContent ?? "").replace(/ /g, " ").replace(/[ \t]*\n[ \t]*/g, " ");
      continue;
    }
    if (!(node instanceof HTMLElement)) continue;
    if (node.tagName === "BR") {
      out += "\n";
      continue;
    }
    if (node.tagName === "IMG") continue; // images become their own block (see paragraphs())
    if (node.tagName === "A") {
      // Keep the address exactly as written (only if it's an allowed one).
      const raw = (node.getAttribute("href") ?? "").trim();
      const href = safeHref(raw) ? raw : null;
      const label = inlineMd(node.childNodes, marks).trim();
      out += href && label ? `[${label}](${href})` : label;
      continue;
    }
    // Bold/italic inside bold/italic is not repeated.
    const bold = isBold(node) && !marks.bold;
    const italic = isItalic(node) && !marks.italic;
    let inner = inlineMd(node.childNodes, { bold: marks.bold || bold, italic: marks.italic || italic });
    if (italic) inner = wrap(inner, "*");
    if (bold) inner = wrap(inner, "**");
    out += inner;
  }
  return out;
}

/** A paragraph-like element: text with line breaks; any images inside become separate blocks. */
function paragraphs(el: HTMLElement): string[] {
  const blocks: string[] = [];
  let run: ChildNode[] = [];
  const flush = () => {
    const text = inlineMd(run)
      .split("\n")
      .map((l) => l.trim())
      .join("\n")
      .replace(/^\n+|\n+$/g, "");
    if (text.trim()) blocks.push(text);
    run = [];
  };
  for (const child of Array.from(el.childNodes)) {
    if (child instanceof HTMLImageElement) {
      flush();
      const src = keptImage(child.getAttribute("src"));
      if (src) blocks.push(`![${(child.getAttribute("alt") ?? "").replace(/[[\]]/g, "")}](${src})`);
    } else if (child instanceof HTMLElement && BLOCK_TAGS.has(child.tagName)) {
      flush();
      blocks.push(...blocksMd(child));
    } else run.push(child);
  }
  flush();
  return blocks;
}

function blocksMd(el: HTMLElement): string[] {
  const tag = el.tagName;
  if (tag === "HR") return ["---"];
  if (tag === "IMG") {
    const src = keptImage(el.getAttribute("src"));
    return src ? [`![${(el.getAttribute("alt") ?? "").replace(/[[\]]/g, "")}](${src})`] : [];
  }
  if (/^H[1-6]$/.test(tag)) {
    const text = inlineMd(el.childNodes).replace(/\s*\n\s*/g, " ").trim();
    return text ? [`${tag === "H1" || tag === "H2" ? "##" : "###"} ${text}`] : [];
  }
  if (tag === "UL" || tag === "OL") {
    const items = Array.from(el.children)
      .filter((c) => c.tagName === "LI")
      .map((li) => inlineMd(li.childNodes).replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);
    return items.length ? [items.map((t, i) => `${tag === "OL" ? `${i + 1}.` : "-"} ${t}`).join("\n")] : [];
  }
  if (tag === "BLOCKQUOTE") {
    const lines = paragraphs(el)
      .join("\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.length ? [lines.map((l) => `> ${l}`).join("\n")] : [];
  }
  return paragraphs(el);
}

/** The editor's content in the stored format. */
export function editorToMd(root: HTMLElement): string {
  return paragraphs(root).join("\n\n").trim();
}

// ── The editor ──────────────────────────────────────────────

type BlockKind = "p" | "h2" | "h3" | "blockquote";
const toolButton =
  "flex h-8 min-w-8 items-center justify-center border border-transparent px-2 text-sm text-black hover:border-neutral-300 aria-pressed:border-black aria-pressed:bg-black aria-pressed:text-white";

export function RichTextEditor({
  name,
  defaultValue,
  label,
  minHeight = 220,
  media,
  folders,
  placeholder = "Start writing…",
}: {
  /** Form field name; the stored text is sent under this name. */
  name: string;
  defaultValue: string;
  /** Accessible name of the text area. */
  label: string;
  minHeight?: number;
  /** Pass the Media library to get an "Insert image" button. */
  media?: PickerImage[];
  folders?: PickerFolder[];
  placeholder?: string;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  // Until you edit, the original text is sent unchanged (so "standard texts" stay recognised).
  const [value, setValue] = useState(defaultValue);
  const [empty, setEmpty] = useState(!defaultValue.trim());
  const [state, setState] = useState({ bold: false, italic: false, ul: false, ol: false, block: "p" as BlockKind });
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = editor.current;
    if (!el) return;
    el.innerHTML = mdToHtml(defaultValue);
    const onSelection = () => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
      savedRange.current = sel.getRangeAt(0).cloneRange();
      let node: Node | null = sel.anchorNode;
      let block: BlockKind = "p";
      while (node && node !== el) {
        if (node instanceof HTMLElement) {
          const t = node.tagName;
          if (t === "H1" || t === "H2") block = "h2";
          else if (/^H[3-6]$/.test(t)) block = "h3";
          else if (t === "BLOCKQUOTE") block = "blockquote";
          if (block !== "p") break;
        }
        node = node.parentNode;
      }
      setState({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        block,
      });
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
    // Only on mount: the editor owns its content afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    const el = editor.current;
    if (!el) return;
    const md = editorToMd(el);
    setValue(md);
    setEmpty(!md);
  }

  /** Runs an editing command on the current selection (restoring it if the toolbar took focus). */
  function run(command: string, arg?: string) {
    const el = editor.current;
    if (!el) return;
    // Was the cursor still in the text? If not (e.g. after the image window), put it back where it was.
    const before = document.getSelection();
    const wasInside = Boolean(before && before.rangeCount > 0 && el.contains(before.anchorNode));
    el.focus();
    const sel = document.getSelection();
    if (!wasInside && savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    document.execCommand("defaultParagraphSeparator", false, "p");
    document.execCommand(command, false, arg);
    sync();
  }

  function setBlock(kind: BlockKind) {
    run("formatBlock", `<${kind}>`);
  }

  function addLink() {
    const url = window.prompt("Link address: a page on this site (e.g. /products) or a full web address (https://…)", "https://");
    if (!url) return;
    const href = safeHref(url);
    if (!href) return window.alert("That link address isn't allowed. Use /page-on-this-site, https://… or mailto:…");
    const sel = document.getSelection();
    if (sel && sel.isCollapsed) {
      const text = href.replace(/^mailto:/, "");
      run("insertHTML", `<a href="${href.replace(/"/g, "&quot;")}">${text.replace(/</g, "&lt;")}</a>`);
    } else run("createLink", href);
  }

  function insertImage(image: PickerImage) {
    const src = safeImage(image.url);
    if (!src) return;
    const alt = image.name.replace(/"/g, "&quot;");
    run("insertHTML", `<p><img src="${src.replace(/"/g, "&quot;")}" alt="${alt}"></p><p><br></p>`);
  }

  /** Pasted text arrives without its outside formatting (no fonts or colours from Word etc.). */
  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const html = text
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`)
      .join("");
    run("insertHTML", html);
  }

  const keep = (e: React.MouseEvent) => e.preventDefault(); // keep the text selection when clicking the toolbar

  /** Clicking an image in the text selects it, so it can be removed (button, Delete or Backspace). */
  function onEditorClick(e: React.MouseEvent) {
    const el = editor.current;
    el?.querySelectorAll("img.is-selected").forEach((img) => img.classList.remove("is-selected"));
    if (e.target instanceof HTMLImageElement) {
      e.target.classList.add("is-selected");
      setSelectedImage(e.target);
      const r = document.createRange();
      r.selectNode(e.target);
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    } else setSelectedImage(null);
  }

  function removeImage() {
    const img = selectedImage;
    if (!img || !editor.current?.contains(img)) return setSelectedImage(null);
    const parent = img.parentElement;
    img.remove();
    // Drop the now-empty line the image was on.
    if (parent && parent !== editor.current && !parent.textContent?.trim() && !parent.querySelector("img")) parent.remove();
    setSelectedImage(null);
    sync();
  }

  return (
    <div className="border border-neutral-300 bg-white focus-within:border-black">
      <div role="toolbar" aria-label={`${label}: formatting`} className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        <select
          aria-label="Text size"
          value={state.block === "blockquote" ? "p" : state.block}
          onChange={(e) => setBlock(e.target.value as BlockKind)}
          className="h-8 border border-neutral-300 bg-white px-2 text-sm text-black"
        >
          <option value="p">Normal text</option>
          <option value="h3">Large</option>
          <option value="h2">Extra large</option>
        </select>
        <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />
        <button type="button" onMouseDown={keep} onClick={() => run("bold")} aria-pressed={state.bold} title="Bold (Ctrl+B)" className={`${toolButton} font-bold`}>
          B
        </button>
        <button type="button" onMouseDown={keep} onClick={() => run("italic")} aria-pressed={state.italic} title="Italic (Ctrl+I)" className={`${toolButton} italic`}>
          I
        </button>
        <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />
        <button type="button" onMouseDown={keep} onClick={() => run("insertUnorderedList")} aria-pressed={state.ul} title="Bullet list" className={toolButton}>
          • List
        </button>
        <button type="button" onMouseDown={keep} onClick={() => run("insertOrderedList")} aria-pressed={state.ol} title="Numbered list" className={toolButton}>
          1. List
        </button>
        <button
          type="button"
          onMouseDown={keep}
          onClick={() => setBlock(state.block === "blockquote" ? "p" : "blockquote")}
          aria-pressed={state.block === "blockquote"}
          title="Quote"
          className={toolButton}
        >
          “ Quote
        </button>
        <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />
        <button type="button" onMouseDown={keep} onClick={addLink} title="Add a link to the selected text" className={toolButton}>
          Link
        </button>
        <button type="button" onMouseDown={keep} onClick={() => run("unlink")} title="Remove link" className={toolButton}>
          Unlink
        </button>
        <button type="button" onMouseDown={keep} onClick={() => run("insertHorizontalRule")} title="Dividing line" className={toolButton}>
          ―
        </button>
        {/* The editor remembers where the cursor was, so the image lands there after choosing. */}
        {media && folders && <MediaPicker images={media} folders={folders} onInsert={insertImage} label="Image" />}
        {selectedImage && (
          <button type="button" onMouseDown={keep} onClick={removeImage} title="Remove the selected image from the text" className={`${toolButton} border-black`}>
            ✕ Remove image
          </button>
        )}
        <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />
        <button
          type="button"
          onMouseDown={keep}
          onClick={() => {
            run("removeFormat");
            setBlock("p");
          }}
          title="Clear formatting of the selected text"
          className={toolButton}
        >
          Clear
        </button>
        <button type="button" onMouseDown={keep} onClick={() => run("undo")} title="Undo (Ctrl+Z)" className={toolButton}>
          ↶
        </button>
        <button type="button" onMouseDown={keep} onClick={() => run("redo")} title="Redo (Ctrl+Y)" className={toolButton}>
          ↷
        </button>
      </div>

      <div className="relative">
        {empty && (
          <p aria-hidden className="pointer-events-none absolute left-4 top-3 text-sm text-neutral-400">
            {placeholder}
          </p>
        )}
        <div
          ref={editor}
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          onClick={onEditorClick}
          onPaste={onPaste}
          className="rich-text max-h-[70vh] overflow-y-auto px-4 py-3 text-sm outline-none"
          style={{ minHeight }}
        />
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
