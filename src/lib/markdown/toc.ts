export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "");
}

export function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (!match) continue;
    const text = match[2].replace(/#+$/, "").trim();
    headings.push({
      level: match[1].length,
      text,
      id: slugifyHeading(text),
    });
  }
  return headings;
}

export function countChapters(items: import("@/lib/types/book").OutlineItem[]): number {
  let count = 0;
  for (const item of items) {
    if (item.type === "chapter") count += 1;
    if (item.children?.length) count += countChapters(item.children);
  }
  return count;
}
