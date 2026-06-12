import type { OutlineItem } from "@/lib/types/book";

/** URL 与 outline 中的章节 id 统一为字符串再比较 */
export function normalizeChapterId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return "";
  return String(id);
}

/** 递归规范化 outline 中的章节 id（JSON 里可能是 number） */
export function normalizeOutlineItems(items: OutlineItem[]): OutlineItem[] {
  return items.map((item) => ({
    ...item,
    id: normalizeChapterId(item.id),
    children: item.children?.length ? normalizeOutlineItems(item.children) : item.children,
  }));
}

/** 在目录树中查找章节节点 */
export function findChapterInOutline(
  items: OutlineItem[],
  chapterId: string | number
): OutlineItem | null {
  const target = normalizeChapterId(chapterId);
  for (const item of items) {
    if (item.type === "chapter" && normalizeChapterId(item.id) === target) return item;
    if (item.children?.length) {
      const found = findChapterInOutline(item.children, chapterId);
      if (found) return found;
    }
  }
  return null;
}

export function isChapterInOutline(items: OutlineItem[], chapterId: string | number): boolean {
  return findChapterInOutline(items, chapterId) !== null;
}

export function findFirstChapter(items: OutlineItem[]): OutlineItem | null {
  for (const item of items) {
    if (item.type === "chapter" && item.id) return item;
    if (item.children?.length) {
      const found = findFirstChapter(item.children);
      if (found) return found;
    }
  }
  return null;
}

export const BOOK_CHAPTER_QUERY = "chapter";

export function bookChapterHref(bookId: string, chapterId: string | number): string {
  return `/books/${bookId}?${BOOK_CHAPTER_QUERY}=${encodeURIComponent(normalizeChapterId(chapterId))}`;
}
