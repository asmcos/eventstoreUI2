"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { normalizeChapterId } from "@/lib/book/outline";
import type { DragPosition } from "@/lib/book/outline-edit";
import type { OutlineItem } from "@/lib/types/book";

interface EditableOutlineTreeProps {
  items: OutlineItem[];
  activeId: string | null;
  onSelectChapter: (item: OutlineItem) => void;
  onRename: (item: OutlineItem) => void;
  onDelete: (item: OutlineItem) => void;
  onDragEnd: (dragged: OutlineItem, target: OutlineItem, position: DragPosition) => void;
  draggedItem: OutlineItem | null;
  dragOverItem: OutlineItem | null;
  dragOverPosition: DragPosition | null;
  onSetDraggedItem: (item: OutlineItem | null) => void;
  onSetDragOver: (item: OutlineItem | null, position: DragPosition | null) => void;
  level?: number;
}

export default function EditableOutlineTree({
  items,
  activeId,
  onSelectChapter,
  onRename,
  onDelete,
  onDragEnd,
  draggedItem,
  dragOverItem,
  dragOverPosition,
  onSetDraggedItem,
  onSetDragOver,
  level = 1,
}: EditableOutlineTreeProps) {
  return (
    <div className="text-sm">
      {items.map((item) => (
        <OutlineNode
          key={normalizeChapterId(item.id)}
          item={item}
          activeId={activeId}
          onSelectChapter={onSelectChapter}
          onRename={onRename}
          onDelete={onDelete}
          onDragEnd={onDragEnd}
          draggedItem={draggedItem}
          dragOverItem={dragOverItem}
          dragOverPosition={dragOverPosition}
          onSetDraggedItem={onSetDraggedItem}
          onSetDragOver={onSetDragOver}
          level={level}
        />
      ))}
    </div>
  );
}

function dragClass(
  item: OutlineItem,
  dragOverItem: OutlineItem | null,
  dragOverPosition: DragPosition | null,
  draggedItem: OutlineItem | null
) {
  const isOver =
    dragOverItem && normalizeChapterId(dragOverItem.id) === normalizeChapterId(item.id);
  const isDragging =
    draggedItem && normalizeChapterId(draggedItem.id) === normalizeChapterId(item.id);
  return [
    "outline-item-draggable group mb-1 flex items-center gap-0.5 rounded-lg border-l-[3px] pr-1 transition",
    isOver ? "drag-over" : "",
    isOver && dragOverPosition === "before" ? "drag-over-before" : "",
    isOver && dragOverPosition === "after" ? "drag-over-after" : "",
    isOver && dragOverPosition === "inside" ? "drag-over-inside" : "",
    isDragging ? "dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function OutlineNode({
  item,
  activeId,
  onSelectChapter,
  onRename,
  onDelete,
  onDragEnd,
  draggedItem,
  dragOverItem,
  dragOverPosition,
  onSetDraggedItem,
  onSetDragOver,
  level,
}: {
  item: OutlineItem;
  activeId: string | null;
  onSelectChapter: (item: OutlineItem) => void;
  onRename: (item: OutlineItem) => void;
  onDelete: (item: OutlineItem) => void;
  onDragEnd: (dragged: OutlineItem, target: OutlineItem, position: DragPosition) => void;
  draggedItem: OutlineItem | null;
  dragOverItem: OutlineItem | null;
  dragOverPosition: DragPosition | null;
  onSetDraggedItem: (item: OutlineItem | null) => void;
  onSetDragOver: (item: OutlineItem | null, position: DragPosition | null) => void;
  level: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const isFolder = item.type === "folder";
  const isActive =
    activeId !== null && normalizeChapterId(activeId) === normalizeChapterId(item.id);

  const handleDragStart = (e: React.DragEvent) => {
    onSetDraggedItem(item);
    e.dataTransfer.setData("text/plain", normalizeChapterId(item.id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || normalizeChapterId(draggedItem.id) === normalizeChapterId(item.id)) {
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const height = rect.height;

    let position: DragPosition;
    if (item.type === "folder") {
      if (offset > height * 0.7) position = "inside";
      else if (offset < height * 0.3) position = "before";
      else position = "after";
    } else {
      position = offset < height / 2 ? "before" : "after";
    }

    onSetDragOver(item, position);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || !dragOverPosition) return;
    if (normalizeChapterId(draggedItem.id) === normalizeChapterId(item.id)) return;
    onDragEnd(draggedItem, item, dragOverPosition);
    onSetDraggedItem(null);
    onSetDragOver(null, null);
  };

  const handleDragEnd = () => {
    onSetDraggedItem(null);
    onSetDragOver(null, null);
  };

  return (
    <div style={{ marginLeft: level > 1 ? "0.75rem" : 0 }}>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={(e) => e.preventDefault()}
        onDragLeave={() => {
          if (dragOverItem && normalizeChapterId(dragOverItem.id) === normalizeChapterId(item.id)) {
            onSetDragOver(null, null);
          }
        }}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        className={`${dragClass(item, dragOverItem, dragOverPosition, draggedItem)} ${
          isActive ? "border-l-indigo-600 bg-indigo-50" : "border-l-transparent hover:bg-gray-50"
        }`}
      >
        <span
          className="shrink-0 cursor-grab px-1 text-gray-300 group-hover:text-gray-400"
          aria-hidden
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        <button
          type="button"
          onClick={() => {
            if (isFolder) setExpanded(!expanded);
            else onSelectChapter(item);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 px-1 py-2 text-left"
        >
          {isFolder ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-violet-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-violet-500" />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0 text-violet-500" />
          )}
          {isFolder && <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
          <span className="line-clamp-2 flex-1 text-gray-800">{item.title}</span>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-28 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(item);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-3 w-3" /> 重命名
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(item);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" /> 删除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isFolder && expanded && item.children && item.children.length > 0 && (
        <EditableOutlineTree
          items={item.children}
          activeId={activeId}
          onSelectChapter={onSelectChapter}
          onRename={onRename}
          onDelete={onDelete}
          onDragEnd={onDragEnd}
          draggedItem={draggedItem}
          dragOverItem={dragOverItem}
          dragOverPosition={dragOverPosition}
          onSetDraggedItem={onSetDraggedItem}
          onSetDragOver={onSetDragOver}
          level={level + 1}
        />
      )}
    </div>
  );
}
