// Size guides: one table per shop category, typed or pasted in the admin.
//
// Format (also works when pasted from a spreadsheet or Printful's size table):
//   Size | Chest (cm) | Length (cm)      ← first line with "|" or tabs = column headings
//   S    | 96         | 71
//   M    | 102        | 74
//   Measurements are of the garment laid flat.   ← lines without separators = notes
import { prisma } from "./db";

export type SizeTable = { header: string[]; rows: string[][]; notes: string[] };

const splitCells = (line: string) =>
  (line.includes("\t") ? line.split("\t") : line.split("|")).map((c) => c.trim()).filter((c, i, all) => c || (i > 0 && i < all.length - 1));

/** Turns the admin text into a table. Returns null when there's nothing to show. */
export function parseSizeTable(content: string): SizeTable | null {
  const header: string[] = [];
  const rows: string[][] = [];
  const notes: string[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (!line.includes("|") && !line.includes("\t")) {
      notes.push(line);
      continue;
    }
    if (/^[|\s:-]+$/.test(line)) continue; // a Markdown-style |---|---| line
    const cells = splitCells(line);
    if (cells.length === 0) continue;
    if (header.length === 0) header.push(...cells);
    else rows.push(cells);
  }
  if (header.length === 0 && notes.length === 0) return null;
  return { header, rows, notes };
}

export async function getSizeGuide(categorySlug: string | undefined | null): Promise<SizeTable | null> {
  if (!categorySlug) return null;
  const row = await prisma.sizeGuide.findUnique({ where: { category: categorySlug } });
  return row ? parseSizeTable(row.content) : null;
}
