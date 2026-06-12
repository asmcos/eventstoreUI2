import type { OutlineItem } from "@/lib/types/book";
import { normalizeChapterId } from "./outline";

export type DragPosition = "before" | "after" | "inside";

export function findItemById(items: OutlineItem[], id: string | number): OutlineItem | null {
  const target = normalizeChapterId(id);
  for (const item of items) {
    if (normalizeChapterId(item.id) === target) return item;
    if (item.children?.length) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findItemParentAndIndex(
  items: OutlineItem[],
  id: string | number,
  parent: OutlineItem[] | null = null
): { parent: OutlineItem[] | null; index: number } {
  const target = normalizeChapterId(id);
  for (let i = 0; i < items.length; i++) {
    if (normalizeChapterId(items[i].id) === target) {
      return { parent: parent ?? items, index: i };
    }
    if (items[i].children?.length) {
      const result = findItemParentAndIndex(items[i].children!, id, items[i].children!);
      if (result.index !== -1) return result;
    }
  }
  return { parent: null, index: -1 };
}

export function nextOutlineId(items: OutlineItem[]): number {
  let max = 0;
  const walk = (list: OutlineItem[]) => {
    for (const item of list) {
      const n = Number(item.id);
      if (!Number.isNaN(n)) max = Math.max(max, n);
      if (item.children?.length) walk(item.children);
    }
  };
  walk(items);
  return max + 1;
}

export function cloneOutline(items: OutlineItem[]): OutlineItem[] {
  return JSON.parse(JSON.stringify(items)) as OutlineItem[];
}

function isDescendantOf(
  items: OutlineItem[],
  ancestorId: string | number,
  descendantId: string | number
): boolean {
  const ancestor = findItemById(items, ancestorId);
  if (!ancestor?.children?.length) return false;

  const walk = (list: OutlineItem[]): boolean => {
    for (const item of list) {
      if (normalizeChapterId(item.id) === normalizeChapterId(descendantId)) return true;
      if (item.children?.length && walk(item.children)) return true;
    }
    return false;
  };
  return walk(ancestor.children);
}

/** 拖拽重排大纲（与原版 editbook handleDragEnd 一致） */
export function reorderOutline(
  outline: OutlineItem[],
  draggedItem: OutlineItem,
  targetItem: OutlineItem,
  position: DragPosition
): OutlineItem[] {
  if (normalizeChapterId(draggedItem.id) === normalizeChapterId(targetItem.id)) {
    return outline;
  }

  if (position === "inside" && isDescendantOf(outline, draggedItem.id, targetItem.id)) {
    return outline;
  }

  const updated = cloneOutline(outline);
  const { parent: draggedParent, index: draggedIndex } = findItemParentAndIndex(
    updated,
    draggedItem.id
  );
  if (!draggedParent || draggedIndex === -1) return outline;

  const [removed] = draggedParent.splice(draggedIndex, 1);

  const { parent: targetParent, index: targetIndex } = findItemParentAndIndex(
    updated,
    targetItem.id
  );
  if (!targetParent || targetIndex === -1) return outline;

  if (position === "inside" && targetItem.type === "folder") {
    const folder = findItemById(updated, targetItem.id);
    if (folder) {
      if (!folder.children) folder.children = [];
      folder.children.push(removed);
    }
  } else {
    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
    targetParent.splice(insertIndex, 0, removed);
  }

  return updated;
}

export const DEFAULT_OUTLINE: OutlineItem[] = [
  { id: "1", title: "前言", type: "chapter" },
  {
    id: "2",
    title: "第一部分：基础知识",
    type: "folder",
    children: [],
  },
];
