"use client";

import { useEffect, useRef } from "react";
import { recordBrowseView } from "@/lib/browselog";

interface RecordBrowseViewProps {
  targetId: string;
}

/** 进入详情页时上报浏览记录，对应原项目 browselog() */
export default function RecordBrowseView({ targetId }: RecordBrowseViewProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (!targetId || recorded.current) return;
    recorded.current = true;
    recordBrowseView(targetId);
  }, [targetId]);

  return null;
}
