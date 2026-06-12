"use client";

import { useEffect, useRef } from "react";
import { Eye } from "lucide-react";
import { recordBrowseView } from "@/lib/browselog";

interface TopicViewBadgeProps {
  topicId: string;
  initialCount?: number;
}

export default function TopicViewBadge({ topicId, initialCount = 0 }: TopicViewBadgeProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (!topicId || recorded.current) return;
    recorded.current = true;
    recordBrowseView(topicId);
  }, [topicId]);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-gray-800"
      title="浏览量"
    >
      <Eye className="h-4 w-4 text-blue-600" />
      <span className="font-semibold">{initialCount}</span>
    </div>
  );
}
