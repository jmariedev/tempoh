import type { JSONContent } from "@tiptap/react";

// Formatted text as Notion stores it: a list of runs, each with its own styling.
// Notion text properties have no real lists, so a bullet is a line starting with "• ".

export interface Segment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  href?: string | null;
}

export type RichText = Segment[];

const BULLET = "• ";
type Marks = Omit<Segment, "text">;

const sameMarks = (a: Marks, b: Marks) =>
  !!a.bold === !!b.bold &&
  !!a.italic === !!b.italic &&
  !!a.underline === !!b.underline &&
  !!a.strike === !!b.strike &&
  (a.href ?? null) === (b.href ?? null);

/** Joins neighboring runs that share the same styling and drops empty ones. */
function merge(segments: RichText): RichText {
  const out: RichText = [];
  for (const seg of segments) {
    if (!seg.text) continue;
    const last = out[out.length - 1];
    if (last && sameMarks(last, seg)) last.text += seg.text;
    else out.push({ ...seg });
  }
  return out;
}

export const toPlain = (rt: RichText) => rt.map((s) => s.text).join("");
export const isEmpty = (rt: RichText) => toPlain(rt).trim() === "";
export const fromPlain = (text: string): RichText => (text ? [{ text }] : []);

/** Cleans up rich text sent by the browser before it's saved. */
export function sanitize(value: unknown): RichText {
  if (typeof value === "string") return fromPlain(value);
  if (!Array.isArray(value)) return [];
  return merge(
    value
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object" && typeof s.text === "string")
      .map((s) => ({
        text: s.text as string,
        bold: s.bold === true || undefined,
        italic: s.italic === true || undefined,
        underline: s.underline === true || undefined,
        strike: s.strike === true || undefined,
        href: typeof s.href === "string" && /^https?:\/\//.test(s.href) ? s.href : undefined,
      })),
  );
}

/** Splits rich text into lines, keeping each run's styling. */
export function toLines(rt: RichText): RichText[] {
  const lines: RichText[] = [[]];
  for (const seg of rt) {
    seg.text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ ...seg, text: part });
    });
  }
  return lines;
}

/** Removes the bullet prefix from a line, or returns null if the line isn't a bullet. */
export function stripBullet(line: RichText): RichText | null {
  if (!toPlain(line).startsWith(BULLET)) return null;
  let skip = BULLET.length;
  const out: RichText = [];
  for (const seg of line) {
    if (skip >= seg.text.length) {
      skip -= seg.text.length;
      continue;
    }
    out.push({ ...seg, text: seg.text.slice(skip) });
    skip = 0;
  }
  return out;
}

// ---- Notion ----

interface NotionRichTextItem {
  plain_text: string;
  href: string | null;
  annotations: { bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean };
}

export function fromNotion(items: NotionRichTextItem[]): RichText {
  return merge(
    items.map((t) => ({
      text: t.plain_text,
      bold: t.annotations.bold || undefined,
      italic: t.annotations.italic || undefined,
      underline: t.annotations.underline || undefined,
      strike: t.annotations.strikethrough || undefined,
      href: t.href ?? undefined,
    })),
  );
}

export function toNotion(rt: RichText) {
  // Notion caps each rich text item at 2000 characters.
  return rt.flatMap((seg) =>
    (seg.text.match(/[\s\S]{1,2000}/g) ?? []).map((content) => ({
      type: "text" as const,
      text: { content, link: seg.href ? { url: seg.href } : null },
      annotations: {
        bold: !!seg.bold,
        italic: !!seg.italic,
        underline: !!seg.underline,
        strikethrough: !!seg.strike,
      },
    })),
  );
}

// ---- Editor (TipTap) ----

function inline(line: RichText): JSONContent[] {
  return line.map((seg) => {
    const marks: JSONContent["marks"] = [];
    if (seg.bold) marks.push({ type: "bold" });
    if (seg.italic) marks.push({ type: "italic" });
    if (seg.underline) marks.push({ type: "underline" });
    if (seg.strike) marks.push({ type: "strike" });
    if (seg.href) marks.push({ type: "link", attrs: { href: seg.href } });
    return { type: "text", text: seg.text, ...(marks.length && { marks }) };
  });
}

export function toDoc(rt: RichText): JSONContent {
  const content: JSONContent[] = [];
  for (const line of toLines(rt)) {
    const bullet = stripBullet(line);
    const paragraph = { type: "paragraph", content: inline(bullet ?? line) };
    if (bullet) {
      const last = content[content.length - 1];
      const item = { type: "listItem", content: [paragraph] };
      if (last?.type === "bulletList") last.content!.push(item);
      else content.push({ type: "bulletList", content: [item] });
    } else {
      content.push(paragraph);
    }
  }
  return { type: "doc", content };
}

function runs(node: JSONContent): RichText {
  return (node.content ?? []).map((child): Segment => {
    if (child.type === "hardBreak") return { text: "\n" };
    const marks = child.marks ?? [];
    const has = (type: string) => marks.some((m) => m.type === type) || undefined;
    return {
      text: child.text ?? "",
      bold: has("bold"),
      italic: has("italic"),
      underline: has("underline"),
      strike: has("strike"),
      href: (marks.find((m) => m.type === "link")?.attrs?.href as string | undefined) ?? undefined,
    };
  });
}

export function fromDoc(doc: JSONContent): RichText {
  const lines: RichText[] = [];
  for (const block of doc.content ?? []) {
    if (block.type === "bulletList") {
      for (const item of block.content ?? []) {
        for (const p of item.content ?? []) lines.push([{ text: BULLET }, ...runs(p)]);
      }
    } else {
      lines.push(runs(block));
    }
  }
  // Drop trailing empty lines so an empty editor saves as empty text.
  while (lines.length && toPlain(lines[lines.length - 1]) === "") lines.pop();
  return merge(lines.flatMap((line, i) => (i === 0 ? line : [{ text: "\n" }, ...line])));
}
