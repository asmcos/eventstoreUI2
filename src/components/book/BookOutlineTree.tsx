"use client";

import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { useState } from "react";
import { normalizeChapterId } from "@/lib/book/outline";
import type { OutlineItem } from "@/lib/types/book";

interface BookOutlineTreeProps {
  items: OutlineItem[];
  activeId: string | null;
  onSelect: (item: OutlineItem) => void;
  level?: number;
}

export default function BookOutlineTree({
  items,
  activeId,
  onSelect,
  level = 1,
}: BookOutlineTreeProps) {
  return (
    <div className="outline-tree text-sm">
      {items.map((item) => (
        <OutlineNode
          key={item.id}
          item={item}
          activeId={activeId}
          onSelect={onSelect}
          level={level}
        />
      ))}
    </div>
  );
}

function OutlineNode({
  item,
  activeId,
  onSelect,
  level,
}: {
  item: OutlineItem;
  activeId: string | null;
  onSelect: (item: OutlineItem) => void;
  level: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isFolder = item.type === "folder";
  const isActive = activeId !== null && normalizeChapterId(activeId) === normalizeChapterId(item.id);

  return (
    <div style={{ marginLeft: level > 1 ? "1rem" : 0 }}>
      <button
        type="button"
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded);
          } else {
            onSelect(item);
          }
        }}
        className={`outline-item mb-1 flex w-full items-center gap-2 rounded-lg border-l-[3px] px-2.5 py-2 text-left transition-all ${
          isActive
            ? "border-l-indigo-600 bg-indigo-50 font-medium text-indigo-600"
            : "border-l-transparent text-slate-700 hover:border-l-indigo-200 hover:bg-indigo-50/50"
        }`}
      >
        {isFolder ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-violet-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-violet-500" />
          )
        ) : (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-xs text-violet-600">
            <FileText className="h-3.5 w-3.5" />
          </span>
        )}
        {isFolder && <Folder className="h-4 w-4 shrink-0 text-amber-500" />}
        <span className="line-clamp-2 flex-1">{item.title}</span>
      </button>
      {isFolder && expanded && item.children && item.children.length > 0 && (
        <BookOutlineTree
          items={item.children}
          activeId={activeId}
          onSelect={onSelect}
          level={level + 1}
        />
      )}
    </div>
  );
}
